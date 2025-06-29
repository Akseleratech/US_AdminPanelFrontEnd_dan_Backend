import { auth } from '../config/firebase.jsx';

// API Base URL - using relative path for Vite proxy
const API_BASE_URL = '/api';

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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

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
    return responseData;
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
  create: (data) => apiCall('/spaces', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiCall(`/spaces/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiCall(`/spaces/${id}`, { method: 'DELETE' })
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
  create: (data) => apiCall('/amenities', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiCall(`/amenities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiCall(`/amenities/${id}`, { method: 'DELETE' }),
  toggleStatus: (id) => apiCall(`/amenities/${id}/toggle`, { method: 'PATCH' }),
  getActive: () => apiCall('/amenities?status=active')
};