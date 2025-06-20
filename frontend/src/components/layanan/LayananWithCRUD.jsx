import React, { useState } from 'react';
import { Search, Filter, Plus, RefreshCw, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import SpacesTable from './SpacesTable.jsx';
import CitiesTable from './CitiesTable.jsx';
import ServicesTable from './ServicesTable.jsx';
import ServiceModal from './ServiceModal.jsx';
import CityModal from './CityModal.jsx';
import useServices from '../../hooks/useServices.js';
import useCities from '../../hooks/useCities.js';

const LayananWithCRUD = ({ 
  layananSubTab, 
  setLayananSubTab, 
  spaces, 
  onEdit, 
  onDelete, 
  onAddNew 
}) => {
  const {
    services,
    loading: servicesLoading,
    error: servicesError,
    searchTerm: serviceSearchTerm,
    setSearchTerm: setServiceSearchTerm,
    createService,
    updateService,
    deleteService,
    filterByCategory,
    filterByType,
    filterByStatus,
    clearFilters: clearServiceFilters,
    refresh: refreshServices
  } = useServices();

  const {
    cities,
    loading: citiesLoading,
    error: citiesError,
    searchTerm: citySearchTerm,
    setSearchTerm: setCitySearchTerm,
    createCity,
    updateCity,
    deleteCity,
    filterByStatus: filterCitiesByStatus,
    filterFeatured,
    clearFilters: clearCityFilters,
    refresh: refreshCities
  } = useCities();

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedService, setSelectedService] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [cityToDelete, setCityToDelete] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const getTabTitle = () => {
    switch (layananSubTab) {
      case 'spaces': return 'Space';
      case 'cities': return 'Kota';
      case 'services': return 'Layanan';
      default: return 'Space';
    }
  };

  const handleAddNewService = () => {
    setSelectedService(null);
    setModalMode('add');
    setShowServiceModal(true);
  };

  const handleEditService = (service) => {
    setSelectedService(service);
    setModalMode('edit');
    setShowServiceModal(true);
  };

  const handleDeleteService = (service) => {
    setServiceToDelete(service);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;

    try {
      await deleteService(serviceToDelete.id);
      showNotification(`Layanan "${serviceToDelete.name}" berhasil dihapus`, 'success');
      setShowDeleteConfirm(false);
      setServiceToDelete(null);
    } catch (error) {
      showNotification(`Gagal menghapus layanan: ${error.message}`, 'error');
    }
  };

  const handleSaveService = async (serviceData) => {
    try {
      console.log('LayananWithCRUD: handleSaveService called with:', serviceData);
      console.log('LayananWithCRUD: modalMode:', modalMode);
      
      if (modalMode === 'add') {
        console.log('LayananWithCRUD: Calling createService...');
        const result = await createService(serviceData);
        console.log('LayananWithCRUD: createService result:', result);
        showNotification('Layanan baru berhasil ditambahkan', 'success');
      } else {
        console.log('LayananWithCRUD: Calling updateService...');
        const result = await updateService(selectedService.id, serviceData);
        console.log('LayananWithCRUD: updateService result:', result);
        showNotification('Layanan berhasil diperbarui', 'success');
      }
      setShowServiceModal(false);
      setSelectedService(null);
    } catch (error) {
      console.error('LayananWithCRUD: Error in handleSaveService:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      showNotification(`Gagal ${modalMode === 'add' ? 'menambah' : 'memperbarui'} layanan: ${errorMessage}`, 'error');
      throw error; // Let the modal handle the error display
    }
  };

  // City handlers
  const handleAddNewCity = () => {
    setSelectedCity(null);
    setModalMode('add');
    setShowCityModal(true);
  };

  const handleEditCity = (city) => {
    setSelectedCity(city);
    setModalMode('edit');
    setShowCityModal(true);
  };

  const handleDeleteCity = (city) => {
    setCityToDelete(city);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCity = async () => {
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

  const handleSaveCity = async (cityData) => {
    try {
      console.log('LayananWithCRUD: handleSaveCity called with:', cityData);
      console.log('LayananWithCRUD: modalMode:', modalMode);
      
      if (modalMode === 'add') {
        console.log('LayananWithCRUD: Calling createCity...');
        const result = await createCity(cityData);
        console.log('LayananWithCRUD: createCity result:', result);
        showNotification('Kota baru berhasil ditambahkan', 'success');
      } else {
        console.log('LayananWithCRUD: Calling updateCity...');
        const result = await updateCity(selectedCity.id, cityData);
        console.log('LayananWithCRUD: updateCity result:', result);
        showNotification('Kota berhasil diperbarui', 'success');
      }
      setShowCityModal(false);
      setSelectedCity(null);
    } catch (error) {
      console.error('LayananWithCRUD: Error in handleSaveCity:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      showNotification(`Gagal ${modalMode === 'add' ? 'menambah' : 'memperbarui'} kota: ${errorMessage}`, 'error');
      throw error; // Let the modal handle the error display
    }
  };

  const handleSearchChange = (e) => {
    if (layananSubTab === 'services') {
      setServiceSearchTerm(e.target.value);
    } else if (layananSubTab === 'cities') {
      setCitySearchTerm(e.target.value);
    }
  };

  const renderServiceControls = () => (
    <div className="space-y-4">
      {/* Error Display */}
      {servicesError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-sm text-red-600">{servicesError}</span>
          <button
            onClick={refreshServices}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`border rounded-md p-3 flex items-center ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-600'
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          <span className="text-sm">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}

      {/* Action Bar for Services */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari layanan..."
              value={serviceSearchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Filter Dropdown */}
          <div className="relative">
            <select
              onChange={(e) => {
                const [filterType, filterValue] = e.target.value.split(':');
                if (filterType === 'category') filterByCategory(filterValue);
                else if (filterType === 'type') filterByType(filterValue);
                else if (filterType === 'status') filterByStatus(filterValue);
                else clearServiceFilters();
              }}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Layanan</option>
              <optgroup label="Kategori">
                <option value="category:office">Office</option>
                <option value="category:workspace">Workspace</option>
                <option value="category:event">Event</option>
                <option value="category:legal">Legal</option>
                <option value="category:business-support">Business Support</option>
              </optgroup>
              <optgroup label="Tipe">
                <option value="type:virtual-office">Virtual Office</option>
                <option value="type:private-office">Private Office</option>
                <option value="type:meeting-room">Meeting Room</option>
                <option value="type:coworking-space">Coworking Space</option>
                <option value="type:event-space">Event Space</option>
                <option value="type:business-legality">Business Legality</option>
              </optgroup>
              <optgroup label="Status">
                <option value="status:published">Published</option>
                <option value="status:draft">Draft</option>
                <option value="status:archived">Archived</option>
              </optgroup>
            </select>
          </div>
          
          <button
            onClick={refreshServices}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={servicesLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${servicesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        <button
          onClick={handleAddNewService}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Layanan
        </button>
      </div>
    </div>
  );

  const renderCityControls = () => (
    <div className="space-y-4">
      {/* Error Display */}
      {citiesError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-sm text-red-600">{citiesError}</span>
          <button
            onClick={refreshCities}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`border rounded-md p-3 flex items-center ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-600'
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          <span className="text-sm">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}

      {/* Action Bar for Cities */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kota..."
              value={citySearchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Filter Dropdown */}
          <div className="relative">
            <select
              onChange={(e) => {
                const [filterType, filterValue] = e.target.value.split(':');
                if (filterType === 'status') filterCitiesByStatus(filterValue);
                else if (filterType === 'featured') filterFeatured(filterValue === 'true');
                else clearCityFilters();
              }}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kota</option>
              <optgroup label="Status">
                <option value="status:active">Active</option>
                <option value="status:inactive">Inactive</option>
              </optgroup>
              <optgroup label="Featured">
                <option value="featured:true">Featured</option>
                <option value="featured:false">Non-Featured</option>
              </optgroup>
            </select>
          </div>
          
          <button
            onClick={refreshCities}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={citiesLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${citiesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        <button
          onClick={handleAddNewCity}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kota
        </button>
      </div>
    </div>
  );

  const renderTable = () => {
    switch (layananSubTab) {
      case 'spaces':
        return <SpacesTable spaces={spaces} onEdit={onEdit} onDelete={onDelete} />;
      case 'cities':
        return (
          <div className="space-y-4">
            {renderCityControls()}
            <CitiesTable 
              cities={cities} 
              onEdit={handleEditCity} 
              onDelete={(type, id) => {
                const city = cities.find(c => c.id === id);
                if (city) handleDeleteCity(city);
              }}
              loading={citiesLoading}
            />
          </div>
        );
      case 'services':
        return (
          <div className="space-y-4">
            {renderServiceControls()}
            <ServicesTable 
              services={services} 
              onEdit={handleEditService} 
              onDelete={(type, id) => {
                const service = services.find(s => s.id === id);
                if (service) handleDeleteService(service);
              }}
              loading={servicesLoading}
            />
          </div>
        );
      default:
        return <SpacesTable spaces={spaces} onEdit={onEdit} onDelete={onDelete} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setLayananSubTab('spaces')}
          className={`px-4 py-2 font-medium text-sm ${
            layananSubTab === 'spaces'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Spaces
        </button>
        <button
          onClick={() => setLayananSubTab('cities')}
          className={`px-4 py-2 font-medium text-sm ${
            layananSubTab === 'cities'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Kota
        </button>
        <button
          onClick={() => setLayananSubTab('services')}
          className={`px-4 py-2 font-medium text-sm ${
            layananSubTab === 'services'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Layanan
        </button>
      </div>

      {/* Action Bar for non-services tabs */}
      {layananSubTab !== 'services' && (
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${layananSubTab}...`}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
          </div>
          <button
            onClick={() => onAddNew()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah {getTabTitle()}
          </button>
        </div>
      )}

      {/* Table */}
      {renderTable()}

      {/* Service Modal */}
      <ServiceModal
        isOpen={showServiceModal}
        onClose={() => {
          setShowServiceModal(false);
          setSelectedService(null);
        }}
        onSave={handleSaveService}
        service={selectedService}
        mode={modalMode}
      />

      {/* City Modal */}
      <CityModal
        isOpen={showCityModal}
        onClose={() => {
          setShowCityModal(false);
          setSelectedCity(null);
        }}
        onSubmit={handleSaveCity}
        city={selectedCity}
        loading={citiesLoading}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <Trash2 className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Hapus</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus {serviceToDelete ? 'layanan' : 'kota'}{' '}
              <strong>"{(serviceToDelete || cityToDelete)?.name}"</strong>? 
              Tindakan ini tidak dapat dibatalkan.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={serviceToDelete ? confirmDeleteService : confirmDeleteCity}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Hapus
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setServiceToDelete(null);
                  setCityToDelete(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayananWithCRUD; 