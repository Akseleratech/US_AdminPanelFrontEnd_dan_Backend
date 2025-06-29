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
      if (response && response.data && Array.isArray(response.data.amenities)) {
        setAmenities(response.data.amenities);
        setTotal(response.data.total || response.data.amenities.length);
      } else {
        setAmenities([]);
        setTotal(0);
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat fasilitas');
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
      return await amenitiesAPI.create(amenityData);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const updateAmenity = async (id, amenityData) => {
    try {
      return await amenitiesAPI.update(id, amenityData);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const deleteAmenity = async (id) => {
    try {
      return await amenitiesAPI.delete(id);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
  
  return { amenities, loading, error, total, fetchAmenities, addAmenity, updateAmenity, deleteAmenity };
};

export default useAmenities;