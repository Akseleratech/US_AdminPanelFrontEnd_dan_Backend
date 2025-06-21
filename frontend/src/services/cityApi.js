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
      const transformedData = this.transformCityData(cityData);
      const response = await axios.post(API_BASE_URL, transformedData);
      return response.data;
    } catch (error) {
      console.error('Error creating city:', error);
      throw new Error(error.response?.data?.message || 'Failed to create city');
    }
  }

  // UPDATE existing city
  async updateCity(id, cityData) {
    try {
      const transformedData = this.transformCityData(cityData);
      const response = await axios.put(`${API_BASE_URL}/${id}`, transformedData);
      return response.data;
    } catch (error) {
      console.error('Error updating city:', error);
      throw new Error(error.response?.data?.message || 'Failed to update city');
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

  // Transform city data to match backend schema
  transformCityData(data) {
    return {
      cityId: data.cityId || undefined,
      name: data.name,
      province: data.province,
      country: {
        id: data.country.id || 'ID',
        name: data.country.name || 'Indonesia',
        code: data.country.code || 'IDN',
        phoneCode: data.country.phoneCode || '+62'
      },
      location: {
        coordinates: {
          latitude: parseFloat(data.location.coordinates.latitude) || 0,
          longitude: parseFloat(data.location.coordinates.longitude) || 0
        },
        latitude: parseFloat(data.location.coordinates.latitude) || 0,
        longitude: parseFloat(data.location.coordinates.longitude) || 0,
        boundingBox: data.location.boundingBox || {
          northeast: { lat: 0, lng: 0 },
          southwest: { lat: 0, lng: 0 }
        },
        area: parseFloat(data.location.area) || 0,
        elevation: parseInt(data.location.elevation) || 0
      },
      postalCodes: Array.isArray(data.postalCodes) ? data.postalCodes : [],
      timezone: data.timezone || 'Asia/Jakarta',
      utcOffset: data.utcOffset || '+07:00',
      statistics: {
        totalSpaces: parseInt(data.statistics?.totalSpaces) || 0,
        activeSpaces: parseInt(data.statistics?.activeSpaces) || 0
      },
      search: {
        keywords: Array.isArray(data.search?.keywords) 
          ? data.search.keywords 
          : [data.name.toLowerCase()],
        aliases: Array.isArray(data.search?.aliases) ? data.search.aliases : [],
        slug: data.search?.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        metaTitle: data.search?.metaTitle || `Co-working Spaces in ${data.name}`,
        metaDescription: data.search?.metaDescription || `Find and book workspaces in ${data.name}`
      },
      isActive: data.isActive ?? true
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