import { useState, useEffect, useCallback } from 'react';
import serviceAPI from '../services/serviceApi';

const useServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});

  // Fetch all services
  const fetchServices = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await serviceAPI.getServices(params);
      if (response.success) {
        setServices(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to fetch services');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search services
  const searchServices = useCallback(async (term, additionalFilters = {}) => {
    if (!term && Object.keys(additionalFilters).length === 0) {
      return fetchServices();
    }

    setLoading(true);
    setError(null);
    try {
      const response = await serviceAPI.searchServices(term, { ...filters, ...additionalFilters });
      if (response.success) {
        setServices(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to search services');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error searching services:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, fetchServices]);

  // Create a new service
  const createService = useCallback(async (serviceData) => {
    console.log('useServices: createService called with:', serviceData);
    setLoading(true);
    setError(null);
    try {
      console.log('useServices: Calling serviceAPI.createService...');
      const response = await serviceAPI.createService(serviceData);
      console.log('useServices: serviceAPI response:', response);
      
      if (response.success) {
        // Add the new service to the list
        setServices(prev => {
          console.log('useServices: Adding new service to list, prev:', prev);
          const newList = [response.data, ...prev];
          console.log('useServices: New services list:', newList);
          return newList;
        });
        console.log('useServices: Successfully created service:', response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create service');
      }
    } catch (err) {
      console.error('useServices: Error creating service:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing service
  const updateService = useCallback(async (id, serviceData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await serviceAPI.updateService(id, serviceData);
      if (response.success) {
        // Update the service in the list
        setServices(prev => 
          prev.map(service => 
            service.id === id ? response.data : service
          )
        );
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update service');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error updating service:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a service
  const deleteService = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await serviceAPI.deleteService(id);
      if (response.success) {
        // Remove the service from the list
        setServices(prev => prev.filter(service => service.id !== id));
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete service');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error deleting service:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get a single service by ID
  const getService = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await serviceAPI.getService(id);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch service');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching service:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter services by category
  const filterByCategory = useCallback(async (category) => {
    const newFilters = { ...filters, category };
    setFilters(newFilters);
    await searchServices(searchTerm, newFilters);
  }, [filters, searchTerm, searchServices]);

  // Filter services by type
  const filterByType = useCallback(async (type) => {
    const newFilters = { ...filters, type };
    setFilters(newFilters);
    await searchServices(searchTerm, newFilters);
  }, [filters, searchTerm, searchServices]);

  // Filter services by status
  const filterByStatus = useCallback(async (status) => {
    const newFilters = { ...filters, status };
    setFilters(newFilters);
    await searchServices(searchTerm, newFilters);
  }, [filters, searchTerm, searchServices]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    fetchServices();
  }, [fetchServices]);

  // Bulk operations
  const bulkUpdateStatus = useCallback(async (serviceIds, status) => {
    setLoading(true);
    setError(null);
    try {
      const result = await serviceAPI.bulkUpdateStatus(serviceIds, status);
      
      // Update services in state
      setServices(prev =>
        prev.map(service =>
          serviceIds.includes(service.id) ? { ...service, status } : service
        )
      );
      
      return result;
    } catch (err) {
      setError(err.message);
      console.error('Error in bulk update:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkDelete = useCallback(async (serviceIds) => {
    setLoading(true);
    setError(null);
    try {
      const result = await serviceAPI.bulkDelete(serviceIds);
      
      // Remove services from state
      setServices(prev =>
        prev.filter(service => !serviceIds.includes(service.id))
      );
      
      return result;
    } catch (err) {
      setError(err.message);
      console.error('Error in bulk delete:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh/reload services
  const refresh = useCallback(() => {
    if (searchTerm || Object.keys(filters).length > 0) {
      searchServices(searchTerm, filters);
    } else {
      fetchServices();
    }
  }, [searchTerm, filters, searchServices, fetchServices]);

  // Initial load
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Search effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm) {
        searchServices(searchTerm, filters);
      } else if (Object.keys(filters).length > 0) {
        fetchServices(filters);
      } else {
        fetchServices();
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // State
    services,
    loading,
    error,
    searchTerm,
    filters,

    // Basic CRUD operations
    createService,
    updateService,
    deleteService,
    getService,
    fetchServices,

    // Search and filter
    searchServices,
    setSearchTerm,
    filterByCategory,
    filterByType,
    filterByStatus,
    clearFilters,

    // Bulk operations
    bulkUpdateStatus,
    bulkDelete,

    // Utility
    refresh,
    setError: (err) => setError(err) // Allow manual error setting
  };
};

export default useServices; 