const env = require('../config/env');
const logger = require('../utils/logger');
const { MLServiceUnavailableError } = require('../middleware/errorMiddleware');
const { isValidAcuity, normalizeAcuity, getAcuityColor } = require('../utils/acuityUtils');
const { evaluateClinicalRules } = require('../utils/clinicalRuleEngine');

const VALID_TRANSPORTS = ['AMBULANCE', 'WALK IN', 'HELICOPTER', 'OTHER', 'UNKNOWN'];

/**
 * Normalizes input value to float/int number, or strictly null.
 */
function parseNullableFloat(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

/**
 * Converts temperature to Fahrenheit (°F) with 1 decimal precision, or null.
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
 * Normalizes gender to strictly 'M' or 'F'.
 */
function normalizeGender(gender) {
  if (!gender) return 'M';
  const str = String(gender).trim().toUpperCase();
  if (str.startsWith('F')) return 'F';
  return 'M';
}

/**
 * Normalizes arrival transport to allowed enum.
 */
function normalizeArrivalTransport(transport) {
  if (!transport) return 'UNKNOWN';
  const str = String(transport).trim().toUpperCase().replace('-', ' ');
  if (VALID_TRANSPORTS.includes(str)) return str;
  return 'UNKNOWN';
}

/**
 * Normalizes arrival time to ISO 8601 string.
 */
function normalizeArrivalTime(arrivalTime) {
  if (!arrivalTime) return new Date().toISOString();
  const d = new Date(arrivalTime);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/**
 * Constructs the exact 10 documented fields expected by the ML model contract.
 * Uncollected fields are strictly preserved as null (never omitted, never 0, never NaN).
 * 
 * @param {Object} features Raw clinical features
 * @returns {Object} Contract-compliant ML payload
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

const CORE_VITAL_KEYS = ['temperature', 'heartrate', 'resprate', 'o2sat', 'sbp', 'dbp'];
const ACUITY_TO_NUMBER = {
  'Immediate': 1,
  'Emergent': 2,
  'Urgent': 3,
  'Less Urgent': 4,
  'Non-urgent': 5
};

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
 * Communicates with the ML Inference Service with automatic offline fallback.
 * 
 * If the ML service is unreachable, offline, or returns an error, the system
 * automatically falls back to the deterministic Clinical ESI Rule Engine so
 * that critical patient triage and queueing are NEVER interrupted.
 * 
 * @param {Object} clinicalFeatures
 * @returns {Promise<Object>} { acuity, predicted_acuity, acuity_color, triage_label, probabilities, manual_assessment_recommended, missing_fields, ignored_out_of_range, confidence_score, model_used, is_offline_fallback }
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

  // Parse response: supports { acuity: 1..5, triage_label, probabilities, manual_assessment_recommended, ... }, raw integer (1..5), { prediction: 1..5 }, { predicted_acuity: 1..5 }, [1..5]
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

  // Derive confidence from explicit confidence_score or the predicted class probability
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
