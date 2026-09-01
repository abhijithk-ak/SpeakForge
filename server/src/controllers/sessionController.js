const sessionRepo = require('../db/repositories/sessionRepository');
const apiKeyRepo  = require('../db/repositories/apiKeyRepository');
const { decrypt } = require('../utils/encryption');
const { generateResponse, buildSystemPrompt } = require('../services/llmService');

/**
 * POST /api/sessions
 * Create a new practice session.
 */
const createSession = async (req, res, next) => {
  try {
    const { mode, role, coach_personality, difficulty, topic, scenario, client_personality } = req.body;

    if (!mode || !['interview', 'speech', 'client'].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_MODE', message: 'mode must be: interview | speech | client' }
      });
    }

    const session = await sessionRepo.create(req.user.id, {
      mode, role, coach_personality, difficulty
    });

    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/sessions
 * Get all sessions for the authenticated user.
 */
const getSessions = async (req, res, next) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit  || '20', 10), 50);
    const offset = parseInt(req.query.offset || '0', 10);
    const sessions = await sessionRepo.findAllByUser(req.user.id, limit, offset);
    res.json({ success: true, data: sessions });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/sessions/:id
 * Get a single session with its turns.
 */
const getSession = async (req, res, next) => {
  try {
    const session = await sessionRepo.findById(req.params.id, req.user.id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }
    const turns = await sessionRepo.getTurns(req.params.id);
    res.json({ success: true, data: { ...session, turns } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/sessions/:id/start
 * Mark the session as started — returns the opening message from the AI coach.
 */
const startSession = async (req, res, next) => {
  try {
    const session = await sessionRepo.findById(req.params.id, req.user.id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    // Get the user's preferred/configured LLM provider
    const { provider, topic, scenario, client_personality } = req.body;
    const safeProvider = provider || 'groq';

    const keyRow = await apiKeyRepo.findByProvider(req.user.id, safeProvider);
    if (!keyRow) {
      return res.status(400).json({
        success: false,
        error: {
          code:    'NO_API_KEY',
          message: `No ${safeProvider} API key configured. Go to Settings → AI Provider.`
        }
      });
    }

    const apiKey = decrypt(keyRow.api_key_enc);
    const selectedModel = keyRow.selected_model;

    const systemPrompt = buildSystemPrompt(session.mode, {
      role:              session.role,
      difficulty:        session.difficulty,
      coach_personality: session.coach_personality,
      topic,
      scenario,
      client_personality
    });

    // Initiate greeting from the AI — prompt must end with a user role for providers like Groq
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Hello! I am ready for our session. Please greet me and start.' }
    ];
    const opening = await generateResponse(safeProvider, apiKey, messages, selectedModel);

    // Mark session as started
    await sessionRepo.start(session.id, req.user.id);

    // Save the opening as turn 0 (assistant only)
    await sessionRepo.addTurn(session.id, 0, '', opening);

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        opening,
        provider: safeProvider,
        model: selectedModel
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/sessions/:id/turn
 * Process one conversation turn: user text → AI response.
 * Body: { transcript: string, provider: string, turnNumber: number, topic?, scenario?, client_personality? }
 */
const processTurn = async (req, res, next) => {
  try {
    const session = await sessionRepo.findById(req.params.id, req.user.id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    const { transcript, provider, turnNumber, topic, scenario, client_personality } = req.body;

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'EMPTY_TRANSCRIPT', message: 'Transcript is required.' }
      });
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

    // Build full conversation history for context
    const systemPrompt = buildSystemPrompt(session.mode, {
      role:              session.role,
      difficulty:        session.difficulty,
      coach_personality: session.coach_personality,
      topic,
      scenario,
      client_personality
    });

    const existingTurns = await sessionRepo.getTurns(session.id);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...existingTurns
        .filter(t => t.content)
        .map(t => ({
          role:    t.speaker === 'user' ? 'user' : 'assistant',
          content: t.content
        })),
      { role: 'user', content: transcript.trim() }
    ];

    const aiResponse = await generateResponse(safeProvider, apiKey, messages, selectedModel);

    // Persist the turn
    await sessionRepo.addTurn(session.id, turnNumber || existingTurns.length + 1, transcript.trim(), aiResponse);

    res.json({
      success: true,
      data: {
        response:   aiResponse,
        turnNumber: turnNumber || existingTurns.length + 1
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/sessions/:id/end
 * End the session. Returns session summary.
 */
const endSession = async (req, res, next) => {
  try {
    const session = await sessionRepo.end(req.params.id, req.user.id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }
    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSession, getSessions, getSession, startSession, processTurn, endSession };
