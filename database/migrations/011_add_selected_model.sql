-- Adds selected_model column to user_api_keys table
ALTER TABLE user_api_keys
ADD COLUMN IF NOT EXISTS selected_model VARCHAR(100);
