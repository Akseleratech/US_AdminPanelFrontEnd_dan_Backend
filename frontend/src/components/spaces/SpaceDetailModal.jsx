import React, { useState } from 'react';
import { X, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { getStatusColor } from '../../utils/helpers.jsx';

const SpaceDetailModal = ({ 
  isOpen, 
  onClose, 
  space, 
  orders = [],
  formatPrice,
  formatBookingDateRange,
  getEffectiveStatus,
  getCategoryDisplayName,
  getBuildingDisplayName 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen || !space) return null;

  // Helper function to get booking information for the space
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

  const spaceBookings = getSpaceBookings(space.id);
  const recentOrders = orders.filter(order => order.spaceId === space.id)
    .sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate))
    .slice(0, 10); // Show last 10 orders

  // Image gallery handlers
  const hasImages = space.images && space.images.length > 0;
  const totalImages = hasImages ? space.images.length : 0;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{space.name}</h2>
            <p className="text-sm text-gray-600">{getBuildingDisplayName(space.buildingId)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Image Gallery */}
          {hasImages ? (
            <div className="space-y-4">
              {/* Main Image Display */}
              <div className="relative h-64 w-full overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={space.images[currentImageIndex]}
                  alt={`${space.name} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Navigation Arrows (only show if more than 1 image) */}
                {totalImages > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {totalImages > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                    {currentImageIndex + 1} / {totalImages}
                  </div>
                )}
              </div>

              {/* Thumbnail Navigation (only show if more than 1 image) */}
              {totalImages > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {space.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => goToImage(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        currentImageIndex === index 
                          ? 'border-blue-500' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${space.name} - Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 w-full bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">No images available</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Space Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Space Information</h3>
              
              {/* Basic Info */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Category:</span>
                  <span className="text-sm font-medium">{getCategoryDisplayName(space.category)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Capacity:</span>
                  <span className="text-sm font-medium">{space.capacity} orang</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getEffectiveStatus(space).className}`}>
                    {getEffectiveStatus(space).text}
                  </span>
                </div>
              </div>

              {/* Description */}
              {space.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{space.description}</p>
                </div>
              )}

              {/* Operational Hours */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Operational Hours</h4>
                <div className="bg-gray-50 p-3 rounded">
                  {space.operationalHours?.isAlwaysOpen ? (
                    <p className="text-sm text-gray-600">24 Hours (Always Open)</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(space.operationalHours?.schedule || {}).map(([day, schedule]) => {
                        const dayLabel = day === 'sunday' ? 'Minggu' : day === 'monday' ? 'Senin' : day === 'tuesday' ? 'Selasa' : day === 'wednesday' ? 'Rabu' : day === 'thursday' ? 'Kamis' : day === 'friday' ? 'Jumat' : 'Sabtu';
                        return (
                          <div key={day} className={`${schedule.isOpen ? 'text-gray-700' : 'text-red-500'}`}>
                            <strong>{dayLabel}:</strong> {schedule.isOpen ? `${schedule.openTime} - ${schedule.closeTime}` : 'Tutup'}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Pricing</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <p className="text-gray-600 mb-1">Per Jam</p>
                    <p className="font-medium">{formatPrice(space.pricing?.hourly)}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <p className="text-gray-600 mb-1">Per 1/2 Hari</p>
                    <p className="font-medium">{formatPrice(space.pricing?.halfday)}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <p className="text-gray-600 mb-1">Per Hari</p>
                    <p className="font-medium">{formatPrice(space.pricing?.daily)}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <p className="text-gray-600 mb-1">Per Bulan</p>
                    <p className="font-medium">{formatPrice(space.pricing?.monthly)}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-center col-span-2">
                    <p className="text-gray-600 mb-1">Per Tahun</p>
                    <p className="font-medium">{formatPrice(space.pricing?.yearly)}</p>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Amenities</h4>
                <div className="flex flex-wrap gap-1">
                  {(space.amenities && space.amenities.length > 0) ? (
                    space.amenities.map((amenity, index) => (
                      <span 
                        key={index} 
                        className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                      >
                        {amenity}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">No amenities listed</span>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
              
              {/* Active Bookings */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Active Bookings ({spaceBookings.length})</h4>
                {spaceBookings.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {spaceBookings.map((booking, index) => (
                      <div key={index} className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start text-green-700 flex-1">
                            <Calendar className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              {formatBookingDateRange(booking)}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="flex items-center text-green-600">
                          <User className="w-4 h-4 mr-2" />
                          <span>{booking.customerName || 'Unknown Customer'}</span>
                        </div>
                        {booking.amountBase && (
                          <div className="text-green-600 text-xs mt-1">
                            💰 {formatPrice(booking.amountBase)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No active bookings</p>
                )}
              </div>

              {/* Recent Order History */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Order History (Last 10)</h4>
                {recentOrders.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {recentOrders.map((order, index) => (
                      <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded text-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start text-gray-700 flex-1">
                            <Calendar className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              {formatBookingDateRange(order)}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <User className="w-4 h-4 mr-2" />
                          <span>{order.customerName || 'Unknown Customer'}</span>
                        </div>
                        {order.amountBase && (
                          <div className="text-gray-600 text-xs mt-1">
                            💰 {formatPrice(order.amountBase)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No order history</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceDetailModal;