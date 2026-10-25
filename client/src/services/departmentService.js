import { apiClient } from './apiClient';

export const DEFAULT_DEPARTMENTS = [
  {
    id: 'dept-1',
    name: 'Emergency',
    code: 'ER',
    capacity: 35,
    currentQueueLength: 0,
    averageWaitTime: 8,
    status: 'Active',
    description: 'Immediate resuscitation, acute trauma care, and life-threatening medical stabilization.'
  },
  {
    id: 'dept-2',
    name: 'Emergency / Critical Care',
    code: 'ECC',
    capacity: 20,
    currentQueueLength: 0,
    averageWaitTime: 12,
    status: 'Active',
    description: 'High acuity resuscitation, continuous hemodynamic monitoring, and emergent intensive care.'
  },
  {
    id: 'dept-3',
    name: 'General Medical',
    code: 'MED',
    capacity: 50,
    currentQueueLength: 0,
    averageWaitTime: 19,
    status: 'Active',
    description: 'Inpatient and medical admissions, urgent multi-resource adult medical care and diagnostics.'
  },
  {
    id: 'dept-4',
    name: 'Outpatient',
    code: 'OPD',
    capacity: 60,
    currentQueueLength: 0,
    averageWaitTime: 24,
    status: 'Active',
    description: 'Non-urgent ambulatory care, primary reviews, minor wound treatment, and general consultations.'
  }
];

export const departmentService = {
  getDepartments: async () => {
    try {
      const response = await apiClient.get('/departments');
      if (response && response.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch (err) {
      console.warn('Failed to fetch departments from API, using fallback:', err.message);
    }
    return [...DEFAULT_DEPARTMENTS];
  },

  addDepartment: async (deptData) => {
    try {
      const response = await apiClient.post('/departments', deptData);
      if (response?.data) return response.data;
    } catch (err) {
      console.warn('API department creation failed, generating local fallback:', err.message);
    }
    const newId = `dept-${String(Date.now()).slice(-4)}`;
    return {
      id: newId,
      currentQueueLength: 0,
      averageWaitTime: 15,
      status: 'Active',
      ...deptData
    };
  },

  updateDepartment: async (id, updatedFields) => {
    try {
      const response = await apiClient.put(`/departments/${id}`, updatedFields);
      if (response?.data) return response.data;
    } catch (err) {
      console.warn('API department update failed:', err.message);
    }
    return { id, ...updatedFields };
  },

  deleteDepartment: async (id) => {
    try {
      await apiClient.delete(`/departments/${id}`);
    } catch (err) {
      console.warn('API department deletion failed:', err.message);
    }
    return { success: true, id };
  }
};

export default departmentService;
