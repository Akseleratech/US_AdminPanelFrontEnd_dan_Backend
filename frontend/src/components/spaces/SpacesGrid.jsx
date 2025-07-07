import React, { useState } from 'react';
import { Edit, Trash2, LayoutGrid, Building, Users, Tag, CheckSquare, DollarSign, Clock, Power, Calendar, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Plus } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import SpaceDetailModal from './SpaceDetailModal';

const SpacesGrid = ({ 
  spaces, 
  loading, 
  orders = [],
  onEdit, 
  onDelete, 
  onToggleActive,
  getCategoryDisplayName,
  getBuildingDisplayName 
}) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);

  // Calculate pagination values
  const totalItems = spaces?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSpaces = spaces?.slice(startIndex, endIndex) || [];

  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPage = (pageNumber) => setCurrentPage(pageNumber);

  // Reset to first page when spaces change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [spaces?.length]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);
      
      if (currentPage <= 3) {
        endPage = Math.min(maxVisiblePages, totalPages);
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!spaces || spaces.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="text-center py-16">
          <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada ruang</h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            Mulai dengan membuat ruang pertama Anda untuk memulai mengelola sistem.
          </p>
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-2 rounded-lg inline-flex items-center text-sm font-medium">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Ruang Pertama
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatOperationalHours = (operationalHours) => {
    if (!operationalHours) return 'Tidak diatur';
    
    if (operationalHours.isAlwaysOpen) {
      return '24 Jam';
    }
    
    // Get current day
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', {weekday: 'long'}).toLowerCase();
    
    const schedule = operationalHours.schedule;
    if (!schedule || !schedule[currentDay]) {
      return 'Jadwal tidak tersedia';
    }
    
    const daySchedule = schedule[currentDay];
    if (!daySchedule.isOpen) {
      return 'Tutup hari ini';
    }
    
    return `${daySchedule.openTime} - ${daySchedule.closeTime}`;
  };

  const getEffectiveStatus = (space) => {
    // 1) Nonaktif manual (manual inactive)
    if (!space.isActive) {
      return {
        text: 'Nonaktif Manual',
        className: 'bg-red-100 text-red-800',
        icon: '🔴',
        priority: 'manual'
      };
    }

    // 2) Tutup sementara (outside operational hours)
    if (space.operationalStatus && !space.operationalStatus.isOperational) {
      return {
        text: 'Diluar Jam Operasional',
        className: 'bg-orange-100 text-orange-800',
        icon: '🟠',
        priority: 'operational'
      };
    }

    // 3) Beroperasi (operational). If the space is booked, it still remains in this status
    return {
      text: 'Beroperasi',
      className: 'bg-green-100 text-green-800',
      icon: '🟢',
      priority: 'operational'
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBookingDateRange = (booking) => {
    if (!booking.startDate || !booking.endDate) return '-';
    
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const pricingType = booking.pricingType || 'daily';
    
    // Check if it's the same day
    const isSameDay = startDate.toDateString() === endDate.toDateString();
    
    if (pricingType === 'hourly') {
      // For hourly: show date and time range
      if (isSameDay) {
        return (
          <div>
            <div className="font-medium">{formatDate(booking.startDate)}</div>
            <div className="text-blue-600 text-xs">
              🕐 {formatTime(booking.startDate)} - {formatTime(booking.endDate)}
            </div>
          </div>
        );
      } else {
        // Hourly booking across multiple days (rare case)
        return (
          <div>
            <div className="text-xs">
              {formatDate(booking.startDate)} {formatTime(booking.startDate)}
            </div>
            <div className="text-xs">
              - {formatDate(booking.endDate)} {formatTime(booking.endDate)}
            </div>
          </div>
        );
      }
    } else {
      // For daily, halfday, monthly: show date range
      if (isSameDay) {
        return (
          <div>
            <div className="font-medium">{formatDate(booking.startDate)}</div>
            <div className="text-xs text-gray-600">
              {pricingType === 'halfday' && '🌅 Half Day'}
              {pricingType === 'daily' && '📅 Full Day'}
              {pricingType === 'monthly' && '📆 Monthly'}
              {pricingType === 'yearly' && '🗓️ Yearly'}
            </div>
          </div>
        );
      } else {
        return (
          <div>
            <div className="font-medium text-xs">{formatDate(booking.startDate)}</div>
            <div className="font-medium text-xs">- {formatDate(booking.endDate)}</div>
            <div className="text-xs text-gray-600">
              {pricingType === 'halfday' && '🌅 Half Day'}
              {pricingType === 'daily' && '📅 Full Day'}
              {pricingType === 'monthly' && '📆 Monthly'}
              {pricingType === 'yearly' && '🗓️ Yearly'}
            </div>
          </div>
        );
      }
    }
  };

  // Handle view space details
  const handleViewSpace = (space) => {
    setSelectedSpace(space);
    setIsDetailModalOpen(true);
  };

  // Close detail modal
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSpace(null);
  };


  // Pagination Controls Component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              currentPage === 1 
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              currentPage === totalPages 
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
        
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Menampilkan{' '}
              <span className="font-medium">{startIndex + 1}</span> sampai{' '}
              <span className="font-medium">{Math.min(endIndex, totalItems)}</span> dari{' '}
              <span className="font-medium">{totalItems}</span> ruang
            </p>
          </div>
          
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              {/* First Page Button */}
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                  currentPage === 1 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-500 bg-white hover:bg-gray-50'
                }`}
                title="Halaman Pertama"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              
              {/* Previous Page Button */}
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
                  currentPage === 1 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-500 bg-white hover:bg-gray-50'
                }`}
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {/* Page Numbers */}
              {getPageNumbers().map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => goToPage(pageNumber)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    pageNumber === currentPage
                      ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              
              {/* Next Page Button */}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
                  currentPage === totalPages 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-500 bg-white hover:bg-gray-50'
                }`}
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              
              {/* Last Page Button */}
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                  currentPage === totalPages 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-500 bg-white hover:bg-gray-50'
                }`}
                title="Halaman Terakhir"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentSpaces.map((space) => {
          const effectiveStatus = getEffectiveStatus(space);
          
          return (
            <div key={space.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-200 transition-all duration-300 overflow-hidden group">
            
            {/* Header with enhanced design */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 border-b border-primary-100/50">
              <div className="p-5">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">{space.name}</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="w-4 h-4 mr-1.5 flex-shrink-0" />
                      <span className="truncate">{getBuildingDisplayName(space.buildingId)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {/* Enhanced Status Badge */}
                    <div className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${
                      effectiveStatus.priority === 'manual' 
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : effectiveStatus.text === 'Beroperasi'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                      <span className="mr-1.5">{effectiveStatus.icon}</span>
                      {effectiveStatus.text}
                    </div>
                    
                    {/* Manual inactive indicator */}
                    {!space.isActive && (
                      <div className="px-2 py-1 text-xs text-red-600 bg-red-50 rounded-md border border-red-100">
                        Manual nonaktif
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Main Content */}
            <div className="p-5 space-y-4">
              {/* Key Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Tag className="w-4 h-4 mr-1 text-primary-600" />
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Kategori</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{getCategoryDisplayName(space.category)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="w-4 h-4 mr-1 text-primary-600" />
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Kapasitas</p>
                  <p className="text-sm font-semibold text-gray-900">{space.capacity} orang</p>
                </div>
              </div>

              {/* Operational Hours */}
              <div className="flex items-center text-sm bg-blue-50 rounded-lg p-3">
                <Clock className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-blue-600 font-medium mb-0.5">Jam Operasional</p>
                  <p className="text-sm font-semibold text-blue-900">{formatOperationalHours(space.operationalHours)}</p>
                </div>
              </div>

              {/* Description */}
              {space.description && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 font-medium mb-1">Deskripsi</p>
                  <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                    {space.description}
                  </p>
                </div>
              )}

              {/* Enhanced Pricing Grid */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-center mb-3">
                  <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                  <p className="text-sm font-semibold text-green-900">Harga Sewa</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white rounded-md p-2 border border-green-100">
                    <p className="text-xs text-green-600 font-medium mb-1">Per Jam</p>
                    <p className="text-xs font-bold text-green-900">{formatPrice(space.pricing?.hourly)}</p>
                  </div>
                  <div className="bg-white rounded-md p-2 border border-green-100">
                    <p className="text-xs text-green-600 font-medium mb-1">Per 1/2 Hari</p>
                    <p className="text-xs font-bold text-green-900">{formatPrice(space.pricing?.halfday)}</p>
                  </div>
                  <div className="bg-white rounded-md p-2 border border-green-100">
                    <p className="text-xs text-green-600 font-medium mb-1">Per Hari</p>
                    <p className="text-xs font-bold text-green-900">{formatPrice(space.pricing?.daily)}</p>
                  </div>
                  <div className="bg-white rounded-md p-2 border border-green-100">
                    <p className="text-xs text-green-600 font-medium mb-1">Per Bulan</p>
                    <p className="text-xs font-bold text-green-900">{formatPrice(space.pricing?.monthly)}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="bg-white rounded-md p-2 text-center border border-green-100">
                    <p className="text-xs text-green-600 font-medium mb-1">Per Tahun</p>
                    <p className="text-xs font-bold text-green-900">{formatPrice(space.pricing?.yearly)}</p>
                  </div>
                </div>
              </div>

              {/* Enhanced Amenities */}
              <div>
                <div className="flex items-center mb-2">
                  <CheckSquare className="w-4 h-4 mr-2 text-purple-600" />
                  <p className="text-sm font-semibold text-purple-900">Fasilitas</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(space.amenities && space.amenities.length > 0) ? (
                    space.amenities.slice(0, 6).map((amenity, index) => (
                      <span 
                        key={index} 
                        className="inline-block px-2.5 py-1 text-xs bg-purple-50 text-purple-700 rounded-full border border-purple-100 font-medium"
                      >
                        {amenity}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">Tidak ada fasilitas</span>
                  )}
                  {space.amenities && space.amenities.length > 6 && (
                    <span className="inline-block px-2.5 py-1 text-xs bg-gray-100 text-gray-600 rounded-full border border-gray-200 font-medium">
                      +{space.amenities.length - 6} lainnya
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Enhanced Actions Footer */}
            <div className="bg-gray-50 border-t border-gray-100 px-5 py-3">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    space.isActive 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      space.isActive ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    {space.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => handleViewSpace(space)} 
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200 group/btn" 
                    title="Lihat Detail"
                  >
                    <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                  </button>
                  <button 
                    onClick={() => onToggleActive && onToggleActive(space)} 
                    className={`p-2 rounded-lg transition-colors duration-200 group/btn ${
                      space.isActive 
                        ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' 
                        : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                    }`}
                    title={space.isActive ? 'Nonaktifkan ruang' : 'Aktifkan ruang'}
                  >
                    <Power className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                  </button>
                  <button 
                    onClick={() => onEdit(space)} 
                    className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors duration-200 group/btn" 
                    title="Edit Space"
                  >
                    <Edit className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                  </button>
                  <button 
                    onClick={() => onDelete(space)} 
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 group/btn" 
                    title="Delete Space"
                  >
                    <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Enhanced Pagination Controls */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <PaginationControls />
      </div>

      {/* Space Detail Modal */}
      <SpaceDetailModal 
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        space={selectedSpace}
        orders={orders}
        formatPrice={formatPrice}
        formatBookingDateRange={formatBookingDateRange}
        getEffectiveStatus={getEffectiveStatus}
        getCategoryDisplayName={getCategoryDisplayName}
        getBuildingDisplayName={getBuildingDisplayName}
      />
    </div>
  );
};

export default SpacesGrid; 