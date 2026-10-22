const prisma = require('../config/db');
const mlService = require('./mlService');
const { recalculateQueuePositions } = require('./queueService');
const { getDepartmentForAcuity, normalizeAcuity, getAcuityColor } = require('../utils/acuityUtils');
const { NotFoundError } = require('../middleware/errorMiddleware');
const cacheService = require('./cacheService');
const logger = require('../utils/logger');

function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function parseNullableNumber(val) {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

function convertTemperatureToFahrenheit(temp, unit = 'C') {
  if (temp === null || temp === undefined || temp === '') return null;
  const num = Number(temp);
  if (isNaN(num)) return null;
  const u = String(unit).trim().toUpperCase();
  if (u === 'F' || num > 60) return Math.round(num * 10) / 10;
  return Math.round(((num * 9 / 5) + 32) * 10) / 10;
}

function normalizeGender(gender) {
  if (!gender) return 'M';
  const g = String(gender).trim().toUpperCase();
  if (g.startsWith('F')) return 'F';
  return 'M';
}

const VALID_TRANSPORTS = ['AMBULANCE', 'WALK IN', 'HELICOPTER', 'OTHER', 'UNKNOWN'];
function normalizeTransport(transport) {
  if (!transport) return 'UNKNOWN';
  const t = String(transport).trim().toUpperCase().replace('-', ' ');
  return VALID_TRANSPORTS.includes(t) ? t : 'UNKNOWN';
}

/**
 * Executes the complete triage pipeline:
 * 1. Validates patient existence.
 * 2. Prepares contract features for ML inference service (with °F temperature & strict nulls).
 * 3. Calls external ML inference service with offline fallback.
 * 4. Persists assessment, prediction (including acuity_color), and priority queue entry.
 * 5. Recalculates hospital priority queue positions.
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

  // 1. Verify patient exists
  const patient = await prisma.patient.findUnique({
    where: { patient_id }
  });

  if (!patient) {
    throw new NotFoundError(`Patient with ID '${patient_id}' does not exist`);
  }

  const age = calculateAge(patient.date_of_birth);

  // Parse incoming values safely preserving nulls
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

  // 2. Format clinical features for ML inference service (exact 10 documented fields + context)
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
    // Context fields for offline rule fallback engine
    age,
    chief_complaint_code: ccVal
  };

  // 3. Call ML inference service
  const predictionResult = await mlService.predictAcuity(featuresForML);

  // 4. Clinical decision & override handling
  const isOverridden = Boolean(nurse_override?.is_overridden && nurse_override?.override_acuity);
  const finalAcuity = isOverridden 
    ? normalizeAcuity(nurse_override.override_acuity)
    : predictionResult.predicted_acuity;
  const finalColor = getAcuityColor(finalAcuity);
  const department = getDepartmentForAcuity(finalAcuity);

  // 5. Atomic transaction for storing assessment, prediction, and queue entry
  const result = await prisma.$transaction(async (tx) => {
    // A. Create Triage Assessment
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

    // B. Create Acuity Prediction
    const prediction = await tx.acuityPrediction.create({
      data: {
        assessment_id: assessment.assessment_id,
        predicted_acuity: predictionResult.predicted_acuity,
        acuity_color: predictionResult.acuity_color || getAcuityColor(predictionResult.predicted_acuity),
        confidence_score: predictionResult.confidence_score,
        model_used: predictionResult.model_used
      }
    });

    // C. Create Queue Entry
    const queueEntry = await tx.queueEntry.create({
      data: {
        patient_id,
        prediction_id: prediction.prediction_id,
        acuity_level: finalAcuity,
        department,
        queue_position: 9999,
        status: 'Waiting'
      }
    });

    // D. Recalculate all active queue positions
    await recalculateQueuePositions(tx);

    // E. Retrieve updated queue entry
    const finalQueueEntry = await tx.queueEntry.findUnique({
      where: { queue_id: queueEntry.queue_id }
    });

    return {
      assessment,
      prediction: {
        ...prediction,
        predicted_acuity: predictionResult.predicted_acuity,
        acuity_color: predictionResult.acuity_color || getAcuityColor(predictionResult.predicted_acuity),
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

  await cacheService.delPattern('queue:*');
  await cacheService.del('admin:dashboard');

  return result;
}

/**
 * Retrieves a triage assessment with its prediction and patient info.
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
 * Retrieves all triage assessments for a patient.
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

