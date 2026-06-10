/**
 * Authentication Controller
 * Handles user registration and login
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Generate JWT token with user id in payload
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @route   POST /api/auth/register
// @desc    Register new user
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Hash password (never store plain text passwords)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into database
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name.trim(), email.toLowerCase(), hashedPassword]
    );

    const token = generateToken(result.insertId);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        id: result.insertId,
        name: name.trim(),
        email: email.toLowerCase(),
        onboarding_completed: false,
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
};

// @route   POST /api/auth/login
// @desc    Login user and return JWT
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const [users] = await pool.query(
      'SELECT id, name, email, password, onboarding_completed FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = users[0];

    // Compare entered password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        onboarding_completed: !!user.onboarding_completed,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// @route   GET /api/auth/me
// @desc    Get current logged-in user profile
const getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, created_at, onboarding_completed FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: users[0],
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = { register, login, getMe };
