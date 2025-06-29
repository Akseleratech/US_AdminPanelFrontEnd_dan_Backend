import React, { useState, useEffect } from 'react';
import { Search, Plus, LayoutGrid, MapPin, Users, Clock, Edit, Trash2, Eye, Calendar } from 'lucide-react';
import useSpaces from '../../hooks/useSpaces';
import useLayanan from '../../hooks/useLayanan';
import useBuildings from '../../hooks/useBuildings';
import SpaceModal from './SpaceModal';
import LoadingSpinner from '../common/LoadingSpinner';
import { getStatusColor, getStatusIcon } from '../../utils/helpers';
import { ordersAPI } from '../../services/api.jsx';
import SpacesGrid from './SpacesGrid';

const Spaces = () => {
  const {
    spaces,
    loading,
    error,
    refreshSpaces,
    createSpace,
    updateSpace,
    deleteSpace,
  } = useSpaces();

  const {
    layananList,
    loading: layananLoading
  } = useLayanan();

  const {
    buildings,
    loading: buildingsLoading
  } = useBuildings();

  // Create a map of layanan IDs to names
  const layananMap = {};
  if (Array.isArray(layananList)) {
    layananList.forEach(layanan => {
      if (layanan && layanan.id) {
        layananMap[layanan.id] = layanan.name;
      }
    });
  }

  // Create a map of building IDs to names
  const buildingMap = {};
  if (Array.isArray(buildings)) {
    buildings.forEach(building => {
      if (building && building.id) {
        buildingMap[building.id] = building.name;
      }
    });
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [filters, setFilters] = useState({
    buildingId: 'all',
    layanan: 'all',
    status: 'all', // 'all', 'active', 'inactive'
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Fetch orders data
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await ordersAPI.getAll();
      
      if (response?.orders) {
        setOrders(response.orders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter spaces based on search term and filters
  const filteredSpaces = spaces.filter(space => {
    const searchMatch = space.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      layananMap[space.category]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buildingMap[space.buildingId]?.toLowerCase().includes(searchTerm.toLowerCase());

    const buildingMatch = filters.buildingId === 'all' || space.buildingId === filters.buildingId;
    const layananMatch = filters.layanan === 'all' || space.category === filters.layanan;
    const statusMatch = filters.status === 'all' || (filters.status === 'active' && space.isActive) || (filters.status === 'inactive' && !space.isActive);

    return searchMatch && buildingMatch && layananMatch && statusMatch;
  });

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

  const handleToggleActive = async (space) => {
    const newStatus = !space.isActive;
    const action = newStatus ? 'mengaktifkan' : 'menonaktifkan';
    
    if (window.confirm(`Apakah Anda yakin ingin ${action} ruang "${space.name}"?`)) {
      try {
        await updateSpace(space.id, { 
          ...space, 
          isActive: newStatus 
        });
        showNotification(
          `Ruang "${space.name}" berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}!`, 
          'success'
        );
      } catch (error) {
        showNotification(`Gagal ${action} ruang: ${error.message}`, 'error');
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
    switch (category?.toLowerCase()) {
      case 'meeting-room': return <Users className="w-4 h-4" />;
      case 'co-working': return <LayoutGrid className="w-4 h-4" />;
      case 'private-office': return <MapPin className="w-4 h-4" />;
      case 'event-space': return <Clock className="w-4 h-4" />;
      case 'phone-booth': return <Users className="w-4 h-4" />;
      default: return <LayoutGrid className="w-4 h-4" />;
    }
  };

  const getCategoryDisplayName = (categoryId) => {
    return layananMap[categoryId] || categoryId || 'Unknown';
  };

  const getBuildingDisplayName = (buildingId) => {
    return buildingMap[buildingId] || buildingId || 'Unknown';
  };

  // Helper function to get effective status for statistics
  const getEffectiveStatus = (space) => {
    // If manually deactivated, it's inactive
    if (!space.isActive) return 'inactive';
    
    // If outside operational hours, it's effectively inactive
    if (space.operationalStatus && !space.operationalStatus.isOperational) return 'inactive';
    
    // Otherwise it's active and operational
    return 'active';
  };

  // Statistics calculations based on effective status
  const effectivelyActiveSpaces = filteredSpaces.filter(s => getEffectiveStatus(s) === 'active');
  const effectivelyInactiveSpaces = filteredSpaces.filter(s => getEffectiveStatus(s) === 'inactive');
  const totalCapacity = filteredSpaces.reduce((total, space) => total + (parseInt(space.capacity) || 0), 0);

  // More detailed breakdown
  const manuallyDeactivatedSpaces = filteredSpaces.filter(s => !s.isActive);
  const outsideOperationalHours = filteredSpaces.filter(s => 
    s.isActive && s.operationalStatus && !s.operationalStatus.isOperational
  );

  // Calculate booked spaces from orders
  const getBookedSpaces = () => {
    const activeStatuses = ['confirmed', 'ongoing', 'active', 'in-progress', 'pending'];
    const activeOrders = orders.filter(order => 
      activeStatuses.includes(order.status?.toLowerCase())
    );
    
    // Get unique space IDs that are currently booked
    const bookedSpaceIds = [...new Set(activeOrders.map(order => order.spaceId))];
    
    // Count how many of our filtered spaces are currently booked
    const bookedSpacesCount = filteredSpaces.filter(space => 
      bookedSpaceIds.includes(space.id) || bookedSpaceIds.includes(space.spaceId)
    ).length;
    
    return {
      count: bookedSpacesCount,
      totalActiveOrders: activeOrders.length
    };
  };

  const bookedSpacesInfo = getBookedSpaces();

  if (loading || layananLoading || buildingsLoading || ordersLoading) {
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
            onClick={refreshSpaces}
            className="mt-2 text-sm bg-red-200 hover:bg-red-300 px-3 py-1 rounded"
          >
            Retry
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spaces</p>
              <p className="text-2xl font-bold text-gray-900">{filteredSpaces.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <LayoutGrid className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Beroperasi</p>
              <p className="text-2xl font-bold text-green-600">{effectivelyActiveSpaces.length}</p>
              <p className="text-xs text-gray-500 mt-1">Aktif & dalam jam operasional</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sedang Digunakan</p>
              <p className="text-2xl font-bold text-blue-600">{bookedSpacesInfo.count}</p>
              <p className="text-xs text-gray-500 mt-1">{bookedSpacesInfo.totalActiveOrders} booking aktif</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tutup Sementara</p>
              <p className="text-2xl font-bold text-orange-600">{outsideOperationalHours.length}</p>
              <p className="text-xs text-gray-500 mt-1">Di luar jam operasional</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nonaktif Manual</p>
              <p className="text-2xl font-bold text-red-600">{manuallyDeactivatedSpaces.length}</p>
              <p className="text-xs text-gray-500 mt-1">Dimatikan oleh admin</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Search */}
          <div className="relative w-full md:w-auto">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, gedung..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 ring-primary"
            />
          </div>

          {/* Add Button */}
          <button
            onClick={handleAddSpace}
            className="flex-shrink-0 flex items-center px-4 py-2 bg-gradient-primary text-white text-sm font-semibold rounded-lg hover:bg-gradient-primary-hover shadow-primary transition-all duration-200 w-full md:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Space
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Gedung</label>
            <select
              name="buildingId"
              value={filters.buildingId}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
            >
              <option value="all">Semua Gedung</option>
              {Array.isArray(buildings) && buildings.map(building => (
                <option key={building.id} value={building.id}>{building.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Layanan</label>
            <select
              name="layanan"
              value={filters.layanan}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
            >
              <option value="all">Semua Layanan</option>
              {Array.isArray(layananList) && layananList.map(layanan => (
                <option key={layanan.id} value={layanan.id}>{layanan.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Spaces Grid */}
      <SpacesGrid
        spaces={filteredSpaces}
        loading={loading || layananLoading}
        onEdit={handleEditSpace}
        onDelete={handleDeleteSpace}
        onToggleActive={handleToggleActive}
        getCategoryDisplayName={getCategoryDisplayName}
        getBuildingDisplayName={getBuildingDisplayName}
      />

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