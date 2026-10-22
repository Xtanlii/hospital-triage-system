const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Base path: /api/users
router.use(authenticateToken);

router.get('/', requireRole('ADMIN'), userController.getAllUsers);
router.get('/:id', userController.getUserById);

module.exports = router;

