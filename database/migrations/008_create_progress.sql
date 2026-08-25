CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  sessions_completed INTEGER DEFAULT 0,
  total_practice_minutes INTEGER DEFAULT 0,
  avg_overall_score DECIMAL(5,2),
  avg_clarity DECIMAL(5,2),
  avg_fluency DECIMAL(5,2),
  avg_confidence DECIMAL(5,2),
  avg_structure DECIMAL(5,2),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_date ON user_progress(date);
