const queueService = require('../services/queueService');
const { ForbiddenError, ValidationError } = require('../middleware/errorMiddleware');

async function getQueue(req, res, next) {
  try {
    let { status, department, acuity_level } = req.query;

    // Strict department scoping: A doctor can ONLY see their own department's queue
    if (req.user && req.user.role === 'DOCTOR') {
      if (!req.user.department) {
        throw new ValidationError('Doctor does not have an assigned department.');
      }
      department = req.user.department;
    }

    const entries = await queueService.getQueue({ status, department, acuity_level });

    res.status(200).json({
      success: true,
      message: req.user && req.user.role === 'DOCTOR' 
        ? `Queue for department '${department}' retrieved successfully`
        : 'Hospital queue retrieved successfully',
      data: entries
    });
  } catch (err) {
    next(err);
  }
}

async function getQueueEntry(req, res, next) {
  try {
    const entry = await queueService.getQueueEntryById(req.params.id);

    // If doctor, verify entry belongs to doctor's department
    if (req.user && req.user.role === 'DOCTOR' && entry.department !== req.user.department) {
      throw new ForbiddenError(
        `Access forbidden: You can only view patients within your assigned department (${req.user.department})`
      );
    }

    res.status(200).json({
      success: true,
      message: 'Queue entry retrieved successfully',
      data: entry
    });
  } catch (err) {
    next(err);
  }
}

async function getPatientQueue(req, res, next) {
  try {
    const entries = await queueService.getPatientQueueHistory(req.params.patientId);
    res.status(200).json({
      success: true,
      message: 'Patient queue entries retrieved successfully',
      data: entries
    });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;

    // If doctor, verify queue entry is in their department
    if (req.user && req.user.role === 'DOCTOR') {
      const entry = await queueService.getQueueEntryById(req.params.id);
      if (entry.department !== req.user.department) {
        throw new ForbiddenError(
          `Access forbidden: You can only update patients within your assigned department (${req.user.department})`
        );
      }
    }

    const updated = await queueService.updateQueueStatus(req.params.id, status);
    res.status(200).json({
      success: true,
      message: `Queue status updated to '${status}'`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function attendPatient(req, res, next) {
  try {
    // If doctor, verify queue entry is in their department
    if (req.user && req.user.role === 'DOCTOR') {
      const entry = await queueService.getQueueEntryById(req.params.id);
      if (entry.department !== req.user.department) {
        throw new ForbiddenError(
          `Access forbidden: You can only attend patients within your assigned department (${req.user.department})`
        );
      }
    }

    const updated = await queueService.attendPatient(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Patient attended and queue entry marked completed',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function cancelPatient(req, res, next) {
  try {
    if (req.user && req.user.role === 'DOCTOR') {
      const entry = await queueService.getQueueEntryById(req.params.id);
      if (entry.department !== req.user.department) {
        throw new ForbiddenError(
          `Access forbidden: You can only cancel patients within your assigned department (${req.user.department})`
        );
      }
    }

    const updated = await queueService.cancelPatient(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Queue entry successfully cancelled',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getQueue,
  getQueueEntry,
  getPatientQueue,
  updateStatus,
  attendPatient,
  cancelPatient
};
