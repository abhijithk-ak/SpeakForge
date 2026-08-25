const { pool } = require('../../config/db');

const getOrCreatePlan = async (userId) => {
  let result = await pool.query(
    'SELECT * FROM usage_plans WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    result = await pool.query(
      `INSERT INTO usage_plans (user_id) VALUES ($1) RETURNING *`,
      [userId]
    );
  }

  return result.rows[0];
};

const getTodayUsage = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM daily_usage
     WHERE user_id = $1 AND date = CURRENT_DATE`,
    [userId]
  );
  return result.rows[0] || { total_audio_seconds: 0, sessions_count: 0 };
};

const createPlanForUser = async (userId) => {
  await pool.query(
    `INSERT INTO usage_plans (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
};

const getUsageSummary = async (userId) => {
  const [plan, today] = await Promise.all([
    getOrCreatePlan(userId),
    getTodayUsage(userId)
  ]);

  const dailyLimitSeconds = plan.daily_minutes_limit * 60;
  const usedSeconds = today.total_audio_seconds || 0;
  const remainingSeconds = Math.max(0, dailyLimitSeconds - usedSeconds);
  const purchasedRemaining =
    (plan.purchased_minutes - plan.purchased_minutes_used) * 60;

  return {
    plan_type: plan.plan_type,
    daily_limit_minutes: plan.daily_minutes_limit,
    used_today_seconds: usedSeconds,
    remaining_today_seconds: remainingSeconds,
    remaining_today_minutes: Math.floor(remainingSeconds / 60),
    purchased_minutes_remaining: Math.max(0, purchasedRemaining / 60),
    sessions_today: today.sessions_count || 0,
    can_start_session: remainingSeconds > 0 || purchasedRemaining > 0
  };
};

module.exports = {
  getOrCreatePlan,
  getTodayUsage,
  createPlanForUser,
  getUsageSummary
};
