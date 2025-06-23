import { useState, useEffect } from 'react';
import { spacesAPI } from '../services/api.jsx';

const useSpaces = () => {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter spaces based on search term
  const filteredSpaces = spaces.filter(space =>
    space.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    space.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      
      if (response.success) {
        setSpaces(response.data || []);
        console.log('useSpaces: Spaces loaded:', response.data?.length || 0);
      } else {
        throw new Error(response.message || 'Failed to fetch spaces');
      }
    } catch (err) {
      console.error('useSpaces: Error fetching spaces:', err);
      setError(err.message);
      setSpaces([]);
    } finally {
      setLoading(false);
    }
  };

  const createSpace = async (spaceData) => {
    try {
      console.log('useSpaces: Creating space with data:', spaceData);
      
      const response = await spacesAPI.create(spaceData);
      console.log('useSpaces: Create response:', response);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create space');
      }
      
      const result = await response.json();
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
      
      const response = await spacesAPI.update(spaceId, spaceData);
      console.log('useSpaces: Update response:', response);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update space');
      }
      
      const result = await response.json();
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
      
      const response = await spacesAPI.delete(spaceId);
      console.log('useSpaces: Delete response:', response);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete space');
      }
      
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
    allSpaces: spaces,
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