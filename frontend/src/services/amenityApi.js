import { apiClient } from './api.jsx';

export const amenityAPI = {
  // Get all amenities
  async getAll(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.category) queryParams.append('category', params.category);
      if (params.type) queryParams.append('type', params.type);

      const url = `/amenities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching amenities:', error);
      throw error;
    }
  },

  // Get single amenity by ID
  async getById(id) {
    try {
      const response = await apiClient.get(`/amenities/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching amenity:', error);
      throw error;
    }
  },

  // Create new amenity
  async create(amenityData) {
    try {
      const response = await apiClient.post('/amenities', amenityData);
      return response.data;
    } catch (error) {
      console.error('Error creating amenity:', error);
      throw error;
    }
  },

  // Update amenity
  async update(id, amenityData) {
    try {
      const response = await apiClient.put(`/amenities/${id}`, amenityData);
      return response.data;
    } catch (error) {
      console.error('Error updating amenity:', error);
      throw error;
    }
  },

  // Delete amenity
  async delete(id) {
    try {
      const response = await apiClient.delete(`/amenities/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting amenity:', error);
      throw error;
    }
  },

  // Toggle amenity active status
  async toggleStatus(id) {
    try {
      const response = await apiClient.patch(`/amenities/${id}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling amenity status:', error);
      throw error;
    }
  },

  // Get active amenities only
  async getActive() {
    try {
      return await this.getAll({ status: 'active' });
    } catch (error) {
      console.error('Error fetching active amenities:', error);
      throw error;
    }
  },

  // Get amenities by category
  async getByCategory(category) {
    try {
      return await this.getAll({ category, status: 'active' });
    } catch (error) {
      console.error('Error fetching amenities by category:', error);
      throw error;
    }
  },

  // Get amenities by type
  async getByType(type) {
    try {
      return await this.getAll({ type, status: 'active' });
    } catch (error) {
      console.error('Error fetching amenities by type:', error);
      throw error;
    }
  }
};

export default amenityAPI; 