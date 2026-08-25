// All database queries for users live here.
// Never write SQL inside controllers or services.

const { pool } = require('../../config/db');

const findByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
    [email]
  );
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await pool.query(
    'SELECT id, email, onboarding_completed, created_at FROM users WHERE id = $1 AND is_active = TRUE',
    [id]
  );
  return result.rows[0] || null;
};

const create = async (email, passwordHash) => {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email, onboarding_completed, created_at`,
    [email, passwordHash]
  );
  return result.rows[0];
};

const createOAuthUser = async (email) => {
  const result = await pool.query(
    `INSERT INTO users (email)
     VALUES ($1)
     RETURNING id, email, onboarding_completed, created_at`,
    [email]
  );
  return result.rows[0];
};

const markOnboardingComplete = async (userId) => {
  await pool.query(
    'UPDATE users SET onboarding_completed = TRUE, updated_at = NOW() WHERE id = $1',
    [userId]
  );
};

module.exports = {
  findByEmail,
  findById,
  create,
  createOAuthUser,
  markOnboardingComplete
};
