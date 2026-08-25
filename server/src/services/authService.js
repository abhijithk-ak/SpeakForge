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

const getUserFromToken = async (userId) => {
  return await userRepository.findById(userId);
};

module.exports = { register, login, getUserFromToken, generateToken };
