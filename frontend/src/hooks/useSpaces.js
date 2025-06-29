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

  return {
    spaces,
    loading,
    error,
    refreshSpaces: fetchSpaces
  };
}

export default useSpaces; 