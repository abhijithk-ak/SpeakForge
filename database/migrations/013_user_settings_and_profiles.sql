-- Migration 013: User Settings, Profiles enhancement, and Session history storage

-- Enhance user_profiles with onboarding arrays and fields if missing
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS fields TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS experience VARCHAR(20) DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- Create user_settings table for universal BYOK and voice preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ai_provider   VARCHAR(30) DEFAULT 'groq',       -- 'openai', 'groq', 'gemini', 'openrouter', 'xai', 'huggingface', 'ollama'
  ai_model      VARCHAR(100) DEFAULT 'llama-3.3-70b-versatile',
  ollama_host   VARCHAR(255) DEFAULT 'localhost',
  ollama_port   INTEGER DEFAULT 11434,
  encrypted_api_key TEXT,                          -- AES-256-GCM encrypted
  voice_name    VARCHAR(100),                      -- SpeechSynthesis voice name
  voice_rate    DECIMAL(3,2) DEFAULT 1.0,
  voice_pitch   DECIMAL(3,2) DEFAULT 1.0,
  preferences   JSONB DEFAULT '{}',                -- domain, default mode, feedback style, difficulty
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);

-- Enhance practice_sessions table for conversation log, config, and user profile snapshot
ALTER TABLE practice_sessions
  ADD COLUMN IF NOT EXISTS conversation_log JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS session_config JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS user_profile_snapshot JSONB DEFAULT '{}';

-- Password reset tokens table for forgot password feature
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);
