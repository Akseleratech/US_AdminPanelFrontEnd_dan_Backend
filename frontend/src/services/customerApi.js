import axios from 'axios';
import { auth } from '../config/firebase';

// API Base URL - using relative path for Vite proxy
const API_BASE_URL = '/api/customers';

// Helper function to get auth token
const getAuthToken = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function to create headers with auth token
const createAuthHeaders = async () => {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

class CustomerAPI {
  // Get all customers
  async getAllCustomers(params = {}) {
    try {
      const headers = await createAuthHeaders();
      const response = await axios.get(API_BASE_URL, { 
        params,
        headers 
      });
      return response.data;
    } catch (error) {
      console.error('💥 CustomerAPI: Error fetching customers:', error);
      throw new Error('Failed to fetch customers');
    }
  }

  // Get customer by ID
  async getCustomerById(id) {
    try {
      const headers = await createAuthHeaders();
      const response = await axios.get(`${API_BASE_URL}/${id}`, { headers });
      return response.data;
    } catch (error) {
      console.error('💥 CustomerAPI: Error fetching customer:', error);
      throw new Error('Failed to fetch customer');
    }
  }

  // Create new customer
  async createCustomer(customerData) {
    try {
      const headers = await createAuthHeaders();
      const response = await axios.post(API_BASE_URL, customerData, { headers });
      return response.data;
    } catch (error) {
      console.error('💥 CustomerAPI: Error creating customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  // Update customer
  async updateCustomer(id, customerData) {
    try {
      const headers = await createAuthHeaders();
      const response = await axios.put(`${API_BASE_URL}/${id}`, customerData, { headers });
      return response.data;
    } catch (error) {
      console.error('💥 CustomerAPI: Error updating customer:', error);
      throw new Error('Failed to update customer');
    }
  }

  // Delete customer
  async deleteCustomer(id) {
    try {
      const headers = await createAuthHeaders();
      const response = await axios.delete(`${API_BASE_URL}/${id}`, { headers });
      return response.data;
    } catch (error) {
      console.error('💥 CustomerAPI: Error deleting customer:', error);
      throw new Error('Failed to delete customer');
    }
  }

  // Search customers
  async searchCustomers(searchTerm, params = {}) {
    try {
      const headers = await createAuthHeaders();
      const response = await axios.get(`${API_BASE_URL}/search`, {
        params: { search: searchTerm, ...params },
        headers
      });
      return response.data;
    } catch (error) {
      console.error('💥 CustomerAPI: Error searching customers:', error);
      throw new Error('Failed to search customers');
    }
  }

  // Get customer statistics
  async getCustomerStatistics() {
    try {
      const headers = await createAuthHeaders();
      const response = await axios.get(`${API_BASE_URL}/statistics`, { headers });
      return response.data;
    } catch (error) {
      console.error('💥 CustomerAPI: Error fetching customer statistics:', error);
      throw new Error('Failed to fetch customer statistics');
    }
  }
}

export default new CustomerAPI(); 