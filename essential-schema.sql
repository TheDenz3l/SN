-- Essential SwiftNotes Database Schema
-- Copy and paste this into Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_tier AS ENUM ('free', 'paid', 'premium');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE note_type AS ENUM ('task', 'comment', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('purchase', 'usage', 'refund', 'bonus');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    tier user_tier DEFAULT 'free' NOT NULL,
    credits INTEGER DEFAULT 10 NOT NULL,
    writing_style TEXT,
    has_completed_setup BOOLEAN DEFAULT FALSE NOT NULL,
    preferences JSONB DEFAULT '{}' NOT NULL,
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
    content JSONB NOT NULL,
    note_type note_type DEFAULT 'general' NOT NULL,
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

-- User Credits Table
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    transaction_type transaction_type NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    reference_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE isp_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own ISP tasks" ON isp_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ISP tasks" ON isp_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ISP tasks" ON isp_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ISP tasks" ON isp_tasks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notes" ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON notes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own note sections" ON note_sections FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM notes WHERE notes.id = note_sections.note_id)
);
CREATE POLICY "Users can insert own note sections" ON note_sections FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM notes WHERE notes.id = note_sections.note_id)
);
CREATE POLICY "Users can update own note sections" ON note_sections FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM notes WHERE notes.id = note_sections.note_id)
);
CREATE POLICY "Users can delete own note sections" ON note_sections FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM notes WHERE notes.id = note_sections.note_id)
);

CREATE POLICY "Users can view own credit transactions" ON user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credit transactions" ON user_credits FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, first_name, last_name, credits)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        10
    );
    
    INSERT INTO public.user_credits (user_id, transaction_type, amount, description)
    VALUES (
        NEW.id,
        'bonus',
        10,
        'Welcome bonus - free tier starting credits'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_isp_tasks_user_id ON isp_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
