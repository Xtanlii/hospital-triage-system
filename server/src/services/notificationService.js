const prisma = require('../config/db');
const { getWaitingThresholdMinutes } = require('../utils/acuityUtils');
const { QUEUE_STATUS } = require('../utils/queueUtils');

/**
 * Scans active queue entries and identifies patients whose waiting time
 * has exceeded their clinical acuity threshold.
 */
async function checkWaitTimeAlerts() {
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

  for (const entry of waitingPatients) {
    const queuedTime = new Date(entry.queued_at).getTime();
    const waitTimeMinutes = Math.floor((now - queuedTime) / (60 * 1000));
    const thresholdMinutes = getWaitingThresholdMinutes(entry.acuity_level);

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

