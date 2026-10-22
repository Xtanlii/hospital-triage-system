const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRequest } = require('../middleware/validationMiddleware');
const { validateLogin, validateRegister } = require('../validators/authValidators');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/register', validateRequest(validateRegister), authController.register);
router.post('/login', validateRequest(validateLogin), authController.login);
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;

