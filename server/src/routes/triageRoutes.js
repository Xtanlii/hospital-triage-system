const express = require('express');
const router = express.Router();
const triageController = require('../controllers/triageController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { validateTriageInput } = require('../validators/triageValidators');

// Base path: /api/triage
router.use(authenticateToken);

// Live ML model prediction endpoint (before final triage submission)
router.post('/predict', requireRole('NURSE', 'ADMIN'), triageController.predictOnly);

// Primary triage assessment endpoint
router.post('/', requireRole('NURSE', 'ADMIN'), validateRequest(validateTriageInput), triageController.createTriage);
router.get('/:assessmentId', triageController.getAssessment);

module.exports = router;

