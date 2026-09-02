const sessionRepo = require('../db/repositories/sessionRepository');
const apiKeyRepo  = require('../db/repositories/apiKeyRepository');
const settingsRepo = require('../db/repositories/settingsRepository');
const profileRepo = require('../db/repositories/profileRepository');
const { decrypt } = require('../utils/encryption');
const { chat, streamChat, buildSystemPrompt, PROVIDERS } = require('../services/llmService');

/**
 * Helper to resolve provider credentials (apiKey or local host/port)
 */
async function resolveProviderCredentials(userId, preferredProvider, requestedModel) {
  // First check user_settings
  const settings = await settingsRepo.getWithEncryptedKey(userId);

  const provider = preferredProvider || settings?.ai_provider || 'groq';
  const model = requestedModel || settings?.ai_model || PROVIDERS[provider]?.defaultModel;
  const ollamaHost = settings?.ollama_host || 'localhost';
  const ollamaPort = settings?.ollama_port || 11434;

  let apiKey = null;

  if (PROVIDERS[provider]?.requiresKey) {
    // Check if key is in user_settings
    if (settings?.encrypted_api_key && settings?.ai_provider === provider) {
      try {
        apiKey = decrypt(settings.encrypted_api_key);
      } catch (e) {}
    }

    // Fallback to user_api_keys table
    if (!apiKey) {
      const keyRow = await apiKeyRepo.findByProvider(userId, provider);
      if (keyRow?.api_key_enc) {
        try {
          apiKey = decrypt(keyRow.api_key_enc);
        } catch (e) {}
      }
    }
  }

  return { provider, model, apiKey, ollamaHost, ollamaPort };
}

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
 * Starts session and returns initial coach greeting
 */
const startSession = async (req, res, next) => {
  try {
    const session = await sessionRepo.findById(req.params.id, req.user.id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    const { provider: reqProvider, model: reqModel, topic, scenario, client_personality } = req.body;
    const { provider, model, apiKey, ollamaHost, ollamaPort } = await resolveProviderCredentials(req.user.id, reqProvider, reqModel);

    if (PROVIDERS[provider]?.requiresKey && !apiKey) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_API_KEY',
          message: `No ${PROVIDERS[provider]?.name || provider} API key configured. Configure your key in Settings.`
        }
      });
    }

    const userProfile = (await profileRepo.findByUserId(req.user.id)) || {};

    const systemPrompt = buildSystemPrompt(session.mode, {
      role:              session.role,
      difficulty:        session.difficulty,
      coach_personality: session.coach_personality,
      topic,
      scenario,
      client_personality
    }, userProfile);

    // Initial greeting prompt
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Hello! I am ready for our session. Please greet me warmly and start.' }
    ];

    const opening = await chat(provider, apiKey, model, messages, ollamaHost, ollamaPort);

    await sessionRepo.start(session.id, req.user.id);
    await sessionRepo.addTurn(session.id, 0, '', opening);

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        opening,
        provider,
        model
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/sessions/:id/turn
 * Standard non-streaming turn
 */
const processTurn = async (req, res, next) => {
  try {
    const session = await sessionRepo.findById(req.params.id, req.user.id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    const { transcript, messages: clientHistory, provider: reqProvider, model: reqModel, turnNumber, topic, scenario, client_personality } = req.body;

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'EMPTY_TRANSCRIPT', message: 'Transcript is required.' }
      });
    }

    const { provider, model, apiKey, ollamaHost, ollamaPort } = await resolveProviderCredentials(req.user.id, reqProvider, reqModel);

    if (PROVIDERS[provider]?.requiresKey && !apiKey) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_API_KEY', message: `No ${provider} API key configured.` }
      });
    }

    const userProfile = (await profileRepo.findByUserId(req.user.id)) || {};

    const systemPrompt = buildSystemPrompt(session.mode, {
      role:              session.role,
      difficulty:        session.difficulty,
      coach_personality: session.coach_personality,
      topic,
      scenario,
      client_personality
    }, userProfile);

    // Build messages array: prioritize full clientHistory if supplied (BUG 3 fix)
    let messages = [];
    if (Array.isArray(clientHistory) && clientHistory.length > 0) {
      messages = [
        { role: 'system', content: systemPrompt },
        ...clientHistory.filter(m => m.role !== 'system')
      ];
    } else {
      const existingTurns = await sessionRepo.getTurns(session.id);
      messages = [
        { role: 'system', content: systemPrompt },
        ...existingTurns
          .filter(t => t.content)
          .map(t => ({
            role:    (t.speaker === 'user' || t.role === 'user') ? 'user' : 'assistant',
            content: t.content
          })),
        { role: 'user', content: transcript.trim() }
      ];
    }

    const aiResponse = await chat(provider, apiKey, model, messages, ollamaHost, ollamaPort);

    // Use provided turnNumber, or compute safe sequential integer from existing turns
    const safeTurnNumber = (turnNumber && Number.isInteger(turnNumber) && turnNumber < 2147483647)
      ? turnNumber
      : ((await sessionRepo.getTurns(session.id)).length + 1);

    await sessionRepo.addTurn(session.id, safeTurnNumber, transcript.trim(), aiResponse);

    res.json({
      success: true,
      data: {
        response:   aiResponse,
        turnNumber: safeTurnNumber
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/sessions/:id/stream
 * Streaming SSE endpoint for real-time sentence-chunked voice output
 */
const streamTurn = async (req, res, next) => {
  try {
    const session = await sessionRepo.findById(req.params.id, req.user.id);
    if (!session) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    const { transcript, messages: clientHistory, provider: reqProvider, model: reqModel, turnNumber, topic, scenario, client_personality } = req.body;

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ success: false, error: { code: 'EMPTY_TRANSCRIPT' } });
    }

    const { provider, model, apiKey, ollamaHost, ollamaPort } = await resolveProviderCredentials(req.user.id, reqProvider, reqModel);

    if (PROVIDERS[provider]?.requiresKey && !apiKey) {
      return res.status(400).json({ success: false, error: { code: 'NO_API_KEY' } });
    }

    const userProfile = (await profileRepo.findByUserId(req.user.id)) || {};

    const systemPrompt = buildSystemPrompt(session.mode, {
      role:              session.role,
      difficulty:        session.difficulty,
      coach_personality: session.coach_personality,
      topic,
      scenario,
      client_personality
    }, userProfile);

    let messages = [];
    if (Array.isArray(clientHistory) && clientHistory.length > 0) {
      messages = [
        { role: 'system', content: systemPrompt },
        ...clientHistory.filter(m => m.role !== 'system')
      ];
    } else {
      const existingTurns = await sessionRepo.getTurns(session.id);
      messages = [
        { role: 'system', content: systemPrompt },
        ...existingTurns
          .filter(t => t.content)
          .map(t => ({
            role:    (t.speaker === 'user' || t.role === 'user') ? 'user' : 'assistant',
            content: t.content
          })),
        { role: 'user', content: transcript.trim() }
      ];
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    await streamChat({
      provider,
      apiKey,
      model,
      messages,
      customHost: ollamaHost,
      customPort: ollamaPort,
      onSentenceChunk: (sentence) => {
        res.write(`data: ${JSON.stringify({ type: 'sentence', text: sentence })}\n\n`);
      },
      onDone: async (fullText) => {
        try {
          const safeTurnNum = (turnNumber && Number.isInteger(turnNumber) && turnNumber < 2147483647)
            ? turnNumber
            : ((await sessionRepo.getTurns(session.id)).length + 1);
          await sessionRepo.addTurn(session.id, safeTurnNum, transcript.trim(), fullText);
        } catch (dbErr) {
          console.error('Failed to save turn from stream:', dbErr.message);
        }
        res.write(`data: ${JSON.stringify({ type: 'done', fullText })}\n\n`);
        res.end();
      },
      onError: (err) => {
        console.error('Streaming turn error:', err.message);
        res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
        res.end();
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/sessions/:id/end
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

module.exports = {
  createSession,
  getSessions,
  getSession,
  startSession,
  processTurn,
  streamTurn,
  endSession
};
