CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(100),
  experience_level VARCHAR(50),
  primary_goal VARCHAR(100),
  employment_status VARCHAR(50),
  target_role VARCHAR(255),
  industry VARCHAR(100),
  preferred_coach VARCHAR(50) DEFAULT 'professional',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
