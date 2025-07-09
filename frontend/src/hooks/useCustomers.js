import { useState, useEffect, useCallback } from 'react';
import { customersAPI } from '../services/api';
import { useGlobalRefresh } from '../contexts/GlobalRefreshContext.jsx';
import { useAuth } from '../components/auth/AuthContext';

const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    hasMore: true
  });
  const [statistics, setStatistics] = useState(null);
  
  // Global refresh context
  const { refreshTriggers, globalRefresh, triggerRefresh } = useGlobalRefresh();
  const { user } = useAuth();

  // Fetch all customers
  const fetchCustomers = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customersAPI.getAll(params);
      // Extract customers from nested response structure
      const customersData = response.data?.customers || response.customers || [];
      setCustomers(customersData);
      if (response.data?.pagination) {
        setPagination(response.data.pagination);
      } else if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search customers
  const searchCustomers = useCallback(async (term, additionalFilters = {}) => {
    if (!term && Object.keys(additionalFilters).length === 0) {
      return fetchCustomers();
    }

    setLoading(true);
    setError(null);
    try {
      const response = await customersAPI.getAll({ search: term, ...filters, ...additionalFilters });
      // Extract customers from nested response structure
      const customersData = response.data?.customers || response.customers || [];
      setCustomers(customersData);
      if (response.data?.pagination) {
        setPagination(response.data.pagination);
      } else if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error searching customers:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, fetchCustomers]);

  // Get single customer
  const getCustomer = useCallback(async (id) => {
    try {
      const response = await customersAPI.getById(id);
      return response;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching customer:', err);
      throw err;
    }
  }, []);

  // Add new customer
  const addCustomer = useCallback(async (customerData) => {
    try {
      const response = await customersAPI.create(customerData);
      // Extract customer data from nested response structure
      const newCustomer = response.data || response;
      setCustomers(prev => [newCustomer, ...prev]);
      triggerRefresh();
      return newCustomer;
    } catch (err) {
      setError(err.message);
      console.error('Error adding customer:', err);
      throw err;
    }
  }, [triggerRefresh]);

  // Update customer
  const updateCustomer = useCallback(async (id, customerData) => {
    try {
      const response = await customersAPI.update(id, customerData);
      // Extract customer data from nested response structure
      const updatedCustomer = response.data?.data || response.data || response;
      setCustomers(prev => prev.map(customer => 
        customer.id === id ? updatedCustomer : customer
      ));
      triggerRefresh();
      return response;
    } catch (err) {
      setError(err.message);
      console.error('Error updating customer:', err);
      throw err;
    }
  }, [triggerRefresh]);

  // Delete customer
  const deleteCustomer = useCallback(async (id) => {
    try {
      await customersAPI.delete(id);
      setCustomers(prev => prev.filter(customer => customer.id !== id));
      triggerRefresh();
    } catch (err) {
      setError(err.message);
      console.error('Error deleting customer:', err);
      throw err;
    }
  }, [triggerRefresh]);

  // Filter customers by status
  const filterByStatus = useCallback(async (status) => {
    const newFilters = { ...filters, status };
    setFilters(newFilters);
    await searchCustomers(searchTerm, newFilters);
  }, [filters, searchTerm, searchCustomers]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    fetchCustomers();
  }, [fetchCustomers]);

  // Refresh/reload customers
  const refresh = useCallback(() => {
    if (searchTerm) {
      searchCustomers(searchTerm, filters);
    } else {
      fetchCustomers(filters);
    }
  }, [searchTerm, filters, searchCustomers, fetchCustomers]);

  // Get customer statistics
  const getCustomerStats = useCallback(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.isActive).length;
    const inactiveCustomers = totalCustomers - activeCustomers;

    return {
      total: totalCustomers,
      active: activeCustomers,
      inactive: inactiveCustomers
    };
  }, [customers]);

  // Initial load and refresh triggers
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Listen to global refresh triggers
  useEffect(() => {
    if (refreshTriggers.customers) {
      refresh();
    }
  }, [refreshTriggers.customers, refresh]);

  // Auto-search when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchCustomers(searchTerm, filters);
      } else {
        fetchCustomers(filters);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters, searchCustomers, fetchCustomers]);

  return {
    customers,
    loading,
    error,
    selectedCustomer,
    setSelectedCustomer,
    isModalOpen,
    setIsModalOpen,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    pagination,
    statistics,
    
    // CRUD operations
    fetchCustomers,
    searchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,
    
    // Filter operations
    filterByStatus,
    clearFilters,
    
    // Utility functions
    refresh,
    getCustomerStats
  };
};

export default useCustomers; 