import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, RefreshCw, AlertCircle, CheckCircle, Trash2, X, ChevronDown } from 'lucide-react';
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
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedCities, setSelectedCities] = useState(new Set());
  const [selectedProvinces, setSelectedProvinces] = useState(new Set());
  const [selectedCountries, setSelectedCountries] = useState(new Set());

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
    console.log('Cities: handleEdit called with:', city);
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
      
      // Auto refresh after successful save
      refresh();
      
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

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const citiesSet = new Set();
    const provincesSet = new Set();
    const countriesSet = new Set();

    cities.forEach(city => {
      if (city.name) citiesSet.add(city.name);
      if (city.province) provincesSet.add(city.province);
      if (city.country) {
        const countryName = typeof city.country === 'object' ? city.country.name : city.country;
        if (countryName) countriesSet.add(countryName);
      }
    });

    return {
      cities: Array.from(citiesSet).sort(),
      provinces: Array.from(provincesSet).sort(),
      countries: Array.from(countriesSet).sort()
    };
  }, [cities]);

  // Filter helper functions
  const handleFilterToggle = (type, value) => {
    const setters = {
      city: setSelectedCities,
      province: setSelectedProvinces,
      country: setSelectedCountries
    };
    
    const getter = {
      city: selectedCities,
      province: selectedProvinces,
      country: selectedCountries
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
    setSelectedCountries(new Set());
    setFilterSearch('');
    setSearchFilter('');
  };

  const getActiveFilterCount = () => {
    return selectedCities.size + selectedProvinces.size + selectedCountries.size;
  };

  // Filter data based on search and checkboxes
  const filteredCities = cities.filter(city => {
    // Text search filter
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      const matchesSearch = 
        city.name?.toLowerCase().includes(searchLower) ||
        city.province?.toLowerCase().includes(searchLower) ||
        (typeof city.country === 'object' ? city.country.name : city.country)?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Checkbox filters
    if (selectedCities.size > 0 && !selectedCities.has(city.name)) return false;
    if (selectedProvinces.size > 0 && !selectedProvinces.has(city.province)) return false;
    if (selectedCountries.size > 0) {
      const countryName = typeof city.country === 'object' ? city.country.name : city.country;
      if (!selectedCountries.has(countryName)) return false;
    }

    return true;
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
        <button
          onClick={handleAddNew}
          className="flex items-center px-4 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover shadow-primary transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kota/Kabupaten
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Filter Cities</h3>
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
                  Kota/Kabupaten
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

            {/* Countries Filter */}
            {filterOptions.countries.filter(country => country.toLowerCase().includes(filterSearch.toLowerCase())).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 flex items-center">
                  Negara
                  {selectedCountries.size > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                      {selectedCountries.size}
                    </span>
                  )}
                </h4>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
                  {filterOptions.countries
                    .filter(country => country.toLowerCase().includes(filterSearch.toLowerCase()))
                    .map(country => (
                      <label key={country} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCountries.has(country)}
                          onChange={() => handleFilterToggle('country', country)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{country}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* No Results Message */}
          {filterSearch && 
           filterOptions.cities.filter(city => city.toLowerCase().includes(filterSearch.toLowerCase())).length === 0 &&
           filterOptions.provinces.filter(province => province.toLowerCase().includes(filterSearch.toLowerCase())).length === 0 &&
           filterOptions.countries.filter(country => country.toLowerCase().includes(filterSearch.toLowerCase())).length === 0 && (
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
                  {Array.from(selectedCountries).map(country => (
                    <span key={`country-${country}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      {country}
                      <button
                        onClick={() => handleFilterToggle('country', country)}
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
            {getActiveFilterCount() > 0 ? 'Filtered' : 'Total'} Cities
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {filteredCities.length}
            {getActiveFilterCount() > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-1">
                of {cities.length}
              </span>
            )}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-primary-200">
          <div className="text-sm font-medium text-primary-700">
            {getActiveFilterCount() > 0 ? 'Filtered' : 'Total'} Provinces
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {new Set(filteredCities.map(city => city.province).filter(Boolean)).size}
            {getActiveFilterCount() > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-1">
                of {new Set(cities.map(city => city.province).filter(Boolean)).size}
              </span>
            )}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-primary-200">
          <div className="text-sm font-medium text-primary-700">
            {getActiveFilterCount() > 0 ? 'Filtered' : 'Total'} Countries
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {new Set(filteredCities.map(city => {
              const countryName = typeof city.country === 'object' ? city.country.name : city.country;
              return countryName;
            }).filter(Boolean)).size}
            {getActiveFilterCount() > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-1">
                of {new Set(cities.map(city => {
                  const countryName = typeof city.country === 'object' ? city.country.name : city.country;
                  return countryName;
                }).filter(Boolean)).size}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
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
            className="inline-flex items-center px-4 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover shadow-primary transition-all duration-200"
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
          initialData={selectedCity}
          isEditing={modalMode === 'edit'}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
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