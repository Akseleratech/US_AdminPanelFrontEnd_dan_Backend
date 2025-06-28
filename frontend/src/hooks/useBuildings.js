import { useState, useEffect, useCallback } from 'react';
import buildingApiService from '../services/buildingApi';

const useBuildings = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    brand: '',
    city: '',
    province: '',
    country: '',
    isActive: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Fetch buildings with current filters and pagination
  const fetchBuildings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        sortBy: 'metadata.createdAt',
        sortOrder: 'desc',
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined || params[key] === null) {
          delete params[key];
        }
      });

      console.log('🏢 useBuildings: Fetching buildings with params:', params);

      const response = await buildingApiService.getBuildings(params);
      
      setBuildings(response.buildings || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0
      }));

      console.log('✅ useBuildings: Buildings fetched successfully:', response.buildings?.length);
    } catch (err) {
      console.error('❌ useBuildings: Error fetching buildings:', err);
      setError(err.message || 'Failed to fetch buildings');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, pagination.page, pagination.limit]);

  // Create new building
  const createBuilding = useCallback(async (buildingData) => {
    try {
      console.log('🏢 useBuildings: Creating building:', buildingData);
      
      const newBuilding = await buildingApiService.createBuilding(buildingData);
      
      // Refresh the list
      await fetchBuildings();
      
      console.log('✅ useBuildings: Building created successfully:', newBuilding);
      return newBuilding;
    } catch (err) {
      console.error('❌ useBuildings: Error creating building:', err);
      throw err;
    }
  }, [fetchBuildings]);

  // Update existing building
  const updateBuilding = useCallback(async (id, buildingData) => {
    try {
      console.log('🏢 useBuildings: Updating building:', id, buildingData);
      
      const updatedBuilding = await buildingApiService.updateBuilding(id, buildingData);
      
      // Refresh the list
      await fetchBuildings();
      
      console.log('✅ useBuildings: Building updated successfully:', updatedBuilding);
      return updatedBuilding;
    } catch (err) {
      console.error('❌ useBuildings: Error updating building:', err);
      throw err;
    }
  }, [fetchBuildings]);

  // Delete building
  const deleteBuilding = useCallback(async (id) => {
    try {
      console.log('🏢 useBuildings: Deleting building:', id);
      
      await buildingApiService.deleteBuilding(id);
      
      // Refresh the list
      await fetchBuildings();
      
      console.log('✅ useBuildings: Building deleted successfully');
    } catch (err) {
      console.error('❌ useBuildings: Error deleting building:', err);
      throw err;
    }
  }, [fetchBuildings]);

  // Get building by ID
  const getBuilding = useCallback(async (id) => {
    try {
      console.log('🏢 useBuildings: Fetching building by ID:', id);
      
      const building = await buildingApiService.getBuilding(id);
      
      console.log('✅ useBuildings: Building fetched by ID:', building);
      return building;
    } catch (err) {
      console.error('❌ useBuildings: Error fetching building by ID:', err);
      throw err;
    }
  }, []);

  // Refresh buildings list
  const refresh = useCallback(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  // Update search term with debounce effect
  const updateSearchTerm = useCallback((term) => {
    setSearchTerm(term);
    // Reset to first page when searching
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Reset to first page when filtering
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Update pagination
  const updatePagination = useCallback((newPagination) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  // Debounce search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        fetchBuildings();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchBuildings]);

  return {
    // Data
    buildings,
    loading,
    error,
    searchTerm,
    filters,
    pagination,

    // Actions
    createBuilding,
    updateBuilding,
    deleteBuilding,
    getBuilding,
    refresh,
    fetchBuildings,

    // Setters
    setSearchTerm: updateSearchTerm,
    setFilters: updateFilters,
    setPagination: updatePagination
  };
};

export default useBuildings; 