CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode VARCHAR(50) NOT NULL,
  role VARCHAR(255),
  coach_personality VARCHAR(50) DEFAULT 'professional',
  difficulty VARCHAR(50) DEFAULT 'intermediate',
  status VARCHAR(50) DEFAULT 'created',
  realtime_session_id VARCHAR(255),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON practice_sessions(status);
