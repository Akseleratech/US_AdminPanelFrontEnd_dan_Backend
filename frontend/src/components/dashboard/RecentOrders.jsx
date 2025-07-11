import React from 'react';
import { getStatusColor, getStatusIcon } from '../../utils/helpers.jsx';
import { Calendar, MapPin, User, Eye } from 'lucide-react';

const RecentOrders = ({ recentOrders }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Bookings</h3>
        <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
          <Eye className="w-4 h-4 mr-1" />
          View All
        </button>
      </div>
      
      <div className="space-y-3">
        {recentOrders.map((order) => (
          <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-gray-400" />
                <p className="font-medium text-gray-900">{order.customer || order.customerName}</p>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{order.service || order.spaceName} - {order.location || order.cityName}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(order.startDate || order.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-semibold text-gray-900 mb-1">
                {formatCurrency(order.amount || order.total)}
              </p>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="ml-1 capitalize">{order.status}</span>
              </div>
            </div>
          </div>
        ))}
        
        {recentOrders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No recent bookings found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentOrders; 