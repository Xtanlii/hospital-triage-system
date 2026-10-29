/**
 * ============================================================================
 * Triage Service (Clinical Assessment, ML Inference & Queue Admission)
 * ============================================================================
 * 
 * Orchestrates the full triage workflow:
 * 1. Demographic & vital sign intake and normalization (including °C -> °F conversion).
 * 2. Contract validation for the ML microservice (strict null preservation).
 * 3. AI Acuity prediction via external Python inference service (with automatic rule engine fallback).
 * 4. Nurse override management for clinical discretion.
 * 5. Atomic persistence across TriageAssessment, AcuityPrediction, and QueueEntry.
 * 6. Automated priority queue re-ranking and cache invalidation.
 */

const prisma = require('../config/db');
const mlService = require('./mlService');
const { recalculateQueuePositions } = require('./queueService');
const { getDepartmentForAcuity, normalizeAcuity, getAcuityColor } = require('../utils/acuityUtils');
const { NotFoundError } = require('../middleware/errorMiddleware');
const cacheService = require('./cacheService');
const logger = require('../utils/logger');

/**
 * Calculates a patient's exact integer age from their date of birth.
 * 
 * @param {string|Date} dateOfBirth - Patient birth date.
 * @returns {number} Age in complete years.
 */
function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

/**
 * Parses a numerical value safely, preserving strict nulls for missing values.
 * In clinical ML, missing vitals must remain null (not 0 or NaN) so imputation works accurately.
 * 
 * @param {any} val - Input value.
 * @returns {number|null} Parsed numeric value or null.
 */
function parseNullableNumber(val) {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

/**
 * Converts clinical temperature to Fahrenheit (°F) with 1-decimal precision.
 * The machine learning model was trained on Fahrenheit clinical datasets (e.g. MIMIC-IV-ED).
 * 
 * @param {number|string|null} temp - Temperature value.
 * @param {string} [unit='C'] - Source unit ('C' or 'F').
 * @returns {number|null} Temperature in °F rounded to 1 decimal place, or null if unrecorded.
 */
function convertTemperatureToFahrenheit(temp, unit = 'C') {
  if (temp === null || temp === undefined || temp === '') return null;
  const num = Number(temp);
  if (isNaN(num)) return null;
  const u = String(unit).trim().toUpperCase();
  // If explicitly in Fahrenheit or already in typical Fahrenheit range (> 60)
  if (u === 'F' || num > 60) return Math.round(num * 10) / 10;
  // Convert Celsius to Fahrenheit
  return Math.round(((num * 9 / 5) + 32) * 10) / 10;
}

/**
 * Normalizes patient gender to single-character code ('M' or 'F').
 * 
 * @param {string} gender - Input gender string.
 * @returns {string} 'M' or 'F'.
 */
function normalizeGender(gender) {
  if (!gender) return 'M';
  const g = String(gender).trim().toUpperCase();
  if (g.startsWith('F')) return 'F';
  return 'M';
}

const VALID_TRANSPORTS = ['AMBULANCE', 'WALK IN', 'HELICOPTER', 'OTHER', 'UNKNOWN'];

/**
 * Validates and normalizes the arrival transport method to supported clinical categories.
 * 
 * @param {string} transport - Input transport mode.
 * @returns {string} Normalized transport string ('AMBULANCE', 'WALK IN', etc.).
 */
function normalizeTransport(transport) {
  if (!transport) return 'UNKNOWN';
  const t = String(transport).trim().toUpperCase().replace('-', ' ');
  return VALID_TRANSPORTS.includes(t) ? t : 'UNKNOWN';
}

/**
 * Executes the complete End-to-End Triage Pipeline:
 * 
 * Step 1: Validates that the patient exists in the electronic health record.
 * Step 2: Normalizes vital signs and computes patient age.
 * Step 3: Builds the 10-feature payload required by the Python ML Inference service.
 * Step 4: Dispatches features to ML service; falls back to internal clinical heuristics if ML service is unreachable.
 * Step 5: Evaluates Nurse Clinical Override (if nurse modified AI suggestion, nurse's decision takes precedence).
 * Step 6: Determines destination clinical department (e.g. Critical Care for Level 1/2, GOPD for Level 3/4).
 * Step 7: Executes atomic database transaction:
 *         - Inserts TriageAssessment audit record.
 *         - Inserts AcuityPrediction record with confidence score.
 *         - Inserts QueueEntry and immediately re-ranks active patient positions.
 * Step 8: Flushes queue and dashboard caches for immediate synchronization.
 * 
 * @param {Object} clinicalData - Raw triage form submission from triage nurse.
 * @param {string} nurseId - User ID of the on-duty triage nurse.
 * @throws {NotFoundError} If the patient ID is invalid.
 * @returns {Promise<Object>} Aggregated assessment, prediction, queue entry, and patient profile.
 */
async function performTriage(clinicalData, nurseId) {
  const {
    patient_id,
    systolic_bp,
    sbp,
    diastolic_bp,
    dbp,
    heart_rate,
    heartrate,
    respiratory_rate,
    resprate,
    spo2,
    o2sat,
    temperature,
    temperature_unit = 'C',
    pain_score,
    pain,
    chief_complaint_code,
    arrival_transport,
    arrival_time,
    nurse_override
  } = clinicalData || {};

  // 1. Verify patient exists in database
  const patient = await prisma.patient.findUnique({
    where: { patient_id }
  });

  if (!patient) {
    throw new NotFoundError(`Patient with ID '${patient_id}' does not exist`);
  }

  const age = calculateAge(patient.date_of_birth);

  // 2. Parse incoming clinical values safely, preserving nulls for unmeasured vitals
  const sbpVal = parseNullableNumber(systolic_bp ?? sbp);
  const dbpVal = parseNullableNumber(diastolic_bp ?? dbp);
  const hrVal = parseNullableNumber(heart_rate ?? heartrate);
  const rrVal = parseNullableNumber(respiratory_rate ?? resprate);
  const o2Val = parseNullableNumber(spo2 ?? o2sat);
  const rawTemp = parseNullableNumber(temperature);
  const painVal = parseNullableNumber(pain_score ?? pain);
  const ccVal = parseNullableNumber(chief_complaint_code);

  const transportVal = normalizeTransport(arrival_transport);
  const arrivalTimeIso = arrival_time ? new Date(arrival_time).toISOString() : new Date().toISOString();
  const tempF = convertTemperatureToFahrenheit(rawTemp, temperature_unit);
  const genderCode = normalizeGender(patient.gender);

  // 3. Format clinical features for ML inference service (exact 10 documented contract fields + context)
  const featuresForML = {
    temperature: tempF,
    heartrate: hrVal,
    resprate: rrVal,
    o2sat: o2Val,
    sbp: sbpVal,
    dbp: dbpVal,
    pain: painVal,
    gender: genderCode,
    arrival_transport: transportVal,
    arrival_time: arrivalTimeIso,
    // Supplemental context fields for the offline clinical rule engine fallback
    age,
    chief_complaint_code: ccVal
  };

  // 4. Request ML prediction from microservice (or internal rule fallback)
  const predictionResult = await mlService.predictAcuity(featuresForML);

  // 5. Nurse override handling: Nurse's clinical assessment supersedes AI recommendation
  const isOverridden = Boolean(nurse_override?.is_overridden && nurse_override?.override_acuity);
  const finalAcuity = isOverridden 
    ? normalizeAcuity(nurse_override.override_acuity)
    : predictionResult.predicted_acuity;
  const finalColor = getAcuityColor(finalAcuity);
  const department = getDepartmentForAcuity(finalAcuity);

  // 6. Execute atomic database transaction to prevent partial triage entries
  const result = await prisma.$transaction(async (tx) => {
    // A. Create permanent clinical assessment record
    const assessment = await tx.triageAssessment.create({
      data: {
        patient_id,
        nurse_id: nurseId,
        systolic_bp: sbpVal !== null ? Math.round(sbpVal) : null,
        diastolic_bp: dbpVal !== null ? Math.round(dbpVal) : null,
        heart_rate: hrVal !== null ? Math.round(hrVal) : null,
        respiratory_rate: rrVal !== null ? Math.round(rrVal) : null,
        spo2: o2Val !== null ? o2Val : null,
        temperature: rawTemp !== null ? rawTemp : null,
        pain_score: painVal !== null ? Math.round(painVal) : null,
        chief_complaint_code: ccVal !== null ? Math.round(ccVal) : null,
        arrival_transport: transportVal,
        arrival_time: new Date(arrivalTimeIso)
      }
    });

    // B. Create AI prediction audit record
    const prediction = await tx.acuityPrediction.create({
      data: {
        assessment_id: assessment.assessment_id,
        predicted_acuity: predictionResult.predicted_acuity,
        acuity_color: predictionResult.acuity_color || getAcuityColor(predictionResult.predicted_acuity),
        confidence_score: predictionResult.confidence_score,
        model_used: predictionResult.model_used
      }
    });

    // C. Insert patient into the hospital queue
    const queueEntry = await tx.queueEntry.create({
      data: {
        patient_id,
        prediction_id: prediction.prediction_id,
        acuity_level: finalAcuity,
        department,
        queue_position: 9999, // Temporary position before atomic re-ranking
        status: 'Waiting'
      }
    });

    // D. Re-rank all active hospital queue positions atomically
    await recalculateQueuePositions(tx);

    // E. Retrieve newly assigned priority position
    const finalQueueEntry = await tx.queueEntry.findUnique({
      where: { queue_id: queueEntry.queue_id }
    });

    return {
      assessment,
      prediction: {
        ...prediction,
        acuity: predictionResult.acuity,
        predicted_acuity: predictionResult.predicted_acuity,
        acuity_color: predictionResult.acuity_color || getAcuityColor(predictionResult.predicted_acuity),
        triage_label: predictionResult.triage_label || predictionResult.acuity_color || getAcuityColor(predictionResult.predicted_acuity),
        probabilities: predictionResult.probabilities || null,
        manual_assessment_recommended: Boolean(predictionResult.manual_assessment_recommended),
        missing_fields: predictionResult.missing_fields || [],
        ignored_out_of_range: predictionResult.ignored_out_of_range || [],
        confidence_score: Number(prediction.confidence_score),
        is_offline_fallback: Boolean(predictionResult.is_offline_fallback)
      },
      queueEntry: finalQueueEntry,
      patient: {
        patient_id: patient.patient_id,
        full_name: `${patient.first_name} ${patient.last_name}`,
        gender: patient.gender,
        age
      }
    };
  });

  logger.info('Triage workflow completed successfully', {
    meta: {
      patient_id,
      assessment_id: result.assessment.assessment_id,
      acuity: result.prediction.predicted_acuity,
      color: result.prediction.acuity_color,
      queue_position: result.queueEntry.queue_position
    }
  });

  // 7. Invalidate cached queue and administrative analytics
  await cacheService.delPattern('queue:*');
  await cacheService.del('admin:dashboard');

  return result;
}

/**
 * Retrieves a detailed triage assessment by its primary ID.
 * Includes assessing nurse credentials, AI prediction outputs, and queue entries.
 * 
 * @param {string} assessment_id - UUID of the assessment record.
 * @throws {NotFoundError} If no assessment matches the ID.
 * @returns {Promise<Object>} Full assessment record.
 */
async function getAssessmentById(assessment_id) {
  const assessment = await prisma.triageAssessment.findUnique({
    where: { assessment_id },
    include: {
      patient: true,
      nurse: {
        select: { user_id: true, full_name: true, username: true }
      },
      prediction: {
        include: {
          queueEntries: true
        }
      }
    }
  });

  if (!assessment) {
    throw new NotFoundError(`Assessment with ID '${assessment_id}' not found`);
  }

  return assessment;
}

/**
 * Retrieves all historical triage assessments recorded for a specific patient.
 * 
 * @param {string} patient_id - UUID of the patient.
 * @throws {NotFoundError} If the patient does not exist.
 * @returns {Promise<Array<Object>>} Assessments sorted newest first.
 */
async function getAssessmentsByPatientId(patient_id) {
  const patient = await prisma.patient.findUnique({ where: { patient_id } });
  if (!patient) {
    throw new NotFoundError(`Patient with ID '${patient_id}' not found`);
  }

  return prisma.triageAssessment.findMany({
    where: { patient_id },
    include: {
      nurse: {
        select: { user_id: true, full_name: true, username: true }
      },
      prediction: true
    },
    orderBy: { assessed_at: 'desc' }
  });
}

module.exports = {
  performTriage,
  getAssessmentById,
  getAssessmentsByPatientId
};
