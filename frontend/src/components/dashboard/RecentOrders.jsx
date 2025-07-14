import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getStatusColor, getStatusIcon } from '../../utils/helpers.jsx';
import { Calendar, MapPin, User, Eye } from 'lucide-react';

const RecentOrders = ({ recentOrders }) => {
  const navigate = useNavigate();

  const handleViewAllOrders = () => {
    navigate('/orders');
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Rp 0';
    return `Rp ${Number(amount).toLocaleString('id-ID')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateRange = (order) => {
    // Debug logging to see what data we're receiving
    console.log('🔍 RecentOrders - Order data:', {
      id: order.id,
      startDate: order.startDate,
      endDate: order.endDate,
      createdAt: order.createdAt,
      pricingType: order.pricingType
    });

    if (!order.startDate || !order.endDate) {
      console.log('⚠️ RecentOrders - Missing startDate or endDate, using fallback');
      // Fallback to createdAt if no startDate/endDate
      if (order.createdAt) {
        return (
          <div>
            <div className="font-medium text-xs">{formatDate(order.createdAt)}</div>
            <div className="text-xs text-gray-600">📅 Created</div>
          </div>
        );
      }
      return <span className="text-xs text-gray-500">No date info</span>;
    }
    
    try {
      const startDate = new Date(order.startDate);
      const endDate = new Date(order.endDate);
      const pricingType = order.pricingType || 'daily';
      
      console.log('🔍 RecentOrders - Parsed dates:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startValid: !isNaN(startDate.getTime()),
        endValid: !isNaN(endDate.getTime())
      });
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.log('❌ RecentOrders - Invalid date detected');
        return <span className="text-xs text-gray-500">Invalid date</span>;
      }
      
      // Check if it's the same day
      const isSameDay = startDate.toDateString() === endDate.toDateString();
      
      // Calculate duration for display
      const getDurationInfo = () => {
        const diffMs = endDate - startDate;
        if (diffMs <= 0) return '';

        if (pricingType === 'hourly') {
          const hours = Math.ceil(diffMs / (1000 * 60 * 60));
          return `${hours} jam`;
        } else if (pricingType === 'daily') {
          const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
          return days === 1 ? '1 hari' : `${days} hari`;
        } else if (pricingType === 'halfday') {
          const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
          const sessions = days * 2;
          return `${sessions} sesi`;
        } else if (pricingType === 'monthly') {
          const months = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30));
          return months === 1 ? '1 bulan' : `${months} bulan`;
        }
        return '';
      };
      
      if (pricingType === 'hourly') {
        // For hourly: show date and time range
        if (isSameDay) {
          return (
            <div>
              <div className="font-medium text-xs">{formatDate(order.startDate)}</div>
              <div className="text-xs text-blue-600">
                🕐 {formatTime(order.startDate)} - {formatTime(order.endDate)}
              </div>
              <div className="text-xs text-blue-500 font-medium">
                ⏱️ {getDurationInfo()}
              </div>
            </div>
          );
        } else {
          // Hourly booking across multiple days (rare case)
          return (
            <div>
              <div className="text-xs">
                {formatDate(order.startDate)} {formatTime(order.startDate)}
              </div>
              <div className="text-xs">
                - {formatDate(order.endDate)} {formatTime(order.endDate)}
              </div>
              <div className="text-xs text-blue-500 font-medium">
                ⏱️ {getDurationInfo()}
              </div>
            </div>
          );
        }
      } else {
        // For daily, halfday, monthly: show date range
        if (isSameDay) {
          return (
            <div>
              <div className="font-medium text-xs">{formatDate(order.startDate)}</div>
              <div className="text-xs text-gray-600">
                {pricingType === 'halfday' && '🌅 Half Day'}
                {pricingType === 'daily' && '📅 Full Day'}
                {pricingType === 'monthly' && '📆 Monthly'}
              </div>
            </div>
          );
        } else {
          return (
            <div>
              <div className="text-xs font-medium">{formatDate(order.startDate)}</div>
              <div className="text-xs font-medium">- {formatDate(order.endDate)}</div>
              <div className="text-xs text-gray-600">
                {pricingType === 'halfday' && `🌅 ${getDurationInfo()}`}
                {pricingType === 'daily' && `📅 ${getDurationInfo()}`}
                {pricingType === 'monthly' && `📆 ${getDurationInfo()}`}
              </div>
            </div>
          );
        }
      }
    } catch (error) {
      console.error('❌ RecentOrders - Error formatting date range:', error);
      return <span className="text-xs text-gray-500">Date error</span>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
        <button 
          onClick={handleViewAllOrders}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center transition-colors duration-150"
        >
          <Eye className="w-4 h-4 mr-1" />
          View All
        </button>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {recentOrders && recentOrders.length > 0 ? (
          recentOrders.slice(0, 8).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <p className="font-medium text-gray-900 text-sm truncate">{order.customer || order.customerName}</p>
                </div>
                
                <div className="flex items-center space-x-3 text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{order.service || order.spaceName}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <div className="min-w-0">
                      {formatDateRange(order)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right ml-2 flex-shrink-0">
                <p className="font-semibold text-gray-900 text-sm mb-1">
                  {formatCurrency(order.amountBase || order.amount || order.total)}
                </p>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1 capitalize">{order.status}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No recent bookings found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentOrders; 