import { useState, useEffect, useCallback } from 'react';
import layananAPI from '../services/layananApi.jsx';
import { useGlobalRefresh } from '../contexts/GlobalRefreshContext.jsx';

const useLayanan = () => {
  const [layananList, setLayananList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  
  // Global refresh context
  const { refreshTriggers, refreshServices } = useGlobalRefresh();

  // Fetch all layanan
  const fetchLayanan = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await layananAPI.getLayanan(params);
      if (response.success) {
        const services = response.data.services || [];
        console.log('useLayanan: Fetched services:', services);
        setLayananList(services);
      } else {
        throw new Error(response.message || 'Failed to fetch layanan');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching layanan:', err);
      // Don't clear the existing list on error - preserve current state
      console.log('useLayanan: Preserving existing layanan list due to error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Search layanan
  const searchLayanan = useCallback(async (term, additionalFilters = {}) => {
    if (!term && Object.keys(additionalFilters).length === 0) {
      return fetchLayanan();
    }

    setLoading(true);
    setError(null);
    try {
      const response = await layananAPI.searchLayanan(term, { ...filters, ...additionalFilters });
      if (response.success) {
        const services = response.data.services || [];
        console.log('useLayanan: Search results:', services);
        setLayananList(services);
      } else {
        throw new Error(response.message || 'Failed to search layanan');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error searching layanan:', err);
      // Don't clear the existing list on error - preserve current state
      console.log('useLayanan: Preserving existing layanan list due to search error');
    } finally {
      setLoading(false);
    }
  }, [filters, fetchLayanan]);

  // Create a new layanan
  const createLayanan = useCallback(async (layananData) => {
    console.log('useLayanan: createLayanan called with:', layananData);
    setLoading(true);
    setError(null);
    try {
      console.log('useLayanan: Calling layananAPI.createLayanan...');
      const response = await layananAPI.createLayanan(layananData);
      console.log('useLayanan: layananAPI response:', response);
      
      if (response.success) {
        // Extract the actual layanan data from response.data
        const newLayanan = response.data;
        console.log('useLayanan: Extracted layanan data:', newLayanan);
        
        // Add the new layanan to the list
        setLayananList(prev => {
          console.log('useLayanan: Adding new layanan to list, prev:', prev);
          const newList = [newLayanan, ...prev];
          console.log('useLayanan: New layanan list:', newList);
          return newList;
        });
        
        // Trigger global refresh for services
        refreshServices();
        console.log('useLayanan: Successfully created layanan and triggered global refresh:', newLayanan);
        return newLayanan;
      } else {
        throw new Error(response.message || 'Failed to create layanan');
      }
    } catch (err) {
      console.error('useLayanan: Error creating layanan:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing layanan
  const updateLayanan = useCallback(async (id, layananData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await layananAPI.updateLayanan(id, layananData);
      if (response.success) {
        // Extract the actual layanan data from response.data
        const updatedLayanan = response.data;
        console.log('useLayanan: Updated layanan data:', updatedLayanan);
        
        // Update the layanan in the list
        setLayananList(prev => 
          prev.map(layanan => 
            layanan.id === id ? updatedLayanan : layanan
          )
        );
        
        // Trigger global refresh for services
        refreshServices();
        console.log('useLayanan: Successfully updated layanan and triggered global refresh:', updatedLayanan);
        return updatedLayanan;
      } else {
        throw new Error(response.message || 'Failed to update layanan');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error updating layanan:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a layanan
  const deleteLayanan = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await layananAPI.deleteLayanan(id);
      if (response.success) {
        // Remove the layanan from the list
        setLayananList(prev => prev.filter(layanan => layanan.id !== id));
        
        // Trigger global refresh for services
        refreshServices();
        console.log('useLayanan: Successfully deleted layanan and triggered global refresh:', id);
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete layanan');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error deleting layanan:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get a single layanan by ID
  const getLayananById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await layananAPI.getLayananById(id);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch layanan');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching layanan:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter layanan by category
  const filterByCategory = useCallback(async (category) => {
    const newFilters = { ...filters, category };
    setFilters(newFilters);
    await searchLayanan(searchTerm, newFilters);
  }, [filters, searchTerm, searchLayanan]);

  // Filter layanan by type
  const filterByType = useCallback(async (type) => {
    const newFilters = { ...filters, type };
    setFilters(newFilters);
    await searchLayanan(searchTerm, newFilters);
  }, [filters, searchTerm, searchLayanan]);

  // Filter layanan by status
  const filterByStatus = useCallback(async (status) => {
    const newFilters = { ...filters, status };
    setFilters(newFilters);
    await searchLayanan(searchTerm, newFilters);
  }, [filters, searchTerm, searchLayanan]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    fetchLayanan();
  }, [fetchLayanan]);

  // Bulk operations
  const bulkUpdateStatus = useCallback(async (layananIds, status) => {
    setLoading(true);
    setError(null);
    try {
      const result = await layananAPI.bulkUpdateStatus(layananIds, status);
      
      // Update layanan in state
      setLayananList(prev =>
        prev.map(layanan =>
          layananIds.includes(layanan.id) ? { ...layanan, status } : layanan
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

  const bulkDelete = useCallback(async (layananIds) => {
    setLoading(true);
    setError(null);
    try {
      const result = await layananAPI.bulkDelete(layananIds);
      
      // Remove layanan from state
      setLayananList(prev =>
        prev.filter(layanan => !layananIds.includes(layanan.id))
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

  // Refresh/reload layanan
  const refresh = useCallback(() => {
    if (searchTerm || Object.keys(filters).length > 0) {
      searchLayanan(searchTerm, filters);
    } else {
      fetchLayanan();
    }
  }, [searchTerm, filters, searchLayanan, fetchLayanan]);

  // Initial load
  useEffect(() => {
    fetchLayanan();
  }, [fetchLayanan]);

  // Search effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm) {
        searchLayanan(searchTerm, filters);
      } else if (Object.keys(filters).length > 0) {
        fetchLayanan(filters);
      } else {
        fetchLayanan();
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Global refresh effect - listen to global service refresh triggers
  useEffect(() => {
    if (refreshTriggers.services > 0) {
      console.log('useLayanan: Global services refresh triggered, count:', refreshTriggers.services);
      fetchLayanan();
    }
  }, [refreshTriggers.services, fetchLayanan]);

  return {
    // State
    layananList,
    loading,
    error,
    searchTerm,
    filters,

    // Basic CRUD operations
    createLayanan,
    updateLayanan,
    deleteLayanan,
    getLayananById,
    fetchLayanan,

    // Search and filter
    searchLayanan,
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

export default useLayanan; 