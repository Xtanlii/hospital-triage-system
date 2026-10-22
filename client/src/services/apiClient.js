/**
 * Centralized API Client for ApexCare Hospital Management System
 * Automatically attaches JWT Authorization header and handles JSON serialization.
 */

const BASE_URL = '/api';

export function getToken() {
  return localStorage.getItem('hospital_token') || localStorage.getItem('token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('hospital_token', token);
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('hospital_token');
    localStorage.removeItem('token');
  }
}

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage = data?.message || 
      (data?.errors && Array.isArray(data.errors) ? data.errors.map(e => e.message || e.msg).join(', ') : null) || 
      `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const apiClient = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
  getToken,
  setToken
};

export default apiClient;
