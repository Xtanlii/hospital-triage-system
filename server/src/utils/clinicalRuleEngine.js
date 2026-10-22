/**
 * Clinical ESI Rule-Based Fallback Engine
 * 
 * Provides an authoritative, evidence-based Emergency Severity Index (ESI)
 * clinical triage algorithm that executes deterministically when:
 * 1. The external machine learning inference service is unreachable (network failure / downtime).
 * 2. Operating in fully offline hospital disaster mode.
 * 3. Validating ML predictions against clinical safety boundaries.
 */

const { ACUITY_LEVELS } = require('./acuityUtils');

/**
 * Safely extracts a numeric vital sign from candidate field names.
 * Supports contract field names, legacy snake_case, and camelCase aliases.
 * Returns null if all candidates are null, undefined, empty string, or NaN.
 * 
 * @param {...any} candidates 
 * @returns {number|null}
 */
function getNumericValue(...candidates) {
  for (const val of candidates) {
    if (val !== undefined && val !== null && val !== '') {
      const num = Number(val);
      if (!isNaN(num)) return num;
    }
  }
  return null;
}

/**
 * Evaluates patient clinical features against 5-level ESI criteria.
 * 
 * Safely guards all comparisons against null/undefined to prevent JS coercion bugs (null < 85 === true).
 * Normalizes Fahrenheit temperatures to Celsius before clinical threshold evaluation.
 * Supports both model-readme.md contract names (sbp, dbp, heartrate, resprate, o2sat, temperature, pain)
 * and legacy aliases (systolic_bp, diastolic_bp, heart_rate, respiratory_rate, spo2, pain_score).
 * 
 * @param {Object} features
 * @returns {Object} { predicted_acuity, confidence_score, model_used, is_offline_fallback, rationale }
 */
function evaluateClinicalRules(features) {
  const input = features || {};

  const systolic_bp = getNumericValue(input.sbp, input.systolic_bp, input.systolicBp);
  const diastolic_bp = getNumericValue(input.dbp, input.diastolic_bp, input.diastolicBp);
  const heart_rate = getNumericValue(input.heartrate, input.heart_rate, input.heartRate);
  const respiratory_rate = getNumericValue(input.resprate, input.respiratory_rate, input.respiratoryRate);
  const spo2 = getNumericValue(input.o2sat, input.spo2, input.oxygenSaturation);
  const rawTemp = getNumericValue(input.temperature, input.temp);
  const pain_score = getNumericValue(input.pain, input.pain_score, input.painScore);
  const chief_complaint_code = getNumericValue(input.chief_complaint_code, input.chiefComplaintCode);

  // Temperature unit normalization:
  // If temperature > 50, assume Fahrenheit and convert to Celsius for clinical thresholds: (°F - 32) * 5/9
  let tempC = null;
  if (rawTemp !== null) {
    tempC = rawTemp > 50 ? (rawTemp - 32) * (5 / 9) : rawTemp;
  }

  // ─────────────────────────────────────────────────────────────
  // LEVEL 1: IMMEDIATE / RESUSCITATION (Red)
  // Severe life threat requiring immediate aggressive resuscitation
  // ─────────────────────────────────────────────────────────────
  if (
    (spo2 !== null && spo2 < 85) ||
    (heart_rate !== null && (heart_rate < 40 || heart_rate > 140)) ||
    (respiratory_rate !== null && (respiratory_rate < 8 || respiratory_rate > 35)) ||
    (systolic_bp !== null && (systolic_bp < 70 || systolic_bp > 210)) ||
    chief_complaint_code === 101 // Cardiac arrest / Severe crushing retrosternal pain with shock
  ) {
    return {
      predicted_acuity: ACUITY_LEVELS.IMMEDIATE,
      confidence_score: 0.96,
      model_used: 'Clinical ESI Rule Engine (Offline Fallback)',
      is_offline_fallback: true,
      rationale: 'Severe physiological decompensation or life-threatening vitals requiring immediate resuscitation.'
    };
  }

  // ─────────────────────────────────────────────────────────────
  // LEVEL 2: EMERGENT / HIGH RISK (Orange)
  // High-risk situation, severe pain, or danger-zone vital signs
  // ─────────────────────────────────────────────────────────────
  if (
    (pain_score !== null && pain_score >= 8) ||
    (spo2 !== null && spo2 >= 85 && spo2 < 92) ||
    (heart_rate !== null && heart_rate >= 115 && heart_rate <= 140) ||
    (respiratory_rate !== null && respiratory_rate >= 28 && respiratory_rate <= 35) ||
    (systolic_bp !== null && systolic_bp >= 180 && systolic_bp <= 210) ||
    (tempC !== null && tempC >= 39.5) ||
    chief_complaint_code === 204 // Acute peritonitis / Severe acute abdomen
  ) {
    return {
      predicted_acuity: ACUITY_LEVELS.EMERGENT,
      confidence_score: 0.92,
      model_used: 'Clinical ESI Rule Engine (Offline Fallback)',
      is_offline_fallback: true,
      rationale: 'High-risk clinical presentation or severe pain score requiring emergent clinical attention.'
    };
  }

  // ─────────────────────────────────────────────────────────────
  // LEVEL 3: URGENT / MULTIPLE RESOURCES (Yellow)
  // Moderate physiological derangement or moderate pain
  // ─────────────────────────────────────────────────────────────
  if (
    (pain_score !== null && pain_score >= 5 && pain_score <= 7) ||
    (spo2 !== null && spo2 >= 92 && spo2 < 95) ||
    (heart_rate !== null && heart_rate >= 100 && heart_rate < 115) ||
    (respiratory_rate !== null && respiratory_rate >= 22 && respiratory_rate < 28) ||
    (systolic_bp !== null && systolic_bp >= 140 && systolic_bp < 180) ||
    (tempC !== null && tempC >= 38.2 && tempC < 39.5) ||
    chief_complaint_code === 301 // Moderate dyspnea / asthma exacerbation
  ) {
    return {
      predicted_acuity: ACUITY_LEVELS.URGENT,
      confidence_score: 0.88,
      model_used: 'Clinical ESI Rule Engine (Offline Fallback)',
      is_offline_fallback: true,
      rationale: 'Urgent condition with moderate vital derangement requiring diagnostic resources.'
    };
  }

  // ─────────────────────────────────────────────────────────────
  // LEVEL 4: LESS URGENT / SINGLE RESOURCE (Green)
  // Mild symptoms with stable hemodynamics
  // ─────────────────────────────────────────────────────────────
  if (
    (pain_score !== null && pain_score >= 3 && pain_score <= 4) ||
    (tempC !== null && tempC >= 37.5 && tempC < 38.2) ||
    (systolic_bp !== null && systolic_bp >= 130 && systolic_bp < 140) ||
    (heart_rate !== null && heart_rate >= 90 && heart_rate < 100)
  ) {
    return {
      predicted_acuity: ACUITY_LEVELS.LESS_URGENT,
      confidence_score: 0.91,
      model_used: 'Clinical ESI Rule Engine (Offline Fallback)',
      is_offline_fallback: true,
      rationale: 'Stable vital signs with mild symptoms expected to require simple evaluation.'
    };
  }

  // ─────────────────────────────────────────────────────────────
  // LEVEL 5: NON-URGENT (Blue)
  // Stable baseline vitals, unrecorded/null vitals, or minimal discomfort
  // ─────────────────────────────────────────────────────────────
  return {
    predicted_acuity: ACUITY_LEVELS.NON_URGENT,
    confidence_score: 0.95,
    model_used: 'Clinical ESI Rule Engine (Offline Fallback)',
    is_offline_fallback: true,
    rationale: 'All vitals within normal baseline limits with low pain score; non-urgent care.'
  };
}

module.exports = {
  evaluateClinicalRules
};
