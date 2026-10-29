/**
 * ============================================================================
 * Machine Learning Inference Service (Client & Clinical Fallback Gateway)
 * ============================================================================
 * 
 * Responsibilities:
 * - Formats clinical data strictly to the ML model contract (10 core fields).
 * - Enforces data typing: °F conversion, numeric floats, null-preservation for uncollected vitals.
 * - HTTP communication with the Python ML inference microservice (`/predict`).
 * - High-availability resilience: Automatically switches to the rule-based Clinical
 *   ESI heuristic engine if the Python service is offline, unresponsive, or returning 5xx.
 * - Normalizes various model response formats (probabilities, confidence scores, acuity levels).
 */

const env = require('../config/env');
const logger = require('../utils/logger');
const { MLServiceUnavailableError } = require('../middleware/errorMiddleware');
const { isValidAcuity, normalizeAcuity, getAcuityColor } = require('../utils/acuityUtils');
const { evaluateClinicalRules } = require('../utils/clinicalRuleEngine');

/** Valid arrival transport modes accepted by both Python ML and DB schemas */
const VALID_TRANSPORTS = ['AMBULANCE', 'WALK IN', 'HELICOPTER', 'OTHER', 'UNKNOWN'];

/**
 * Normalizes an input value to a floating point or integer number, or strictly null.
 * Crucial for ML inference: missing vital signs must NOT be converted to 0 (which would be fatal/inaccurate).
 * 
 * @param {any} value - Raw input value from request.
 * @returns {number|null} Clean numeric float or null if empty/invalid.
 */
function parseNullableFloat(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

/**
 * Converts clinical temperature from Celsius (°C) to Fahrenheit (°F) with 1 decimal precision.
 * 
 * Clinical datasets (e.g., MIMIC-IV-ED) use Fahrenheit for vital sign regression/classification.
 * - If unit is already 'F' or value > 60 (implied °F), it preserves value.
 * - Otherwise converts via (C * 9/5) + 32.
 * 
 * @param {number|string|null} temp - Temperature value.
 * @param {string} [unit='C'] - Source unit ('C' or 'F').
 * @returns {number|null} Formatted Fahrenheit temperature or null.
 */
function formatTemperatureFahrenheit(temp, unit = 'C') {
  if (temp === null || temp === undefined || temp === '') return null;
  const num = Number(temp);
  if (isNaN(num)) return null;
  const u = String(unit).trim().toUpperCase();
  if (u === 'F' || num > 60) {
    return Math.round(num * 10) / 10;
  }
  const fahrenheit = (num * 9 / 5) + 32;
  return Math.round(fahrenheit * 10) / 10;
}

/**
 * Normalizes gender input to single uppercase character ('M' or 'F').
 * 
 * @param {string} gender - Input string ('Male', 'Female', 'M', 'F').
 * @returns {string} Strictly 'M' or 'F'.
 */
function normalizeGender(gender) {
  if (!gender) return 'M';
  const str = String(gender).trim().toUpperCase();
  if (str.startsWith('F')) return 'F';
  return 'M';
}

/**
 * Normalizes arrival transport to allowed enum values accepted by the ML model.
 * 
 * @param {string} transport - Mode of arrival ('AMBULANCE', 'WALK-IN', etc.).
 * @returns {string} Normalized transport string.
 */
function normalizeArrivalTransport(transport) {
  if (!transport) return 'UNKNOWN';
  const str = String(transport).trim().toUpperCase().replace('-', ' ');
  if (VALID_TRANSPORTS.includes(str)) return str;
  return 'UNKNOWN';
}

/**
 * Normalizes arrival time to ISO 8601 string, defaulting to current time if absent.
 * 
 * @param {string|Date|null} arrivalTime - Input arrival timestamp.
 * @returns {string} ISO 8601 formatted date string.
 */
function normalizeArrivalTime(arrivalTime) {
  if (!arrivalTime) return new Date().toISOString();
  const d = new Date(arrivalTime);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/**
 * Constructs the exact 10 documented fields expected by the Python ML model contract:
 * - temperature: Float (°F) or null
 * - heartrate: Float (BPM) or null
 * - resprate: Float (breaths/min) or null
 * - o2sat: Float (%) or null
 * - sbp: Float (mmHg) or null
 * - dbp: Float (mmHg) or null
 * - pain: Float (0-10) or null
 * - gender: 'M' or 'F'
 * - arrival_transport: 'AMBULANCE' | 'WALK IN' | 'OTHER' | 'UNKNOWN'
 * - arrival_time: ISO-8601 string
 * 
 * @param {Object} features - Raw clinical input from triage form.
 * @returns {Object} Strict contract-compliant JSON payload.
 */
function formatMLPayload(features) {
  const f = features || {};
  return {
    temperature: formatTemperatureFahrenheit(f.temperature, f.temperature_unit),
    heartrate: parseNullableFloat(f.heartrate ?? f.heart_rate),
    resprate: parseNullableFloat(f.resprate ?? f.respiratory_rate),
    o2sat: parseNullableFloat(f.o2sat ?? f.spo2),
    sbp: parseNullableFloat(f.sbp ?? f.systolic_bp),
    dbp: parseNullableFloat(f.dbp ?? f.diastolic_bp),
    pain: parseNullableFloat(f.pain ?? f.pain_score),
    gender: normalizeGender(f.gender),
    arrival_transport: normalizeArrivalTransport(f.arrival_transport),
    arrival_time: normalizeArrivalTime(f.arrival_time)
  };
}

/** The 6 foundational physiological parameters evaluated during triage */
const CORE_VITAL_KEYS = ['temperature', 'heartrate', 'resprate', 'o2sat', 'sbp', 'dbp'];

/** Mapping from ESI text labels to standard 1-5 integer indices */
const ACUITY_TO_NUMBER = {
  'Immediate': 1,
  'Emergent': 2,
  'Urgent': 3,
  'Less Urgent': 4,
  'Non-urgent': 5
};

/**
 * Computes diagnostic flags when operating under fallback conditions:
 * Identifies unrecorded vitals and recommends manual reassessment if fewer than 3 core vitals exist.
 * 
 * @param {Object} mlPayload - Formatted clinical payload.
 * @returns {Object} Diagnostic summary.
 */
function computeFallbackDiagnostics(mlPayload) {
  const missing = CORE_VITAL_KEYS.filter(k => mlPayload[k] === null || mlPayload[k] === undefined);
  if (mlPayload.pain === null || mlPayload.pain === undefined) {
    missing.push('pain');
  }
  const availableCoreCount = CORE_VITAL_KEYS.length - CORE_VITAL_KEYS.filter(k => mlPayload[k] === null || mlPayload[k] === undefined).length;
  return {
    missing_fields: missing,
    ignored_out_of_range: [],
    manual_assessment_recommended: availableCoreCount < 3
  };
}

/**
 * Builds a structured fallback response using the deterministic clinical rule engine.
 * 
 * @param {Object} clinicalFeatures - Original clinical input with supplemental context.
 * @param {Object} mlPayload - Formatted vital signs.
 * @returns {Object} Full prediction result structure matching the ML service interface.
 */
function buildFallbackResponse(clinicalFeatures, mlPayload) {
  const fallbackResult = evaluateClinicalRules(clinicalFeatures);
  const normalizedAcuity = normalizeAcuity(fallbackResult.predicted_acuity);
  const acuityColor = getAcuityColor(normalizedAcuity);
  const acuityNum = ACUITY_TO_NUMBER[normalizedAcuity] || 3;
  const diagnostics = computeFallbackDiagnostics(mlPayload);

  return {
    ...fallbackResult,
    acuity: acuityNum,
    predicted_acuity: normalizedAcuity,
    acuity_color: acuityColor,
    triage_label: acuityColor,
    probabilities: null,
    ...diagnostics
  };
}

/**
 * Dispatches clinical vitals to the Python ML Inference service with automatic offline fallback.
 * 
 * Resilience Mechanism:
 * - Communicates with `http://127.0.0.1:8000/predict` using strict timeout (e.g., 5000ms).
 * - If the Python service is offline, cold-starting, or encounters an internal exception,
 *   the call seamlessly switches to the internal Clinical ESI Rule Engine.
 * - This ensures triage and queue admissions NEVER fail, maintaining continuous ED operations.
 * 
 * @param {Object} clinicalFeatures - Vital signs and patient attributes.
 * @throws {MLServiceUnavailableError} Only if fallback is disabled in env configuration.
 * @returns {Promise<Object>} Formatted prediction result including predicted_acuity, color, confidence_score, and model_used.
 */
async function predictAcuity(clinicalFeatures) {
  const url = `${env.ML_SERVICE_URL}/predict`;
  const mlPayload = formatMLPayload(clinicalFeatures);

  logger.info('Dispatching inference request to ML service', {
    meta: {
      url,
      payload: mlPayload
    }
  });

  let response;
  try {
    // 1. Send HTTP POST with configurable timeout
    const signal = AbortSignal.timeout(env.ML_SERVICE_TIMEOUT_MS);
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(mlPayload),
      signal
    });
  } catch (err) {
    // 2. Network error or timeout: activate offline fallback engine
    logger.warn('ML inference service is unreachable or timed out. Activating Clinical ESI Offline Fallback Engine.', {
      meta: {
        url,
        error: err.message,
        code: err.code || err.name
      }
    });

    if (env.ENABLE_ML_OFFLINE_FALLBACK !== false) {
      return buildFallbackResponse(clinicalFeatures, mlPayload);
    }

    throw new MLServiceUnavailableError(
      `ML Inference Service is unreachable or timed out: ${err.message}`
    );
  }

  // 3. Handle non-200 HTTP responses
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'No response body');
    logger.warn(`ML service returned error HTTP ${response.status}. Activating Clinical ESI Offline Fallback.`, {
      meta: { status: response.status, body: errorText }
    });

    if (env.ENABLE_ML_OFFLINE_FALLBACK !== false) {
      return buildFallbackResponse(clinicalFeatures, mlPayload);
    }

    throw new MLServiceUnavailableError(
      `ML Inference Service failed with status ${response.status}: ${errorText}`
    );
  }

  // 4. Parse JSON response body
  let data;
  try {
    data = await response.json();
  } catch (err) {
    logger.warn('Failed to parse ML JSON response. Activating Clinical ESI Offline Fallback.', {
      meta: { error: err.message }
    });

    if (env.ENABLE_ML_OFFLINE_FALLBACK !== false) {
      return buildFallbackResponse(clinicalFeatures, mlPayload);
    }

    throw new MLServiceUnavailableError('ML Inference Service returned invalid JSON response');
  }

  // 5. Unpack various possible model response schemas
  let rawAcuity = null;
  let rawConfidence = undefined;
  let modelUsed = null;
  let probabilities = null;
  let manualAssessmentRecommended = undefined;
  let missingFields = undefined;
  let ignoredOutOfRange = undefined;
  let triageLabel = undefined;

  if (typeof data === 'number' || typeof data === 'string') {
    rawAcuity = data;
  } else if (Array.isArray(data)) {
    rawAcuity = data[0];
  } else if (data && typeof data === 'object') {
    rawAcuity = data.predicted_acuity ?? data.prediction ?? data.acuity ?? data.level;
    rawConfidence = data.confidence_score ?? data.confidence;
    modelUsed = data.model_used ?? data.model;
    probabilities = data.probabilities || null;
    manualAssessmentRecommended = data.manual_assessment_recommended;
    missingFields = data.missing_fields;
    ignoredOutOfRange = data.ignored_out_of_range;
    triageLabel = data.triage_label;
  }

  // 6. Validate that returned acuity is a legitimate clinical ESI category
  if (!rawAcuity || !isValidAcuity(rawAcuity)) {
    logger.warn('ML service returned invalid acuity label. Activating Clinical ESI Offline Fallback.', {
      meta: { data }
    });

    if (env.ENABLE_ML_OFFLINE_FALLBACK !== false) {
      return buildFallbackResponse(clinicalFeatures, mlPayload);
    }

    throw new MLServiceUnavailableError(
      `ML service returned invalid acuity '${rawAcuity}'. Expected integer 1-5 or standard ESI acuity.`
    );
  }

  const normalizedAcuity = normalizeAcuity(rawAcuity);
  const acuityColor = triageLabel || getAcuityColor(normalizedAcuity);
  const acuityNum = ACUITY_TO_NUMBER[normalizedAcuity] || Number(rawAcuity) || 3;

  // 7. Derive confidence score from explicit metric or predicted class probability
  let confidence = 0.85;
  if (rawConfidence !== undefined && rawConfidence !== null) {
    const parsedConf = Number(rawConfidence);
    if (!isNaN(parsedConf)) {
      confidence = parsedConf > 1 && parsedConf <= 100 ? parsedConf / 100 : parsedConf;
    }
  } else if (probabilities && typeof probabilities === 'object' && probabilities[String(acuityNum)] !== undefined) {
    const probVal = Number(probabilities[String(acuityNum)]);
    if (!isNaN(probVal)) {
      confidence = probVal;
    }
  }

  const fallbackDiag = computeFallbackDiagnostics(mlPayload);

  // 8. Package final normalized result
  const result = {
    acuity: acuityNum,
    predicted_acuity: normalizedAcuity,
    acuity_color: getAcuityColor(normalizedAcuity),
    triage_label: acuityColor,
    probabilities,
    manual_assessment_recommended: manualAssessmentRecommended !== undefined
      ? Boolean(manualAssessmentRecommended)
      : fallbackDiag.manual_assessment_recommended,
    missing_fields: Array.isArray(missingFields) ? missingFields : fallbackDiag.missing_fields,
    ignored_out_of_range: Array.isArray(ignoredOutOfRange) ? ignoredOutOfRange : fallbackDiag.ignored_out_of_range,
    confidence_score: confidence,
    model_used: (modelUsed && typeof modelUsed === 'string' && modelUsed.trim()) 
      ? modelUsed.trim() 
      : 'XGBoost (Online ML)',
    is_offline_fallback: false
  };

  logger.info('Received validated prediction from ML service', { meta: { result } });

  return result;
}

module.exports = {
  predictAcuity,
  formatMLPayload
};
