const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const {
  register, login, me,
  registerValidation, loginValidation
} = require('../controllers/authController');

// Rate limit applied to all auth routes
router.use(authLimiter);

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected route — requires valid JWT
router.get('/me', authMiddleware, me);

// Logout is handled client-side by deleting the token from localStorage.
// A token blacklist can be added later if needed.
router.post('/logout', (req, res) => {
  res.json({ success: true, data: { message: 'Logged out successfully' } });
});

module.exports = router;
