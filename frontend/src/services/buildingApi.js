// Building API service
// NOTE: These endpoints require admin authorization on the backend. We need to
// include the Firebase ID token in the Authorization header for every request
// so that `verifyAdminAuth` in Cloud Functions can validate the user.

import { auth } from '../config/firebase.jsx';

const getAuthToken = async () => {
  try {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  } catch (e) {
    console.error('⚠️  buildingApi: failed to get auth token', e);
    return null;
  }
};

const API_BASE_URL = '/api/buildings'; // Use relative path for Vite proxy

class BuildingApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get all buildings with optional filters
  async getBuildings(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination params
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      // Add filter params
      if (params.search) queryParams.append('search', params.search);
      if (params.brand) queryParams.append('brand', params.brand);
      if (params.city) queryParams.append('city', params.city);
      if (params.province) queryParams.append('province', params.province);
      if (params.country) queryParams.append('country', params.country);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
      
      // Add sorting params
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = queryParams.toString() ? 
        `${this.baseURL}?${queryParams.toString()}` : 
        this.baseURL;

      console.log('🏢 Fetching buildings from:', url);

      const token = await getAuthToken();
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Buildings fetched successfully:', data);
      
      // Return the actual data, ensuring consistent structure
      return data.success ? data.data : data;
    } catch (error) {
      console.error('❌ Error fetching buildings:', error);
      throw error;
    }
  }

  // Get building by ID
  async getBuilding(id) {
    try {
      console.log(`🏢 Fetching building with ID: ${id}`);
      
      const token = await getAuthToken();
      const response = await fetch(`${this.baseURL}/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Building fetched successfully:', data);
      
      return data.data; // Fixed: use data.data instead of data.building
    } catch (error) {
      console.error('❌ Error fetching building:', error);
      throw error;
    }
  }

  // Create new building
  async createBuilding(buildingData) {
    try {
      console.log('🏢 Creating building:', buildingData);

      const token = await getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers,
        body: JSON.stringify(buildingData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Building creation failed:', data);
        throw new Error(data.error?.message || data.message || `HTTP error! status: ${response.status}`);
      }

      console.log('✅ Building created successfully:', data);
      return data.data; // Fixed: use data.data instead of data.building
    } catch (error) {
      console.error('❌ Error creating building:', error);
      throw error;
    }
  }

  // Update building
  async updateBuilding(id, buildingData) {
    try {
      console.log(`🏢 Updating building ${id}:`, buildingData);

      const token = await getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(buildingData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Building update failed:', data);
        throw new Error(data.error?.message || data.message || `HTTP error! status: ${response.status}`);
      }

      console.log('✅ Building updated successfully:', data);
      return data.data; // Fixed: use data.data instead of data.building
    } catch (error) {
      console.error('❌ Error updating building:', error);
      throw error;
    }
  }

  // Delete building
  async deleteBuilding(id) {
    try {
      console.log(`🏢 Deleting building with ID: ${id}`);

      const token = await getAuthToken();
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Building deleted successfully:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Error deleting building:', error);
      throw error;
    }
  }

  // Get buildings summary/statistics
  async getBuildingsSummary() {
    try {
      console.log('🏢 Fetching buildings summary');
      
      // Get all buildings to calculate summary
      const response = await this.getBuildings({ limit: 1000 });
      const buildings = response.buildings || [];
      
      const summary = {
        total: buildings.length,
        active: buildings.filter(b => b.isActive).length,
        inactive: buildings.filter(b => !b.isActive).length,
        byBrand: {},
        byCity: {},
        byCountry: {}
      };
      
      // Calculate brand distribution
      buildings.forEach(building => {
        if (building.brand) {
          summary.byBrand[building.brand] = (summary.byBrand[building.brand] || 0) + 1;
        }
        
        if (building.location?.city) {
          summary.byCity[building.location.city] = (summary.byCity[building.location.city] || 0) + 1;
        }
        
        if (building.location?.country) {
          summary.byCountry[building.location.country] = (summary.byCountry[building.location.country] || 0) + 1;
        }
      });
      
      console.log('✅ Buildings summary calculated:', summary);
      return summary;
    } catch (error) {
      console.error('❌ Error fetching buildings summary:', error);
      throw error;
    }
  }

  // Upload building image
  async uploadBuildingImage(buildingId, imageFile) {
    try {
      console.log('🖼️ BuildingAPI: Uploading image for building:', buildingId);
      
      // Convert file to base64 for Cloud Functions
      const base64 = await this.fileToBase64(imageFile);
      
      const payload = {
        imageData: base64,
        fileName: imageFile.name
      };
      
      console.log('📤 BuildingAPI: Sending image upload request');
      const token = await getAuthToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${this.baseURL}/${buildingId}/upload-image`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ BuildingAPI: Image uploaded successfully:', data);
      return data;
    } catch (error) {
      console.error('💥 BuildingAPI: Error uploading building image:', error);
      throw new Error(error.message || 'Failed to upload image');
    }
  }

  // Helper method to convert file to base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

// Create and export singleton instance
const buildingApiService = new BuildingApiService();
export default buildingApiService; 