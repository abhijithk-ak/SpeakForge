const { pool }        = require('../config/db');
const sessionRepo     = require('../db/repositories/sessionRepository');
const apiKeyRepo      = require('../db/repositories/apiKeyRepository');
const { decrypt }     = require('../utils/encryption');
const { generateEvaluation } = require('../services/llmService');

/**
 * POST /api/evaluations/:sessionId
 * Generate and save an evaluation for a completed session.
 */
const createEvaluation = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { provider }  = req.body;

    const session = await sessionRepo.findById(sessionId, req.user.id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'SESSION_NOT_FOUND' } });
    }

    // Check if already evaluated
    const existing = await pool.query(
      'SELECT id FROM evaluations WHERE session_id = $1',
      [sessionId]
    );
    if (existing.rows.length > 0) {
      const eval_ = await pool.query('SELECT * FROM evaluations WHERE session_id = $1', [sessionId]);
      return res.json({ success: true, data: eval_.rows[0] });
    }

    const safeProvider = provider || 'groq';
    const keyRow = await apiKeyRepo.findByProvider(req.user.id, safeProvider);
    if (!keyRow) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_API_KEY', message: `No ${safeProvider} API key configured.` }
      });
    }

    const apiKey = decrypt(keyRow.api_key_enc);
    const selectedModel = keyRow.selected_model;
    const transcript = await sessionRepo.getTranscriptText(sessionId);

    if (!transcript.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'EMPTY_SESSION', message: 'No conversation turns found for this session.' }
      });
    }

    const scores = await generateEvaluation(safeProvider, apiKey, transcript, selectedModel);

    // Persist evaluation
    const result = await pool.query(
      `INSERT INTO evaluations
         (session_id, user_id, overall_score, clarity_score, fluency_score,
          confidence_score, structure_score, vocabulary_score, relevance_score,
          filler_word_count, filler_word_score, strengths, improvements,
          specific_feedback, raw_analysis)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        sessionId,
        req.user.id,
        scores.overall_score     || 0,
        scores.clarity_score     || 0,
        scores.fluency_score     || 0,
        scores.confidence_score  || 0,
        scores.structure_score   || 0,
        scores.vocabulary_score  || 0,
        scores.relevance_score   || 0,
        scores.filler_word_count || 0,
        scores.filler_word_score || 100,
        JSON.stringify(scores.strengths    || []),
        JSON.stringify(scores.improvements || []),
        scores.specific_feedback || '',
        JSON.stringify(scores)
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/evaluations/:sessionId
 * Get the evaluation for a session.
 */
const getEvaluation = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT e.* FROM evaluations e
       JOIN practice_sessions ps ON ps.id = e.session_id
       WHERE e.session_id = $1 AND ps.user_id = $2`,
      [req.params.sessionId, req.user.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { createEvaluation, getEvaluation };
