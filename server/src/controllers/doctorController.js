const prisma = require('../config/db');
const { NotFoundError, ValidationError, ForbiddenError } = require('../middleware/errorMiddleware');
const queueService = require('../services/queueService');
const logger = require('../utils/logger');

/**
 * Checks in a doctor (sets on-duty to true).
 */
async function checkIn(req, res, next) {
  try {
    const doctorId = req.user.userId;

    const doctor = await prisma.user.update({
      where: { user_id: doctorId },
      data: { is_on_duty: true },
      select: {
        user_id: true,
        full_name: true,
        username: true,
        role: true,
        department: true,
        is_on_duty: true
      }
    });

    const activeCount = await prisma.user.count({
      where: { role: 'DOCTOR', is_on_duty: true }
    });

    logger.info(`Doctor checked in: ${doctor.full_name} (${doctor.department}). Active doctors: ${activeCount}`);

    res.status(200).json({
      success: true,
      message: `${doctor.full_name} checked in successfully. You are now ON DUTY.`,
      data: {
        doctor,
        activeDoctorsCount: activeCount
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Checks out a doctor (sets on-duty to false).
 * Triggers immediate reduction in active doctor count.
 */
async function checkOut(req, res, next) {
  try {
    const doctorId = req.user.userId;

    const doctor = await prisma.user.update({
      where: { user_id: doctorId },
      data: { is_on_duty: false },
      select: {
        user_id: true,
        full_name: true,
        username: true,
        role: true,
        department: true,
        is_on_duty: true
      }
    });

    const activeCount = await prisma.user.count({
      where: { role: 'DOCTOR', is_on_duty: true }
    });

    logger.info(`Doctor checked out: ${doctor.full_name} (${doctor.department}). Active doctors: ${activeCount}`);

    res.status(200).json({
      success: true,
      message: `${doctor.full_name} checked out successfully. You are now OFF DUTY.`,
      data: {
        doctor,
        activeDoctorsCount: activeCount
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Toggles doctor duty status between on-duty and off-duty.
 */
async function toggleDuty(req, res, next) {
  try {
    const doctorId = req.user.userId;

    const current = await prisma.user.findUnique({
      where: { user_id: doctorId },
      select: { is_on_duty: true, full_name: true, department: true }
    });

    if (!current) {
      throw new NotFoundError('Doctor profile not found');
    }

    const nextDutyState = !current.is_on_duty;

    const doctor = await prisma.user.update({
      where: { user_id: doctorId },
      data: { is_on_duty: nextDutyState },
      select: {
        user_id: true,
        full_name: true,
        username: true,
        role: true,
        department: true,
        is_on_duty: true
      }
    });

    const activeCount = await prisma.user.count({
      where: { role: 'DOCTOR', is_on_duty: true }
    });

    logger.info(`Doctor duty toggled: ${doctor.full_name} is now ${nextDutyState ? 'ON DUTY' : 'OFF DUTY'}. Active: ${activeCount}`);

    res.status(200).json({
      success: true,
      message: `Duty status updated: ${nextDutyState ? 'ON DUTY' : 'OFF DUTY'}`,
      data: {
        doctor,
        activeDoctorsCount: activeCount
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves the count and listing of all currently active on-duty doctors,
 * with department breakdowns.
 */
async function getActiveDoctors(req, res, next) {
  try {
    const [activeCount, totalDoctors, activeDoctors] = await Promise.all([
      prisma.user.count({
        where: { role: 'DOCTOR', is_on_duty: true }
      }),
      prisma.user.count({
        where: { role: 'DOCTOR' }
      }),
      prisma.user.findMany({
        where: { role: 'DOCTOR', is_on_duty: true },
        select: {
          user_id: true,
          full_name: true,
          username: true,
          department: true,
          is_on_duty: true
        },
        orderBy: { full_name: 'asc' }
      })
    ]);

    // Group active doctors count by department
    const byDepartment = activeDoctors.reduce((acc, doc) => {
      const dept = doc.department || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: 'Active doctors retrieved successfully',
      data: {
        activeCount,
        totalDoctors,
        byDepartment,
        activeDoctors
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves the doctor's department-scoped queue.
 * Strictly locked to the doctor's assigned department.
 */
async function getMyDepartmentQueue(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.userId },
      select: { department: true, full_name: true, is_on_duty: true }
    });

    if (!user || !user.department) {
      throw new ValidationError('Doctor does not have an assigned department.');
    }

    const { status, acuity_level } = req.query;

    const entries = await queueService.getQueue({
      status,
      department: user.department,
      acuity_level
    });

    res.status(200).json({
      success: true,
      message: `Queue for department '${user.department}' retrieved successfully`,
      data: {
        department: user.department,
        isOnDuty: user.is_on_duty,
        count: entries.length,
        entries
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  checkIn,
  checkOut,
  toggleDuty,
  getActiveDoctors,
  getMyDepartmentQueue
};
