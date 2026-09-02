// Business logic for authentication.
// Controllers call this — they don't implement logic directly.

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../db/repositories/userRepository');
const profileRepository = require('../db/repositories/profileRepository');
const usageRepository = require('../db/repositories/usageRepository');
const logger = require('../utils/logger');

const SALT_ROUNDS = 12;

// Creates a signed JWT containing the user's ID.
// The token expires after JWT_EXPIRES_IN (e.g. 7d).
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async (email, password) => {
  // Check if email is already registered
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.code = 'EMAIL_EXISTS';
    throw err;
  }

  // Hash the password before storing — never store plaintext
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user, then immediately create their profile and usage plan
  const user = await userRepository.create(email, passwordHash);
  await profileRepository.create(user.id);
  await usageRepository.createPlanForUser(user.id);

  logger.info('New user registered', { userId: user.id });

  const token = generateToken(user.id);
  return { user, token };
};

const login = async (email, password) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  // Compare the provided password against the stored hash
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    const err = new Error('Invalid email or password');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  logger.info('User logged in', { userId: user.id });

  const token = generateToken(user.id);

  // Don't return password_hash to the client
  const { password_hash, ...safeUser } = user;
  return { user: safeUser, token };
};

const crypto = require('crypto');
const { pool } = require('../config/db');

const forgotPassword = async (email) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    // Return friendly message without leaking user existence
    return { message: 'If an account exists with that email, a password reset code has been generated.' };
  }

  // Generate a random 6-character reset code or hex token
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Expire previous tokens for user
  await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

  // Insert new token valid for 1 hour
  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
    [user.id, resetCode]
  );

  logger.info('Password reset token generated', { userId: user.id });

  return {
    message: 'Password reset code generated.',
    // Returning resetCode allows demo/local usage without third-party email configuration
    resetCode
  };
};

const resetPassword = async (email, resetCode, newPassword) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or reset code');
    err.code = 'INVALID_RESET';
    throw err;
  }

  const tokenRes = await pool.query(
    `SELECT * FROM password_reset_tokens
     WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW()`,
    [user.id, resetCode]
  );

  if (tokenRes.rows.length === 0) {
    const err = new Error('Invalid or expired reset code');
    err.code = 'INVALID_RESET';
    throw err;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, user.id]);
  await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

  logger.info('Password reset successful', { userId: user.id });
  return { message: 'Password reset successfully. You can now sign in with your new password.' };
};

const getUserFromToken = async (userId) => {
  return await userRepository.findById(userId);
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getUserFromToken,
  generateToken
};

