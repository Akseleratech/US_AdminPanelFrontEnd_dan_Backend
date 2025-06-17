// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to make API calls
const apiCall = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    return { error: error.message };
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
  getAll: () => apiCall('/orders'),
  getById: (id) => apiCall(`/orders/${id}`),
  create: (data) => fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  update: (id, data) => fetch(`${API_BASE_URL}/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  delete: (id) => fetch(`${API_BASE_URL}/orders/${id}`, { method: 'DELETE' })
};

// Spaces API
export const spacesAPI = {
  getAll: () => apiCall('/spaces'),
  getById: (id) => apiCall(`/spaces/${id}`),
  create: (data) => fetch(`${API_BASE_URL}/spaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  update: (id, data) => fetch(`${API_BASE_URL}/spaces/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  delete: (id) => fetch(`${API_BASE_URL}/spaces/${id}`, { method: 'DELETE' })
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

// Services API
export const servicesAPI = {
  getAll: () => apiCall('/services'),
  getById: (id) => apiCall(`/services/${id}`),
  create: (data) => fetch(`${API_BASE_URL}/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  update: (id, data) => fetch(`${API_BASE_URL}/services/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  delete: (id) => fetch(`${API_BASE_URL}/services/${id}`, { method: 'DELETE' })
}; 