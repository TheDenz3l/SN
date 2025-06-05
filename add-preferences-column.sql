-- Migration to add preferences column to user_profiles table
-- This ensures the preferences column exists for storing user default settings

-- Add preferences column if it doesn't exist
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}' NOT NULL;

-- Update any existing users to have empty preferences object
UPDATE user_profiles 
SET preferences = '{}' 
WHERE preferences IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'preferences';
