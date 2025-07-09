import { auth } from '../config/firebase.jsx';

// API Base URL: dynamic based on environment
// 1) If VITE_API_BASE is defined, always use that (allows custom targets)
// 2) Otherwise: in development (vite dev / emulator) -> use functions emulator URL
//                in production (build on Hosting)   -> use relative '/api' path so Hosting rewrites route to Cloud Functions
const API_BASE_URL =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.DEV
    ? 'http://localhost:5555/demo-unionspace-crm/asia-southeast1'
    : '/api');

// Export API_BASE_URL for use in other services
export { API_BASE_URL };

// Helper function to get auth token
const getAuthToken = async () => {
  try {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    console.log(`🔗 Making API call to: ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      mode: 'cors', // Enable CORS
    });

    console.log(`📡 API Response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage += '\n• ' + errorData.errors.join('\n• ');
        }
      } catch (parseError) {
        // Could not parse error response, stick with the original message
      }
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log('✅ API Response data:', responseData);
    
    // Updated: Always return the full response object so callers have access
    // to `success`, `data`, and other metadata. Only throw when the backend
    // explicitly marks the request as unsuccessful.
    if (responseData.success === false) {
      throw new Error(responseData.error || 'API request failed');
    }
    
    return responseData;
  } catch (error) {
    console.error('❌ API call failed:', error);
    throw error;
  }
};

const apiCallWithFormData = async (endpoint, formData, method = 'POST') => {
  try {
    const token = await getAuthToken();
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.message) errorMessage = errorData.message;
      } catch (e) {
        // ignore
      }
      throw new Error(errorMessage);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => apiCall('/dashboard/stats'),
  getRecentOrders: () => apiCall('/dashboard/recent-orders'),
  getQuickStats: () => apiCall('/dashboard/quick-stats'),
};

// Orders API
export const ordersAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiCall(`/orders${queryParams ? `?${queryParams}` : ''}`);
  },
  getById: (id) => apiCall(`/orders/${id}`),
  create: (data) => apiCall('/orders', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiCall(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiCall(`/orders/${id}`, { method: 'DELETE' })
};

// Spaces API
export const spacesAPI = {
  getAll: () => apiCall('/spaces'),
  getById: (id) => apiCall(`/spaces/${id}`),
  getAvailability: (id, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiCall(`/spaces/${id}/availability${queryParams ? `?${queryParams}` : ''}`);
  },
  create: (data) => apiCall('/spaces', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiCall(`/spaces/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiCall(`/spaces/${id}`, { method: 'DELETE' }),
  uploadImages: async (spaceId, imageFiles) => {
    try {
      console.log('🖼️ SpacesAPI: Uploading images for space:', spaceId);
      
      // Convert all files to base64
      const imagePromises = imageFiles.map(async (file, index) => {
        const base64 = await fileToBase64(file);
        return {
          data: base64,
          name: file.name || `space_${spaceId}_${index}`
        };
      });
      
      const images = await Promise.all(imagePromises);
      
      const payload = { images };
      
      console.log('📤 SpacesAPI: Sending multiple image upload request');
      const response = await apiCall(`/spaces/${spaceId}/upload-images`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      console.log('✅ SpacesAPI: Images uploaded successfully:', response);
      return response;
    } catch (error) {
      console.error('💥 SpacesAPI: Error uploading space images:', error);
      throw new Error(error.message || 'Failed to upload images');
    }
  }
};

// Helper function to convert file to base64 (used by spacesAPI)
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Cities API
export const citiesAPI = {
  getAll: () => apiCall('/cities'),
  getById: (id) => apiCall(`/cities/${id}`),
  create: (data) => fetch(`${API_BASE_URL}/cities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  update: (id, data) => fetch(`${API_BASE_URL}/cities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  delete: (id) => fetch(`${API_BASE_URL}/cities/${id}`, { method: 'DELETE' })
};

// Layanan API (Services)
export const layananAPI = {
  getAll: () => apiCall('/services'),
  getById: (id) => apiCall(`/services/${id}`),
  create: (data) => apiCall('/services', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiCall(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiCall(`/services/${id}`, { method: 'DELETE' })
};

// Buildings API
export const buildingsAPI = {
  getAll: (params = {}) => {
    // Use same pattern as Buildings tab - with query parameters
    const defaultParams = {
      page: 1,
      limit: 100, // Get more buildings for dropdown
      sortBy: 'metadata.createdAt',
      sortOrder: 'desc',
      ...params
    };
    const queryParams = new URLSearchParams(defaultParams).toString();
    return apiCall(`/buildings?${queryParams}`);
  },
  getById: (id) => apiCall(`/buildings/${id}`),
  create: (data) => apiCall('/buildings', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiCall(`/buildings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiCall(`/buildings/${id}`, { method: 'DELETE' })
};

// Amenities API
export const amenitiesAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiCall(`/amenities${queryParams ? `?${queryParams}` : ''}`);
  },
  getById: (id) => apiCall(`/amenities/${id}`),
  create: (formData) => apiCallWithFormData('/amenities', formData, 'POST'),
  update: (id, formData) => apiCallWithFormData(`/amenities/${id}`, formData, 'PUT'),
  delete: (id) => apiCall(`/amenities/${id}`, { method: 'DELETE' }),
  toggleStatus: (id) => apiCall(`/amenities/${id}/toggle`, { method: 'PATCH' }),
  getActive: () => apiCall('/amenities?status=active')
};

// Promos API
export const promosAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiCall(`/promos${queryParams ? `?${queryParams}` : ''}`);
  },
  getById: (id) => apiCall(`/promos/${id}`),
  create: (data) => apiCall('/promos', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiCall(`/promos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiCall(`/promos/${id}`, { method: 'DELETE' }),
  uploadImage: async (promoId, file) => {
    const base64Data = await fileToBase64(file);
    return apiCall(`/promos/${promoId}/upload-image`, {
      method: 'POST',
      body: JSON.stringify({
        imageData: base64Data,
        fileName: file.name
      })
    });
  }
};

// Articles API
export const articlesAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiCall(`/articles${queryParams ? `?${queryParams}` : ''}`);
  },
  getById: (id) => apiCall(`/articles/${id}`),
  create: (data) => apiCall('/articles', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiCall(`/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiCall(`/articles/${id}`, { method: 'DELETE' }),
  uploadImage: async (articleId, file) => {
    const base64Data = await fileToBase64(file);
    return apiCall(`/articles/${articleId}/upload-image`, {
      method: 'POST',
      body: JSON.stringify({
        imageData: base64Data,
        fileName: file.name
      })
    });
  }
};