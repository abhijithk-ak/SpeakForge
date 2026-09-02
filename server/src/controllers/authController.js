const { body, validationResult } = require('express-validator');
const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Validation rules — these run before the controller function
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

const register = async (req, res, next) => {
  try {
    // Check validation errors from the middleware above
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'VALIDATION_ERROR', errors.array()[0].msg, 400);
    }

    const { email, password } = req.body;
    const { user, token } = await authService.register(email, password);

    return sendSuccess(res, { user, token }, 201);
  } catch (err) {
    if (err.code === 'EMAIL_EXISTS') {
      return sendError(res, 'EMAIL_EXISTS', err.message, 409);
    }
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'VALIDATION_ERROR', errors.array()[0].msg, 400);
    }

    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);

    return sendSuccess(res, { user, token });
  } catch (err) {
    if (err.code === 'INVALID_CREDENTIALS') {
      return sendError(res, 'INVALID_CREDENTIALS', err.message, 401);
    }
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    // req.user.id comes from authMiddleware — never from the request body
    const user = await authService.getUserFromToken(req.user.id);
    if (!user) {
      return sendError(res, 'NOT_FOUND', 'User not found', 404);
    }
    return sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'VALIDATION_ERROR', errors.array()[0].msg, 400);
    }
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'VALIDATION_ERROR', errors.array()[0].msg, 400);
    }
    const { email, resetCode, newPassword } = req.body;
    const result = await authService.resetPassword(email, resetCode, newPassword);
    return sendSuccess(res, result);
  } catch (err) {
    if (err.code === 'INVALID_RESET') {
      return sendError(res, 'INVALID_RESET', err.message, 400);
    }
    next(err);
  }
};

module.exports = {
  register,
  login,
  me,
  forgotPassword,
  resetPassword,
  registerValidation,
  loginValidation
};
