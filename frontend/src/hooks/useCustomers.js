import { useState, useEffect, useCallback } from 'react';
import customerAPI from '../services/customerApi';
import { useGlobalRefresh } from '../contexts/GlobalRefreshContext.jsx';

const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  
  // Global refresh context
  const { refreshTriggers, globalRefresh, triggerRefresh } = useGlobalRefresh();

  // Fetch all customers
  const fetchCustomers = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { customers: fetchedCustomers, pagination: newPagination } = await customerAPI.getCustomers({ 
        page: currentPage, 
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...filters 
      });
      setCustomers(fetchedCustomers);
      setPagination(newPagination);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, globalRefresh]);

  // Search customers
  const searchCustomers = useCallback(async (term, additionalFilters = {}) => {
    if (!term && Object.keys(additionalFilters).length === 0) {
      return fetchCustomers();
    }

    setLoading(true);
    setError(null);
    try {
      const response = await customerAPI.searchCustomers(term, { ...filters, ...additionalFilters });
      if (response.success) {
        setCustomers(response.data.customers || []);
      } else {
        throw new Error(response.message || 'Failed to search customers');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error searching customers:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, fetchCustomers]);

  // Add a new customer
  const addCustomer = async (customerData) => {
    setLoading(true);
    setError(null);
    try {
      const newCustomer = await customerAPI.createCustomer(customerData);
      setCustomers(prev => [newCustomer, ...prev]);
      triggerRefresh('customers');
    } catch (error) {
      setError(error.message);
      console.error('Error creating customer:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing customer
  const updateCustomer = async (id, customerData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedCustomer = await customerAPI.updateCustomer(id, customerData);
      setCustomers(prev => 
        prev.map(customer => 
          customer.id === id ? updatedCustomer : customer
        )
      );
      triggerRefresh('customers');
    } catch (error) {
      setError(error.message);
      console.error('Error updating customer:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete a customer
  const deleteCustomer = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await customerAPI.deleteCustomer(id);
      setCustomers(prev => prev.filter(customer => customer.id !== id));
      triggerRefresh('customers');
    } catch (error) {
      setError(error.message);
      console.error('Error deleting customer:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get a single customer by ID
  const getCustomer = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const customer = await customerAPI.getCustomer(id);
      return customer;
    } catch (error) {
      setError(error.message);
      console.error('Error fetching customer:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Filter customers by status
  const filterByStatus = useCallback(async (status) => {
    const newFilters = { ...filters, status };
    setFilters(newFilters);
    await searchCustomers(searchTerm, newFilters);
  }, [filters, searchTerm, searchCustomers]);

  // Filter customers by company
  const filterByCompany = useCallback(async (company) => {
    const newFilters = { ...filters, company };
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
    const companiesSet = new Set(customers.filter(c => c.company).map(c => c.company));
    const totalCompanies = companiesSet.size;

    return {
      total: totalCustomers,
      active: activeCustomers,
      inactive: inactiveCustomers,
      companies: totalCompanies
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
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    pagination,
    
    // CRUD operations
    fetchCustomers,
    searchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,
    
    // Filter operations
    filterByStatus,
    filterByCompany,
    clearFilters,
    
    // Utility functions
    refresh,
    getCustomerStats
  };
};

export default useCustomers; 