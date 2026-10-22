const prisma = require('../config/db');
const { NotFoundError } = require('../middleware/errorMiddleware');

async function getAllUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        full_name: true,
        username: true,
        role: true,
        department: true,
        is_on_duty: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users
    });
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.params.id },
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
      throw new NotFoundError(`User with ID '${req.params.id}' not found`);
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllUsers,
  getUserById
};
