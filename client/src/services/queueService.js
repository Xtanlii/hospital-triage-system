import { apiClient } from './apiClient';

// 5-Level ESI Clinical Priority Weights (1 is most critical/immediate)
export const TRIAGE_WEIGHTS = {
  'LEVEL 1': 1,
  'RED': 1,
  'CRITICAL': 1,
  'RESUSCITATION': 1,
  'IMMEDIATE': 1,

  'LEVEL 2': 2,
  'ORANGE': 2,
  'EMERGENT': 2,
  'HIGH': 2,

  'LEVEL 3': 3,
  'YELLOW': 3,
  'AMBER': 3,
  'URGENT': 3,
  'MODERATE': 3,

  'LEVEL 4': 4,
  'GREEN': 4,
  'LESS URGENT': 4,

  'LEVEL 5': 5,
  'BLUE': 5,
  'NON-URGENT': 5,
  'LOW': 5
};

export function normalizeQueueEntry(e) {
  if (!e) return null;
  const id = e.queue_id || e.id;
  const patient = e.patient || {};
  const fullName = patient.first_name 
    ? `${patient.first_name} ${patient.last_name || ''}`.trim()
    : (e.patientName || patient.full_name || 'Patient');

  let age = e.patientAge;
  if (age === undefined && patient.date_of_birth) {
    const diffMs = Date.now() - new Date(patient.date_of_birth).getTime();
    age = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
  } else if (age === undefined) {
    age = 30;
  }

  const dept = e.department || e.departmentName || 'Emergency';
  const prefix = dept.includes('Crit') ? 'ECC' : dept.includes('Med') ? 'MED' : dept.includes('Out') ? 'OPD' : 'ER';
  const pos = e.queue_position !== undefined ? e.queue_position : 1;
  const qNum = e.queueNumber || `${prefix}-${String(pos).padStart(3, '0')}`;

  const queuedTime = e.queued_at || e.checkInTime || new Date().toISOString();
  const waitingMins = e.waitingMinutes !== undefined 
    ? e.waitingMinutes 
    : Math.max(0, Math.round((Date.now() - new Date(queuedTime).getTime()) / 60000));

  const acuity = e.acuity_level || e.triageLevel || 'Urgent';
  const color = e.prediction?.acuity_color || e.acuity_color || 
    (acuity === 'Immediate' ? 'Red' : acuity === 'Emergent' ? 'Orange' : acuity === 'Urgent' ? 'Yellow' : acuity === 'Less Urgent' ? 'Green' : 'Blue');

  return {
    ...e,
    id,
    queue_id: id,
    queueNumber: qNum,
    patientId: e.patient_id || e.patientId || patient.patient_id,
    patient_id: e.patient_id || e.patientId || patient.patient_id,
    patientName: fullName,
    patientAge: age,
    patientGender: patient.gender || e.patientGender || 'Unknown',
    departmentId: e.departmentId || dept,
    departmentName: dept,
    department: dept,
    triageLevel: acuity,
    acuity_level: acuity,
    acuity_color: color,
    status: e.status || 'Waiting',
    queue_position: pos,
    checkInTime: queuedTime,
    queued_at: queuedTime,
    waitingMinutes: waitingMins,
    assignedDoctor: e.assignedDoctor || (e.doctor ? e.doctor.full_name : 'Unassigned'),
    chiefComplaint: e.chiefComplaint || e.assessment?.chief_complaint || e.patient?.chief_complaint || 'Clinical consultation',
    patient,
    prediction: e.prediction
  };
}

export const queueService = {
  normalizeQueueEntry,
  sortQueue: (entries) => {
    return [...entries].sort((a, b) => {
      // Completed or Cancelled items at the bottom if in same list
      const aDone = a.status === 'Completed' || a.status === 'Cancelled';
      const bDone = b.status === 'Completed' || b.status === 'Cancelled';
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;

      // Primary: 5-Level Triage (Level 1 -> Level 2 -> Level 3 -> Level 4 -> Level 5)
      const weightA = TRIAGE_WEIGHTS[String(a.triageLevel || a.acuity_level).toUpperCase()] || 4;
      const weightB = TRIAGE_WEIGHTS[String(b.triageLevel || b.acuity_level).toUpperCase()] || 4;
      const weightDiff = weightA - weightB;
      if (weightDiff !== 0) return weightDiff;

      // Secondary: Longest waiting time first (queued earlier)
      return (b.waitingMinutes || 0) - (a.waitingMinutes || 0);
    });
  },

  getInitialQueue: () => {
    const cached = localStorage.getItem('hospital_queue');
    return cached ? JSON.parse(cached).map(normalizeQueueEntry) : [];
  },

  generateQueueNumber: (deptCode, existingEntries) => {
    const prefix = deptCode ? deptCode.toUpperCase() : 'Q';
    const deptMatches = existingEntries.filter(e => e.queueNumber && e.queueNumber.startsWith(prefix));
    const nextNum = deptMatches.length + 1;
    return `${prefix}-${String(nextNum).padStart(3, '0')}`;
  },

  getQueue: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      if (params.status) query.append('status', params.status);
      if (params.department) query.append('department', params.department);
      if (params.acuity_level) query.append('acuity_level', params.acuity_level);

      const qs = query.toString() ? `?${query.toString()}` : '';
      const response = await apiClient.get(`/queue${qs}`);
      if (response && response.data && Array.isArray(response.data)) {
        return queueService.sortQueue(response.data.map(normalizeQueueEntry));
      }
    } catch (err) {
      console.warn('API getQueue failed, falling back to cache:', err.message);
    }
    const cached = localStorage.getItem('hospital_queue');
    return cached ? queueService.sortQueue(JSON.parse(cached).map(normalizeQueueEntry)) : [];
  },

  getQueueEntry: async (id) => {
    try {
      const response = await apiClient.get(`/queue/${id}`);
      if (response && response.data) {
        return normalizeQueueEntry(response.data);
      }
    } catch (err) {
      console.warn(`API getQueueEntry(${id}) failed:`, err.message);
    }
    return null;
  },

  updateStatus: async (id, status) => {
    try {
      const response = await apiClient.patch(`/queue/${id}/status`, { status });
      if (response?.data) return normalizeQueueEntry(response.data);
    } catch (err) {
      console.warn(`API updateStatus(${id}, ${status}) failed:`, err.message);
    }
    return { id, status };
  },

  attendPatient: async (id) => {
    try {
      const response = await apiClient.patch(`/queue/${id}/attend`);
      if (response?.data) return normalizeQueueEntry(response.data);
    } catch (err) {
      console.warn(`API attendPatient(${id}) failed:`, err.message);
    }
    return { id, status: 'In Consultation' };
  },

  cancelPatient: async (id, reason = '') => {
    try {
      const response = await apiClient.patch(`/queue/${id}/cancel`, { reason });
      if (response?.data) return normalizeQueueEntry(response.data);
    } catch (err) {
      console.warn(`API cancelPatient(${id}) failed:`, err.message);
    }
    return { id, status: 'Cancelled' };
  },

  calculateStats: (queueEntries) => {
    const activeEntries = queueEntries.filter(e => e.status !== 'Completed' && e.status !== 'Cancelled');
    const waiting = activeEntries.filter(e => e.status === 'Waiting');

    const isL1 = (lvl) => ['LEVEL 1', 'RED', 'CRITICAL', 'RESUSCITATION', 'IMMEDIATE'].includes(String(lvl).toUpperCase());
    const isL2 = (lvl) => ['LEVEL 2', 'ORANGE', 'EMERGENT', 'HIGH'].includes(String(lvl).toUpperCase());
    const isL3 = (lvl) => ['LEVEL 3', 'YELLOW', 'AMBER', 'URGENT', 'MODERATE'].includes(String(lvl).toUpperCase());
    const isL4 = (lvl) => ['LEVEL 4', 'GREEN', 'LESS URGENT'].includes(String(lvl).toUpperCase());
    const isL5 = (lvl) => ['LEVEL 5', 'BLUE', 'NON-URGENT', 'LOW'].includes(String(lvl).toUpperCase());

    const level1 = activeEntries.filter(e => isL1(e.triageLevel));
    const level2 = activeEntries.filter(e => isL2(e.triageLevel));
    const level3 = activeEntries.filter(e => isL3(e.triageLevel));
    const level4 = activeEntries.filter(e => isL4(e.triageLevel));
    const level5 = activeEntries.filter(e => isL5(e.triageLevel));
    const completedToday = queueEntries.filter(e => e.status === 'Completed');

    const totalWait = activeEntries.reduce((acc, curr) => acc + (curr.waitingMinutes || 0), 0);
    const avgWait = activeEntries.length > 0 ? Math.round(totalWait / activeEntries.length) : 0;

    return {
      totalActive: activeEntries.length,
      waitingCount: waiting.length,
      awaitingTriageCount: 0,
      level1Count: level1.length,
      level2Count: level2.length,
      level3Count: level3.length,
      level4Count: level4.length,
      level5Count: level5.length,
      // Backward compatibility aliases
      redCount: level1.length,
      amberCount: level2.length + level3.length,
      greenCount: level4.length + level5.length,
      seenToday: completedToday.length,
      averageWaitTime: avgWait || 15
    };
  }
};

export default queueService;
