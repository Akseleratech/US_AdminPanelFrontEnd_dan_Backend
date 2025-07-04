import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Plus, RefreshCw, AlertCircle, CheckCircle, Trash2, X, ChevronDown } from 'lucide-react';
import CustomersTable from './CustomersTable.jsx';
import CustomerModal from './CustomerModal.jsx';
import CustomerDetailModal from './CustomerDetailModal.jsx';
import useCustomers from '../../hooks/useCustomers';
import { useAuth } from '../auth/AuthContext';
import customerApi from '../../services/customerApi';
import { ordersAPI } from '../../services/api.jsx';
import customerAPI from '../../services/customerApi';

const Customers = () => {
  const {
    customers,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    pagination,
    currentPage,
    setCurrentPage,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refresh,
    selectedCustomer,
    setSelectedCustomer,
    isModalOpen,
    setIsModalOpen,
    statistics,
    
    // CRUD operations
    fetchCustomers,
    searchCustomers,
    filterByStatus,
    clearFilters,
    
    // Utility functions
    getCustomerStats
  } = useCustomers();

  const { user } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [notification, setNotification] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  
  // Detail modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [customerToView, setCustomerToView] = useState(null);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState(new Set());

  // Active orders state
  const [activeCustomerEmails, setActiveCustomerEmails] = useState(new Set());
  const ACTIVE_ORDER_STATUSES = ['pending', 'confirmed', 'active'];

  const fetchActiveOrders = async () => {
    try {
      const response = await ordersAPI.getAll({ limit: 1000 }); // adjust limit as needed
      const allOrders = response.data?.orders || response.orders || [];

      const activeSet = new Set();
      allOrders.forEach((order) => {
        const status = order.status?.toLowerCase();
        if (ACTIVE_ORDER_STATUSES.includes(status)) {
          if (order.customerEmail) activeSet.add(order.customerEmail.toLowerCase());
        }
      });
      setActiveCustomerEmails(activeSet);
    } catch (err) {
      console.error('Failed to fetch active orders:', err);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleView = async (customer) => {
    try {
      // Fetch full customer details to ensure createdBy/updatedBy are included
      const detailedCustomer = await customerAPI.getCustomerById(customer.id || customer.customerId);
      setCustomerToView(detailedCustomer);
    } catch (err) {
      console.warn('Failed to fetch detailed customer data, falling back to existing object.', err);
      setCustomerToView(customer);
    } finally {
      setShowDetailModal(true);
    }
  };

  const handleDelete = (customer) => {
    setCustomerToDelete(customer);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;

    try {
      await deleteCustomer(customerToDelete.id);
      showNotification(`Customer "${customerToDelete.name}" successfully deleted`, 'success');
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
    } catch (error) {
      showNotification(`Failed to delete customer: ${error.message}`, 'error');
    }
  };

  const handleSave = async (customerData) => {
    try {
      if (modalMode === 'add') {
        await addCustomer(customerData);
        showNotification('Customer berhasil ditambahkan', 'success');
      } else {
        await updateCustomer(selectedCustomer.id, customerData);
        showNotification('Customer berhasil diupdate', 'success');
      }
      setShowModal(false);
      setSelectedCustomer(null);
      refresh();
    } catch (err) {
      showNotification(`Error: ${err.message}`, 'error');
      console.error('Failed to save customer:', err);
    }
  };

  const handleRefresh = () => {
    refresh();
    fetchActiveOrders();
    showNotification('Customer data successfully updated', 'success');
  };

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const statusesSet = new Set(['Active', 'Inactive']);

    return {
      statuses: Array.from(statusesSet)
    };
  }, []);

  // Filter helper functions
  const handleFilterToggle = (type, value) => {
    if (type === 'status') {
      const newSet = new Set(selectedStatuses);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      setSelectedStatuses(newSet);
    }
  };

  const clearAllFilters = () => {
    setSelectedStatuses(new Set());
    setFilterSearch('');
    setSearchFilter('');
  };

  const getActiveFilterCount = () => {
    return selectedStatuses.size;
  };

  // Filter data based on search and checkboxes
  const filteredCustomers = (customers || []).filter(customer => {
    // Text search filter
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      const matchesSearch = 
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Status filter
    if (selectedStatuses.size > 0) {
      const status = customer.isActive ? 'Active' : 'Inactive';
      if (!selectedStatuses.has(status)) return false;
    }

    return true;
  });

  // Initial fetch active orders
  useEffect(() => {
    fetchActiveOrders();
  }, []);

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`flex items-center p-4 rounded-md ${
          notification.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
              <p className="text-sm text-gray-500">Manage your customer database</p>
            </div>
            {user && (
              <div className="hidden sm:block pl-4 border-l border-gray-200">
                <p className="text-xs text-gray-500">Logged in as</p>
                <p className="text-sm font-medium text-gray-900">{user.displayName || user.email}</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setSearchTerm(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* Filter Button */}
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
              getActiveFilterCount() > 0
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {getActiveFilterCount() > 0 && (
              <span className="bg-white text-primary rounded-full px-2 py-0.5 text-xs">
                {getActiveFilterCount()}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Filter Dropdown */}
          {showFilters && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-900">Filter Customers</h3>
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-primary hover:text-primary-dark"
                  >
                    Clear All
                  </button>
                </div>

                {/* Status Filter */}
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Status</h4>
                  <div className="space-y-2">
                    {filterOptions.statuses.map(status => (
                      <label key={status} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedStatuses.has(status)}
                          onChange={() => handleFilterToggle('status', status)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add New Button */}
        <button
          onClick={handleAddNew}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredCustomers.length} of {(customers || []).length} customers
      </div>

      {/* Table */}
      <CustomersTable
        customers={filteredCustomers}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        activeCustomerEmails={activeCustomerEmails}
        loading={loading}
      />

      {/* Modal */}
      <CustomerModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        customer={selectedCustomer}
        mode={modalMode}
      />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setCustomerToView(null);
        }}
        customer={customerToView}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Customer
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete customer "{customerToDelete?.name}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setCustomerToDelete(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers; 