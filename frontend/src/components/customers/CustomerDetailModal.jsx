import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, MapPin, Package, Clock, DollarSign } from 'lucide-react';

const CustomerDetailModal = ({ isOpen, onClose, customer }) => {
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      fetchRecentOrders();
    }
  }, [isOpen, customer]);

  const fetchRecentOrders = async () => {
    if (!customer) return;
    
    try {
      setLoadingOrders(true);
      // TODO: Implement API call to fetch customer's recent orders
      // For now, using mock data
      const mockOrders = [
        {
          id: 'ORD001',
          orderDate: '2024-01-15',
          service: 'Meeting Room A',
          duration: '2 hours',
          amount: 250000,
          status: 'completed'
        },
        {
          id: 'ORD002',
          orderDate: '2024-01-10',
          service: 'Coworking Space',
          duration: '1 day',
          amount: 150000,
          status: 'completed'
        },
        {
          id: 'ORD003',
          orderDate: '2024-01-05',
          service: 'Conference Room B',
          duration: '3 hours',
          amount: 375000,
          status: 'pending'
        }
      ];
      
      // Simulate API delay
      setTimeout(() => {
        setRecentOrders(mockOrders);
        setLoadingOrders(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      setLoadingOrders(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Customer Details</h2>
              <p className="text-sm text-gray-500">Detailed information and order history</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Card 1: Customer Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <User className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer ID</label>
                  <p className="text-lg font-semibold text-gray-900">{customer.customerId}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-lg text-gray-900">{customer.name}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    <p className="text-lg text-gray-900">{customer.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone Number</label>
                    <p className="text-lg text-gray-900">{customer.phone || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Join Date</label>
                    <p className="text-lg text-gray-900">{formatDate(customer.joinDate)}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${
                    customer.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {customer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {customer.createdBy && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created By</label>
                    <div className="text-lg text-gray-900">
                      <p>{customer.createdBy.displayName}</p>
                      <p className="text-sm text-gray-500">{customer.createdBy.email}</p>
                    </div>
                  </div>
                )}
                
                {customer.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-lg text-gray-900">{customer.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Recent Orders */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              </div>
              <span className="text-sm text-gray-500">Last 5 orders</span>
            </div>
            
            {loadingOrders ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-500 ml-4">Loading orders...</p>
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{order.service}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(order.orderDate)}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {order.duration}
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {formatCurrency(order.amount)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <span className="text-sm font-medium text-gray-600">#{order.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500 font-medium">No orders found</p>
                <p className="text-gray-400 text-sm">This customer hasn't made any orders yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailModal; 