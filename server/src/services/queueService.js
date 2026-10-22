const prisma = require('../config/db');
const { NotFoundError, ValidationError } = require('../middleware/errorMiddleware');
const { QUEUE_STATUS, ACTIVE_QUEUE_STATUSES, computeQueuePositions } = require('../utils/queueUtils');
const cacheService = require('./cacheService');
const logger = require('../utils/logger');

/**
 * Atomically recalculates queue positions for all currently active patients in the hospital.
 * Active statuses: 'Waiting', 'Called'.
 * @param {Object} tx Prisma client or transaction instance
 */
async function recalculateQueuePositions(tx = prisma) {
  // Fetch all active queue entries
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

  const positionAssignments = computeQueuePositions(activeEntries);

  // Update positions for entries whose position changed
  for (const item of positionAssignments) {
    await tx.queueEntry.update({
      where: { queue_id: item.queue_id },
      data: { queue_position: item.queue_position }
    });
  }

  // Invalidate cached queues
  await cacheService.delPattern('queue:*');

  logger.info(`Recalculated queue positions for ${positionAssignments.length} active patients`);
  return positionAssignments;
}

/**
 * Retrieves the current queue with optional filters, backed by Redis/In-Memory Cache.
 */
async function getQueue({ status, department, acuity_level } = {}) {
  const cacheKey = `queue:${status || 'all'}:${department || 'all'}:${acuity_level || 'all'}`;

  // Try cache first
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  const where = {};
  if (status) where.status = status;
  if (department) where.department = department;
  if (acuity_level) where.acuity_level = acuity_level;

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
      { queue_position: 'asc' },
      { queued_at: 'asc' }
    ]
  });

  // Save to cache for 30 seconds
  await cacheService.set(cacheKey, entries, 30);

  return entries;
}

/**
 * Retrieves a single queue entry by its ID.
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
 * Retrieves patient queue history.
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
 * Updates queue entry status and recalculates positions.
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

    await recalculateQueuePositions(tx);

    logger.info(`Queue entry '${queue_id}' status updated to '${status}'`);
    return updated;
  });

  await cacheService.delPattern('queue:*');
  await cacheService.del('admin:dashboard');

  return result;
}

/**
 * Marks a patient as attended (Completed).
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
 * Cancels a patient's queue entry.
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
