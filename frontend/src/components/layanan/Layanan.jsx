import React, { useState } from 'react';
import { Search, Plus, AlertCircle, Trash2 } from 'lucide-react';
import LayananTable from './LayananTable.jsx';
import LayananModal from './LayananModal.jsx';
import useLayanan from '../../hooks/useLayanan.js';

const Layanan = () => {
  const {
    layananList,
    loading: layananLoading,
    error: layananError,
    searchTerm: layananSearchTerm,
    setSearchTerm: setLayananSearchTerm,
    createLayanan,
    updateLayanan,
    deleteLayanan,
    refresh: refreshLayanan
  } = useLayanan();

  const [showLayananModal, setShowLayananModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedLayanan, setSelectedLayanan] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [layananToDelete, setLayananToDelete] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAddNew = () => {
    setSelectedLayanan(null);
    setModalMode('add');
    setShowLayananModal(true);
  };

  const handleEdit = (layanan) => {
    setSelectedLayanan(layanan);
    setModalMode('edit');
    setShowLayananModal(true);
  };

  const handleDelete = (layanan) => {
    setLayananToDelete(layanan);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!layananToDelete) return;

    try {
      await deleteLayanan(layananToDelete.id);
      showNotification(`Layanan "${layananToDelete.name}" berhasil dihapus`, 'success');
      setShowDeleteConfirm(false);
      setLayananToDelete(null);
    } catch (error) {
      showNotification(`Gagal menghapus layanan: ${error.message}`, 'error');
    }
  };

  const handleSaveLayanan = async (layananData) => {
    try {
      console.log('Layanan: handleSaveLayanan called with:', layananData);
      console.log('Layanan: modalMode:', modalMode);
      
      if (modalMode === 'add') {
        console.log('Layanan: Calling createLayanan...');
        const result = await createLayanan(layananData);
        console.log('Layanan: createLayanan result:', result);
        showNotification('Layanan baru berhasil ditambahkan', 'success');
      } else {
        console.log('Layanan: Calling updateLayanan...');
        const result = await updateLayanan(selectedLayanan.id, layananData);
        console.log('Layanan: updateLayanan result:', result);
        showNotification('Layanan berhasil diperbarui', 'success');
      }
      setShowLayananModal(false);
      setSelectedLayanan(null);
    } catch (error) {
      console.error('Layanan: Error in handleSaveLayanan:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Layanan</h1>
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
              value={layananSearchTerm}
              onChange={(e) => setLayananSearchTerm(e.target.value)}
              placeholder="Cari layanan..."
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
      {layananError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-red-600">{layananError}</span>
          <button
            onClick={refreshLayanan}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Table */}
      <LayananTable 
        layananList={layananList} 
        onEdit={handleEdit} 
        onDelete={(type, id) => {
          const layanan = layananList.find(l => l.id === id);
          if (layanan) handleDelete(layanan);
        }}
        loading={layananLoading}
      />

      {/* Layanan Modal */}
      <LayananModal
        isOpen={showLayananModal}
        onClose={() => {
          setShowLayananModal(false);
          setSelectedLayanan(null);
        }}
        onSave={handleSaveLayanan}
        layanan={selectedLayanan}
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
              Apakah Anda yakin ingin menghapus layanan "{layananToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
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

export default Layanan; 