import { useState, useEffect } from 'react';
import { spacesAPI } from '../services/api';

const useSpaces = () => {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSpaces = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await spacesAPI.getAll();
      console.log('useSpaces: Raw API response:', JSON.stringify(response, null, 2));
      
      if (response?.success) {
        // Extract spaces array from nested response
        const spacesArray = response.data?.data || [];
        console.log('useSpaces: Extracted spaces array:', JSON.stringify(spacesArray, null, 2));
        
        // Map the data to include id
        const mappedSpaces = spacesArray.map(space => ({
          ...space,
          id: space.id || space.spaceId // Use existing id or fallback to spaceId
        }));
        
        console.log('useSpaces: Final mapped spaces:', JSON.stringify(mappedSpaces, null, 2));
        setSpaces(mappedSpaces);
        console.log('useSpaces: Spaces loaded successfully:', mappedSpaces.length, 'spaces');
      } else {
        throw new Error(response?.message || 'Failed to fetch spaces');
      }
    } catch (err) {
      console.error('useSpaces: Error fetching spaces:', err);
      setError(err.message);
      setSpaces([]); // Reset spaces to empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  const createSpace = async (spaceData) => {
    try {
      const newSpace = await spacesAPI.create(spaceData);
      if (newSpace.success) {
        setSpaces(prevSpaces => [newSpace.data, ...prevSpaces]);
        return newSpace.data;
      } else {
        throw new Error(newSpace.message || 'Failed to create space');
      }
    } catch (error) {
      console.error('useSpaces: Error creating space:', error);
      throw error;
    }
  };

  const updateSpace = async (id, spaceData) => {
    try {
      const updatedSpace = await spacesAPI.update(id, spaceData);
      if (updatedSpace.success) {
        setSpaces(prevSpaces =>
          prevSpaces.map(s => (s.id === id ? updatedSpace.data : s))
        );
        return updatedSpace.data;
      } else {
        throw new Error(updatedSpace.message || 'Failed to update space');
      }
    } catch (error) {
      console.error('useSpaces: Error updating space:', error);
      throw error;
    }
  };

  const deleteSpace = async (id) => {
    try {
      const response = await spacesAPI.delete(id);
      if (response.success) {
        setSpaces(prevSpaces => prevSpaces.filter(s => s.id !== id));
      } else {
        throw new Error(response.message || 'Failed to delete space');
      }
    } catch (error) {
      console.error('useSpaces: Error deleting space:', error);
      throw error;
    }
  };

  return {
    spaces,
    loading,
    error,
    refreshSpaces: fetchSpaces,
    createSpace,
    updateSpace,
    deleteSpace,
  };
}

export default useSpaces; 