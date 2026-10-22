const { getAcuityPriority } = require('./acuityUtils');

const QUEUE_STATUS = {
  WAITING: 'Waiting',
  CALLED: 'Called',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

const ACTIVE_QUEUE_STATUSES = [
  QUEUE_STATUS.WAITING,
  QUEUE_STATUS.CALLED
];

/**
 * Clinical Priority Queue comparator function.
 * 1. Higher clinical acuity first (lower priority number).
 * 2. Earlier arrival (queued_at ASC) first for identical acuity.
 */
function compareQueuePriority(a, b) {
  const prioA = getAcuityPriority(a.acuity_level);
  const prioB = getAcuityPriority(b.acuity_level);

  if (prioA !== prioB) {
    return prioA - prioB;
  }

  const timeA = new Date(a.queued_at).getTime();
  const timeB = new Date(b.queued_at).getTime();
  return timeA - timeB;
}

/**
 * Calculates updated sequential positions for an array of active queue entries.
 * Returns array of { queue_id, queue_position }.
 */
function computeQueuePositions(entries) {
  const sorted = [...entries].sort(compareQueuePriority);
  return sorted.map((entry, index) => ({
    queue_id: entry.queue_id,
    queue_position: index + 1
  }));
}

module.exports = {
  QUEUE_STATUS,
  ACTIVE_QUEUE_STATUSES,
  compareQueuePriority,
  computeQueuePositions
};

