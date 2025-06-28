import { useState, useEffect } from 'react';
import { spacesAPI } from '../services/api.jsx';

const useSpaces = () => {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter spaces based on search term - with safeguard to ensure spaces is always an array
  const filteredSpaces = (Array.isArray(spaces) ? spaces : []).filter(space =>
    space.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    space.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    space.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    space.location?.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchSpaces = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('useSpaces: Fetching spaces...');
      
      const response = await spacesAPI.getAll();
      console.log('useSpaces: API response:', response);
      
      if (response && response.success) {
        const spacesData = response.data || [];
        setSpaces(Array.isArray(spacesData) ? spacesData : []);
        console.log('useSpaces: Spaces loaded:', spacesData.length || 0);
      } else {
        throw new Error(response?.message || 'Failed to fetch spaces');
      }
    } catch (err) {
      console.error('useSpaces: Error fetching spaces:', err);
      setError(err.message);
      setSpaces([]); // Ensure spaces is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  const createSpace = async (spaceData) => {
    try {
      console.log('useSpaces: Creating space with data:', spaceData);
      
      const result = await spacesAPI.create(spaceData);
      console.log('useSpaces: Space created successfully:', result);
      
      // Refresh the spaces list
      await fetchSpaces();
      return result;
    } catch (err) {
      console.error('useSpaces: Error creating space:', err);
      throw err;
    }
  };

  const updateSpace = async (spaceId, spaceData) => {
    try {
      console.log('useSpaces: Updating space:', spaceId, spaceData);
      
      const result = await spacesAPI.update(spaceId, spaceData);
      console.log('useSpaces: Space updated successfully:', result);
      
      // Refresh the spaces list
      await fetchSpaces();
      return result;
    } catch (err) {
      console.error('useSpaces: Error updating space:', err);
      throw err;
    }
  };

  const deleteSpace = async (spaceId) => {
    try {
      console.log('useSpaces: Deleting space:', spaceId);
      
      const result = await spacesAPI.delete(spaceId);
      console.log('useSpaces: Space deleted successfully');
      
      // Refresh the spaces list
      await fetchSpaces();
    } catch (err) {
      console.error('useSpaces: Error deleting space:', err);
      throw err;
    }
  };

  // Load spaces on mount
  useEffect(() => {
    fetchSpaces();
  }, []);

  return {
    spaces: filteredSpaces,
    allSpaces: Array.isArray(spaces) ? spaces : [],
    loading,
    error,
    searchTerm,
    setSearchTerm,
    createSpace,
    updateSpace,
    deleteSpace,
    refresh: fetchSpaces
  };
};

export default useSpaces; 