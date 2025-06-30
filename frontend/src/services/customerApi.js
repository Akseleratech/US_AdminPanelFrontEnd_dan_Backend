import axios from 'axios';

const API_BASE_URL = '/api/customers';

class CustomerAPI {
  // GET all customers
  async getCustomers(params = {}) {
    try {
      const response = await axios.get(API_BASE_URL, { params });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch customers');
    }
  }

  // GET single customer by ID
  async getCustomer(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch customer');
    }
  }

  // CREATE new customer
  async createCustomer(customerData) {
    try {
      const payload = { ...customerData };
      let photoFile = null;
      if (payload.photo instanceof File) {
        photoFile = payload.photo;
        delete payload.photo; // send JSON without file
      }

      const response = await axios.post(API_BASE_URL, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const createdCustomer = response.data.data;

      // If there is a photo file, upload it separately
      if (photoFile) {
        await this.uploadCustomerImage(createdCustomer.id, photoFile);
      }

      return createdCustomer;
    } catch (error) {
      console.error('💥 CustomerAPI: Error creating customer:', error);
      throw new Error(error.response?.data?.message || 'Failed to create customer');
    }
  }

  // UPDATE existing customer
  async updateCustomer(id, customerData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/${id}`, customerData, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data.data;
    } catch (error) {
      console.error('💥 CustomerAPI: Error updating customer:', error);
      throw new Error(error.response?.data?.message || 'Failed to update customer');
    }
  }

  // Upload customer image
  async uploadCustomerImage(customerId, imageFile) {
    try {
      console.log('🖼️ CustomerAPI: Uploading image for customer:', customerId);
      
      // Convert file to base64 for Cloud Functions
      const base64 = await this.fileToBase64(imageFile);
      
      const payload = {
        imageData: base64,
        fileName: imageFile.name
      };
      
      console.log('📤 CustomerAPI: Sending image upload request');
      const response = await axios.post(`${API_BASE_URL}/${customerId}/upload-image`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ CustomerAPI: Image uploaded successfully:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('💥 CustomerAPI: Error uploading customer image:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload image');
    }
  }

  // Helper function to convert file to base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // DELETE customer
  async deleteCustomer(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete customer');
    }
  }

  // Create FormData for customer with image support
  createFormData(data) {
    console.log('🔨 CustomerAPI: Creating FormData from data:', {
      ...data,
      photo: data.photo ? `FILE: ${data.photo.name}` : null
    });
    
    const formData = new FormData();
    
    // Basic fields
    if (data.customerId) formData.append('customerId', data.customerId);
    formData.append('name', data.name);
    formData.append('email', data.email);
    if (data.phone) formData.append('phone', data.phone);
    if (data.company) formData.append('company', data.company);
    if (data.address) formData.append('address', data.address);
    if (data.dateOfBirth) formData.append('dateOfBirth', data.dateOfBirth);
    
    // Active status
    formData.append('isActive', data.isActive ?? true);
    
    // Handle image file
    if (data.photo && data.photo instanceof File) {
      console.log('📎 CustomerAPI: Adding photo file to FormData:', {
        name: data.photo.name,
        size: data.photo.size,
        type: data.photo.type
      });
      formData.append('photo', data.photo);
    } else {
      console.log('📎 CustomerAPI: No photo file to add (not a File object)');
    }
    
    console.log('✅ CustomerAPI: FormData created successfully');
    return formData;
  }

  // Transform customer data to match backend schema
  transformCustomerData(data) {
    return {
      customerId: data.customerId || undefined,
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      company: data.company || undefined,
      address: data.address || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      joinDate: data.joinDate || new Date().toISOString(),
      
      // Metadata
      tags: data.tags || [],
      notes: data.notes || '',
      
      // Search keywords for better searchability
      search: {
        keywords: this.generateSearchKeywords(data),
        slug: data.name ? data.name.toLowerCase().replace(/\s+/g, '-') : '',
        metaTitle: `Customer: ${data.name}`,
        metaDescription: `Customer profile for ${data.name}`
      }
    };
  }

  // Generate search keywords for customers
  generateSearchKeywords(customerData) {
    const keywords = [];
    
    // Add name keywords
    if (customerData.name) {
      keywords.push(customerData.name.toLowerCase());
      keywords.push(...customerData.name.toLowerCase().split(' '));
    }
    
    // Add email keywords
    if (customerData.email) {
      keywords.push(customerData.email.toLowerCase());
      const emailParts = customerData.email.split('@');
      if (emailParts.length === 2) {
        keywords.push(emailParts[0].toLowerCase());
        keywords.push(emailParts[1].toLowerCase());
      }
    }
    
    // Add company keywords
    if (customerData.company) {
      keywords.push(customerData.company.toLowerCase());
      keywords.push(...customerData.company.toLowerCase().split(' '));
    }
    
    // Add phone keywords (numbers only)
    if (customerData.phone) {
      const phoneNumbers = customerData.phone.replace(/\D/g, '');
      if (phoneNumbers) {
        keywords.push(phoneNumbers);
      }
    }
    
    // Remove duplicates and empty strings
    return [...new Set(keywords.filter(keyword => keyword && keyword.length > 1))];
  }

  // SEARCH customers
  async searchCustomers(searchTerm, filters = {}) {
    try {
      const params = {
        search: searchTerm,
        ...filters
      };
      const response = await axios.get(`${API_BASE_URL}/search`, { params });
      return response.data;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw new Error(error.response?.data?.message || 'Failed to search customers');
    }
  }

  // GET active customers
  async getActiveCustomers() {
    try {
      const response = await axios.get(`${API_BASE_URL}/active`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active customers:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch active customers');
    }
  }

  // GET customers by company
  async getCustomersByCompany(company) {
    try {
      const response = await axios.get(`${API_BASE_URL}/company/${encodeURIComponent(company)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customers by company:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch customers by company');
    }
  }

  // Convert customer data for upload (base64 conversion)
  async convertToBase64ForUpload(customerData) {
    const convertedData = { ...customerData };
    
    if (convertedData.photo && convertedData.photo instanceof File) {
      try {
        convertedData.photo = await this.fileToBase64(convertedData.photo);
      } catch (error) {
        console.error('Error converting photo to base64:', error);
        delete convertedData.photo;
      }
    }
    
    return convertedData;
  }

  // Get customer statistics
  async getCustomerStatistics() {
    try {
      const response = await axios.get(`${API_BASE_URL}/statistics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer statistics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch customer statistics');
    }
  }
}

// Export singleton instance
const customerAPI = new CustomerAPI();
export default customerAPI; 