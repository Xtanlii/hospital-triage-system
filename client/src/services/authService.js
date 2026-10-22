import { apiClient } from './apiClient';

/**
 * Normalizes backend uppercase roles ('NURSE', 'DOCTOR', 'ADMIN')
 * to Title Case expected by frontend routing and UI components.
 */
export function normalizeRole(role) {
  if (!role) return null;
  const upper = String(role).trim().toUpperCase();
  if (upper === 'NURSE') return 'Nurse';
  if (upper === 'DOCTOR') return 'Doctor';
  if (upper === 'ADMIN') return 'Admin';
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

/**
 * Formats user entity from backend to match frontend property expectations.
 */
export function normalizeUser(user) {
  if (!user) return null;
  const role = normalizeRole(user.role);
  const username = user.username || '';
  const email = user.email || (username.includes('@') ? username : `${username}@hospital.ng`);
  const name = user.full_name || user.name || username || 'Hospital Staff';
  const dept = user.department || user.departmentName || 'Emergency';

  return {
    ...user,
    id: user.user_id || user.id,
    user_id: user.user_id || user.id,
    name,
    full_name: name,
    username,
    email,
    role,
    department: dept,
    departmentName: dept,
    departmentId: dept,
    isOnDuty: user.is_on_duty ?? user.isOnDuty ?? false,
    is_on_duty: user.is_on_duty ?? user.isOnDuty ?? false,
    status: user.is_on_duty ? 'Active' : 'Off Duty'
  };
}

export const authService = {
  /**
   * Real authenticated login via Express API POST /api/auth/login.
   */
  login: async (username, password) => {
    const response = await apiClient.post('/auth/login', {
      username: username ? String(username).trim() : '',
      password: password ? String(password) : ''
    });

    if (response?.data?.token) {
      apiClient.setToken(response.data.token);
    }

    const normalizedUser = normalizeUser(response?.data?.user);
    if (normalizedUser) {
      localStorage.setItem('hospital_current_user', JSON.stringify(normalizedUser));
    }

    return {
      success: true,
      user: normalizedUser,
      token: response?.data?.token
    };
  },

  /**
   * Fetches current authenticated user profile via GET /api/auth/me.
   */
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    const normalizedUser = normalizeUser(response?.data);
    if (normalizedUser) {
      localStorage.setItem('hospital_current_user', JSON.stringify(normalizedUser));
    }
    return normalizedUser;
  },

  /**
   * Registers a new user via POST /api/auth/register.
   */
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    if (response?.data?.token) {
      apiClient.setToken(response.data.token);
    }
    const normalizedUser = normalizeUser(response?.data?.user);
    return {
      success: true,
      user: normalizedUser,
      token: response?.data?.token
    };
  },

  /**
   * Logs out user and purges stored credentials.
   */
  logout: () => {
    apiClient.setToken(null);
    localStorage.removeItem('hospital_current_user');
    localStorage.removeItem('hospital_token');
    localStorage.removeItem('token');
  }
};

export default authService;
