const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Base path: /api/admin
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

router.get('/dashboard', adminController.getDashboard);
router.get('/queue', adminController.getAdminQueue);
router.get('/alerts', adminController.getAlerts);
router.get('/statistics', adminController.getStatistics);
router.get('/patients', adminController.getAdminPatients);
router.get('/assessments', adminController.getAdminAssessments);
router.get('/predictions', adminController.getAdminPredictions);

module.exports = router;

