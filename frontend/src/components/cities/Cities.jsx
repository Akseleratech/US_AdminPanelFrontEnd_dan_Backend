import React, { useState } from 'react';
import { Search, Filter, Plus, RefreshCw, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import CitiesTable from './CitiesTable.jsx';
import SimpleCityModal from './SimpleCityModal.jsx';
import useCities from '../../hooks/useCities.js';

const Cities = () => {
  const {
    cities,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    createCity,
    updateCity,
    deleteCity,
    refresh
  } = useCities();

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedCity, setSelectedCity] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cityToDelete, setCityToDelete] = useState(null);
  const [notification, setNotification] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAddNew = () => {
    setSelectedCity(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = (city) => {
    setSelectedCity(city);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDelete = (type, cityId) => {
    if (type === 'city') {
      const city = cities.find(c => c.id === cityId);
      if (city) {
        setCityToDelete(city);
        setShowDeleteConfirm(true);
      }
    }
  };

  const confirmDelete = async () => {
    if (!cityToDelete) return;

    try {
      await deleteCity(cityToDelete.id);
      showNotification(`Kota "${cityToDelete.name}" berhasil dihapus`, 'success');
      setShowDeleteConfirm(false);
      setCityToDelete(null);
    } catch (error) {
      showNotification(`Gagal menghapus kota: ${error.message}`, 'error');
    }
  };

  const handleSave = async (cityData) => {
    try {
      console.log('Cities: handleSave called with:', cityData);
      console.log('Cities: modalMode:', modalMode);
      
      if (modalMode === 'add') {
        console.log('Cities: Calling createCity...');
        const result = await createCity(cityData);
        console.log('Cities: createCity result:', result);
        showNotification('Kota baru berhasil ditambahkan', 'success');
      } else {
        console.log('Cities: Calling updateCity...');
        const result = await updateCity(selectedCity.id, cityData);
        console.log('Cities: updateCity result:', result);
        showNotification('Kota berhasil diperbarui', 'success');
      }
      setShowModal(false);
      setSelectedCity(null);
    } catch (error) {
      console.error('Cities: Error in handleSave:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      showNotification(`Gagal ${modalMode === 'add' ? 'menambah' : 'memperbarui'} kota: ${errorMessage}`, 'error');
      throw error; // Let the modal handle the error display
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchFilter(value);
    setSearchTerm(value);
  };

  const handleRefresh = () => {
    refresh();
    showNotification('Data kota berhasil diperbarui', 'success');
  };

  

  // Filter data based on search
  const filteredCities = cities.filter(city => {
    if (!searchFilter) return true;
    return city.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
           city.province?.toLowerCase().includes(searchFilter.toLowerCase()) ||
           city.country?.name?.toLowerCase().includes(searchFilter.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`flex items-center p-4 rounded-md ${
          notification.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cities/Regencies Management</h1>
          <p className="text-gray-600">Kelola semua kota dan kabupaten yang tersedia dalam sistem</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}



      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search cities, regencies, or provinces..."
              value={searchFilter}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kota/Kabupaten
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Total Cities</div>
          <div className="text-2xl font-bold text-gray-900">{cities.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Active Cities</div>
          <div className="text-2xl font-bold text-green-600">
            {cities.filter(city => city.isActive).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Provinces</div>
          <div className="text-2xl font-bold text-blue-600">
            {new Set(cities.map(city => city.province).filter(Boolean)).size}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Total Spaces</div>
          <div className="text-2xl font-bold text-purple-600">
            {cities.reduce((sum, city) => sum + (city.statistics?.totalSpaces || 0), 0)}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading cities...</span>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <CitiesTable 
          cities={filteredCities} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
        />
      )}

      {/* Empty State */}
      {!loading && filteredCities.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            {searchFilter ? 'No cities found matching your search.' : 'No cities available.'}
          </div>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First City
          </button>
        </div>
      )}

      {/* City Modal */}
      {showModal && (
        <SimpleCityModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleSave}
          city={selectedCity}
          loading={loading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the city "{cityToDelete?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1 inline" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cities; 