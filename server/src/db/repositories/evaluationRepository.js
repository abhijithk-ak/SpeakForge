const { pool } = require('../../config/db');

const getRecentByUserId = async (userId, limit = 5) => {
  const result = await pool.query(
    `SELECT e.*, ps.mode, ps.role, ps.started_at
     FROM evaluations e
     JOIN practice_sessions ps ON e.session_id = ps.id
     WHERE e.user_id = $1
     ORDER BY e.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
};

const getWeeklyTrend = async (userId, days = 14) => {
  const result = await pool.query(
    `SELECT * FROM user_progress
     WHERE user_id = $1
     AND date >= CURRENT_DATE - INTERVAL '${days} days'
     ORDER BY date ASC`,
    [userId]
  );
  return result.rows;
};

const getCountByUserId = async (userId) => {
  const result = await pool.query(
    'SELECT COUNT(*)::integer FROM evaluations WHERE user_id = $1',
    [userId]
  );
  return result.rows[0].count || 0;
};

module.exports = {
  getRecentByUserId,
  getWeeklyTrend,
  getCountByUserId
};
