const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Base path: /api/queue
router.use(authenticateToken);

router.get('/', queueController.getQueue);
router.get('/:id', queueController.getQueueEntry);
router.patch('/:id/status', requireRole('NURSE', 'ADMIN', 'DOCTOR'), queueController.updateStatus);
router.patch('/:id/attend', requireRole('NURSE', 'ADMIN', 'DOCTOR'), queueController.attendPatient);
router.patch('/:id/cancel', requireRole('NURSE', 'ADMIN', 'DOCTOR'), queueController.cancelPatient);

module.exports = router;