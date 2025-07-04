import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, MapPin, Package, Clock, DollarSign, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { ordersAPI } from '../../services/api.jsx';

const CustomerDetailModal = ({ isOpen, onClose, customer }) => {
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const ordersPerPage = 10;

  useEffect(() => {
    if (isOpen && customer) {
      console.log('Customer data:', customer);
      setCurrentPage(1); // Reset to first page when modal opens
      fetchRecentOrders(1);
    }
  }, [isOpen, customer]);

  useEffect(() => {
    if (isOpen && customer) {
      fetchRecentOrders(currentPage);
    }
  }, [currentPage]);

  const fetchRecentOrders = async (page = 1) => {
    if (!customer) return;
    
    try {
      setLoadingOrders(true);
      setOrdersError(null); // Clear previous errors
      console.log('🔍 Fetching orders for customer:', customer.name, '-', customer.email || customer.customerId, 'page:', page);
      
      // Calculate offset for pagination
      const offset = (page - 1) * ordersPerPage;
      
      // Fetch orders filtered by customer email or customer ID
      const filterParams = {
        limit: ordersPerPage,
        offset: offset,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      // Try filtering by email first, then by customer ID as fallback
      if (customer.email) {
        filterParams.customerEmail = customer.email;
      } else if (customer.customerId) {
        filterParams.customerId = customer.customerId;
      }

      console.log('📤 Sending request with params:', filterParams);
      const response = await ordersAPI.getAll(filterParams);
      
      // Extract orders from response
      const ordersData = response.data?.orders || response.orders || [];
      const total = response.data?.total || response.total || ordersData.length;
      
      console.log('✅ Fetched customer orders:', ordersData.length, 'orders, total:', total);
      
      // Transform API data to match component expectations
      const transformedOrders = ordersData.map(order => ({
        id: order.orderId || order.id,
        orderDate: order.startDate || order.metadata?.createdAt,
        service: order.spaceName || order.service || 'Unknown Service',
        duration: calculateDuration(order.startDate, order.endDate),
        amount: order.amount || 0,
        status: order.status || 'unknown',
        notes: order.notes
      }));
      
      setRecentOrders(transformedOrders);
      setTotalOrders(total);
    } catch (error) {
      console.error('❌ Error fetching recent orders:', error);
      setOrdersError(error.message || 'Failed to fetch customer orders');
      setRecentOrders([]); // Set empty array on error
      setTotalOrders(0);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Helper function to calculate duration between start and end dates
  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 1) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours >= 1) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'Less than 1 hour';
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

  // Pagination helper functions
  const totalPages = Math.ceil(totalOrders / ordersPerPage);
  const startItem = (currentPage - 1) * ordersPerPage + 1;
  const endItem = Math.min(currentPage * ordersPerPage, totalOrders);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-7xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
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

        {/* Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Customer Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm md:col-span-1 space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {/* Row */}
                <div className="text-gray-500">Customer ID</div>
                <div className="font-medium text-gray-900 break-all">{customer.customerId}</div>

                <div className="text-gray-500">Full Name</div>
                <div className="text-gray-900">{customer.name}</div>

                <div className="text-gray-500">Email</div>
                <div className="text-gray-900 break-all">{customer.email}</div>

                <div className="text-gray-500">Phone</div>
                <div className="text-gray-900">{customer.phone || '-'}</div>

                <div className="text-gray-500">Join Date</div>
                <div className="text-gray-900">{formatDate(customer.joinDate)}</div>

                <div className="text-gray-500">Status</div>
                <div>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                    customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {customer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {customer.notes && (
                  <>
                    <div className="text-gray-500">Notes</div>
                    <div className="text-gray-900 text-xs">{customer.notes}</div>
                  </>
                )}
              </div>
            </div>

            {/* Card 2: Recent Orders */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm md:col-span-2 md:row-span-2 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                </div>
                <div className="text-sm text-gray-500">
                  {totalOrders > 0 ? (
                    <span>
                      Showing {startItem}-{endItem} of {totalOrders} orders
                    </span>
                  ) : (
                    <span>No orders</span>
                  )}
                </div>
              </div>
              
              {loadingOrders ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-gray-500 ml-4">Loading orders...</p>
                </div>
              ) : ordersError ? (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-2">
                    <AlertTriangle className="mx-auto h-12 w-12" />
                  </div>
                  <p className="text-red-600 font-medium">Failed to load orders</p>
                  <p className="text-gray-500 text-sm mt-1">{ordersError}</p>
                  <button
                    onClick={fetchRecentOrders}
                    className="mt-3 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-dark transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : recentOrders.length > 0 ? (
                <div className="flex flex-col flex-1">
                  <div className="space-y-3 flex-1">
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
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          className={`p-2 rounded-md border transition-colors ${
                            currentPage === 1
                              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-gray-600 px-2">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className={`p-2 rounded-md border transition-colors ${
                            currentPage === totalPages
                              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500 font-medium">No orders found</p>
                  <p className="text-gray-400 text-sm">This customer hasn't made any orders yet.</p>
                </div>
              )}
            </div>

            {/* Card 3: User Tracking */}
            {(customer.createdBy || customer.updatedBy) && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm md:col-span-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <User className="w-5 h-5 text-primary-600" />
                  <span>User Tracking</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                  {customer.createdBy && (
                    <div>
                      <p className="text-gray-500 mb-1">Created By</p>
                      <p className="font-medium text-gray-900">{customer.createdBy.displayName}</p>
                      <p className="text-xs text-gray-500">{customer.createdBy.email}</p>
                    </div>
                  )}

                  {customer.updatedBy && (
                    <div>
                      <p className="text-gray-500 mb-1">Last Updated By</p>
                      <p className="font-medium text-gray-900">{customer.updatedBy.displayName}</p>
                      <p className="text-xs text-gray-500">{customer.updatedBy.email}</p>
                    </div>
                  )}
                </div>
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