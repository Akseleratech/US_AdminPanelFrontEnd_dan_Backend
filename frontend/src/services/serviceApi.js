import axios from 'axios';

// Use relative path for Vite proxy
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

class ServiceAPI {
  // GET all services
  async getServices(params = {}) {
    try {
      const response = await axios.get(API_BASE_URL, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch services');
    }
  }

  // GET single service by ID
  async getService(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching service:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch service');
    }
  }

  // CREATE new service
  async createService(serviceData) {
    try {
      // Transform data to match backend expectations
      const transformedData = this.transformServiceData(serviceData);
      const response = await axios.post(API_BASE_URL, transformedData);
      return response.data;
    } catch (error) {
      console.error('ServiceAPI: Error creating service:', error);
      console.error('ServiceAPI: Error details:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to create service');
    }
  }

  // UPDATE existing service
  async updateService(id, serviceData) {
    try {
      // Transform data to match backend expectations
      const transformedData = this.transformServiceData(serviceData);
      const response = await axios.put(`${API_BASE_URL}/${id}`, transformedData);
      return response.data;
    } catch (error) {
      console.error('Error updating service:', error);
      throw new Error(error.response?.data?.message || 'Failed to update service');
    }
  }

  // DELETE service
  async deleteService(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting service:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete service');
    }
  }

  // Transform service data to match backend schema
  transformServiceData(data) {
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

  // Search services
  async searchServices(searchTerm, filters = {}) {
    try {
      const params = {
        search: searchTerm,
        ...filters
      };
      return await this.getServices(params);
    } catch (error) {
      console.error('Error searching services:', error);
      throw error;
    }
  }

  // Get services by category
  async getServicesByCategory(category) {
    try {
      return await this.getServices({ category });
    } catch (error) {
      console.error('Error fetching services by category:', error);
      throw error;
    }
  }

  // Get services by type
  async getServicesByType(type) {
    try {
      return await this.getServices({ type });
    } catch (error) {
      console.error('Error fetching services by type:', error);
      throw error;
    }
  }

  // Get services by status
  async getServicesByStatus(status) {
    try {
      return await this.getServices({ status });
    } catch (error) {
      console.error('Error fetching services by status:', error);
      throw error;
    }
  }

  // Bulk operations
  async bulkUpdateStatus(serviceIds, status) {
    try {
      const promises = serviceIds.map(id => 
        this.updateService(id, { status })
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

  async bulkDelete(serviceIds) {
    try {
      const promises = serviceIds.map(id => this.deleteService(id));
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
const serviceAPI = new ServiceAPI();
export default serviceAPI; 