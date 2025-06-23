import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import SpacesTable from './SpacesTable.jsx';
import SpaceModal from './SpaceModal.jsx';
import useSpaces from '../../hooks/useSpaces.js';

const Spaces = () => {
  const {
    spaces,
    loading: spacesLoading,
    error: spacesError,
    searchTerm: spaceSearchTerm,
    setSearchTerm: setSpaceSearchTerm,
    createSpace,
    updateSpace,
    deleteSpace,
    refresh: refreshSpaces
  } = useSpaces();

  const [showSpaceModal, setShowSpaceModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAddNew = () => {
    setSelectedSpace(null);
    setModalMode('add');
    setShowSpaceModal(true);
  };

  const handleEdit = (space) => {
    setSelectedSpace(space);
    setModalMode('edit');
    setShowSpaceModal(true);
  };

  const handleDelete = async (space) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus space "${space.name}"?`)) {
      try {
        await deleteSpace(space.id);
        showNotification(`Space "${space.name}" berhasil dihapus`, 'success');
      } catch (error) {
        showNotification(`Gagal menghapus space: ${error.message}`, 'error');
      }
    }
  };

  const handleSaveSpace = async (spaceData) => {
    try {
      console.log('Spaces: handleSaveSpace called with:', spaceData);
      console.log('Spaces: modalMode:', modalMode);
      
      if (modalMode === 'add') {
        console.log('Spaces: Calling createSpace...');
        const result = await createSpace(spaceData);
        console.log('Spaces: createSpace result:', result);
        showNotification('Space baru berhasil ditambahkan', 'success');
      } else {
        console.log('Spaces: Calling updateSpace...');
        const result = await updateSpace(selectedSpace.id, spaceData);
        console.log('Spaces: updateSpace result:', result);
        showNotification('Space berhasil diperbarui', 'success');
      }
      setShowSpaceModal(false);
      setSelectedSpace(null);
    } catch (error) {
      console.error('Spaces: Error in handleSaveSpace:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      showNotification(`Gagal ${modalMode === 'add' ? 'menambah' : 'memperbarui'} space: ${errorMessage}`, 'error');
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
          <h1 className="text-2xl font-bold text-gray-900">Spaces Management</h1>
          <p className="text-gray-600">Kelola semua spaces yang tersedia</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={spaceSearchTerm}
              onChange={(e) => setSpaceSearchTerm(e.target.value)}
              placeholder="Search spaces..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ring-primary"
            />
          </div>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center px-4 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover shadow-primary transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Space
        </button>
      </div>

      {/* Error Display */}
      {spacesError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-red-600">{spacesError}</span>
          <button
            onClick={refreshSpaces}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Table */}
      <SpacesTable 
        spaces={spaces} 
        onEdit={handleEdit} 
        onDelete={(type, id) => {
          const space = spaces.find(s => s.id === id);
          if (space) handleDelete(space);
        }}
        loading={spacesLoading}
      />

      {/* Space Modal */}
      <SpaceModal
        isOpen={showSpaceModal}
        onClose={() => {
          setShowSpaceModal(false);
          setSelectedSpace(null);
        }}
        onSave={handleSaveSpace}
        space={selectedSpace}
        mode={modalMode}
      />
    </div>
  );
};

export default Spaces; 