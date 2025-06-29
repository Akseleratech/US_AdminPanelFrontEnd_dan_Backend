import axios from 'axios';

const API_BASE_URL = '/api/cities';

class CityAPI {
  // GET all cities
  async getCities(params = {}) {
    try {
      const response = await axios.get(API_BASE_URL, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch cities');
    }
  }

  // GET single city by ID
  async getCity(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching city:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch city');
    }
  }

  // CREATE new city
  async createCity(cityData) {
    try {
      console.log('🏙️ CityAPI: Creating city with data:', {
        ...cityData,
        thumbnail: cityData.thumbnail ? 'FILE_OBJECT' : null
      });
      
      const formData = this.createFormData(cityData);
      
      // Debug FormData contents
      console.log('📤 CityAPI: FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: FILE (${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
      
      console.log('🚀 CityAPI: Sending POST request to', API_BASE_URL);
      const response = await axios.post(API_BASE_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ CityAPI: City created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('💥 CityAPI: Error creating city:', error);
      console.error('💥 CityAPI: Error response:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to create city');
    }
  }

  // UPDATE existing city
  async updateCity(id, cityData) {
    try {
      console.log('🏙️ CityAPI: Updating city', id, 'with data:', {
        ...cityData,
        thumbnail: cityData.thumbnail ? 'FILE_OBJECT' : null
      });
      
      const formData = this.createFormData(cityData);
      
      // Debug FormData contents
      console.log('📤 CityAPI: FormData contents for update:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: FILE (${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
      
      console.log('🚀 CityAPI: Sending PUT request to', `${API_BASE_URL}/${id}`);
      const response = await axios.put(`${API_BASE_URL}/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ CityAPI: City updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('💥 CityAPI: Error updating city:', error);
      console.error('💥 CityAPI: Error response:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to update city');
    }
  }

  // Upload city image
  async uploadCityImage(cityId, imageFile) {
    try {
      const formData = new FormData();
      formData.append('thumbnail', imageFile);
      
      const response = await axios.post(`${API_BASE_URL}/upload-image/${cityId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading city image:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload image');
    }
  }

  // DELETE city
  async deleteCity(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/${id}`);
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
    
    // Postal codes
    if (data.postalCode) {
      formData.append('postalCodes', JSON.stringify([data.postalCode]));
    }
    
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
      postalCodes: data.postalCode ? [data.postalCode] : [],
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
}

// Create singleton instance
const cityAPI = new CityAPI();
export default cityAPI; 