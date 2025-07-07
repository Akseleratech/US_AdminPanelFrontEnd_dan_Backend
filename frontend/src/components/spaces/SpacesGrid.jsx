import React, { useState } from 'react';
import { Edit, Trash2, LayoutGrid, Building, Users, Tag, CheckSquare, DollarSign, Clock, Power, Calendar, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye } from 'lucide-react';
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
      <div className="text-center py-12">
         <LayoutGrid className="mx-auto h-12 w-12 text-gray-300" />
         <h3 className="mt-2 text-sm font-medium text-gray-800">No spaces found</h3>
         <p className="mt-1 text-sm text-gray-500">
           Get started by creating your first space.
         </p>
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
        text: 'Tutup Sementara',
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

  // Helper function to get booking information for a space
  const getSpaceBookings = (spaceId) => {
    if (!orders || !Array.isArray(orders)) {
      return [];
    }
    
    // Filter orders for this space with confirmed or active status
    const bookedStatuses = ['confirmed', 'active'];
    
    // First, find orders for this space (regardless of status)
    const ordersForSpace = orders.filter(order => {
      const isMatch = order.spaceId === spaceId;
      return isMatch;
    });
    
    // Then filter by status
    const validBookings = ordersForSpace.filter(order => {
      const statusMatch = bookedStatuses.includes(order.status?.toLowerCase());
      return statusMatch;
    });
    
    return validBookings.sort((a, b) => new Date(a.startDate) - new Date(b.startDate)); // Sort by start date
  };

  // Pagination Controls Component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-primary-200 sm:px-6">
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentSpaces.map((space) => {
          return (
            <div key={space.id} className="bg-white border border-primary-100 hover:shadow-lg transition-all duration-300">
            {/* Space Image */}
            {space.images && space.images.length > 0 && (
              <div className="h-48 w-full overflow-hidden">
                <img
                  src={space.images[0]}
                  alt={space.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            
            {/* Header */}
            <div className="border-b border-primary-100">
              <div className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-primary-800">{space.name}</h3>
                    <p className="text-sm text-primary-600">{getBuildingDisplayName(space.buildingId)}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {/* Effective Status - combines manual active/inactive + operational hours */}
                    {(() => {
                      const effectiveStatus = getEffectiveStatus(space);
                      return (
                        <div className={`px-2 py-1 text-xs font-medium rounded ${effectiveStatus.className}`}>
                          <span className="mr-1">{effectiveStatus.icon}</span>
                          {effectiveStatus.text}
                        </div>
                      );
                    })()}
                    
                    {/* Show manual inactive reason if space is manually deactivated */}
                    {!space.isActive && (
                      <div className="px-2 py-1 text-xs text-gray-500 italic">
                        Dinonaktifkan manual
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-4 space-y-4">
              {/* Basic Info */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-primary-700">
                  <Tag className="w-4 h-4 mr-1.5" />
                  {getCategoryDisplayName(space.category)}
                </div>
                <div className="flex items-center text-primary-700">
                  <Users className="w-4 h-4 mr-1.5" />
                  {space.capacity} orang
                </div>
              </div>

              {/* Operational Hours */}
              <div className="flex items-center text-sm text-primary-700">
                <Clock className="w-4 h-4 mr-1.5" />
                <span className="text-primary-600">Jam Operasional: </span>
                <span className="ml-1 font-medium">{formatOperationalHours(space.operationalHours)}</span>
              </div>

              {/* Description */}
              {space.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {space.description}
                </p>
              )}

              {/* Pricing */}
              <div className="grid grid-cols-5 gap-2 py-2 border-y border-primary-50">
                <div className="text-center">
                  <p className="text-xs text-primary-600 mb-1">Per Jam</p>
                  <p className="text-sm font-medium text-primary-800">{formatPrice(space.pricing?.hourly)}</p>
                </div>
                <div className="text-center border-x border-primary-50">
                  <p className="text-xs text-primary-600 mb-1">Per 1/2&nbsp;Hari</p>
                  <p className="text-sm font-medium text-primary-800">{formatPrice(space.pricing?.halfday)}</p>
                </div>
                <div className="text-center border-r border-primary-50">
                  <p className="text-xs text-primary-600 mb-1">Per Hari</p>
                  <p className="text-sm font-medium text-primary-800">{formatPrice(space.pricing?.daily)}</p>
                </div>
                <div className="text-center border-r border-primary-50">
                  <p className="text-xs text-primary-600 mb-1">Per Bulan</p>
                  <p className="text-sm font-medium text-primary-800">{formatPrice(space.pricing?.monthly)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-primary-600 mb-1">Per Tahun</p>
                  <p className="text-sm font-medium text-primary-800">{formatPrice(space.pricing?.yearly)}</p>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <p className="text-xs text-primary-600 mb-2">Fasilitas:</p>
                <div className="flex flex-wrap gap-1">
                  {(space.amenities && space.amenities.length > 0) ? (
                    space.amenities.map((amenity, index) => (
                      <span 
                        key={index} 
                        className="inline-block px-2 py-0.5 text-xs bg-primary-50 text-primary-700"
                      >
                        {amenity}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-primary-400">-</span>
                  )}
                </div>
              </div>

              {/* Booking Information */}
              {(() => {
                const bookings = getSpaceBookings(space.id);
                if (bookings.length === 0) {
                  return (
                    <div className="pt-3 border-t border-primary-100">
                      <p className="text-xs text-primary-600 mb-2">Status Booking:</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1.5" />
                        <span>Tidak ada booking aktif</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="pt-3 border-t border-primary-100">
                    <p className="text-xs text-primary-600 mb-2">Booking Aktif ({bookings.length}):</p>
                    <div className="space-y-2 max-h-24 overflow-y-auto">
                      {bookings.map((booking, index) => (
                        <div key={index} className="p-2 bg-blue-50 rounded text-xs">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-start text-blue-700 flex-1 min-w-0">
                              <Calendar className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                {formatBookingDateRange(booking)}
                              </div>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ml-2 flex-shrink-0 ${
                              booking.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                          <div className="flex items-center text-blue-600">
                            <User className="w-3 h-3 mr-1" />
                            <span className="truncate">{booking.customerName || 'Unknown Customer'}</span>
                          </div>
                          {booking.orderId && (
                            <div className="text-gray-500 mt-1 text-xs truncate">
                              Order: {booking.orderId}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Actions */}
            <div className="px-4 py-2 bg-primary-50/50 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {space.isActive ? 'Manual aktif' : 'Manual nonaktif'}
              </div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => handleViewSpace(space)} 
                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded" 
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onToggleActive && onToggleActive(space)} 
                  className={`p-1.5 rounded transition-colors ${
                    space.isActive 
                      ? 'text-green-600 hover:text-green-800 hover:bg-green-50' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                  title={space.isActive ? 'Nonaktifkan ruang' : 'Aktifkan ruang'}
                >
                  <Power className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onEdit(space)} 
                  className="p-1.5 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded" 
                  title="Edit Space"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onDelete(space)} 
                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded" 
                  title="Delete Space"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      <PaginationControls />

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