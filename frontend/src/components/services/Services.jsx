import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import ServicesTable from './ServicesTable.jsx';
import ServiceModal from './ServiceModal.jsx';
import useServices from '../../hooks/useServices.js';

const Services = () => {
  const {
    services,
    loading: servicesLoading,
    error: servicesError,
    searchTerm: serviceSearchTerm,
    setSearchTerm: setServiceSearchTerm,
    createService,
    updateService,
    deleteService,
    refresh: refreshServices
  } = useServices();

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedService, setSelectedService] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAddNew = () => {
    setSelectedService(null);
    setModalMode('add');
    setShowServiceModal(true);
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setModalMode('edit');
    setShowServiceModal(true);
  };

  const handleDelete = async (service) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus layanan "${service.name}"?`)) {
      try {
        await deleteService(service.id);
        showNotification(`Layanan "${service.name}" berhasil dihapus`, 'success');
      } catch (error) {
        showNotification(`Gagal menghapus layanan: ${error.message}`, 'error');
      }
    }
  };

  const handleSaveService = async (serviceData) => {
    try {
      console.log('Services: handleSaveService called with:', serviceData);
      console.log('Services: modalMode:', modalMode);
      
      if (modalMode === 'add') {
        console.log('Services: Calling createService...');
        const result = await createService(serviceData);
        console.log('Services: createService result:', result);
        showNotification('Layanan baru berhasil ditambahkan', 'success');
      } else {
        console.log('Services: Calling updateService...');
        const result = await updateService(selectedService.id, serviceData);
        console.log('Services: updateService result:', result);
        showNotification('Layanan berhasil diperbarui', 'success');
      }
      setShowServiceModal(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Services: Error in handleSaveService:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      showNotification(`Gagal ${modalMode === 'add' ? 'menambah' : 'memperbarui'} layanan: ${errorMessage}`, 'error');
      throw error; // Let the modal handle the error display
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Services Management</h1>
          <p className="text-gray-600">Kelola semua layanan yang tersedia</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={serviceSearchTerm}
              onChange={(e) => setServiceSearchTerm(e.target.value)}
              placeholder="Search services..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ring-primary"
            />
          </div>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center px-4 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover shadow-primary transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Layanan
        </button>
      </div>

      {/* Error Display */}
      {servicesError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-red-600">{servicesError}</span>
          <button
            onClick={refreshServices}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Table */}
      <ServicesTable 
        services={services} 
        onEdit={handleEdit} 
        onDelete={(type, id) => {
          const service = services.find(s => s.id === id);
          if (service) handleDelete(service);
        }}
        loading={servicesLoading}
      />

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
    </div>
  );
};

export default Services; 