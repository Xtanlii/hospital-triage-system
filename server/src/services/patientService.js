/**
 * ============================================================================
 * Patient Service (EHR Demographics & Encounter Management)
 * ============================================================================
 * 
 * Responsibilities:
 * - Patient intake, registration, and profile deduplication.
 * - Paginated directory querying with case-insensitive search (name, phone).
 * - Full electronic health record retrieval: encounters, vital trends, assessments, queues.
 * - Demographic updates and data validation.
 */

const prisma = require('../config/db');
const { NotFoundError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

/**
 * Registers a new patient into the hospital master patient index (MPI).
 * 
 * Sanitizes input text, validates date of birth, and records registration timestamp.
 * 
 * @param {Object} data - Patient demographic payload.
 * @param {string} data.first_name - Patient given name.
 * @param {string} data.last_name - Patient family name.
 * @param {string|Date} data.date_of_birth - ISO or valid date string.
 * @param {string} data.gender - Biological gender ('Male', 'Female', etc.).
 * @param {string} [data.phone_number] - Contact telephone number.
 * @returns {Promise<Object>} Created patient database record.
 */
async function createPatient(data) {
  const patient = await prisma.patient.create({
    data: {
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      date_of_birth: new Date(data.date_of_birth),
      gender: data.gender.trim(),
      phone_number: data.phone_number ? data.phone_number.trim() : null
    }
  });

  logger.info('Patient registered successfully', { meta: { patient_id: patient.patient_id } });
  return patient;
}

/**
 * Retrieves a paginated list of patients with optional multi-attribute search.
 * Searches across first_name, last_name, and phone_number case-insensitively.
 * 
 * @param {Object} [params={}] - Query parameters.
 * @param {number} [params.page=1] - Page number (1-based index).
 * @param {number} [params.limit=20] - Records per page.
 * @param {string} [params.search=''] - Keyword filter for name or phone.
 * @returns {Promise<{patients: Array<Object>, pagination: Object}>} Paginated results with metadata.
 */
async function getPatients({ page = 1, limit = 20, search = '' } = {}) {
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  // Construct search filter
  const where = {};
  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { first_name: { contains: term, mode: 'insensitive' } },
      { last_name: { contains: term, mode: 'insensitive' } },
      { phone_number: { contains: term, mode: 'insensitive' } }
    ];
  }

  // Execute count and paginated query in parallel
  const [total, patients] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.findMany({
      where,
      skip,
      take,
      orderBy: { registered_at: 'desc' }
    })
  ]);

  return {
    patients,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / take)
    }
  };
}

/**
 * Retrieves a patient's complete clinical record by their UUID.
 * 
 * Deeply includes:
 * - All historical triage assessments with assigned nurses.
 * - Machine learning acuity prediction audit records.
 * - All historical hospital queue entries sorted chronologically (newest first).
 * 
 * @param {string} patient_id - UUID of the patient.
 * @throws {NotFoundError} If the patient is not found.
 * @returns {Promise<Object>} Complete patient record with clinical history.
 */
async function getPatientById(patient_id) {
  const patient = await prisma.patient.findUnique({
    where: { patient_id },
    include: {
      assessments: {
        orderBy: { assessed_at: 'desc' },
        include: {
          prediction: true,
          nurse: {
            select: { user_id: true, full_name: true, username: true }
          }
        }
      },
      queueEntries: {
        orderBy: { queued_at: 'desc' }
      }
    }
  });

  if (!patient) {
    throw new NotFoundError(`Patient with ID '${patient_id}' not found`);
  }

  return patient;
}

/**
 * Updates a patient's demographic information.
 * Only modifies provided fields, trimming strings and re-parsing date fields.
 * 
 * @param {string} patient_id - UUID of the patient to update.
 * @param {Object} data - Updated demographic fields.
 * @throws {NotFoundError} If the patient does not exist.
 * @returns {Promise<Object>} Updated patient record.
 */
async function updatePatient(patient_id, data) {
  // Verify patient existence prior to update
  await getPatientById(patient_id);

  const updateData = {};
  if (data.first_name !== undefined) updateData.first_name = data.first_name.trim();
  if (data.last_name !== undefined) updateData.last_name = data.last_name.trim();
  if (data.date_of_birth !== undefined) updateData.date_of_birth = new Date(data.date_of_birth);
  if (data.gender !== undefined) updateData.gender = data.gender.trim();
  if (data.phone_number !== undefined) updateData.phone_number = data.phone_number ? data.phone_number.trim() : null;

  const updated = await prisma.patient.update({
    where: { patient_id },
    data: updateData
  });

  logger.info('Patient details updated', { meta: { patient_id } });
  return updated;
}

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient
};
