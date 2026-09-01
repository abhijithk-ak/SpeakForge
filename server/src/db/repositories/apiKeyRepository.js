const { pool } = require('../../config/db');

/**
 * Upsert a provider API key for a user.
 * If the user already has a key for that provider, it is replaced.
 */
const upsert = async (userId, provider, encryptedKey, selectedModel = null) => {
  const result = await pool.query(
    `INSERT INTO user_api_keys (user_id, provider, api_key_enc, selected_model)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, provider)
     DO UPDATE SET api_key_enc   = EXCLUDED.api_key_enc,
                   selected_model = COALESCE(EXCLUDED.selected_model, user_api_keys.selected_model),
                   is_active     = true,
                   updated_at    = NOW()
     RETURNING id, provider, selected_model, is_active, updated_at`,
    [userId, provider, encryptedKey, selectedModel]
  );
  return result.rows[0];
};

/**
 * Update selected model for a user's provider key.
 */
const updateModel = async (userId, provider, selectedModel) => {
  const result = await pool.query(
    `UPDATE user_api_keys
     SET selected_model = $3,
         updated_at     = NOW()
     WHERE user_id = $1 AND provider = $2
     RETURNING id, provider, selected_model, is_active, updated_at`,
    [userId, provider, selectedModel]
  );
  return result.rows[0];
};

/**
 * Get all keys for a user (returns encrypted values — caller decrypts).
 */
const findAllByUser = async (userId) => {
  const result = await pool.query(
    `SELECT id, provider, api_key_enc, selected_model, is_active, updated_at
     FROM user_api_keys
     WHERE user_id = $1
     ORDER BY provider`,
    [userId]
  );
  return result.rows;
};

/**
 * Get a single key by provider for a user.
 */
const findByProvider = async (userId, provider) => {
  const result = await pool.query(
    `SELECT id, api_key_enc, selected_model, is_active
     FROM user_api_keys
     WHERE user_id = $1 AND provider = $2`,
    [userId, provider]
  );
  return result.rows[0] || null;
};

/**
 * Remove a provider key for a user.
 */
const remove = async (userId, provider) => {
  await pool.query(
    `DELETE FROM user_api_keys WHERE user_id = $1 AND provider = $2`,
    [userId, provider]
  );
};

module.exports = { upsert, updateModel, findAllByUser, findByProvider, remove };
