const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Base path: /api/doctor
router.use(authenticateToken);

// Shift / Duty status routes
router.post('/check-in', requireRole('DOCTOR', 'ADMIN'), doctorController.checkIn);
router.post('/check-out', requireRole('DOCTOR', 'ADMIN'), doctorController.checkOut);
router.patch('/duty-status', requireRole('DOCTOR', 'ADMIN'), doctorController.toggleDuty);

// Active doctors counter and metrics
router.get('/active', doctorController.getActiveDoctors);

// Department-scoped queue
router.get('/my-queue', requireRole('DOCTOR'), doctorController.getMyDepartmentQueue);

module.exports = router;
