import React, { useState } from 'react';
import { Search, Plus, LayoutGrid, MapPin, Users, Clock, Edit, Trash2, Eye } from 'lucide-react';
import useSpaces from '../../hooks/useSpaces';
import SpaceModal from './SpaceModal';
import LoadingSpinner from '../common/LoadingSpinner';

const Spaces = () => {
  const {
    spaces,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    createSpace,
    updateSpace,
    deleteSpace,
    refresh
  } = useSpaces();

  const [notification, setNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAddSpace = () => {
    setSelectedSpace(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditSpace = (space) => {
    setSelectedSpace(space);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewSpace = (space) => {
    setSelectedSpace(space);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleDeleteSpace = async (space) => {
    if (window.confirm(`Are you sure you want to delete space "${space.name}"?`)) {
      try {
        await deleteSpace(space.id);
        showNotification('Space deleted successfully!', 'success');
      } catch (error) {
        showNotification('Failed to delete space: ' + error.message, 'error');
      }
    }
  };

  const handleModalSave = async (spaceData) => {
    try {
      if (modalMode === 'create') {
        await createSpace(spaceData);
        showNotification('Space created successfully!', 'success');
      } else if (modalMode === 'edit') {
        await updateSpace(selectedSpace.id, spaceData);
        showNotification('Space updated successfully!', 'success');
      }
      setIsModalOpen(false);
      setSelectedSpace(null);
    } catch (error) {
      showNotification('Failed to save space: ' + error.message, 'error');
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const getTypeIcon = (category) => {
    switch (category) {
      case 'meeting-room': return <Users className="w-4 h-4" />;
      case 'co-working': return <LayoutGrid className="w-4 h-4" />;
      case 'private-office': return <MapPin className="w-4 h-4" />;
      case 'event-space': return <Clock className="w-4 h-4" />;
      case 'phone-booth': return <Users className="w-4 h-4" />;
      default: return <LayoutGrid className="w-4 h-4" />;
    }
  };

  const getCategoryDisplayName = (category) => {
    switch (category) {
      case 'meeting-room': return 'Meeting Room';
      case 'co-working': return 'Co-working Space';
      case 'private-office': return 'Private Office';
      case 'event-space': return 'Event Space';
      case 'phone-booth': return 'Phone Booth';
      default: return category || 'Unknown';
    }
  };

  // Statistics calculations
  const activeSpaces = spaces.filter(s => s.isActive);
  const inactiveSpaces = spaces.filter(s => !s.isActive);
  const totalCapacity = spaces.reduce((total, space) => total + (parseInt(space.capacity) || 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

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
          <p className="text-gray-600">Kelola ruang kerja dan fasilitas dalam gedung</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading spaces:</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={refresh}
            className="mt-2 text-sm bg-red-200 hover:bg-red-300 px-3 py-1 rounded"
          >
            Retry
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spaces</p>
              <p className="text-2xl font-bold text-gray-900">{spaces.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <LayoutGrid className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{activeSpaces.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-red-600">{inactiveSpaces.length}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Capacity</p>
              <p className="text-2xl font-bold text-gray-900">{totalCapacity}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search spaces..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ring-primary"
            />
          </div>
        </div>

        <button 
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-sm hover:shadow font-medium text-sm"
          onClick={handleAddSpace}
        >
          <Plus className="w-5 h-5" />
          <span>Add Space</span>
        </button>
      </div>

      {/* Spaces Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Space
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Layanan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amenities
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {spaces.map((space) => (
                <tr key={space.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-primary-light flex items-center justify-center">
                          {getTypeIcon(space.category)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{space.name}</div>
                        <div className="text-sm text-gray-500">{space.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getCategoryDisplayName(space.category)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{space.capacity} people</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{space.location?.city}</div>
                    <div className="text-sm text-gray-500">{space.location?.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(space.isActive)}`}>
                      {getStatusText(space.isActive)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {space.amenities && space.amenities.slice(0, 3).map((amenity, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                          {typeof amenity === 'string' ? amenity : amenity.name}
                        </span>
                      ))}
                      {space.amenities && space.amenities.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                          +{space.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={() => handleViewSpace(space)}
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      className="text-primary hover:text-primary-dark mr-3"
                      onClick={() => handleEditSpace(space)}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDeleteSpace(space)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {spaces.length === 0 && !loading && (
          <div className="text-center py-12">
            <LayoutGrid className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No spaces found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? `No spaces match "${searchTerm}"` : 'Get started by creating your first space.'}
            </p>
            <button 
              onClick={handleAddSpace}
              className="mt-4 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-all duration-200 shadow-sm hover:shadow font-medium text-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Space</span>
            </button>
          </div>
        )}
      </div>

      {/* Space Modal */}
      <SpaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        space={selectedSpace}
        mode={modalMode}
      />
    </div>
  );
};

export default Spaces; 