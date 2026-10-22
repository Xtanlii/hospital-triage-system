function validateRegister(body) {
  const errors = [];
  const { full_name, username, password, role } = body || {};

  if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
    errors.push({ field: 'full_name', message: 'Full name is required' });
  } else if (full_name.trim().length > 100) {
    errors.push({ field: 'full_name', message: 'Full name cannot exceed 100 characters' });
  }

  if (!username || typeof username !== 'string' || !username.trim()) {
    errors.push({ field: 'username', message: 'Username is required' });
  } else if (username.trim().length < 3 || username.trim().length > 50) {
    errors.push({ field: 'username', message: 'Username must be between 3 and 50 characters' });
  }

  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
  }

  const validRoles = ['NURSE', 'ADMIN'];
  if (!role || !validRoles.includes(role.toUpperCase())) {
    errors.push({ field: 'role', message: 'Role must be either NURSE or ADMIN' });
  }

  return errors;
}

function validateLogin(body) {
  const errors = [];
  const { username, password } = body || {};

  if (!username || typeof username !== 'string' || !username.trim()) {
    errors.push({ field: 'username', message: 'Username is required' });
  }

  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return errors;
}

module.exports = {
  validateRegister,
  validateLogin
};

