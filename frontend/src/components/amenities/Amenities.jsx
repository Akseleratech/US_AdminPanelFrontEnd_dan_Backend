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
    fetchAmenities, 
    addAmenity, 
    updateAmenity, 
    deleteAmenity,
    toggleAmenityStatus
  } = useAmenities();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAmenity, setCurrentAmenity] = useState(null);
  const [modalMode, setModalMode] = useState('add');

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
    if (modalMode === 'edit') {
      await updateAmenity(currentAmenity.id, amenityData);
    } else {
      await addAmenity(amenityData);
    }
    // Refresh the list after saving
    fetchAmenities();
    handleCloseModal();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this amenity?')) {
      await deleteAmenity(id);
      fetchAmenities();
    }
  };

  const handleToggle = async (id) => {
    await toggleAmenityStatus(id);
    fetchAmenities();
  };

  return (
    <div>
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