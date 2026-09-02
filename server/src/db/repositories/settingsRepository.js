const { pool } = require('../../config/db');

const findByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT id, user_id, ai_provider, ai_model, ollama_host, ollama_port,
            voice_name, voice_rate, voice_pitch, preferences,
            (encrypted_api_key IS NOT NULL) AS has_api_key,
            created_at, updated_at
     FROM user_settings
     WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

const getWithEncryptedKey = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM user_settings WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

const upsert = async (userId, data) => {
  const current = await getWithEncryptedKey(userId);

  const aiProvider = data.ai_provider !== undefined ? data.ai_provider : (current?.ai_provider || 'groq');
  const aiModel = data.ai_model !== undefined ? data.ai_model : (current?.ai_model || 'llama-3.3-70b-versatile');
  const ollamaHost = data.ollama_host !== undefined ? data.ollama_host : (current?.ollama_host || 'localhost');
  const ollamaPort = data.ollama_port !== undefined ? parseInt(data.ollama_port, 10) : (current?.ollama_port || 11434);
  const encryptedApiKey = data.encrypted_api_key !== undefined ? data.encrypted_api_key : (current?.encrypted_api_key || null);
  const voiceName = data.voice_name !== undefined ? data.voice_name : (current?.voice_name || null);
  const voiceRate = data.voice_rate !== undefined ? parseFloat(data.voice_rate) : (current?.voice_rate || 1.0);
  const voicePitch = data.voice_pitch !== undefined ? parseFloat(data.voice_pitch) : (current?.voice_pitch || 1.0);
  const preferences = data.preferences !== undefined ? data.preferences : (current?.preferences || {});

  const result = await pool.query(
    `INSERT INTO user_settings
       (user_id, ai_provider, ai_model, ollama_host, ollama_port, encrypted_api_key, voice_name, voice_rate, voice_pitch, preferences, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET
       ai_provider = EXCLUDED.ai_provider,
       ai_model = EXCLUDED.ai_model,
       ollama_host = EXCLUDED.ollama_host,
       ollama_port = EXCLUDED.ollama_port,
       encrypted_api_key = COALESCE(EXCLUDED.encrypted_api_key, user_settings.encrypted_api_key),
       voice_name = EXCLUDED.voice_name,
       voice_rate = EXCLUDED.voice_rate,
       voice_pitch = EXCLUDED.voice_pitch,
       preferences = EXCLUDED.preferences,
       updated_at = NOW()
     RETURNING id, user_id, ai_provider, ai_model, ollama_host, ollama_port, voice_name, voice_rate, voice_pitch, preferences, updated_at`,
    [userId, aiProvider, aiModel, ollamaHost, ollamaPort, encryptedApiKey, voiceName, voiceRate, voicePitch, preferences]
  );

  return result.rows[0];
};

module.exports = { findByUserId, getWithEncryptedKey, upsert };
