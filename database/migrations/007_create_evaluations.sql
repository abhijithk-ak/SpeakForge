CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID UNIQUE NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overall_score DECIMAL(5,2),
  clarity_score DECIMAL(5,2),
  fluency_score DECIMAL(5,2),
  confidence_score DECIMAL(5,2),
  structure_score DECIMAL(5,2),
  vocabulary_score DECIMAL(5,2),
  relevance_score DECIMAL(5,2),
  filler_word_count INTEGER DEFAULT 0,
  filler_word_score DECIMAL(5,2),
  strengths JSONB DEFAULT '[]',
  improvements JSONB DEFAULT '[]',
  specific_feedback TEXT,
  raw_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_user ON evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_session ON evaluations(session_id);
