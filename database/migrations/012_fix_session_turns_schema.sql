-- Migration to ensure session_turns table compatibility with all queries
ALTER TABLE session_turns
ADD COLUMN IF NOT EXISTS turn_number INTEGER,
ADD COLUMN IF NOT EXISTS speaker VARCHAR(20),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Populate new columns from existing columns if needed
UPDATE session_turns SET turn_number = turn_index WHERE turn_number IS NULL AND turn_index IS NOT NULL;
UPDATE session_turns SET speaker = role WHERE speaker IS NULL AND role IS NOT NULL;
UPDATE session_turns SET created_at = timestamp WHERE created_at IS NULL AND timestamp IS NOT NULL;
