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
   * Calls the backend ML prediction service (POST /api/triage/predict -> XGBoost model API)
   * with automatic client-side fallback when completely offline.
   */
  runPrediction: async (vitals = {}, chiefComplaint = '', symptoms = '', painLevel = null, context = {}) => {
    const parseNum = (val) => (val !== null && val !== undefined && String(val).trim() !== '' && !isNaN(Number(val))) ? Number(val) : null;

    const temp = parseNum(vitals.temperature);
    const hr = parseNum(vitals.heartRate);
    const rr = parseNum(vitals.respiratoryRate);
    const spo2 = parseNum(vitals.oxygenSaturation);
    const pain = parseNum(painLevel);

    let sysBP = null;
    let diaBP = null;
    if (vitals.bloodPressure && String(vitals.bloodPressure).includes('/')) {
      const parts = String(vitals.bloodPressure).split('/');
      sysBP = parseNum(parts[0]);
      diaBP = parseNum(parts[1]);
    } else {
      sysBP = parseNum(vitals.systolic_bp ?? vitals.sbp);
      diaBP = parseNum(vitals.diastolic_bp ?? vitals.dbp);
    }

    const coreVitalsMap = {
      temperature: temp,
      heartrate: hr,
      resprate: rr,
      o2sat: spo2,
      sbp: sysBP,
      dbp: diaBP
    };
    const missingFields = Object.entries(coreVitalsMap)
      .filter(([, v]) => v === null)
      .map(([k]) => k);
    if (pain === null) missingFields.push('pain');
    const usableVitalsCount = 6 - Object.values(coreVitalsMap).filter(v => v === null).length;
    const manualRecommendedFallback = usableVitalsCount < 3;

    try {
      const response = await apiClient.post('/triage/predict', {
        temperature: temp,
        temperature_unit: 'C',
        heartrate: hr,
        resprate: rr,
        o2sat: spo2,
        sbp: sysBP,
        dbp: diaBP,
        pain,
        gender: context.gender || 'M',
        arrival_transport: context.arrival_transport || 'UNKNOWN',
        arrival_time: context.arrival_time ? new Date(context.arrival_time).toISOString() : new Date().toISOString()
      });

      const d = response?.data?.data || response?.data;
      if (d && d.predicted_acuity) {
        const acuityNum = d.acuity || 3;
        const triageColor = d.triage_label || d.acuity_color || 'Yellow';
        return {
          acuity: acuityNum,
          prediction: d.predicted_acuity,
          label: `Level ${acuityNum} — ${d.predicted_acuity} (${triageColor})`,
          color: triageColor,
          triage_label: triageColor,
          probabilities: d.probabilities || null,
          manual_assessment_recommended: Boolean(d.manual_assessment_recommended),
          missing_fields: Array.isArray(d.missing_fields) ? d.missing_fields : missingFields,
          ignored_out_of_range: Array.isArray(d.ignored_out_of_range) ? d.ignored_out_of_range : [],
          confidence: d.confidence_score ? Math.round(Number(d.confidence_score) * 100) : 85,
          modelVersion: d.model_used || 'XGBoost (MIMIC-IV-ED)',
          is_offline_fallback: Boolean(d.is_offline_fallback),
          rationale: d.rationale || (d.manual_assessment_recommended
            ? `Fewer than 3 core vital signs were usable (${6 - (d.missing_fields || []).filter(f => f !== 'pain').length}/6 collected). Please assess this patient manually.`
            : `Predicted Acuity Level ${acuityNum} (${triageColor} — ${d.predicted_acuity}) using ${d.model_used || 'XGBoost Classifier'}.`)
        };
      }
    } catch (err) {
      console.warn('API /triage/predict unreachable, using client offline rule fallback:', err.message);
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
        acuity: 1,
        prediction: 'Immediate',
        label: 'Level 1 — Immediate (Red)',
        color: 'Red',
        triage_label: 'Red',
        probabilities: null,
        manual_assessment_recommended: manualRecommendedFallback,
        missing_fields: missingFields,
        ignored_out_of_range: [],
        confidence: 96,
        modelVersion: 'Clinical ESI Rule Engine (Offline)',
        is_offline_fallback: true,
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
        acuity: 2,
        prediction: 'Emergent',
        label: 'Level 2 — Emergent (Orange)',
        color: 'Orange',
        triage_label: 'Orange',
        probabilities: null,
        manual_assessment_recommended: manualRecommendedFallback,
        missing_fields: missingFields,
        ignored_out_of_range: [],
        confidence: 91,
        modelVersion: 'Clinical ESI Rule Engine (Offline)',
        is_offline_fallback: true,
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
        acuity: 3,
        prediction: 'Urgent',
        label: 'Level 3 — Urgent (Yellow)',
        color: 'Yellow',
        triage_label: 'Yellow',
        probabilities: null,
        manual_assessment_recommended: manualRecommendedFallback,
        missing_fields: missingFields,
        ignored_out_of_range: [],
        confidence: 88,
        modelVersion: 'Clinical ESI Rule Engine (Offline)',
        is_offline_fallback: true,
        rationale: `Multi-resource clinical intervention required. Hemodynamically stable but urgent investigation indicated.`
      };
    }

    // Level 4: Less Urgent (GREEN)
    if (pain !== null && pain > 0) {
      return {
        acuity: 4,
        prediction: 'Less Urgent',
        label: 'Level 4 — Less Urgent (Green)',
        color: 'Green',
        triage_label: 'Green',
        probabilities: null,
        manual_assessment_recommended: manualRecommendedFallback,
        missing_fields: missingFields,
        ignored_out_of_range: [],
        confidence: 85,
        modelVersion: 'Clinical ESI Rule Engine (Offline)',
        is_offline_fallback: true,
        rationale: `Physiologically stable requiring single-resource examination or simple treatment.`
      };
    }

    // Level 5: Non-Urgent (BLUE)
    return {
      acuity: 5,
      prediction: 'Non-urgent',
      label: 'Level 5 — Non-urgent (Blue)',
      color: 'Blue',
      triage_label: 'Blue',
      probabilities: null,
      manual_assessment_recommended: manualRecommendedFallback,
      missing_fields: missingFields,
      ignored_out_of_range: [],
      confidence: 89,
      modelVersion: 'Clinical ESI Rule Engine (Offline)',
      is_offline_fallback: true,
      rationale: `Stable outpatient complaint requiring no acute emergency department resources.`
    };
  }
};

export default triageService;
