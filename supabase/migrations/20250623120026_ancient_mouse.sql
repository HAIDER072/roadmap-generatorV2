/*
  # Update roadmaps table structure and policies

  1. Table Updates
    - Ensure roadmaps table exists with correct structure
    - Keep ip_address and user_agent columns for now (can be removed later)
    - Update indexes and triggers

  2. Security Updates
    - Drop existing policies if they exist
    - Recreate policies with correct permissions
    - Ensure RLS is enabled

  3. Performance
    - Add necessary indexes
    - Update trigger function
*/

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  phases jsonb NOT NULL DEFAULT '[]'::jsonb,
  roadmap_nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Enable Row Level Security
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roadmaps" ON roadmaps;
DROP POLICY IF EXISTS "Users can create their own roadmaps" ON roadmaps;
DROP POLICY IF EXISTS "Users can update their own roadmaps" ON roadmaps;
DROP POLICY IF EXISTS "Users can delete their own roadmaps" ON roadmaps;

-- Create new policies
CREATE POLICY "Users can view their own roadmaps"
  ON roadmaps
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own roadmaps"
  ON roadmaps
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roadmaps"
  ON roadmaps
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roadmaps"
  ON roadmaps
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_roadmaps_updated_at ON roadmaps;
CREATE TRIGGER update_roadmaps_updated_at
  BEFORE UPDATE ON roadmaps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS roadmaps_user_id_idx ON roadmaps(user_id);
CREATE INDEX IF NOT EXISTS roadmaps_created_at_idx ON roadmaps(created_at DESC);