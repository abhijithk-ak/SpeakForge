const { pool } = require('../../config/db');

const findByUserId = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM user_profiles WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
};

const create = async (userId, data = {}) => {
  const result = await pool.query(
    `INSERT INTO user_profiles (user_id, full_name)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, data.full_name || null]
  );
  return result.rows[0];
};

const update = async (userId, data) => {
  const fields = [];
  const values = [];
  let i = 1;

  const allowed = [
    'full_name', 'avatar_url', 'role', 'experience_level',
    'primary_goal', 'employment_status', 'target_role',
    'industry', 'preferred_coach', 'fields', 'goals',
    'experience', 'onboarding_complete'
  ];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${i++}`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) return findByUserId(userId);

  values.push(userId);
  const result = await pool.query(
    `UPDATE user_profiles SET ${fields.join(', ')}, updated_at = NOW()
     WHERE user_id = $${i}
     RETURNING *`,
    values
  );
  return result.rows[0];
};

module.exports = { findByUserId, create, update };
