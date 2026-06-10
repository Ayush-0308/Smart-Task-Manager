const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { completeOnboarding } = require('../controllers/workspaceController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validateInput');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', protect, getMe);
router.post('/onboarding', protect, completeOnboarding);

module.exports = router;
