import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, RefreshCw, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import { promosAPI } from '../../services/api';
import PromoModal from './PromoModal';
import PromosTable from './PromosTable';
import LoadingSpinner from '../common/LoadingSpinner';

const Promo = () => {
  // Data state
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    isActive: '',
    sortBy: 'order',
    sortOrder: 'asc'
  });

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    banners: 0,
    sections: 0,
    active: 0
  });

  // Load promos on component mount
  useEffect(() => {
    loadPromos();
  }, [filters]);

  // Load promos from API
  const loadPromos = async () => {
    try {
      setLoading(true);
      console.log('🎯 Loading promos with filters:', filters);
      
      // Clean up filters - don't send empty strings to API
      const apiFilters = {};
      if (filters.search && filters.search.trim()) {
        apiFilters.search = filters.search.trim();
      }
      if (filters.type && filters.type.trim()) {
        apiFilters.type = filters.type.trim();
      }
      if (filters.isActive && filters.isActive.trim()) {
        apiFilters.isActive = filters.isActive.trim();
      }
      if (filters.sortBy) {
        apiFilters.sortBy = filters.sortBy;
      }
      if (filters.sortOrder) {
        apiFilters.sortOrder = filters.sortOrder;
      }
      
      console.log('📡 Calling API with filters:', apiFilters);
      const respWrapper = await promosAPI.getAll(apiFilters);
      console.log('✅ API response received:', respWrapper);

      const payload = respWrapper?.data;

      if (payload && payload.promos) {
        setPromos(payload.promos);
        console.log(`📊 Loaded ${payload.promos.length} promos`);

        // Calculate stats
        const stats = {
          total: payload.total || payload.promos.length,
          banners: payload.promos.filter(p => p.type === 'banner').length,
          sections: payload.promos.filter(p => p.type === 'section').length,
          active: payload.promos.filter(p => p.isActive).length
        };
        setStats(stats);
        console.log('📈 Updated stats:', stats);
      } else {
        console.warn('⚠️ No promos data in response:', respWrapper);
        setPromos([]);
        setStats({ total: 0, banners: 0, sections: 0, active: 0 });
      }
    } catch (error) {
      console.error('❌ Error loading promos:', error);
      setPromos([]);
      setStats({ total: 0, banners: 0, sections: 0, active: 0 });
      
      // Show user-friendly error message
      alert('Gagal memuat data promo. Silakan coba lagi atau periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPromos();
    setRefreshing(false);
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle search
  const handleSearch = (e) => {
    handleFilterChange('search', e.target.value);
  };

  // Handle create new promo
  const handleCreateNew = () => {
    setEditingPromo(null);
    setShowModal(true);
  };

  // Handle edit promo
  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setShowModal(true);
  };

  // Handle delete promo
  const handleDelete = async (promo) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus promo "${promo.title}"?`)) {
      return;
    }

    try {
      await promosAPI.delete(promo.id);
      await loadPromos();
    } catch (error) {
      console.error('Error deleting promo:', error);
      alert('Gagal menghapus promo. Silakan coba lagi.');
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (promo) => {
    try {
      await promosAPI.update(promo.id, { isActive: !promo.isActive });
      await loadPromos();
    } catch (error) {
      console.error('Error toggling promo status:', error);
      alert('Gagal mengubah status promo. Silakan coba lagi.');
    }
  };

  // Handle modal save
  const handleModalSave = async () => {
    await loadPromos();
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      isActive: '',
      sortBy: 'order',
      sortOrder: 'asc'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promo Management</h1>
          <p className="text-gray-600 mt-1">
            Kelola banner promosi dan konten untuk aplikasi mobile
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ImageIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Promo</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-800">B</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Banner</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.banners}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                  <span className="text-xs font-medium text-green-800">S</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Section</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.sections}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Aktif</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.active}</dd>
                </dl>
              </div>
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
              value={filters.search}
              onChange={handleSearch}
              placeholder="Cari promo..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ring-primary"
            />
          </div>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center px-4 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover shadow-primary transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Promo
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <PromosTable
          promos={promos}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* Modal */}
      <PromoModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        promo={editingPromo}
        onSave={handleModalSave}
      />
    </div>
  );
};

export default Promo; 