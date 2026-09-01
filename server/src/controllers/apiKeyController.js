const { encrypt, decrypt } = require('../utils/encryption');
const apiKeyRepo = require('../db/repositories/apiKeyRepository');
const { fetchAvailableModels, generateResponse, DEFAULT_MODELS } = require('../services/llmService');

const ALLOWED_PROVIDERS = ['groq', 'gemini', 'openai'];

/**
 * GET /api/keys
 * Returns all configured providers for the authenticated user along with selected models.
 */
const getKeys = async (req, res, next) => {
  try {
    const rows = await apiKeyRepo.findAllByUser(req.user.id);

    const masked = rows.map(r => ({
      provider:      r.provider,
      isActive:      r.is_active,
      selectedModel: r.selected_model || DEFAULT_MODELS[r.provider],
      defaultModel:  DEFAULT_MODELS[r.provider],
      updatedAt:     r.updated_at,
      keyPreview:    r.api_key_enc ? '••••' + decrypt(r.api_key_enc).slice(-4) : null
    }));

    res.json({ success: true, data: masked });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/keys/:provider
 * Save (or update) an API key for a given provider, optionally setting selectedModel.
 */
const saveKey = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { apiKey, selectedModel } = req.body;

    if (!ALLOWED_PROVIDERS.includes(provider)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PROVIDER', message: `Provider must be one of: ${ALLOWED_PROVIDERS.join(', ')}` }
      });
    }

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_KEY', message: 'API key is required and must be at least 8 characters.' }
      });
    }

    const encrypted = encrypt(apiKey.trim());
    const modelToSave = selectedModel || DEFAULT_MODELS[provider];
    const row = await apiKeyRepo.upsert(req.user.id, provider, encrypted, modelToSave);

    res.json({
      success: true,
      data: {
        provider:      row.provider,
        selectedModel: row.selected_model || modelToSave,
        isActive:      row.is_active,
        updatedAt:     row.updated_at
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/keys/:provider/model
 * Update selected model for an existing provider key.
 */
const selectModel = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { selectedModel } = req.body;

    if (!ALLOWED_PROVIDERS.includes(provider)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_PROVIDER' } });
    }

    if (!selectedModel || typeof selectedModel !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_MODEL', message: 'Selected model is required.' }
      });
    }

    const row = await apiKeyRepo.updateModel(req.user.id, provider, selectedModel.trim());
    if (!row) {
      return res.status(404).json({ success: false, error: { code: 'KEY_NOT_FOUND', message: `No ${provider} key configured.` } });
    }

    res.json({
      success: true,
      data: {
        provider:      row.provider,
        selectedModel: row.selected_model,
        updatedAt:     row.updated_at
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/keys/:provider/models
 * Fetch live available models for a provider using the stored API key.
 */
const getAvailableModels = async (req, res, next) => {
  try {
    const { provider } = req.params;

    if (!ALLOWED_PROVIDERS.includes(provider)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_PROVIDER' } });
    }

    const row = await apiKeyRepo.findByProvider(req.user.id, provider);
    if (!row) {
      return res.status(404).json({
        success: false,
        error: { code: 'KEY_NOT_FOUND', message: `No ${provider} key configured.` }
      });
    }

    const apiKey = decrypt(row.api_key_enc);
    const models = await fetchAvailableModels(provider, apiKey);

    res.json({
      success: true,
      data: {
        provider,
        models,
        selectedModel: row.selected_model || DEFAULT_MODELS[provider]
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/keys/:provider
 * Remove a stored API key.
 */
const deleteKey = async (req, res, next) => {
  try {
    const { provider } = req.params;

    if (!ALLOWED_PROVIDERS.includes(provider)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PROVIDER', message: 'Unknown provider.' }
      });
    }

    await apiKeyRepo.remove(req.user.id, provider);
    res.json({ success: true, data: { message: `${provider} key removed.` } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/keys/:provider/test
 * Quick connectivity & AI model verification test — performs a test generation call.
 */
const testKey = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { model } = req.body || {};

    if (!ALLOWED_PROVIDERS.includes(provider)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_PROVIDER' } });
    }

    const row = await apiKeyRepo.findByProvider(req.user.id, provider);
    if (!row) {
      return res.status(404).json({
        success: false,
        error: { code: 'KEY_NOT_FOUND', message: `No ${provider} key configured.` }
      });
    }

    const apiKey = decrypt(row.api_key_enc);
    const testModel = model || row.selected_model || DEFAULT_MODELS[provider];

    let testPassed = false;
    let errorMsg   = null;
    let availableModels = [];

    try {
      // 1. Fetch available models to verify key validity and list models
      availableModels = await fetchAvailableModels(provider, apiKey);

      // 2. Perform a test generation call with the specific selected model
      const testMessages = [
        { role: 'user', content: 'Say "OK"' }
      ];

      const responseText = await generateResponse(provider, apiKey, testMessages, testModel);
      if (responseText) {
        testPassed = true;
      }
    } catch (testErr) {
      testPassed = false;
      errorMsg = testErr.message;
    }

    if (testPassed) {
      // Update selected_model in DB if specified in test request
      if (model && model !== row.selected_model) {
        await apiKeyRepo.updateModel(req.user.id, provider, model);
      }

      res.json({
        success: true,
        data: {
          status: 'connected',
          provider,
          model: testModel,
          availableModels
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          code: 'KEY_OR_MODEL_INVALID',
          message: errorMsg || `${provider} key or model (${testModel}) failed health check.`,
          availableModels
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = { getKeys, saveKey, selectModel, getAvailableModels, deleteKey, testKey };
