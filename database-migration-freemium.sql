-- SwiftNotes Freemium Model Database Migration
-- Adds free generation tracking and credit system enhancements

-- Add new columns to user_profiles table for freemium tracking
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS free_generations_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_generations_reset_date DATE DEFAULT CURRENT_DATE;

-- Update existing users to have the new fields
UPDATE user_profiles 
SET 
  free_generations_used = 0,
  free_generations_reset_date = CURRENT_DATE
WHERE free_generations_used IS NULL OR free_generations_reset_date IS NULL;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_profiles_free_generations 
ON user_profiles(user_id, free_generations_reset_date);

-- Add comment to document the freemium model
COMMENT ON COLUMN user_profiles.free_generations_used IS 'Number of free note generations used in current period (resets daily)';
COMMENT ON COLUMN user_profiles.free_generations_reset_date IS 'Date when free generations were last reset (daily reset)';

-- Verify the migration
SELECT 
  user_id,
  credits,
  free_generations_used,
  free_generations_reset_date,
  created_at
FROM user_profiles 
LIMIT 5;
