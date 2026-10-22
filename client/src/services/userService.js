import { apiClient } from './apiClient';
import { normalizeUser } from './authService';

export const userService = {
  getUsers: async () => {
    try {
      const response = await apiClient.get('/users');
      if (response && response.data && Array.isArray(response.data)) {
        return response.data.map(normalizeUser);
      }
    } catch (err) {
      console.warn('API getUsers failed, falling back to cache:', err.message);
    }
    const cached = localStorage.getItem('hospital_users');
    return cached ? JSON.parse(cached).map(normalizeUser) : [];
  },

  getActiveDoctors: async () => {
    try {
      const response = await apiClient.get('/doctor/active');
      if (response?.data) {
        return response.data;
      }
    } catch (err) {
      console.warn('API getActiveDoctors failed:', err.message);
    }
    return null;
  },

  getUserById: async (id) => {
    try {
      const response = await apiClient.get(`/users/${id}`);
      if (response && response.data) {
        return normalizeUser(response.data);
      }
    } catch (err) {
      console.warn(`API getUserById(${id}) failed:`, err.message);
    }
    return null;
  },

  addUser: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      if (response?.data?.user) {
        return normalizeUser(response.data.user);
      }
    } catch (err) {
      console.warn('API addUser failed, generating local record:', err.message);
    }
    const newId = `usr-${String(Date.now()).slice(-4)}`;
    return normalizeUser({
      id: newId,
      status: 'Active',
      lastActive: 'Just now',
      ...userData
    });
  },

  updateUser: async (id, updatedFields) => {
    return { id, ...updatedFields };
  },

  toggleUserStatus: async (id, currentStatus) => {
    return {
      id,
      status: currentStatus === 'Active' ? 'Inactive' : 'Active'
    };
  }
};

export default userService;
