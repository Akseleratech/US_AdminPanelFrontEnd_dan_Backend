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
    handleCloseModal();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this amenity?')) {
      await deleteAmenity(id);
    }
  };

  const handleToggle = async (id) => {
    await toggleAmenityStatus(id);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Amenities</h1>
        <button
          onClick={() => handleOpenModal('add')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Amenity
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