-- Fix RLS policies to allow service role to create user profiles
-- This is needed for the backend to create profiles during registration

-- Drop existing policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create new policies that allow both authenticated users and service role
CREATE POLICY "Users can view own profile" ON user_profiles 
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update own profile" ON user_profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert profile" ON user_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- Also fix ISP tasks policies to allow service role
DROP POLICY IF EXISTS "Users can view own ISP tasks" ON isp_tasks;
DROP POLICY IF EXISTS "Users can insert own ISP tasks" ON isp_tasks;
DROP POLICY IF EXISTS "Users can update own ISP tasks" ON isp_tasks;
DROP POLICY IF EXISTS "Users can delete own ISP tasks" ON isp_tasks;

CREATE POLICY "Users can view own ISP tasks" ON isp_tasks 
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert ISP tasks" ON isp_tasks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update own ISP tasks" ON isp_tasks 
  FOR UPDATE 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can delete own ISP tasks" ON isp_tasks 
  FOR DELETE 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Fix notes policies
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;

CREATE POLICY "Users can view own notes" ON notes 
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert notes" ON notes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update own notes" ON notes 
  FOR UPDATE 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can delete own notes" ON notes 
  FOR DELETE 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Fix note_sections policies
DROP POLICY IF EXISTS "Users can view own note sections" ON note_sections;
DROP POLICY IF EXISTS "Users can insert own note sections" ON note_sections;
DROP POLICY IF EXISTS "Users can update own note sections" ON note_sections;
DROP POLICY IF EXISTS "Users can delete own note sections" ON note_sections;

CREATE POLICY "Users can view note sections" ON note_sections 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_sections.note_id 
      AND (notes.user_id = auth.uid() OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Users can insert note sections" ON note_sections 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_sections.note_id 
      AND (notes.user_id = auth.uid() OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Users can update note sections" ON note_sections 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_sections.note_id 
      AND (notes.user_id = auth.uid() OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Users can delete note sections" ON note_sections 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_sections.note_id 
      AND (notes.user_id = auth.uid() OR auth.role() = 'service_role')
    )
  );

-- Fix user_credits policies
DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can insert own credits" ON user_credits;

CREATE POLICY "Users can view own credits" ON user_credits 
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert credits" ON user_credits 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');
