const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const env = require('../config/env');
const { ConflictError, AuthError, NotFoundError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

async function register(req, res, next) {
  try {
    const { full_name, username, password, role, department } = req.body;

    const normalizedUsername = username.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { username: normalizedUsername }
    });

    if (existing) {
      throw new ConflictError(`Username '${normalizedUsername}' is already taken`);
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        full_name: full_name.trim(),
        username: normalizedUsername,
        password_hash,
        role: role.toUpperCase(),
        department: department ? department.trim() : null,
        is_on_duty: false
      },
      select: {
        user_id: true,
        full_name: true,
        username: true,
        role: true,
        department: true,
        is_on_duty: true,
        created_at: true
      }
    });

    const token = jwt.sign(
      { 
        userId: user.user_id, 
        username: user.username, 
        role: user.role,
        department: user.department,
        isOnDuty: user.is_on_duty
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    logger.info(`User registered: ${user.username} (${user.role}) - Dept: ${user.department || 'N/A'}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user
      }
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const normalizedUsername = username.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername }
    });

    if (!user) {
      throw new AuthError('Invalid username or password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AuthError('Invalid username or password');
    }

    const token = jwt.sign(
      { 
        userId: user.user_id, 
        username: user.username, 
        role: user.role,
        department: user.department,
        isOnDuty: user.is_on_duty
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    logger.info(`User logged in: ${user.username} (${user.role}) - Dept: ${user.department || 'N/A'}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          username: user.username,
          role: user.role,
          department: user.department,
          is_on_duty: user.is_on_duty,
          created_at: user.created_at
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.userId },
      select: {
        user_id: true,
        full_name: true,
        username: true,
        role: true,
        department: true,
        is_on_duty: true,
        created_at: true
      }
    });

    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    res.status(200).json({
      success: true,
      message: 'Current user profile fetched successfully',
      data: user
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe
};
