import React from 'react';
import { Edit, Trash2, LayoutGrid, Building, Users, Tag, CheckSquare, DollarSign, Clock, Power } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const SpacesGrid = ({ 
  spaces, 
  loading, 
  onEdit, 
  onDelete, 
  onToggleActive,
  getCategoryDisplayName,
  getBuildingDisplayName 
}) => {
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
    // If space is manually deactivated by admin
    if (!space.isActive) {
      return {
        text: 'Inactive',
        className: 'bg-red-100 text-red-800',
        icon: '🔴',
        priority: 'manual'
      };
    }

    // If space is active but outside operational hours
    if (space.operationalStatus && !space.operationalStatus.isOperational) {
      return {
        text: 'Tutup',
        className: 'bg-orange-100 text-orange-800',
        icon: '🟠',
        priority: 'operational'
      };
    }

    // If space is active and within operational hours
    return {
      text: 'Beroperasi',
      className: 'bg-green-100 text-green-800',
      icon: '🟢',
      priority: 'operational'
    };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {spaces.map((space) => (
        <div key={space.id} className="bg-white border border-primary-100 hover:shadow-lg transition-all duration-300">
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
            <div className="grid grid-cols-3 gap-2 py-2 border-y border-primary-50">
              <div className="text-center">
                <p className="text-xs text-primary-600 mb-1">Per Jam</p>
                <p className="text-sm font-medium text-primary-800">{formatPrice(space.pricing?.hourly)}</p>
              </div>
              <div className="text-center border-x border-primary-50">
                <p className="text-xs text-primary-600 mb-1">Per Hari</p>
                <p className="text-sm font-medium text-primary-800">{formatPrice(space.pricing?.daily)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-primary-600 mb-1">Per Bulan</p>
                <p className="text-sm font-medium text-primary-800">{formatPrice(space.pricing?.monthly)}</p>
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
          </div>

          {/* Actions */}
          <div className="px-4 py-2 bg-primary-50/50 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {space.isActive ? 'Manual aktif' : 'Manual nonaktif'}
            </div>
            <div className="flex space-x-1">
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
      ))}
    </div>
  );
};

export default SpacesGrid; 