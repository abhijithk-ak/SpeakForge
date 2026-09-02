const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const settingsRepo = require('../db/repositories/settingsRepository');
const apiKeyRepo = require('../db/repositories/apiKeyRepository');
const { encrypt, decrypt } = require('../utils/encryption');
const { PROVIDERS } = require('../services/llmService');

router.use(authenticate);

/**
 * GET /api/settings
 * Get current user settings (sensitive API key is never returned raw)
 */
router.get('/', async (req, res, next) => {
  try {
    let settings = await settingsRepo.findByUserId(req.user.id);
    if (!settings) {
      // Default initial settings
      settings = await settingsRepo.upsert(req.user.id, {
        ai_provider: 'groq',
        ai_model: 'llama-3.3-70b-versatile',
        ollama_host: 'localhost',
        ollama_port: 11434,
        voice_rate: 1.0,
        voice_pitch: 1.0,
        preferences: {
          defaultMode: 'interview',
          domain: 'Tech',
          difficulty: 'intermediate',
          feedbackStyle: 'balanced'
        }
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/settings
 * Update settings: ai_provider, ai_model, ollama_host, ollama_port, apiKey, voice_name, voice_rate, voice_pitch, preferences
 */
router.put('/', async (req, res, next) => {
  try {
    const {
      ai_provider,
      ai_model,
      ollama_host,
      ollama_port,
      apiKey,
      voice_name,
      voice_rate,
      voice_pitch,
      preferences
    } = req.body;

    const updateData = {};

    if (ai_provider !== undefined) {
      if (!PROVIDERS[ai_provider]) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PROVIDER', message: `Unknown provider: ${ai_provider}` }
        });
      }
      updateData.ai_provider = ai_provider;
    }

    if (ai_model !== undefined) updateData.ai_model = ai_model;
    if (ollama_host !== undefined) updateData.ollama_host = ollama_host;
    if (ollama_port !== undefined) updateData.ollama_port = ollama_port;
    if (voice_name !== undefined) updateData.voice_name = voice_name;
    if (voice_rate !== undefined) updateData.voice_rate = voice_rate;
    if (voice_pitch !== undefined) updateData.voice_pitch = voice_pitch;
    if (preferences !== undefined) updateData.preferences = preferences;

    if (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 4) {
      const encrypted = encrypt(apiKey.trim());
      updateData.encrypted_api_key = encrypted;

      // Also upsert in user_api_keys for backwards compatibility
      if (ai_provider && ai_provider !== 'ollama') {
        await apiKeyRepo.upsert(req.user.id, ai_provider, encrypted);
      }
    }

    const saved = await settingsRepo.upsert(req.user.id, updateData);

    res.json({
      success: true,
      data: saved
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
