const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const apiKeyRepo = require('../db/repositories/apiKeyRepository');
const { decrypt } = require('../utils/encryption');
const { fetchModels, PROVIDERS } = require('../services/llmService');

router.use(authenticate);

/**
 * GET /api/models
 * Fetch models for a provider.
 * Query params:
 *   provider: 'openai' | 'groq' | 'gemini' | 'openrouter' | 'xai' | 'huggingface' | 'ollama'
 *   apiKey: optional raw key for testing before saving
 *   ollamaHost: optional host for Ollama
 *   ollamaPort: optional port for Ollama
 */
router.get('/', async (req, res, next) => {
  try {
    const { provider = 'groq', apiKey, ollamaHost = 'localhost', ollamaPort = 11434 } = req.query;

    if (!PROVIDERS[provider]) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PROVIDER', message: `Unknown provider: ${provider}` }
      });
    }

    let effectiveKey = apiKey;

    // If key not provided in query, look up in database
    if (!effectiveKey && provider !== 'ollama') {
      const storedKey = await apiKeyRepo.findByProvider(req.user.id, provider);
      if (storedKey && storedKey.api_key_enc) {
        try {
          effectiveKey = decrypt(storedKey.api_key_enc);
        } catch (e) {
          console.warn('Failed to decrypt stored key:', e.message);
        }
      }
    }

    if (PROVIDERS[provider].requiresKey && !effectiveKey) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'KEY_REQUIRED',
          message: `An API key is required for ${PROVIDERS[provider].name}`
        }
      });
    }

    const models = await fetchModels(provider, effectiveKey, ollamaHost, ollamaPort);

    res.json({
      success: true,
      data: {
        provider,
        models,
        defaultModel: PROVIDERS[provider].defaultModel
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
