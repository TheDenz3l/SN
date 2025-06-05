/**
 * Database Initialization Script for SwiftNotes
 * Sets up database schema and initial data
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL || 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database schema SQL
const schema = `
-- SwiftNotes Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_tier AS ENUM ('free', 'paid', 'premium');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('purchase', 'usage', 'refund', 'bonus');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    tier user_tier DEFAULT 'free' NOT NULL,
    credits INTEGER DEFAULT 10 NOT NULL,
    writing_style TEXT,
    has_completed_setup BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ISP Tasks Table
CREATE TABLE IF NOT EXISTS isp_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content JSONB DEFAULT '{}' NOT NULL,
    note_type TEXT DEFAULT 'general' NOT NULL,
    tokens_used INTEGER,
    cost DECIMAL(10,6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Note Sections Table
CREATE TABLE IF NOT EXISTS note_sections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
    isp_task_id UUID REFERENCES isp_tasks(id) ON DELETE SET NULL,
    user_prompt TEXT NOT NULL,
    generated_content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE NOT NULL,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- User Credits Transaction Log
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    transaction_type transaction_type NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_isp_tasks_user_id ON isp_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_isp_tasks_order ON isp_tasks(user_id, order_index);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_note_sections_note_id ON note_sections(note_id);
CREATE INDEX IF NOT EXISTS idx_note_sections_task_id ON note_sections(isp_task_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_created_at ON user_credits(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_isp_tasks_updated_at ON isp_tasks;
CREATE TRIGGER update_isp_tasks_updated_at
    BEFORE UPDATE ON isp_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_note_sections_updated_at ON note_sections;
CREATE TRIGGER update_note_sections_updated_at
    BEFORE UPDATE ON note_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE isp_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- User Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- ISP Tasks: Users can only access their own tasks
CREATE POLICY "Users can view own ISP tasks" ON isp_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ISP tasks" ON isp_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ISP tasks" ON isp_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ISP tasks" ON isp_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Notes: Users can only access their own notes
CREATE POLICY "Users can view own notes" ON notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON notes
    FOR DELETE USING (auth.uid() = user_id);

-- Note Sections: Users can only access sections of their own notes
CREATE POLICY "Users can view own note sections" ON note_sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM notes 
            WHERE notes.id = note_sections.note_id 
            AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own note sections" ON note_sections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM notes 
            WHERE notes.id = note_sections.note_id 
            AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own note sections" ON note_sections
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM notes 
            WHERE notes.id = note_sections.note_id 
            AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own note sections" ON note_sections
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM notes 
            WHERE notes.id = note_sections.note_id 
            AND notes.user_id = auth.uid()
        )
    );

-- User Credits: Users can only view their own credit transactions
CREATE POLICY "Users can view own credit transactions" ON user_credits
    FOR SELECT USING (auth.uid() = user_id);
`;

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing SwiftNotes database...');

    // Execute schema
    const { error } = await supabase.rpc('exec_sql', { sql: schema });
    
    if (error) {
      console.error('❌ Database initialization failed:', error);
      return false;
    }

    console.log('✅ Database schema created successfully');

    // Verify tables exist
    const tables = ['user_profiles', 'isp_tasks', 'notes', 'note_sections', 'user_credits'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`✅ Table '${table}' verified`);
        } else {
          console.log(`❌ Table '${table}' verification failed:`, error.message);
        }
      } catch (err) {
        console.log(`❌ Error verifying table '${table}':`, err.message);
      }
    }

    console.log('🎉 Database initialization completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Database initialization error:', error);
    return false;
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase()
    .then(success => {
      if (success) {
        console.log('\n✅ Database is ready for use!');
        process.exit(0);
      } else {
        console.log('\n❌ Database initialization failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
