import React, { useState, useMemo } from 'react';
import { Search, Plus, AlertCircle, Trash2 } from 'lucide-react';
import BuildingsTable from './BuildingsTable.jsx';
import BuildingModal from './BuildingModal.jsx';
import useBuildings from '../../hooks/useBuildings.js';
import useSpaces from '../../hooks/useSpaces.js';
import { useGlobalRefresh } from '../../contexts/GlobalRefreshContext.jsx';

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

  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState(null);

  const usedBuildingIds = useMemo(() => {
    if (!spaces) return new Set();
    return new Set(spaces.map(space => space.buildingId).filter(Boolean));
  }, [spaces]);

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
        
        showNotification('Lokasi/gedung baru berhasil ditambahkan', 'success');
      } else {
        result = await updateBuilding(selectedBuilding.id, buildingData);
        
        // Trigger global refresh untuk buildings dan spaces (karena space modal butuh building data)
        refreshRelatedToBuildings();
        
        showNotification('Lokasi/gedung berhasil diperbarui', 'success');
      }
      setShowBuildingModal(false);
      setSelectedBuilding(null);
      return result; // Return the saved building data for image upload
    } catch (error) {
      const errorMessage = error.message || 'Unknown error occurred';
      showNotification(`Gagal ${modalMode === 'add' ? 'menambah' : 'memperbarui'} lokasi/gedung: ${errorMessage}`, 'error');
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
              value={buildingSearchTerm}
              onChange={(e) => setBuildingSearchTerm(e.target.value)}
              placeholder="Search lokasi/gedung..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ring-primary"
            />
          </div>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center px-4 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover shadow-primary transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Lokasi/Gedung
        </button>
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
        buildings={buildings} 
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
        onClose={() => {
          setShowBuildingModal(false);
          setSelectedBuilding(null);
        }}
        onSave={handleSaveBuilding}
        building={selectedBuilding}
        mode={modalMode}
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