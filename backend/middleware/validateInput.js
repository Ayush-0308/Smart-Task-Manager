/**
 * Simple input validation middleware
 * Keeps controllers clean and returns consistent error messages
 */

const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Valid email is required');
  }
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }
  next();
};

const validateTask = (req, res, next) => {
  const { title, description, status, due_date } = req.body;
  const errors = [];

  if (!title || title.trim().length < 1) {
    errors.push('Task title is required');
  }
  if (title && title.length > 200) {
    errors.push('Title cannot exceed 200 characters');
  }
  if (status && !['pending', 'completed'].includes(status)) {
    errors.push('Status must be pending or completed');
  }
  if (due_date && due_date !== '' && Number.isNaN(new Date(due_date).getTime())) {
    errors.push('Due date must be a valid date and time');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }
  next();
};

module.exports = { validateRegister, validateLogin, validateTask };
