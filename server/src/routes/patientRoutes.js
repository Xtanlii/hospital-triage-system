const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const triageController = require('../controllers/triageController');
const queueController = require('../controllers/queueController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { validatePatient } = require('../validators/patientValidators');

// Base path: /api/patients
router.use(authenticateToken);

router.post('/', requireRole('NURSE', 'ADMIN'), validateRequest(validatePatient, false), patientController.createPatient);
router.get('/', patientController.getPatients);
router.get('/:id', patientController.getPatientById);
router.put('/:id', requireRole('NURSE', 'ADMIN'), validateRequest(validatePatient, true), patientController.updatePatient);

// Nested clinical history endpoints
router.get('/:patientId/triage', triageController.getPatientTriageHistory);
router.get('/:patientId/queue', queueController.getPatientQueue);

module.exports = router;

