import React, { useState, useMemo } from 'react';
import { Search, Plus, AlertCircle, Trash2, Filter, X, ChevronDown } from 'lucide-react';
import BuildingsTable from './BuildingsTable.jsx';
import BuildingModal from './BuildingModal.jsx';
import useBuildings from '../../hooks/useBuildings.js';
import useSpaces from '../../hooks/useSpaces.js';
import { useGlobalRefresh } from '../../contexts/GlobalRefreshContext.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

const Buildings = () => {
  const {
    buildings,
    loading: buildingsLoading,
    error: buildingsError,
    searchTerm: buildingSearchTerm,
    setSearchTerm: setBuildingSearchTerm,
    createBuilding,
    updateBuilding,
    deleteBuilding,
    refresh: refreshBuildings
  } = useBuildings();

  const { spaces, loading: spacesLoading } = useSpaces();

  // Global refresh context
  const { refreshRelatedToSpaces, refreshRelatedToBuildings } = useGlobalRefresh();

  // Retrieve current user role
  const { userRole } = useAuth();

  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedCities, setSelectedCities] = useState(new Set());
  const [selectedProvinces, setSelectedProvinces] = useState(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState(new Set());

  const usedBuildingIds = useMemo(() => {
    if (!spaces) return new Set();
    return new Set(spaces.map(space => space.buildingId).filter(Boolean));
  }, [spaces]);

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const citiesSet = new Set();
    const provincesSet = new Set();
    const statusesSet = new Set(['Active', 'Inactive']); // Predefined statuses

    buildings.forEach(building => {
      if (building.location?.city) citiesSet.add(building.location.city);
      if (building.location?.province) provincesSet.add(building.location.province);
    });

    return {
      cities: Array.from(citiesSet).sort(),
      provinces: Array.from(provincesSet).sort(),
      statuses: Array.from(statusesSet)
    };
  }, [buildings]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAddNew = () => {
    setSelectedBuilding(null);
    setModalMode('add');
    setShowBuildingModal(true);
  };

  const handleEdit = (building) => {
    setSelectedBuilding(building);
    setModalMode('edit');
    setShowBuildingModal(true);
  };

  const handleDelete = (building) => {
    if (usedBuildingIds.has(building.id)) {
      showNotification(`Gedung "${building.name}" sedang digunakan oleh sebuah space dan tidak bisa dihapus.`, 'error');
      return;
    }
    setBuildingToDelete(building);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!buildingToDelete) return;

    try {
      await deleteBuilding(buildingToDelete.id);
      showNotification(`Lokasi/gedung "${buildingToDelete.name}" berhasil dihapus`, 'success');
      setShowDeleteConfirm(false);
      setBuildingToDelete(null);
    } catch (error) {
      showNotification(`Gagal menghapus lokasi/gedung: ${error.message}`, 'error');
    }
  };

  const handleSaveBuilding = async (buildingData) => {
    try {
      let result;
      if (modalMode === 'add') {
        result = await createBuilding(buildingData);
        
        // Trigger global refresh untuk buildings dan spaces (karena space modal butuh building data)
        refreshRelatedToBuildings();
        
        // Only show notification here if no image will be uploaded
        // Image upload success will be handled by the modal
        showNotification('Lokasi/gedung baru berhasil ditambahkan', 'success');
      } else {
        result = await updateBuilding(selectedBuilding.id, buildingData);
        
        // Trigger global refresh untuk buildings dan spaces (karena space modal butuh building data)
        refreshRelatedToBuildings();
        
        showNotification('Lokasi/gedung berhasil diperbarui', 'success');
      }
      return result; // Return the saved building data for image upload
    } catch (error) {
      const errorMessage = error.message || 'Unknown error occurred';
      showNotification(`Gagal ${modalMode === 'add' ? 'menambah' : 'memperbarui'} lokasi/gedung: ${errorMessage}`, 'error');
      throw error; // Let the modal handle the error display
    }
  };

  const handleImageUploaded = () => {
    // Refresh building data after image upload
    refreshRelatedToBuildings();
    console.log('🔄 Buildings: Refreshing data after image upload');
  };

  const handleModalClose = () => {
    setShowBuildingModal(false);
    setSelectedBuilding(null);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchFilter(value);
    setBuildingSearchTerm(value);
  };

  // Filter helper functions
  const handleFilterToggle = (type, value) => {
    const setters = {
      city: setSelectedCities,
      province: setSelectedProvinces,
      status: setSelectedStatuses
    };
    
    const getter = {
      city: selectedCities,
      province: selectedProvinces,
      status: selectedStatuses
    }[type];

    const newSet = new Set(getter);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setters[type](newSet);
  };

  const clearAllFilters = () => {
    setSelectedCities(new Set());
    setSelectedProvinces(new Set());
    setSelectedStatuses(new Set());
    setFilterSearch('');
    setSearchFilter('');
  };

  const getActiveFilterCount = () => {
    return selectedCities.size + selectedProvinces.size + selectedStatuses.size;
  };

  // Filter data based on search and checkboxes
  const filteredBuildings = buildings.filter(building => {
    // Text search filter
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      const matchesSearch = 
        building.name?.toLowerCase().includes(searchLower) ||
        building.description?.toLowerCase().includes(searchLower) ||
        building.location?.city?.toLowerCase().includes(searchLower) ||
        building.location?.province?.toLowerCase().includes(searchLower) ||
        building.location?.address?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Checkbox filters
    if (selectedCities.size > 0 && !selectedCities.has(building.location?.city)) return false;
    if (selectedProvinces.size > 0 && !selectedProvinces.has(building.location?.province)) return false;
    if (selectedStatuses.size > 0) {
      const buildingStatus = building.isActive ? 'Active' : 'Inactive';
      if (!selectedStatuses.has(buildingStatus)) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-200 text-green-800' 
            : 'bg-red-100 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lokasi/Gedung Management</h1>
          <p className="text-gray-600">Kelola semua lokasi dan gedung yang tersedia</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={handleSearchChange}
              placeholder="Search lokasi/gedung..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ring-primary"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 border rounded-lg transition-colors duration-200 ${
              showFilters || getActiveFilterCount() > 0
                ? 'bg-primary-50 border-primary-300 text-primary-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
            {getActiveFilterCount() > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-primary-600 text-white rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${
              showFilters ? 'rotate-180' : ''
            }`} />
          </button>
        </div>
        {userRole === 'admin' && (
          <button
            onClick={handleAddNew}
            className="flex items-center px-4 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover shadow-primary transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Lokasi/Gedung
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Filter Buildings</h3>
            <div className="flex items-center space-x-2">
              {getActiveFilterCount() > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search filter options..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cities Filter */}
            {filterOptions.cities.filter(city => city.toLowerCase().includes(filterSearch.toLowerCase())).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 flex items-center">
                  Kota
                  {selectedCities.size > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {selectedCities.size}
                    </span>
                  )}
                </h4>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
                  {filterOptions.cities
                    .filter(city => city.toLowerCase().includes(filterSearch.toLowerCase()))
                    .map(city => (
                      <label key={city} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCities.has(city)}
                          onChange={() => handleFilterToggle('city', city)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{city}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            {/* Provinces Filter */}
            {filterOptions.provinces.filter(province => province.toLowerCase().includes(filterSearch.toLowerCase())).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 flex items-center">
                  Provinsi
                  {selectedProvinces.size > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      {selectedProvinces.size}
                    </span>
                  )}
                </h4>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
                  {filterOptions.provinces
                    .filter(province => province.toLowerCase().includes(filterSearch.toLowerCase()))
                    .map(province => (
                      <label key={province} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProvinces.has(province)}
                          onChange={() => handleFilterToggle('province', province)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{province}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            {/* Status Filter */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 flex items-center">
                Status
                {selectedStatuses.size > 0 && (
                  <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                    {selectedStatuses.size}
                  </span>
                )}
              </h4>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
                {filterOptions.statuses.map(status => (
                  <label key={status} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.has(status)}
                      onChange={() => handleFilterToggle('status', status)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{status}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* No Results Message */}
          {filterSearch && 
           filterOptions.cities.filter(city => city.toLowerCase().includes(filterSearch.toLowerCase())).length === 0 &&
           filterOptions.provinces.filter(province => province.toLowerCase().includes(filterSearch.toLowerCase())).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No filter options found for "{filterSearch}"</p>
              <button
                onClick={() => setFilterSearch('')}
                className="mt-2 text-sm text-primary-600 hover:text-primary-800"
              >
                Clear search
              </button>
            </div>
          )}

          {/* Filter Summary */}
          {getActiveFilterCount() > 0 && (
            <div className="bg-gray-50 rounded-md p-3">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Active Filters:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {Array.from(selectedCities).map(city => (
                    <span key={`city-${city}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {city}
                      <button
                        onClick={() => handleFilterToggle('city', city)}
                        className="ml-1 hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {Array.from(selectedProvinces).map(province => (
                    <span key={`province-${province}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      {province}
                      <button
                        onClick={() => handleFilterToggle('province', province)}
                        className="ml-1 hover:text-green-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {Array.from(selectedStatuses).map(status => (
                    <span key={`status-${status}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      {status}
                      <button
                        onClick={() => handleFilterToggle('status', status)}
                        className="ml-1 hover:text-purple-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-primary-200">
          <div className="text-sm font-medium text-primary-700">
            {getActiveFilterCount() > 0 ? 'Filtered' : 'Total'} Buildings
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {filteredBuildings.length}
            {getActiveFilterCount() > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-1">
                of {buildings.length}
              </span>
            )}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-primary-200">
          <div className="text-sm font-medium text-primary-700">
            {getActiveFilterCount() > 0 ? 'Filtered' : 'Total'} Cities
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {new Set(filteredBuildings.map(building => building.location?.city).filter(Boolean)).size}
            {getActiveFilterCount() > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-1">
                of {new Set(buildings.map(building => building.location?.city).filter(Boolean)).size}
              </span>
            )}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-primary-200">
          <div className="text-sm font-medium text-primary-700">
            Active Buildings
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {filteredBuildings.filter(building => building.isActive).length}
            {getActiveFilterCount() > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-1">
                of {buildings.filter(building => building.isActive).length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {buildingsError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-red-600">{buildingsError}</span>
          <button
            onClick={refreshBuildings}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Table */}
      <BuildingsTable 
        buildings={filteredBuildings} 
        onEdit={handleEdit} 
        onDelete={(type, id) => {
          const building = buildings.find(b => b.id === id);
          if (building) handleDelete(building);
        }}
        loading={buildingsLoading || spacesLoading}
        usedBuildingIds={usedBuildingIds}
      />

      {/* Building Modal */}
      <BuildingModal
        isOpen={showBuildingModal}
        onClose={handleModalClose}
        onSave={handleSaveBuilding}
        building={selectedBuilding}
        mode={modalMode}
        onImageUploaded={handleImageUploaded}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Hapus</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus lokasi/gedung "{buildingToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1 inline" />
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Buildings; 