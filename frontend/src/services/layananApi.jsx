import axios from 'axios';

// Use consistent base URL with api.jsx
const API_BASE_URL = '/api/services';

// Configure axios defaults
axios.defaults.timeout = 10000;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    console.log('Axios Request:', config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    console.error('Axios Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axios.interceptors.response.use(
  (response) => {
    console.log('Axios Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Axios Response Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

class LayananAPI {
  // GET all layanan
  async getLayanan(params = {}) {
    try {
      const response = await axios.get(API_BASE_URL, { params });
      
      // Normalize data before returning
      if (response.data.success && response.data.data?.services) {
        const normalizedServices = response.data.data.services.map(service => ({
          ...service,
          // Normalize description to string
          description: typeof service.description === 'object' 
            ? service.description?.short || service.description?.long || 'No description'
            : service.description || 'No description'
        }));
        
        return {
          ...response.data,
          data: {
            ...response.data.data,
            services: normalizedServices
          }
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching layanan:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch layanan');
    }
  }

  // GET single layanan by ID
  async getLayananById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${id}`);
      
      // Normalize response data
      if (response.data.success && response.data.data) {
        const normalizedData = {
          ...response.data.data,
          // Normalize description to string
          description: typeof response.data.data.description === 'object' 
            ? response.data.data.description?.short || response.data.data.description?.long || 'No description'
            : response.data.data.description || 'No description'
        };
        
        return {
          ...response.data,
          data: normalizedData
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching layanan:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch layanan');
    }
  }

  // CREATE new layanan
  async createLayanan(layananData) {
    try {
      // Transform data to match backend expectations
      const transformedData = this.transformLayananData(layananData);
      const response = await axios.post(API_BASE_URL, transformedData);
      
      // Normalize response data
      if (response.data.success && response.data.data) {
        const normalizedData = {
          ...response.data.data,
          // Normalize description to string
          description: typeof response.data.data.description === 'object' 
            ? response.data.data.description?.short || response.data.data.description?.long || 'No description'
            : response.data.data.description || 'No description'
        };
        
        return {
          ...response.data,
          data: normalizedData
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('LayananAPI: Error creating layanan:', error);
      console.error('LayananAPI: Error details:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to create layanan');
    }
  }

  // UPDATE existing layanan
  async updateLayanan(id, layananData) {
    try {
      // Transform data to match backend expectations
      const transformedData = this.transformLayananData(layananData);
      const response = await axios.put(`${API_BASE_URL}/${id}`, transformedData);
      
      // Normalize response data
      if (response.data.success && response.data.data) {
        const normalizedData = {
          ...response.data.data,
          // Normalize description to string
          description: typeof response.data.data.description === 'object' 
            ? response.data.data.description?.short || response.data.data.description?.long || 'No description'
            : response.data.data.description || 'No description'
        };
        
        return {
          ...response.data,
          data: normalizedData
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating layanan:', error);
      throw new Error(error.response?.data?.message || 'Failed to update layanan');
    }
  }

  // DELETE layanan
  async deleteLayanan(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting layanan:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete layanan');
    }
  }

  // Transform layanan data to match backend schema
  transformLayananData(data) {
    const transformed = {
      serviceId: data.serviceId || undefined,
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
      category: data.category,
      type: data.type,
      description: {
        short: data.description?.short || '',
        long: data.description?.long || data.description?.short || '',
        shortEn: data.description?.shortEn || data.description?.short || '',
        longEn: data.description?.longEn || data.description?.long || data.description?.short || ''
      },
      metrics: {
        totalSubscribers: parseInt(data.metrics?.totalSubscribers) || 0,
        activeSubscribers: parseInt(data.metrics?.activeSubscribers) || 0,
        monthlySignups: parseInt(data.metrics?.monthlySignups) || 0,
        churnRate: parseFloat(data.metrics?.churnRate) || 0,
        averageLifetimeValue: parseInt(data.metrics?.averageLifetimeValue) || 0,
        customerSatisfactionScore: parseFloat(data.metrics?.customerSatisfactionScore) || 0,
        netPromoterScore: parseInt(data.metrics?.netPromoterScore) || 0
      },
      status: data.status || 'draft',
      createdBy: data.createdBy || 'frontend_user',
      lastModifiedBy: data.lastModifiedBy || 'frontend_user'
    };
    
    return transformed;
  }

  // Check if layanan name already exists (for duplicate validation)
  async checkLayananNameExists(name, excludeId = null) {
    try {
      const response = await this.getLayanan();
      const layananList = response.data?.services || [];
      
      return layananList.some(layanan => {
        const isDuplicate = layanan.name && 
                           layanan.name.toLowerCase().trim() === name.toLowerCase().trim();
        const isNotExcluded = !excludeId || layanan.id !== excludeId;
        return isDuplicate && isNotExcluded;
      });
    } catch (error) {
      console.error('Error checking layanan name existence:', error);
      throw error;
    }
  }

  // Search layanan
  async searchLayanan(searchTerm, filters = {}) {
    try {
      const params = {
        search: searchTerm,
        ...filters
      };
      // getLayanan already handles normalization
      return await this.getLayanan(params);
    } catch (error) {
      console.error('Error searching layanan:', error);
      throw error;
    }
  }

  // Get layanan by category
  async getLayananByCategory(category) {
    try {
      return await this.getLayanan({ category });
    } catch (error) {
      console.error('Error fetching layanan by category:', error);
      throw error;
    }
  }

  // Get layanan by type
  async getLayananByType(type) {
    try {
      return await this.getLayanan({ type });
    } catch (error) {
      console.error('Error fetching layanan by type:', error);
      throw error;
    }
  }

  // Get layanan by status
  async getLayananByStatus(status) {
    try {
      return await this.getLayanan({ status });
    } catch (error) {
      console.error('Error fetching layanan by status:', error);
      throw error;
    }
  }

  // Bulk operations
  async bulkUpdateStatus(layananIds, status) {
    try {
      const promises = layananIds.map(id => 
        this.updateLayanan(id, { status })
      );
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');
      
      return {
        successful: successful.length,
        failed: failed.length,
        totalProcessed: results.length,
        errors: failed.map(result => result.reason.message)
      };
    } catch (error) {
      console.error('Error in bulk update:', error);
      throw error;
    }
  }

  async bulkDelete(layananIds) {
    try {
      const promises = layananIds.map(id => this.deleteLayanan(id));
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');
      
      return {
        successful: successful.length,
        failed: failed.length,
        totalProcessed: results.length,
        errors: failed.map(result => result.reason.message)
      };
    } catch (error) {
      console.error('Error in bulk delete:', error);
      throw error;
    }
  }
}

// Create singleton instance
const layananAPI = new LayananAPI();
export default layananAPI; 