/**
 * ============================================================================
 * Queue Service (Clinical Prioritization & Queue Lifecycle Management)
 * ============================================================================
 * 
 * Responsibilities:
 * - Dynamic priority position calculations adhering to ESI (Emergency Severity Index) triage.
 * - Atomic queue state transitions ('Waiting' -> 'Called' -> 'Completed' / 'Cancelled').
 * - Dual-layer caching (Redis primary with high-speed in-memory fallback).
 * - Real-time queue cache invalidation upon acuity arrival, status update, or discharge.
 * - Transactional guarantees using Prisma interactive transactions ($transaction).
 */

const prisma = require('../config/db');
const { NotFoundError, ValidationError } = require('../middleware/errorMiddleware');
const { QUEUE_STATUS, ACTIVE_QUEUE_STATUSES, computeQueuePositions } = require('../utils/queueUtils');
const cacheService = require('./cacheService');
const logger = require('../utils/logger');

/**
 * Atomically recalculates priority queue positions for all currently active patients in the hospital.
 * 
 * Clinical Prioritization Rules (ESI Standard):
 * 1. Immediate / Level 1 (Red) always receives position 1.
 * 2. Emergent / Level 2 (Orange) is ordered next by earliest waiting time.
 * 3. Urgent / Level 3 (Yellow) follows.
 * 4. Less Urgent / Level 4 (Green) and Non-Urgent / Level 5 (Blue/Teal) follow chronologically.
 * 
 * Only patients with active statuses ('Waiting', 'Called') are assigned positive integer positions.
 * Completed or Cancelled patients receive position 0.
 * 
 * @param {Object} [tx=prisma] - Prisma client or active transaction instance for atomicity.
 * @returns {Promise<Array<{queue_id: string, queue_position: number}>>} Computed position assignments.
 */
async function recalculateQueuePositions(tx = prisma) {
  // Step 1: Query all currently active patients across departments
  const activeEntries = await tx.queueEntry.findMany({
    where: {
      status: { in: ACTIVE_QUEUE_STATUSES }
    },
    select: {
      queue_id: true,
      acuity_level: true,
      queued_at: true,
      queue_position: true
    }
  });

  // Step 2: Calculate deterministic queue order (Acuity primary, queued_at secondary)
  const positionAssignments = computeQueuePositions(activeEntries);

  // Step 3: Persist updated queue numbers in database within transaction
  for (const item of positionAssignments) {
    await tx.queueEntry.update({
      where: { queue_id: item.queue_id },
      data: { queue_position: item.queue_position }
    });
  }

  // Step 4: Invalidate distributed queue caches to ensure doctors & nurses see updated positions immediately
  await cacheService.delPattern('queue:*');

  logger.info(`Recalculated queue positions for ${positionAssignments.length} active patients`);
  return positionAssignments;
}

/**
 * Retrieves the live clinical queue with optional filtering by status, department, and acuity level.
 * 
 * Caching Strategy:
 * - Cache key incorporates all query parameters (e.g., `queue:Waiting:Emergency:Immediate`).
 * - Serves cached result if present within 30-second TTL.
 * - Cache is automatically invalidated upon triage creation, patient attendance, or cancellation.
 * 
 * @param {Object} [filters={}] - Optional query filters.
 * @param {string} [filters.status] - Queue status ('Waiting', 'Called', 'Completed', 'Cancelled').
 * @param {string} [filters.department] - Assigned clinical department (e.g., 'Emergency', 'Cardiology').
 * @param {string} [filters.acuity_level] - Clinical acuity level ('Immediate', 'Emergent', etc.).
 * @returns {Promise<Array<Object>>} Sorted queue records with nested patient and AI prediction details.
 */
async function getQueue({ status, department, acuity_level } = {}) {
  const cacheKey = `queue:${status || 'all'}:${department || 'all'}:${acuity_level || 'all'}`;

  // Check Redis / In-memory cache first for fast response
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Construct dynamic Prisma where clause
  const where = {};
  if (status) where.status = status;
  if (department) where.department = department;
  if (acuity_level) where.acuity_level = acuity_level;

  // Retrieve matching queue entries with related clinical entities
  const entries = await prisma.queueEntry.findMany({
    where,
    include: {
      patient: {
        select: {
          patient_id: true,
          first_name: true,
          last_name: true,
          date_of_birth: true,
          gender: true,
          phone_number: true
        }
      },
      prediction: {
        select: {
          predicted_acuity: true,
          acuity_color: true,
          confidence_score: true,
          model_used: true
        }
      }
    },
    orderBy: [
      { queue_position: 'asc' }, // Order by assigned priority position first
      { queued_at: 'asc' }        // Tie-breaker: earliest arrival time
    ]
  });

  // Populate cache with a 30-second expiration window
  await cacheService.set(cacheKey, entries, 30);

  return entries;
}

/**
 * Retrieves a single queue entry by its unique identifier with full nested clinical audit trail.
 * 
 * Includes:
 * - Full patient demographics.
 * - AI acuity prediction record.
 * - Associated triage assessment vital signs.
 * - Assessing nurse details.
 * 
 * @param {string} queue_id - UUID of the queue entry.
 * @throws {NotFoundError} If the queue entry does not exist.
 * @returns {Promise<Object>} Complete queue record.
 */
async function getQueueEntryById(queue_id) {
  const entry = await prisma.queueEntry.findUnique({
    where: { queue_id },
    include: {
      patient: true,
      prediction: {
        include: {
          assessment: {
            include: {
              nurse: {
                select: { user_id: true, full_name: true, username: true }
              }
            }
          }
        }
      }
    }
  });

  if (!entry) {
    throw new NotFoundError(`Queue entry with ID '${queue_id}' not found`);
  }

  return entry;
}

/**
 * Retrieves historical queue visits and encounters for a specific patient.
 * 
 * @param {string} patient_id - UUID of the patient.
 * @throws {NotFoundError} If patient does not exist.
 * @returns {Promise<Array<Object>>} List of historical queue records sorted newest first.
 */
async function getPatientQueueHistory(patient_id) {
  const patient = await prisma.patient.findUnique({ where: { patient_id } });
  if (!patient) {
    throw new NotFoundError(`Patient with ID '${patient_id}' not found`);
  }

  return prisma.queueEntry.findMany({
    where: { patient_id },
    include: {
      prediction: true
    },
    orderBy: { queued_at: 'desc' }
  });
}

/**
 * Updates a patient's queue status and recalculates remaining queue positions atomically.
 * 
 * State Transition Handlers:
 * - 'Completed': Sets attended_at timestamp, resets queue_position to 0, shifts remaining patients up.
 * - 'Cancelled': Resets queue_position to 0, shifts remaining patients up.
 * - 'Called': Patient remains active in position until doctor marks consultation complete.
 * 
 * @param {string} queue_id - UUID of the queue entry to transition.
 * @param {string} status - New target status ('Waiting', 'Called', 'Completed', 'Cancelled').
 * @throws {ValidationError} If the status is not an allowed enum value.
 * @throws {NotFoundError} If the queue entry does not exist.
 * @returns {Promise<Object>} The updated queue entry.
 */
async function updateQueueStatus(queue_id, status) {
  const validStatuses = Object.values(QUEUE_STATUS);
  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Invalid queue status '${status}'. Valid values: ${validStatuses.join(', ')}`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.queueEntry.findUnique({ where: { queue_id } });
    if (!existing) {
      throw new NotFoundError(`Queue entry '${queue_id}' not found`);
    }

    const updateData = { status };
    if (status === QUEUE_STATUS.COMPLETED && !existing.attended_at) {
      updateData.attended_at = new Date();
      updateData.queue_position = 0;
    } else if (status === QUEUE_STATUS.CANCELLED) {
      updateData.queue_position = 0;
    }

    const updated = await tx.queueEntry.update({
      where: { queue_id },
      data: updateData
    });

    // Re-rank active patients to close any gaps created by completion/cancellation
    await recalculateQueuePositions(tx);

    logger.info(`Queue entry '${queue_id}' status updated to '${status}'`);
    return updated;
  });

  // Flush cached queue lists & dashboard stats
  await cacheService.delPattern('queue:*');
  await cacheService.del('admin:dashboard');

  return result;
}

/**
 * Convenience method: Marks a patient as attended and completed by the physician.
 * 
 * Workflow:
 * 1. Sets status to 'Completed'.
 * 2. Sets attended_at to current timestamp.
 * 3. Removes patient from active priority ranking (queue_position = 0).
 * 4. Recalculates remaining queue numbers.
 * 5. Flushes caches.
 * 
 * @param {string} queue_id - UUID of the queue entry.
 * @throws {NotFoundError} If the queue entry does not exist.
 * @returns {Promise<Object>} The completed queue entry.
 */
async function attendPatient(queue_id) {
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.queueEntry.findUnique({ where: { queue_id } });
    if (!existing) {
      throw new NotFoundError(`Queue entry '${queue_id}' not found`);
    }

    const updated = await tx.queueEntry.update({
      where: { queue_id },
      data: {
        status: QUEUE_STATUS.COMPLETED,
        attended_at: new Date(),
        queue_position: 0
      }
    });

    await recalculateQueuePositions(tx);

    logger.info(`Patient in queue '${queue_id}' attended and marked completed`);
    return updated;
  });

  await cacheService.delPattern('queue:*');
  await cacheService.del('admin:dashboard');

  return result;
}

/**
 * Convenience method: Cancels a patient's queue entry (e.g., patient left without being seen).
 * 
 * Workflow:
 * 1. Sets status to 'Cancelled'.
 * 2. Sets queue_position to 0.
 * 3. Recalculates remaining queue numbers.
 * 4. Flushes caches.
 * 
 * @param {string} queue_id - UUID of the queue entry.
 * @throws {NotFoundError} If the queue entry does not exist.
 * @returns {Promise<Object>} The cancelled queue entry.
 */
async function cancelPatient(queue_id) {
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.queueEntry.findUnique({ where: { queue_id } });
    if (!existing) {
      throw new NotFoundError(`Queue entry '${queue_id}' not found`);
    }

    const updated = await tx.queueEntry.update({
      where: { queue_id },
      data: {
        status: QUEUE_STATUS.CANCELLED,
        queue_position: 0
      }
    });

    await recalculateQueuePositions(tx);

    logger.info(`Queue entry '${queue_id}' cancelled`);
    return updated;
  });

  await cacheService.delPattern('queue:*');
  await cacheService.del('admin:dashboard');

  return result;
}

module.exports = {
  recalculateQueuePositions,
  getQueue,
  getQueueEntryById,
  getPatientQueueHistory,
  updateQueueStatus,
  attendPatient,
  cancelPatient
};
