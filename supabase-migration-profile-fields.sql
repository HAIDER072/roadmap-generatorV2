-- Add display_name and photo_url columns to user_profiles table
-- Run this in your Supabase SQL Editor

-- Add display_name column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add photo_url column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Set default display_name from email for existing users
UPDATE user_profiles 
SET display_name = SPLIT_PART(email, '@', 1)
WHERE display_name IS NULL AND email IS NOT NULL;

-- Add comment to columns
COMMENT ON COLUMN user_profiles.display_name IS 'User display name shown throughout the app';
COMMENT ON COLUMN user_profiles.photo_url IS 'URL to user profile photo';
