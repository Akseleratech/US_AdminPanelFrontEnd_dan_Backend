import { useState, useEffect, useCallback } from 'react';
import cityAPI from '../services/cityApi';
import { useGlobalRefresh } from '../contexts/GlobalRefreshContext.jsx';

const useCities = () => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  
  // Global refresh context
  const { refreshTriggers } = useGlobalRefresh();

  // Fetch all cities
  const fetchCities = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await cityAPI.getCities(params);
      if (response.success) {
        setCities(response.data.cities || []);
      } else {
        throw new Error(response.message || 'Failed to fetch cities');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching cities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search cities
  const searchCities = useCallback(async (term, additionalFilters = {}) => {
    if (!term && Object.keys(additionalFilters).length === 0) {
      return fetchCities();
    }

    setLoading(true);
    setError(null);
    try {
      const response = await cityAPI.searchCities(term, { ...filters, ...additionalFilters });
      if (response.success) {
        setCities(response.data.cities || []);
      } else {
        throw new Error(response.message || 'Failed to search cities');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error searching cities:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, fetchCities]);

  // Create a new city
  const createCity = useCallback(async (cityData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await cityAPI.createCity(cityData);
      if (response.success) {
        // Add the new city to the list
        setCities(prev => [response.data, ...prev]);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create city');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error creating city:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing city
  const updateCity = useCallback(async (id, cityData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await cityAPI.updateCity(id, cityData);
      if (response.success) {
        // Update the city in the list
        setCities(prev => 
          prev.map(city => 
            city.id === id ? response.data : city
          )
        );
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update city');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error updating city:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a city
  const deleteCity = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await cityAPI.deleteCity(id);
      if (response.success) {
        // Remove the city from the list
        setCities(prev => prev.filter(city => city.id !== id));
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete city');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error deleting city:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload city image
  const uploadCityImage = useCallback(async (cityId, imageFile) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🖼️ useCities: Uploading image for city:', cityId);
      const response = await cityAPI.uploadCityImage(cityId, imageFile);
      
      if (response.success || response.thumbnail) {
        // Update the city in the list with new thumbnail
        setCities(prev => 
          prev.map(city => 
            city.id === cityId 
              ? { ...city, thumbnail: response.thumbnail || response.data?.thumbnail }
              : city
          )
        );
        console.log('✅ useCities: City image updated successfully');
        return response;
      } else {
        throw new Error(response.message || 'Failed to upload image');
      }
    } catch (err) {
      setError(err.message);
      console.error('💥 useCities: Error uploading city image:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get a single city by ID
  const getCity = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await cityAPI.getCity(id);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch city');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching city:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter cities by status
  const filterByStatus = useCallback(async (status) => {
    const newFilters = { ...filters, status };
    setFilters(newFilters);
    await searchCities(searchTerm, newFilters);
  }, [filters, searchTerm, searchCities]);

  // Filter featured cities
  const filterFeatured = useCallback(async (featured) => {
    const newFilters = { ...filters, featured: featured ? 'true' : '' };
    setFilters(newFilters);
    await searchCities(searchTerm, newFilters);
  }, [filters, searchTerm, searchCities]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    fetchCities();
  }, [fetchCities]);

  // Refresh/reload cities
  const refresh = useCallback(() => {
    if (searchTerm || Object.keys(filters).length > 0) {
      searchCities(searchTerm, filters);
    } else {
      fetchCities();
    }
  }, [searchTerm, filters, searchCities, fetchCities]);

  // Initial load
  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  // Debounced search
  useEffect(() => {
    if (searchTerm) {
      const debounceTimer = setTimeout(() => {
        searchCities(searchTerm, filters);
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm, filters, searchCities]);

  // Listen to global refresh triggers
  useEffect(() => {
    if (refreshTriggers.cities > 0) {
      console.log('🔄 useCities: Global refresh triggered, refreshing cities data...');
      refresh();
    }
  }, [refreshTriggers.cities, refresh]);

  return {
    // State
    cities,
    loading,
    error,
    searchTerm,
    filters,

    // Actions
    fetchCities,
    searchCities,
    createCity,
    updateCity,
    deleteCity,
    uploadCityImage,
    getCity,
    filterByStatus,
    filterFeatured,
    clearFilters,
    refresh,

    // Search control
    setSearchTerm,
    setFilters
  };
};

export default useCities; 