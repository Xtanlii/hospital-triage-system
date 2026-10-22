const prisma = require('../config/db');
const { checkWaitTimeAlerts } = require('../services/notificationService');
const { QUEUE_STATUS } = require('../utils/queueUtils');
const { ACUITY_LEVELS } = require('../utils/acuityUtils');
const cacheService = require('../services/cacheService');

async function getDashboard(req, res, next) {
  try {
    const cached = await cacheService.get('admin:dashboard');
    if (cached) {
      return res.status(200).json({
        success: true,
        message: 'Admin dashboard overview fetched successfully (Cached)',
        data: cached
      });
    }

    const [
      totalWaiting,
      immediateWaiting,
      emergentWaiting,
      urgentWaiting,
      lessUrgentWaiting,
      nonUrgentWaiting,
      inProgressCount,
      completedCount,
      waitingEntries
    ] = await Promise.all([
      prisma.queueEntry.count({ where: { status: QUEUE_STATUS.WAITING } }),
      prisma.queueEntry.count({ where: { status: QUEUE_STATUS.WAITING, acuity_level: ACUITY_LEVELS.IMMEDIATE } }),
      prisma.queueEntry.count({ where: { status: QUEUE_STATUS.WAITING, acuity_level: ACUITY_LEVELS.EMERGENT } }),
      prisma.queueEntry.count({ where: { status: QUEUE_STATUS.WAITING, acuity_level: ACUITY_LEVELS.URGENT } }),
      prisma.queueEntry.count({ where: { status: QUEUE_STATUS.WAITING, acuity_level: ACUITY_LEVELS.LESS_URGENT } }),
      prisma.queueEntry.count({ where: { status: QUEUE_STATUS.WAITING, acuity_level: ACUITY_LEVELS.NON_URGENT } }),
      prisma.queueEntry.count({ where: { status: QUEUE_STATUS.IN_PROGRESS } }),
      prisma.queueEntry.count({ where: { status: QUEUE_STATUS.COMPLETED } }),
      prisma.queueEntry.findMany({
        where: { status: QUEUE_STATUS.WAITING },
        select: { queued_at: true }
      })
    ]);

    // Calculate average wait time in minutes for currently waiting patients
    const now = Date.now();
    let averageWaitTimeMinutes = 0;
    if (waitingEntries.length > 0) {
      const totalWaitMs = waitingEntries.reduce(
        (sum, entry) => sum + (now - new Date(entry.queued_at).getTime()),
        0
      );
      averageWaitTimeMinutes = Math.round(totalWaitMs / (waitingEntries.length * 60 * 1000));
    }

    // Get active alerts
    const alerts = await checkWaitTimeAlerts();

    const dashboardData = {
      summary: {
        totalWaiting,
        immediateWaiting,
        emergentWaiting,
        urgentWaiting,
        lessUrgentWaiting,
        nonUrgentWaiting,
        inProgressCount,
        completedCount,
        patientsExceedingThreshold: alerts.length,
        averageWaitTimeMinutes
      },
      alerts
    };

    // Cache dashboard for 30s
    await cacheService.set('admin:dashboard', dashboardData, 30);

    res.status(200).json({
      success: true,
      message: 'Admin dashboard overview fetched successfully',
      data: dashboardData
    });
  } catch (err) {
    next(err);
  }
}

async function getAdminQueue(req, res, next) {
  try {
    const queue = await prisma.queueEntry.findMany({
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
      },
      orderBy: [
        { queue_position: 'asc' },
        { queued_at: 'asc' }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Admin full queue view retrieved successfully',
      data: queue
    });
  } catch (err) {
    next(err);
  }
}

async function getAlerts(req, res, next) {
  try {
    const alerts = await checkWaitTimeAlerts();
    res.status(200).json({
      success: true,
      message: 'Wait-time threshold alerts retrieved successfully',
      data: alerts
    });
  } catch (err) {
    next(err);
  }
}

async function getStatistics(req, res, next) {
  try {
    const [
      totalPatients,
      totalAssessments,
      totalPredictions,
      acuityCounts,
      departmentCounts,
      modelCounts
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.triageAssessment.count(),
      prisma.acuityPrediction.count(),
      prisma.queueEntry.groupBy({
        by: ['acuity_level'],
        _count: { queue_id: true }
      }),
      prisma.queueEntry.groupBy({
        by: ['department'],
        _count: { queue_id: true }
      }),
      prisma.acuityPrediction.groupBy({
        by: ['model_used'],
        _count: { prediction_id: true }
      })
    ]);

    res.status(200).json({
      success: true,
      message: 'Hospital triage statistics retrieved successfully',
      data: {
        totals: {
          patients: totalPatients,
          assessments: totalAssessments,
          predictions: totalPredictions
        },
        distribution: {
          byAcuity: acuityCounts.map((a) => ({ acuity: a.acuity_level, count: a._count.queue_id })),
          byDepartment: departmentCounts.map((d) => ({ department: d.department, count: d._count.queue_id })),
          byModel: modelCounts.map((m) => ({ model: m.model_used, count: m._count.prediction_id }))
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getAdminPatients(req, res, next) {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        assessments: {
          orderBy: { assessed_at: 'desc' },
          take: 1
        },
        queueEntries: {
          orderBy: { queued_at: 'desc' },
          take: 1
        }
      },
      orderBy: { registered_at: 'desc' }
    });

    res.status(200).json({
      success: true,
      message: 'Admin patients list retrieved successfully',
      data: patients
    });
  } catch (err) {
    next(err);
  }
}

async function getAdminAssessments(req, res, next) {
  try {
    const assessments = await prisma.triageAssessment.findMany({
      include: {
        patient: true,
        nurse: {
          select: { user_id: true, full_name: true, username: true }
        },
        prediction: true
      },
      orderBy: { assessed_at: 'desc' }
    });

    res.status(200).json({
      success: true,
      message: 'Admin assessments list retrieved successfully',
      data: assessments
    });
  } catch (err) {
    next(err);
  }
}

async function getAdminPredictions(req, res, next) {
  try {
    const predictions = await prisma.acuityPrediction.findMany({
      include: {
        assessment: {
          include: {
            patient: true,
            nurse: {
              select: { user_id: true, full_name: true, username: true }
            }
          }
        }
      },
      orderBy: { predicted_at: 'desc' }
    });

    res.status(200).json({
      success: true,
      message: 'Admin predictions list retrieved successfully',
      data: predictions
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  getAdminQueue,
  getAlerts,
  getStatistics,
  getAdminPatients,
  getAdminAssessments,
  getAdminPredictions
};

