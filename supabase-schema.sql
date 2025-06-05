-- SwiftNotes Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_tier AS ENUM ('free', 'paid', 'premium');
CREATE TYPE note_type AS ENUM ('task', 'comment', 'general');
CREATE TYPE transaction_type AS ENUM ('purchase', 'usage', 'refund', 'bonus');
CREATE TYPE edit_type AS ENUM ('minor', 'major', 'style_change', 'content_addition', 'complete_rewrite');
CREATE TYPE style_confidence_level AS ENUM ('low', 'medium', 'high', 'excellent');

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    tier user_tier DEFAULT 'free' NOT NULL,
    credits INTEGER DEFAULT 10 NOT NULL, -- Free tier starts with 10 credits
    writing_style TEXT, -- User's writing style sample (max 3000 chars)
    has_completed_setup BOOLEAN DEFAULT FALSE NOT NULL,
    -- Enhanced writing style learning fields
    writing_style_confidence DECIMAL(3,2) DEFAULT 0.50 NOT NULL, -- 0.00 to 1.00
    style_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    total_notes_generated INTEGER DEFAULT 0 NOT NULL,
    style_learning_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    style_confidence_level style_confidence_level DEFAULT 'medium' NOT NULL,
    additional_style_samples TEXT[], -- Array of additional writing samples
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ISP Tasks Table
CREATE TABLE isp_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Notes Table
CREATE TABLE notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content JSONB NOT NULL, -- Structured note content
    note_type note_type DEFAULT 'general' NOT NULL,
    tokens_used INTEGER,
    cost DECIMAL(10,6), -- Cost in dollars
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Note Sections Table (for individual ISP task sections)
CREATE TABLE note_sections (
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
CREATE TABLE user_credits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    transaction_type transaction_type NOT NULL,
    amount INTEGER NOT NULL, -- Positive for credits added, negative for credits used
    description TEXT NOT NULL,
    reference_id TEXT, -- For payment references, note IDs, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- User Writing Analytics Table (for continuous learning)
CREATE TABLE user_writing_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
    note_section_id UUID REFERENCES note_sections(id) ON DELETE CASCADE,
    original_generated TEXT NOT NULL, -- Original AI-generated content
    user_edited_version TEXT, -- User's edited version (if edited)
    edit_type edit_type, -- Type of edit made
    confidence_score DECIMAL(3,2) DEFAULT 0.50, -- AI confidence in generation (0.00 to 1.00)
    user_satisfaction_score INTEGER, -- User rating 1-5 (optional)
    feedback_notes TEXT, -- Optional user feedback
    tokens_used INTEGER,
    generation_time_ms INTEGER, -- Time taken to generate
    style_match_score DECIMAL(3,2), -- How well it matched user's style (0.00 to 1.00)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Writing Style Evolution Log
CREATE TABLE writing_style_evolution (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    previous_style TEXT, -- Previous writing style
    updated_style TEXT NOT NULL, -- New/updated writing style
    confidence_before DECIMAL(3,2), -- Confidence before update
    confidence_after DECIMAL(3,2) NOT NULL, -- Confidence after update
    trigger_reason TEXT NOT NULL, -- Why the style was updated
    notes_analyzed INTEGER DEFAULT 0, -- Number of notes used for this update
    improvement_metrics JSONB, -- Detailed metrics about the improvement
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_isp_tasks_user_id ON isp_tasks(user_id);
CREATE INDEX idx_isp_tasks_order ON isp_tasks(user_id, order_index);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_created_at ON notes(user_id, created_at DESC);
CREATE INDEX idx_note_sections_note_id ON note_sections(note_id);
CREATE INDEX idx_note_sections_task_id ON note_sections(isp_task_id);
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_user_credits_created_at ON user_credits(user_id, created_at DESC);

-- Indexes for new analytics tables
CREATE INDEX idx_writing_analytics_user_id ON user_writing_analytics(user_id);
CREATE INDEX idx_writing_analytics_note_id ON user_writing_analytics(note_id);
CREATE INDEX idx_writing_analytics_created_at ON user_writing_analytics(user_id, created_at DESC);
CREATE INDEX idx_writing_analytics_confidence ON user_writing_analytics(confidence_score);
CREATE INDEX idx_style_evolution_user_id ON writing_style_evolution(user_id);
CREATE INDEX idx_style_evolution_created_at ON writing_style_evolution(user_id, created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_isp_tasks_updated_at BEFORE UPDATE ON isp_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_note_sections_updated_at BEFORE UPDATE ON note_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_writing_analytics_updated_at BEFORE UPDATE ON user_writing_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE isp_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_writing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_style_evolution ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ISP Tasks Policies
CREATE POLICY "Users can view own ISP tasks" ON isp_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ISP tasks" ON isp_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ISP tasks" ON isp_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ISP tasks" ON isp_tasks FOR DELETE USING (auth.uid() = user_id);

-- Notes Policies
CREATE POLICY "Users can view own notes" ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON notes FOR DELETE USING (auth.uid() = user_id);

-- Note Sections Policies
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

-- User Credits Policies
CREATE POLICY "Users can view own credit transactions" ON user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credit transactions" ON user_credits FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Writing Analytics Policies
CREATE POLICY "Users can view own writing analytics" ON user_writing_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own writing analytics" ON user_writing_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own writing analytics" ON user_writing_analytics FOR UPDATE USING (auth.uid() = user_id);

-- Writing Style Evolution Policies
CREATE POLICY "Users can view own style evolution" ON writing_style_evolution FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own style evolution" ON writing_style_evolution FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        user_id,
        first_name,
        last_name,
        credits,
        writing_style_confidence,
        style_confidence_level,
        style_learning_enabled
    )
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        10, -- Free tier starting credits
        0.50, -- Default confidence
        'medium', -- Default confidence level
        TRUE -- Enable learning by default
    );

    -- Add initial credit transaction
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

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to deduct credits
CREATE OR REPLACE FUNCTION public.deduct_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT,
    p_reference_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    -- Get current credits
    SELECT credits INTO current_credits
    FROM user_profiles
    WHERE user_id = p_user_id;
    
    -- Check if user has enough credits
    IF current_credits < p_amount THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct credits
    UPDATE user_profiles
    SET credits = credits - p_amount
    WHERE user_id = p_user_id;
    
    -- Log transaction
    INSERT INTO user_credits (user_id, transaction_type, amount, description, reference_id)
    VALUES (p_user_id, 'usage', -p_amount, p_description, p_reference_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits
CREATE OR REPLACE FUNCTION public.add_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT,
    p_reference_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Add credits
    UPDATE user_profiles
    SET credits = credits + p_amount
    WHERE user_id = p_user_id;

    -- Log transaction
    INSERT INTO user_credits (user_id, transaction_type, amount, description, reference_id)
    VALUES (p_user_id, 'purchase', p_amount, p_description, p_reference_id);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate writing style confidence based on analytics
CREATE OR REPLACE FUNCTION public.calculate_style_confidence(p_user_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    total_analytics INTEGER;
    avg_satisfaction DECIMAL(3,2);
    avg_style_match DECIMAL(3,2);
    recent_analytics INTEGER;
    confidence_score DECIMAL(3,2);
BEGIN
    -- Get total analytics count
    SELECT COUNT(*) INTO total_analytics
    FROM user_writing_analytics
    WHERE user_id = p_user_id;

    -- If no analytics, return default confidence
    IF total_analytics = 0 THEN
        RETURN 0.50;
    END IF;

    -- Get average satisfaction score (1-5 scale, convert to 0-1)
    SELECT COALESCE(AVG(user_satisfaction_score), 3.0) / 5.0 INTO avg_satisfaction
    FROM user_writing_analytics
    WHERE user_id = p_user_id AND user_satisfaction_score IS NOT NULL;

    -- Get average style match score
    SELECT COALESCE(AVG(style_match_score), 0.50) INTO avg_style_match
    FROM user_writing_analytics
    WHERE user_id = p_user_id AND style_match_score IS NOT NULL;

    -- Get recent analytics count (last 30 days)
    SELECT COUNT(*) INTO recent_analytics
    FROM user_writing_analytics
    WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '30 days';

    -- Calculate confidence score
    -- Base score from style match (40%) + satisfaction (40%) + experience bonus (20%)
    confidence_score := (avg_style_match * 0.4) + (avg_satisfaction * 0.4);

    -- Add experience bonus based on total analytics
    IF total_analytics >= 50 THEN
        confidence_score := confidence_score + 0.20;
    ELSIF total_analytics >= 20 THEN
        confidence_score := confidence_score + 0.15;
    ELSIF total_analytics >= 10 THEN
        confidence_score := confidence_score + 0.10;
    ELSE
        confidence_score := confidence_score + (total_analytics * 0.01);
    END IF;

    -- Ensure confidence is between 0.00 and 1.00
    confidence_score := GREATEST(0.00, LEAST(1.00, confidence_score));

    RETURN confidence_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user's writing style confidence
CREATE OR REPLACE FUNCTION public.update_style_confidence(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    new_confidence DECIMAL(3,2);
    new_confidence_level style_confidence_level;
BEGIN
    -- Calculate new confidence
    SELECT calculate_style_confidence(p_user_id) INTO new_confidence;

    -- Determine confidence level
    IF new_confidence >= 0.85 THEN
        new_confidence_level := 'excellent';
    ELSIF new_confidence >= 0.70 THEN
        new_confidence_level := 'high';
    ELSIF new_confidence >= 0.40 THEN
        new_confidence_level := 'medium';
    ELSE
        new_confidence_level := 'low';
    END IF;

    -- Update user profile
    UPDATE user_profiles
    SET
        writing_style_confidence = new_confidence,
        style_confidence_level = new_confidence_level,
        style_last_updated = NOW()
    WHERE user_id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log writing analytics
CREATE OR REPLACE FUNCTION public.log_writing_analytics(
    p_user_id UUID,
    p_note_id UUID,
    p_note_section_id UUID,
    p_original_generated TEXT,
    p_user_edited_version TEXT DEFAULT NULL,
    p_edit_type edit_type DEFAULT NULL,
    p_confidence_score DECIMAL(3,2) DEFAULT 0.50,
    p_user_satisfaction_score INTEGER DEFAULT NULL,
    p_feedback_notes TEXT DEFAULT NULL,
    p_tokens_used INTEGER DEFAULT NULL,
    p_generation_time_ms INTEGER DEFAULT NULL,
    p_style_match_score DECIMAL(3,2) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    analytics_id UUID;
BEGIN
    -- Insert analytics record
    INSERT INTO user_writing_analytics (
        user_id,
        note_id,
        note_section_id,
        original_generated,
        user_edited_version,
        edit_type,
        confidence_score,
        user_satisfaction_score,
        feedback_notes,
        tokens_used,
        generation_time_ms,
        style_match_score
    )
    VALUES (
        p_user_id,
        p_note_id,
        p_note_section_id,
        p_original_generated,
        p_user_edited_version,
        p_edit_type,
        p_confidence_score,
        p_user_satisfaction_score,
        p_feedback_notes,
        p_tokens_used,
        p_generation_time_ms,
        p_style_match_score
    )
    RETURNING id INTO analytics_id;

    -- Update user's total notes generated count
    UPDATE user_profiles
    SET total_notes_generated = total_notes_generated + 1
    WHERE user_id = p_user_id;

    -- Update style confidence if learning is enabled
    PERFORM update_style_confidence(p_user_id);

    RETURN analytics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to evolve writing style based on analytics
CREATE OR REPLACE FUNCTION public.evolve_writing_style(
    p_user_id UUID,
    p_new_style TEXT,
    p_trigger_reason TEXT,
    p_notes_analyzed INTEGER DEFAULT 0,
    p_improvement_metrics JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_style TEXT;
    current_confidence DECIMAL(3,2);
    new_confidence DECIMAL(3,2);
BEGIN
    -- Get current style and confidence
    SELECT writing_style, writing_style_confidence
    INTO current_style, current_confidence
    FROM user_profiles
    WHERE user_id = p_user_id;

    -- Calculate new confidence
    SELECT calculate_style_confidence(p_user_id) INTO new_confidence;

    -- Log the evolution
    INSERT INTO writing_style_evolution (
        user_id,
        previous_style,
        updated_style,
        confidence_before,
        confidence_after,
        trigger_reason,
        notes_analyzed,
        improvement_metrics
    )
    VALUES (
        p_user_id,
        current_style,
        p_new_style,
        current_confidence,
        new_confidence,
        p_trigger_reason,
        p_notes_analyzed,
        p_improvement_metrics
    );

    -- Update user profile with new style
    UPDATE user_profiles
    SET
        writing_style = p_new_style,
        writing_style_confidence = new_confidence,
        style_last_updated = NOW()
    WHERE user_id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
