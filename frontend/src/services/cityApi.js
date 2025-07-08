import axios from 'axios';
import { auth } from '../config/firebase.jsx';

const API_BASE_URL = '/api/cities';

// Helper to get Firebase ID token
const getAuthToken = async () => {
  try {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  } catch (e) {
    console.error('⚠️ CityAPI: failed to get auth token', e);
    return null;
  }
};

// Build headers with token
const buildHeaders = async (extra = {}) => {
  const token = await getAuthToken();
  return {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...extra,
  };
};

class CityAPI {
  // GET all cities
  async getCities(params = {}) {
    try {
      const response = await axios.get(API_BASE_URL, {
        params,
        headers: await buildHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch cities');
    }
  }

  // GET single city by ID
  async getCity(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${id}`, {
        headers: await buildHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching city:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch city');
    }
  }

  // CREATE new city
  async createCity(cityData) {
    try {
      const payload = { ...cityData };
      let thumbnailFile = null;
      if (payload.thumbnail instanceof File) {
        thumbnailFile = payload.thumbnail;
        delete payload.thumbnail; // send JSON without file
      }

      const response = await axios.post(API_BASE_URL, payload, {
        headers: await buildHeaders({ 'Content-Type': 'application/json' }),
      });

      const createdCity = response.data;

      // If there is a thumbnail file, upload it separately
      if (thumbnailFile) {
        await this.uploadCityImage(createdCity.id, thumbnailFile);
      }

      return createdCity;
    } catch (error) {
      console.error('💥 CityAPI: Error creating city:', error);
      throw new Error(error.response?.data?.message || 'Failed to create city');
    }
  }

  // UPDATE existing city
  async updateCity(id, cityData) {
    try {
      const payload = { ...cityData };
      let thumbnailFile = null;
      if (payload.thumbnail instanceof File) {
        thumbnailFile = payload.thumbnail;
        delete payload.thumbnail;
      }

      const response = await axios.put(`${API_BASE_URL}/${id}`, payload, {
        headers: await buildHeaders({ 'Content-Type': 'application/json' }),
      });

      const updatedCity = response.data;

      // If thumbnail file provided, upload via separate endpoint
      if (thumbnailFile) {
        await this.uploadCityImage(id, thumbnailFile);
      }

      return updatedCity;
    } catch (error) {
      console.error('💥 CityAPI: Error updating city:', error);
      throw new Error(error.response?.data?.message || 'Failed to update city');
    }
  }

  // Upload city image
  async uploadCityImage(cityId, imageFile) {
    try {
      console.log('🖼️ CityAPI: Uploading image for city:', cityId);
      
      // Convert file to base64 for Cloud Functions
      const base64 = await this.fileToBase64(imageFile);
      
      const payload = {
        imageData: base64,
        fileName: imageFile.name
      };
      
      console.log('📤 CityAPI: Sending image upload request');
      const response = await axios.post(`${API_BASE_URL}/${cityId}/upload-image`, payload, {
        headers: await buildHeaders({ 'Content-Type': 'application/json' }),
      });
      
      console.log('✅ CityAPI: Image uploaded successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('💥 CityAPI: Error uploading city image:', error);
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

  // DELETE city
  async deleteCity(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/${id}`, {
        headers: await buildHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting city:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete city');
    }
  }

  // Create FormData for city with image support
  createFormData(data) {
    console.log('🔨 CityAPI: Creating FormData from data:', {
      ...data,
      thumbnail: data.thumbnail ? `FILE: ${data.thumbnail.name}` : null
    });
    
    const formData = new FormData();
    
    // Basic fields
    if (data.cityId) formData.append('cityId', data.cityId);
    formData.append('name', data.name);
    formData.append('province', data.province);
    formData.append('country', data.country);
    
    // Timezone
    formData.append('timezone', data.timezone || 'Asia/Jakarta');
    formData.append('utcOffset', data.utcOffset || '+07:00');
    
    // Search data
    const searchData = {
      keywords: [data.name.toLowerCase()],
      aliases: [],
      slug: data.name.toLowerCase().replace(/\s+/g, '-'),
      metaTitle: `Co-working Spaces in ${data.name}`,
      metaDescription: `Find and book workspaces in ${data.name}`
    };
    formData.append('search', JSON.stringify(searchData));
    
    // Active status
    formData.append('isActive', data.isActive ?? true);
    
    // Handle image file
    if (data.thumbnail && data.thumbnail instanceof File) {
      console.log('📎 CityAPI: Adding thumbnail file to FormData:', {
        name: data.thumbnail.name,
        size: data.thumbnail.size,
        type: data.thumbnail.type
      });
      formData.append('thumbnail', data.thumbnail);
    } else {
      console.log('📎 CityAPI: No thumbnail file to add (not a File object)');
    }
    
    console.log('✅ CityAPI: FormData created successfully');
    return formData;
  }

  // Transform city data to match backend schema (for backward compatibility)
  transformCityData(data) {
    return {
      cityId: data.cityId || undefined,
      name: data.name,
      province: data.province,
      country: data.country,

      timezone: data.timezone || 'Asia/Jakarta',
      utcOffset: data.utcOffset || '+07:00',
      statistics: {
        totalSpaces: parseInt(data.statistics?.totalSpaces) || 0,
        activeSpaces: parseInt(data.statistics?.activeSpaces) || 0
      },
      search: {
        keywords: [data.name.toLowerCase()],
        aliases: [],
        slug: data.name.toLowerCase().replace(/\s+/g, '-'),
        metaTitle: `Co-working Spaces in ${data.name}`,
        metaDescription: `Find and book workspaces in ${data.name}`
      },
      isActive: data.isActive ?? true,
      thumbnail: data.thumbnail
    };
  }

  // Search cities
  async searchCities(searchTerm, filters = {}) {
    try {
      const params = {
        search: searchTerm,
        ...filters
      };
      return await this.getCities(params);
    } catch (error) {
      console.error('Error searching cities:', error);
      throw error;
    }
  }

  // Get featured cities
  async getFeaturedCities() {
    try {
      return await this.getCities({ featured: 'true' });
    } catch (error) {
      console.error('Error fetching featured cities:', error);
      throw error;
    }
  }

  // Get active cities
  async getActiveCities() {
    try {
      return await this.getCities({ status: 'active' });
    } catch (error) {
      console.error('Error fetching active cities:', error);
      throw error;
    }
  }

  // Base64 conversion for image uploads
  async convertToBase64ForUpload(cityData) {
    const uploadData = {
      name: cityData.name,
      province: cityData.province,
      country: cityData.country,
      timezone: cityData.timezone || 'Asia/Jakarta',
      utcOffset: cityData.utcOffset || '+07:00',
      isActive: cityData.isActive !== undefined ? cityData.isActive : true
    };

    // Convert image to base64 if it's a File object
    if (cityData.thumbnail && cityData.thumbnail instanceof File) {
      console.log('🔄 Converting image to base64...');
      const base64 = await this.convertFileToBase64(cityData.thumbnail);
      uploadData.thumbnail = base64;
    }

    return uploadData;
  }
}

// Create singleton instance
const cityAPI = new CityAPI();
export default cityAPI; 