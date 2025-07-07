import { useState, useEffect, useCallback } from 'react';
import { amenitiesAPI, spacesAPI } from '../services/api';

const useAmenities = (initialLoad = true) => {
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(initialLoad);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [usedAmenityIds, setUsedAmenityIds] = useState(new Set());

  const fetchAmenities = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const [amenitiesResponse, spacesResponse] = await Promise.all([
        amenitiesAPI.getAll(params),
        spacesAPI.getAll()
      ]);
      
      console.log('🔍 useAmenities: Raw API responses:', {
        amenitiesResponse,
        spacesResponse
      });
      
      if (amenitiesResponse && amenitiesResponse.data && Array.isArray(amenitiesResponse.data.amenities)) {
        const amenitiesData = amenitiesResponse.data.amenities;
        console.log('🔍 useAmenities: Amenities data loaded:', amenitiesData.length, 'amenities');
        console.log('🔍 useAmenities: Sample amenity:', amenitiesData[0]);
        
        // Calculate space count for each amenity
        // Try different possible paths for spaces data
        let spacesData = [];
        if (spacesResponse?.data?.spaces) {
          spacesData = spacesResponse.data.spaces;
        } else if (spacesResponse?.data?.data) {
          spacesData = spacesResponse.data.data;
        } else if (spacesResponse?.data && Array.isArray(spacesResponse.data)) {
          spacesData = spacesResponse.data;
        } else if (spacesResponse?.spaces) {
          spacesData = spacesResponse.spaces;
        } else if (Array.isArray(spacesResponse)) {
          spacesData = spacesResponse;
        }
        
        console.log('🔍 useAmenities: Spaces data for calculation:', spacesData.length, 'spaces');
        console.log('🔍 useAmenities: Sample space amenities:', spacesData[0]?.amenities);
        console.log('🔍 useAmenities: Full spaces response structure:', spacesResponse);
        
        const amenitiesWithSpaceCount = amenitiesData.map(amenity => {
          // Check both ID and name for compatibility
          const totalSpaces = spacesData.filter(space => 
            space.amenities && (
              space.amenities.includes(amenity.id) || 
              space.amenities.includes(amenity.name)
            )
          ).length;
          const activeSpaces = spacesData.filter(space => 
            space.amenities && (
              space.amenities.includes(amenity.id) || 
              space.amenities.includes(amenity.name)
            ) && space.isActive
          ).length;
          
          console.log(`🔍 useAmenities: Amenity "${amenity.name}" (ID: ${amenity.id}) - Total: ${totalSpaces}, Active: ${activeSpaces}`);
          
          return {
            ...amenity,
            spaceCount: {
              total: totalSpaces,
              active: activeSpaces
            }
          };
        });
        
        // Calculate used amenity IDs - check both ID and name
        const usedIds = new Set();
        spacesData.forEach(space => {
          if (space.amenities && Array.isArray(space.amenities)) {
            space.amenities.forEach(amenityIdentifier => {
              // Find the amenity by name or ID
              const amenity = amenitiesData.find(a => a.name === amenityIdentifier || a.id === amenityIdentifier);
              if (amenity) {
                usedIds.add(amenity.id); // Always use ID as the key
              }
            });
          }
        });
        
        console.log('🔍 useAmenities: Used amenity IDs:', Array.from(usedIds));
        
        setAmenities(amenitiesWithSpaceCount);
        setUsedAmenityIds(usedIds);
        setTotal(amenitiesResponse.data.total || amenitiesData.length);
      } else {
        setAmenities([]);
        setUsedAmenityIds(new Set());
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

  const toggleAmenityStatus = async (id) => {
    try {
      return await amenitiesAPI.toggleStatus(id);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
  
  return { amenities, loading, error, total, usedAmenityIds, fetchAmenities, addAmenity, updateAmenity, deleteAmenity, toggleAmenityStatus };
};

export default useAmenities;