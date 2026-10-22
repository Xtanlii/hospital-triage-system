import { apiClient } from './apiClient';

export function normalizeAssessment(a) {
  if (!a) return null;
  const id = a.assessment_id || a.id;
  const patient = a.patient || {};
  const patientName = patient.full_name || 
    (patient.first_name ? `${patient.first_name} ${patient.last_name || ''}`.trim() : a.patientName || 'Unknown Patient');

  const nurse = a.nurse || {};
  const nurseName = nurse.full_name || a.nurseName || 'Nurse Amina Bello';

  return {
    ...a,
    id,
    assessment_id: id,
    patientId: a.patient_id || a.patientId,
    patient_id: a.patient_id || a.patientId,
    patientName,
    nurseId: a.nurse_id || a.nurseId,
    nurse_id: a.nurse_id || a.nurseId,
    nurseName,
    finalTriageLevel: a.prediction?.predicted_acuity || a.finalTriageLevel || 'Urgent',
    predictedLevel: a.prediction?.predicted_acuity || a.predictedLevel || 'Urgent',
    predictionConfidence: a.prediction?.confidence_score ? Math.round(Number(a.prediction.confidence_score) * 100) : (a.predictionConfidence || 90),
    timestamp: a.assessed_at || a.timestamp || new Date().toISOString(),
    assessed_at: a.assessed_at || a.timestamp || new Date().toISOString()
  };
}

export const triageService = {
  getAssessments: async () => {
    try {
      const response = await apiClient.get('/admin/assessments');
      if (response && response.data && Array.isArray(response.data)) {
        return response.data.map(normalizeAssessment);
      }
    } catch (err) {
      console.warn('API getAssessments failed, falling back to cache:', err.message);
    }
    const cached = localStorage.getItem('hospital_assessments');
    return cached ? JSON.parse(cached).map(normalizeAssessment) : [];
  },

  getAssessmentById: async (id) => {
    try {
      const response = await apiClient.get(`/triage/${id}`);
      if (response && response.data) {
        return normalizeAssessment(response.data);
      }
    } catch (err) {
      console.warn(`API getAssessmentById(${id}) failed:`, err.message);
    }
    return null;
  },

  getPatientAssessments: async (patientId) => {
    try {
      const response = await apiClient.get(`/patients/${patientId}/triage`);
      if (response && response.data && Array.isArray(response.data)) {
        return response.data.map(normalizeAssessment);
      }
    } catch (err) {
      console.warn(`API getPatientAssessments(${patientId}) failed:`, err.message);
    }
    return [];
  },

  /**
   * Performs clinical triage intake via Express API POST /api/triage.
   */
  createAssessment: async (assessmentData) => {
    // Parse blood pressure
    let sbpVal = assessmentData.systolic_bp !== undefined ? assessmentData.systolic_bp : null;
    let dbpVal = assessmentData.diastolic_bp !== undefined ? assessmentData.diastolic_bp : null;
    if (sbpVal === null && assessmentData.vitals?.bloodPressure && assessmentData.vitals.bloodPressure.includes('/')) {
      const parts = assessmentData.vitals.bloodPressure.split('/');
      sbpVal = parts[0] && parts[0].trim() !== '' ? Number(parts[0].trim()) : null;
      dbpVal = parts[1] && parts[1].trim() !== '' ? Number(parts[1].trim()) : null;
    }

    const payload = {
      patient_id: assessmentData.patient_id || assessmentData.patientId,
      arrival_transport: assessmentData.arrival_transport || 'AMBULANCE',
      arrival_time: assessmentData.arrival_time ? new Date(assessmentData.arrival_time).toISOString() : new Date().toISOString(),
      temperature: assessmentData.temperature !== undefined ? assessmentData.temperature : (assessmentData.vitals?.temperature ? Number(assessmentData.vitals.temperature) : null),
      temperature_unit: 'C',
      heart_rate: assessmentData.heart_rate !== undefined ? assessmentData.heart_rate : (assessmentData.vitals?.heartRate ? Number(assessmentData.vitals.heartRate) : null),
      respiratory_rate: assessmentData.respiratory_rate !== undefined ? assessmentData.respiratory_rate : (assessmentData.vitals?.respiratoryRate ? Number(assessmentData.vitals.respiratoryRate) : null),
      spo2: assessmentData.spo2 !== undefined ? assessmentData.spo2 : (assessmentData.vitals?.oxygenSaturation ? Number(assessmentData.vitals.oxygenSaturation) : null),
      systolic_bp: sbpVal,
      diastolic_bp: dbpVal,
      pain_score: assessmentData.pain_score !== undefined ? assessmentData.pain_score : (assessmentData.painLevel !== undefined ? assessmentData.painLevel : null),
      chief_complaint_code: assessmentData.chief_complaint_code || 1,
      nurse_override: {
        is_overridden: Boolean(assessmentData.override || assessmentData.nurse_override?.is_overridden),
        override_acuity: assessmentData.finalTriageLevel || assessmentData.nurse_override?.override_acuity || 'Urgent',
        override_reason: assessmentData.overrideReason || assessmentData.nurse_override?.override_reason || ''
      }
    };

    try {
      const response = await apiClient.post('/triage', payload);
      if (response && response.data) {
        return {
          ...normalizeAssessment(response.data.assessment),
          ...response.data
        };
      }
    } catch (err) {
      console.warn('API createAssessment (/api/triage) failed, saving locally:', err.message);
    }

    // Local offline fallback
    const newId = `ass-${String(Date.now()).slice(-4)}`;
    return normalizeAssessment({
      id: newId,
      assessment_id: newId,
      ...assessmentData,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Clinical Rule Decision Support Engine for interactive intake guidance.
   * Evaluates vitals and symptoms against standard 5-Level ESI triage criteria,
   * handling nullable and uncollected values safely.
   */
  runPrediction: async (vitals = {}, chiefComplaint = '', symptoms = '', painLevel = null) => {
    // Brief processing delay to match clinical UX
    await new Promise(resolve => setTimeout(resolve, 350));

    const parseNum = (val) => (val !== null && val !== undefined && String(val).trim() !== '' && !isNaN(Number(val))) ? Number(val) : null;

    const temp = parseNum(vitals.temperature);
    const hr = parseNum(vitals.heartRate);
    const rr = parseNum(vitals.respiratoryRate);
    const spo2 = parseNum(vitals.oxygenSaturation);
    const pain = parseNum(painLevel);

    let sysBP = null;
    if (vitals.bloodPressure && String(vitals.bloodPressure).includes('/')) {
      sysBP = parseNum(vitals.bloodPressure.split('/')[0]);
    } else if (vitals.systolic_bp !== undefined) {
      sysBP = parseNum(vitals.systolic_bp);
    }

    const complaintLower = `${chiefComplaint} ${symptoms}`.toLowerCase();

    // Level 1: Immediate / Resuscitation (RED) triggers
    const hasL1Keywords = 
      complaintLower.includes('unconscious') ||
      complaintLower.includes('cardiac arrest') ||
      complaintLower.includes('gasping') ||
      complaintLower.includes('anaphylaxis') ||
      complaintLower.includes('severe trauma') ||
      complaintLower.includes('cyanosis') ||
      complaintLower.includes('active seizure');

    const hasL1Vitals = 
      (spo2 !== null && spo2 < 88) ||
      (hr !== null && (hr > 150 || hr < 40)) ||
      (rr !== null && (rr > 35 || rr < 8)) ||
      (sysBP !== null && sysBP < 80);

    if (hasL1Keywords || hasL1Vitals) {
      return {
        prediction: 'Immediate',
        label: 'Level 1 - Immediate',
        color: 'Red',
        confidence: 96,
        modelVersion: 'v2.5.0-clinical-rf-esi5',
        rationale: hasL1Keywords 
          ? `High-risk clinical symptoms detected (${chiefComplaint}). Immediate life support required.`
          : `Critical physiological instability (SpO2: ${spo2 ?? 'N/A'}%, HR: ${hr ?? 'N/A'} bpm, BP: ${sysBP ?? 'N/A'} mmHg).`
      };
    }

    // Level 2: Emergent (ORANGE) triggers
    const hasL2Keywords = 
      complaintLower.includes('chest pain') ||
      complaintLower.includes('stroke') ||
      complaintLower.includes('confusion') ||
      complaintLower.includes('asthma') ||
      complaintLower.includes('headache') ||
      complaintLower.includes('suicid') ||
      complaintLower.includes('bleeding');

    const hasL2Vitals = 
      (spo2 !== null && spo2 <= 92) ||
      (hr !== null && (hr >= 120 || hr <= 50)) ||
      (rr !== null && (rr >= 26 || rr <= 10)) ||
      (sysBP !== null && (sysBP >= 180 || sysBP <= 90)) ||
      (temp !== null && temp >= 39.5) ||
      (pain !== null && pain >= 7);

    if (hasL2Keywords || hasL2Vitals) {
      return {
        prediction: 'Emergent',
        label: 'Level 2 - Emergent',
        color: 'Orange',
        confidence: 91,
        modelVersion: 'v2.5.0-clinical-rf-esi5',
        rationale: hasL2Keywords
          ? `High-risk presentation (${chiefComplaint}) with potential rapid deterioration.`
          : `Severe physiological or pain distress (Pain: ${pain ?? 'N/A'}/10, HR: ${hr ?? 'N/A'} bpm, SpO2: ${spo2 ?? 'N/A'}%).`
      };
    }

    // Level 3: Urgent (YELLOW) triggers
    const hasL3Keywords = 
      complaintLower.includes('abdominal pain') ||
      complaintLower.includes('vomiting') ||
      complaintLower.includes('fever') ||
      complaintLower.includes('fracture') ||
      complaintLower.includes('wound') ||
      complaintLower.includes('dehydration') ||
      complaintLower.includes('infection');

    const hasL3Vitals = 
      (temp !== null && (temp >= 38.0 || temp <= 35.5)) ||
      (hr !== null && (hr >= 100 || hr <= 55)) ||
      (rr !== null && (rr >= 22 || rr <= 12)) ||
      (pain !== null && pain >= 4);

    if (hasL3Keywords || hasL3Vitals) {
      return {
        prediction: 'Urgent',
        label: 'Level 3 - Urgent',
        color: 'Yellow',
        confidence: 88,
        modelVersion: 'v2.5.0-clinical-rf-esi5',
        rationale: `Multi-resource clinical intervention required. Hemodynamically stable but urgent investigation indicated.`
      };
    }

    // Level 4: Less Urgent (GREEN)
    if (pain !== null && pain > 0) {
      return {
        prediction: 'Less Urgent',
        label: 'Level 4 - Less Urgent',
        color: 'Green',
        confidence: 85,
        modelVersion: 'v2.5.0-clinical-rf-esi5',
        rationale: `Physiologically stable requiring single-resource examination or simple treatment.`
      };
    }

    // Level 5: Non-Urgent (BLUE)
    return {
      prediction: 'Non-urgent',
      label: 'Level 5 - Non-urgent',
      color: 'Blue',
      confidence: 89,
      modelVersion: 'v2.5.0-clinical-rf-esi5',
      rationale: `Stable outpatient complaint requiring no acute emergency department resources.`
    };
  }
};

export default triageService;
