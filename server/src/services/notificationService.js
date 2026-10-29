/**
 * ============================================================================
 * Notification Service (Clinical Wait Time Surveillance & Breach Alerts)
 * ============================================================================
 * 
 * Responsibilities:
 * - Scans all currently waiting patients in the hospital queue.
 * - Compares active waiting duration against clinical urgency thresholds:
 *     - Level 1 (Immediate / Red): 0 minutes (Immediate physician attention required)
 *     - Level 2 (Emergent / Orange): 10 minutes maximum safe wait
 *     - Level 3 (Urgent / Yellow): 30 minutes
 *     - Level 4 (Less Urgent / Green): 60 minutes
 *     - Level 5 (Non-urgent / Blue): 120 minutes
 * - Generates high-priority clinical alerts to prevent patient deterioration in the waiting area.
 */

const prisma = require('../config/db');
const { getWaitingThresholdMinutes } = require('../utils/acuityUtils');
const { QUEUE_STATUS } = require('../utils/queueUtils');

/**
 * Scans active queue entries and identifies patients whose waiting time
 * has exceeded their clinical acuity threshold.
 * 
 * Clinical Safety Rationale:
 * Patients in waiting areas can deteriorate rapidly (e.g. occult sepsis, evolving stroke).
 * This monitor continuously audits wait times so charge nurses can intervene and escalate care.
 * 
 * @returns {Promise<Array<{
 *   patientId: string,
 *   patientName: string,
 *   queueId: string,
 *   acuity: string,
 *   department: string,
 *   waitTimeMinutes: number,
 *   thresholdMinutes: number,
 *   message: string
 * }>>} List of breached patient records with clinical alerts.
 */
async function checkWaitTimeAlerts() {
  // Query all active waiting patients ordered by earliest arrival time
  const waitingPatients = await prisma.queueEntry.findMany({
    where: {
      status: QUEUE_STATUS.WAITING
    },
    include: {
      patient: {
        select: {
          patient_id: true,
          first_name: true,
          last_name: true
        }
      }
    },
    orderBy: { queued_at: 'asc' }
  });

  const now = Date.now();
  const alerts = [];

  // Evaluate each patient against their acuity threshold
  for (const entry of waitingPatients) {
    const queuedTime = new Date(entry.queued_at).getTime();
    const waitTimeMinutes = Math.floor((now - queuedTime) / (60 * 1000));
    const thresholdMinutes = getWaitingThresholdMinutes(entry.acuity_level);

    // If patient has exceeded the maximum permissible clinical wait threshold
    if (waitTimeMinutes >= thresholdMinutes) {
      alerts.push({
        patientId: entry.patient_id,
        patientName: `${entry.patient.first_name} ${entry.patient.last_name}`,
        queueId: entry.queue_id,
        acuity: entry.acuity_level,
        department: entry.department,
        waitTimeMinutes,
        thresholdMinutes,
        message: `Patient has waited ${waitTimeMinutes} minutes, exceeding the ${thresholdMinutes}-minute ${entry.acuity_level} threshold.`
      });
    }
  }

  return alerts;
}

module.exports = {
  checkWaitTimeAlerts
};
