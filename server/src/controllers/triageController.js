const triageService = require('../services/triageService');

async function createTriage(req, res, next) {
  try {
    const nurseId = req.user.userId;
    const result = await triageService.performTriage(req.body, nurseId);

    res.status(201).json({
      success: true,
      message: 'Triage assessment completed, ML inference recorded, and patient added to priority queue',
      data: {
        assessment: result.assessment,
        prediction: result.prediction,
        queueEntry: result.queueEntry,
        patient: result.patient
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getAssessment(req, res, next) {
  try {
    const assessment = await triageService.getAssessmentById(req.params.assessmentId);
    res.status(200).json({
      success: true,
      message: 'Triage assessment retrieved successfully',
      data: assessment
    });
  } catch (err) {
    next(err);
  }
}

async function getPatientTriageHistory(req, res, next) {
  try {
    const assessments = await triageService.getAssessmentsByPatientId(req.params.patientId);
    res.status(200).json({
      success: true,
      message: 'Patient triage history retrieved successfully',
      data: assessments
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTriage,
  getAssessment,
  getPatientTriageHistory
};

