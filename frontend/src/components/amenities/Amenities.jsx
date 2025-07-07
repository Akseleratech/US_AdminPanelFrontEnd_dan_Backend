import React, { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import useAmenities from '../../hooks/useAmenities';
import AmenitiesTable from './AmenitiesTable';
import AmenityModal from './AmenityModal';

const Amenities = () => {
  const { 
    amenities, 
    loading, 
    error, 
    total,
    usedAmenityIds,
    fetchAmenities, 
    addAmenity, 
    updateAmenity, 
    deleteAmenity,
    toggleAmenityStatus
  } = useAmenities();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAmenity, setCurrentAmenity] = useState(null);
  const [modalMode, setModalMode] = useState('add');
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleOpenModal = (mode = 'add', amenity = null) => {
    setModalMode(mode);
    setCurrentAmenity(amenity);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentAmenity(null);
  };

  const handleSave = async (amenityData) => {
    try {
      if (modalMode === 'edit') {
        await updateAmenity(currentAmenity.id, amenityData);
        showNotification('Fasilitas berhasil diperbarui', 'success');
      } else {
        await addAmenity(amenityData);
        showNotification('Fasilitas baru berhasil ditambahkan', 'success');
      }
      // Refresh the list after saving
      fetchAmenities();
      handleCloseModal();
    } catch (err) {
      showNotification(`Gagal ${modalMode === 'edit' ? 'memperbarui' : 'menambahkan'} fasilitas: ${err.message}`, 'error');
    }
  };

  const handleDelete = async (id) => {
    // Check if amenity is being used by any space
    if (usedAmenityIds && usedAmenityIds.has(id)) {
      const amenity = amenities.find(a => a.id === id);
      const amenityName = amenity ? amenity.name : 'fasilitas ini';
      showNotification(`Fasilitas "${amenityName}" sedang digunakan oleh satu atau lebih space dan tidak bisa dihapus.`, 'error');
      return;
    }
    
    const amenity = amenities.find(a => a.id === id);
    const amenityName = amenity ? amenity.name : 'fasilitas ini';
    
    if (window.confirm(`Apakah Anda yakin ingin menghapus fasilitas "${amenityName}"?`)) {
      try {
        await deleteAmenity(id);
        showNotification(`Fasilitas "${amenityName}" berhasil dihapus`, 'success');
        fetchAmenities();
      } catch (err) {
        showNotification(`Gagal menghapus fasilitas: ${err.message}`, 'error');
      }
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleAmenityStatus(id);
      const amenity = amenities.find(a => a.id === id);
      const amenityName = amenity ? amenity.name : 'fasilitas ini';
      const newStatus = amenity ? !amenity.isActive : true;
      showNotification(`Fasilitas "${amenityName}" berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
      fetchAmenities();
    } catch (err) {
      showNotification(`Gagal mengubah status fasilitas: ${err.message}`, 'error');
    }
  };

  return (
    <div>
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

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kelola Fasilitas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Buat, edit, dan kelola semua fasilitas yang tersedia untuk ruangan.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal('add')}
          className="flex items-center px-4 py-2 bg-gradient-primary text-white text-sm font-semibold rounded-lg hover:bg-gradient-primary-hover shadow-primary transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Fasilitas
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">{error}</div>}

      <AmenitiesTable 
        amenities={amenities}
        loading={loading}
        usedAmenityIds={usedAmenityIds}
        onEdit={(amenity) => handleOpenModal('edit', amenity)}
        onDelete={handleDelete}
        onToggleStatus={handleToggle}
      />

      <AmenityModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        amenity={currentAmenity}
        mode={modalMode}
      />
    </div>
  );
};

export default Amenities; 