const { pool } = require('../../config/db');

/**
 * Create a new practice session.
 */
const create = async (userId, data) => {
  const result = await pool.query(
    `INSERT INTO practice_sessions
       (user_id, mode, role, coach_personality, difficulty, status)
     VALUES ($1, $2, $3, $4, $5, 'created')
     RETURNING *`,
    [
      userId,
      data.mode,
      data.role             || null,
      data.coach_personality || 'professional',
      data.difficulty        || 'intermediate'
    ]
  );
  return result.rows[0];
};

/**
 * Get a single session (must belong to the user).
 */
const findById = async (sessionId, userId) => {
  const result = await pool.query(
    `SELECT * FROM practice_sessions WHERE id = $1 AND user_id = $2`,
    [sessionId, userId]
  );
  return result.rows[0] || null;
};

/**
 * Get all sessions for a user (paginated).
 */
const findAllByUser = async (userId, limit = 20, offset = 0) => {
  const result = await pool.query(
    `SELECT ps.*, e.overall_score, e.specific_feedback
     FROM practice_sessions ps
     LEFT JOIN evaluations e ON e.session_id = ps.id
     WHERE ps.user_id = $1
     ORDER BY ps.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
};

/**
 * Mark a session as started.
 */
const start = async (sessionId, userId) => {
  const result = await pool.query(
    `UPDATE practice_sessions
     SET status = 'active', started_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [sessionId, userId]
  );
  return result.rows[0];
};

/**
 * Mark a session as ended and record duration.
 */
const end = async (sessionId, userId) => {
  const result = await pool.query(
    `UPDATE practice_sessions
     SET status = 'completed',
         ended_at = NOW(),
         duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [sessionId, userId]
  );
  return result.rows[0];
};

/**
 * Insert a conversation turn (user speech → AI response).
 */
const addTurn = async (sessionId, turnNumber, userText, aiText) => {
  if (userText && userText.trim()) {
    await pool.query(
      `INSERT INTO session_turns (session_id, turn_number, turn_index, speaker, role, content)
       VALUES ($1, $2, $2, 'user', 'user', $3),
              ($1, $2, $2, 'assistant', 'assistant', $4)`,
      [sessionId, turnNumber, userText.trim(), aiText.trim()]
    );
  } else {
    await pool.query(
      `INSERT INTO session_turns (session_id, turn_number, turn_index, speaker, role, content)
       VALUES ($1, $2, $2, 'assistant', 'assistant', $3)`,
      [sessionId, turnNumber, aiText.trim()]
    );
  }
};

/**
 * Get all turns for a session (for building conversation history).
 */
const getTurns = async (sessionId) => {
  const result = await pool.query(
    `SELECT COALESCE(speaker, role) AS speaker, COALESCE(role, speaker) AS role, content, COALESCE(created_at, timestamp, NOW()) AS created_at
     FROM session_turns
     WHERE session_id = $1
     ORDER BY COALESCE(turn_number, turn_index) ASC, COALESCE(created_at, timestamp) ASC`,
    [sessionId]
  );
  return result.rows;
};

/**
 * Get full transcript as a readable string (for evaluation).
 */
const getTranscriptText = async (sessionId) => {
  const turns = await getTurns(sessionId);
  return turns
    .map(t => `${(t.speaker === 'user' || t.role === 'user') ? 'Candidate' : 'Coach'}: ${t.content}`)
    .join('\n\n');
};

module.exports = { create, findById, findAllByUser, start, end, addTurn, getTurns, getTranscriptText };
