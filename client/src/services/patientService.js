import { apiClient } from './apiClient';

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 30;
  const dob = new Date(dateOfBirth);
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export function normalizePatient(patient) {
  if (!patient) return null;
  const id = patient.patient_id || patient.id;
  const name = patient.full_name || 
    (patient.first_name ? `${patient.first_name} ${patient.last_name || ''}`.trim() : patient.name || 'Unknown Patient');
  
  const age = patient.age !== undefined 
    ? patient.age 
    : (patient.date_of_birth ? calculateAge(patient.date_of_birth) : 30);

  const rawId = String(id || '');
  const hospitalId = patient.hospitalId || 
    (rawId.length >= 8 ? `HOSP-${rawId.slice(0, 8).toUpperCase()}` : `HOSP-2026-${rawId}`);

  return {
    ...patient,
    id,
    patient_id: id,
    name,
    full_name: name,
    hospitalId,
    age,
    gender: patient.gender || 'Unknown',
    phone: patient.phone_number || patient.phone || '+234 800 000 0000',
    phone_number: patient.phone_number || patient.phone || '+234 800 000 0000',
    bloodGroup: patient.bloodGroup || 'O+',
    genotype: patient.genotype || 'AA',
    existingConditions: patient.existingConditions || ['None recorded'],
    allergies: patient.allergies || ['None known'],
    currentMedications: patient.currentMedications || ['None'],
    lastVisit: patient.registered_at ? new Date(patient.registered_at).toISOString().split('T')[0] : (patient.lastVisit || new Date().toISOString().split('T')[0])
  };
}

export const patientService = {
  getPatients: async (params = {}) => {
    try {
      const search = params.search || '';
      const limit = params.limit || 100;
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      query.append('limit', String(limit));

      const response = await apiClient.get(`/patients?${query.toString()}`);
      if (response && response.data && Array.isArray(response.data)) {
        return response.data.map(normalizePatient);
      }
    } catch (err) {
      console.warn('API getPatients failed, falling back to cache:', err.message);
    }
    const cached = localStorage.getItem('hospital_patients');
    return cached ? JSON.parse(cached).map(normalizePatient) : [];
  },

  getPatientById: async (id) => {
    try {
      const response = await apiClient.get(`/patients/${id}`);
      if (response && response.data) {
        return normalizePatient(response.data);
      }
    } catch (err) {
      console.warn(`API getPatientById(${id}) failed:`, err.message);
    }
    const cached = localStorage.getItem('hospital_patients');
    if (cached) {
      const list = JSON.parse(cached);
      const found = list.find(p => (p.id === id || p.patient_id === id));
      if (found) return normalizePatient(found);
    }
    return null;
  },

  searchPatients: async (query) => {
    if (!query) return patientService.getPatients();
    return patientService.getPatients({ search: query });
  },

  registerPatient: async (patientData) => {
    const rawName = (patientData.name || '').trim();
    const parts = rawName.split(' ');
    const first_name = patientData.first_name || parts[0] || 'Unknown';
    const last_name = patientData.last_name || parts.slice(1).join(' ') || 'Patient';

    let date_of_birth = patientData.date_of_birth;
    if (!date_of_birth && patientData.age) {
      const birthYear = new Date().getFullYear() - (parseInt(patientData.age, 10) || 30);
      date_of_birth = `${birthYear}-01-01`;
    } else if (!date_of_birth) {
      date_of_birth = '1995-01-01';
    }

    const payload = {
      first_name,
      last_name,
      date_of_birth,
      gender: patientData.gender || 'Unknown',
      phone_number: patientData.phone || patientData.phone_number || '+234 800 000 0000'
    };

    try {
      const response = await apiClient.post('/patients', payload);
      if (response && response.data) {
        const created = normalizePatient(response.data);
        return {
          ...created,
          bloodGroup: patientData.bloodGroup || 'O+',
          genotype: patientData.genotype || 'AA',
          existingConditions: patientData.existingConditions || ['None recorded'],
          allergies: patientData.allergies || ['None known'],
          currentMedications: patientData.currentMedications || ['None']
        };
      }
    } catch (err) {
      console.warn('API registerPatient failed, creating local offline patient record:', err.message);
    }

    // Offline fallback patient registration
    const fallbackId = `pat-${String(Date.now()).slice(-4)}`;
    return normalizePatient({
      id: fallbackId,
      patient_id: fallbackId,
      first_name,
      last_name,
      full_name: `${first_name} ${last_name}`,
      name: `${first_name} ${last_name}`,
      age: patientData.age || 30,
      gender: patientData.gender || 'Unknown',
      phone_number: payload.phone_number,
      bloodGroup: patientData.bloodGroup || 'O+',
      genotype: patientData.genotype || 'AA',
      existingConditions: patientData.existingConditions || ['None recorded'],
      allergies: patientData.allergies || ['None known'],
      currentMedications: patientData.currentMedications || ['None'],
      registered_at: new Date().toISOString()
    });
  }
};

export default patientService;
