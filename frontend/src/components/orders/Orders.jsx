import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, RefreshCw } from 'lucide-react';
import OrdersTable from './OrdersTable';
import OrderModal from './OrderModal';
import { ordersAPI } from '../../services/api.jsx';
import { useGlobalRefresh } from '../../contexts/GlobalRefreshContext';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  // Global refresh context
  const { triggerRefresh } = useGlobalRefresh();

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersAPI.getAll();
      // Extract orders from nested response structure
      const ordersData = response.data?.orders || response.orders || [];
      setOrders(ordersData);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRefresh = () => {
    fetchOrders();
  };

  const handleAddOrder = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const handleSaveOrder = async (orderData) => {
    try {
      if (editingOrder) {
        await ordersAPI.update(editingOrder.id, orderData);
      } else {
        await ordersAPI.create(orderData);
      }
      fetchOrders(); // Refresh data
      triggerRefresh('orders'); // Notify other components about orders change
    } catch (error) {
      throw error; // Let modal handle the error
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await ordersAPI.delete(orderId);
        fetchOrders(); // Refresh data
        triggerRefresh('orders'); // Notify other components about orders change
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order');
      }
    }
  };

  // Filter orders based on search term
  const filteredOrders = (orders || []).filter(order => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id?.toLowerCase().includes(searchLower) ||
      order.customerName?.toLowerCase().includes(searchLower) ||
      order.customerEmail?.toLowerCase().includes(searchLower) ||
      order.service?.toLowerCase().includes(searchLower) ||
      order.spaceName?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-500">Order Management</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search orders by ID, customer, service, or space..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ring-primary"
            />
          </div>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </div>
        <button
          onClick={handleAddOrder}
          className="flex items-center px-4 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover shadow-primary transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Manual Order
        </button>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredOrders.length} of {(orders || []).length} orders
        {searchTerm && <span> matching "{searchTerm}"</span>}
      </div>

      {/* Table */}
      <OrdersTable 
        orders={filteredOrders} 
        onEdit={handleEditOrder}
        onDelete={handleDeleteOrder}
      />

      {/* Modal */}
      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveOrder}
        editingOrder={editingOrder}
      />
    </div>
  );
};

export default Orders; 