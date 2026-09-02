const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const {
  register, login, me, forgotPassword, resetPassword,
  registerValidation, loginValidation
} = require('../controllers/authController');
const { body } = require('express-validator');

// Rate limit applied to all auth routes
router.use(authLimiter);

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', [body('email').isEmail().normalizeEmail()], forgotPassword);
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('resetCode').notEmpty().withMessage('Reset code is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], resetPassword);

// Protected route — requires valid JWT
router.get('/me', authMiddleware, me);

// Logout is handled client-side by deleting the token from localStorage.
// A token blacklist can be added later if needed.
router.post('/logout', (req, res) => {
  res.json({ success: true, data: { message: 'Logged out successfully' } });
});

module.exports = router;
