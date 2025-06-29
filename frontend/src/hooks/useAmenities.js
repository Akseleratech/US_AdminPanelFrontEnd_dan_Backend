import { useState, useEffect, useCallback } from 'react';
import { amenitiesAPI } from '../services/api';

const useAmenities = (initialLoad = true) => {
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(initialLoad);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchAmenities = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await amenitiesAPI.getAll(params);
      if (response.amenities) {
        setAmenities(response.amenities);
        setTotal(response.total || response.amenities.length);
      } else {
        setAmenities([]);
        setTotal(0);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch amenities');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialLoad) {
      fetchAmenities();
    }
  }, [fetchAmenities, initialLoad]);

  const addAmenity = async (amenityData) => {
    try {
      const newAmenity = await amenitiesAPI.create(amenityData);
      setAmenities(prev => [newAmenity, ...prev]);
      setTotal(prev => prev + 1);
      return newAmenity;
    } catch (err) {
      setError(err.message || 'Failed to add amenity');
      console.error(err);
      throw err;
    }
  };

  const updateAmenity = async (id, amenityData) => {
    try {
      const updatedAmenity = await amenitiesAPI.update(id, amenityData);
      setAmenities(prev => prev.map(a => a.id === id ? updatedAmenity : a));
      return updatedAmenity;
    } catch (err) {
      setError(err.message || 'Failed to update amenity');
      console.error(err);
      throw err;
    }
  };

  const deleteAmenity = async (id) => {
    try {
      await amenitiesAPI.delete(id);
      setAmenities(prev => prev.filter(a => a.id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      setError(err.message || 'Failed to delete amenity');
      console.error(err);
      throw err;
    }
  };
  
  const toggleAmenityStatus = async (id) => {
    try {
      const updatedAmenity = await amenitiesAPI.toggleStatus(id);
      setAmenities(prev => prev.map(a => a.id === id ? updatedAmenity : a));
      return updatedAmenity;
    } catch (err) {
      setError(err.message || 'Failed to toggle amenity status');
      console.error(err);
      throw err;
    }
  };

  return { 
    amenities, 
    loading, 
    error, 
    total, 
    fetchAmenities, 
    addAmenity, 
    updateAmenity, 
    deleteAmenity,
    toggleAmenityStatus 
  };
};

export default useAmenities; 