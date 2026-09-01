-- Stores per-user AI provider API keys (encrypted at rest).
-- Supports Groq, Google Gemini, and OpenAI.
CREATE TABLE IF NOT EXISTS user_api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider      VARCHAR(30)  NOT NULL,   -- 'groq' | 'gemini' | 'openai'
  api_key_enc   TEXT         NOT NULL,   -- AES-256-GCM encrypted key
  is_active     BOOLEAN      DEFAULT true,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON user_api_keys(user_id);
