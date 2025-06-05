-- SwiftNotes Database Migration: Writing Analytics & Learning System
-- This migration adds the enhanced writing style learning capabilities
-- Run this in your Supabase SQL Editor AFTER the base schema

-- Create new custom types
CREATE TYPE edit_type AS ENUM ('minor', 'major', 'style_change', 'content_addition', 'complete_rewrite');
CREATE TYPE style_confidence_level AS ENUM ('low', 'medium', 'high', 'excellent');

-- Add new columns to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS writing_style_confidence DECIMAL(3,2) DEFAULT 0.50 NOT NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS style_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_notes_generated INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS style_learning_enabled BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS style_confidence_level style_confidence_level DEFAULT 'medium' NOT NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS additional_style_samples TEXT[];

-- Create User Writing Analytics Table
CREATE TABLE IF NOT EXISTS user_writing_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
    note_section_id UUID REFERENCES note_sections(id) ON DELETE CASCADE,
    original_generated TEXT NOT NULL,
    user_edited_version TEXT,
    edit_type edit_type,
    confidence_score DECIMAL(3,2) DEFAULT 0.50,
    user_satisfaction_score INTEGER,
    feedback_notes TEXT,
    tokens_used INTEGER,
    generation_time_ms INTEGER,
    style_match_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create Writing Style Evolution Log
CREATE TABLE IF NOT EXISTS writing_style_evolution (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    previous_style TEXT,
    updated_style TEXT NOT NULL,
    confidence_before DECIMAL(3,2),
    confidence_after DECIMAL(3,2) NOT NULL,
    trigger_reason TEXT NOT NULL,
    notes_analyzed INTEGER DEFAULT 0,
    improvement_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_writing_analytics_user_id ON user_writing_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_analytics_note_id ON user_writing_analytics(note_id);
CREATE INDEX IF NOT EXISTS idx_writing_analytics_created_at ON user_writing_analytics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_writing_analytics_confidence ON user_writing_analytics(confidence_score);
CREATE INDEX IF NOT EXISTS idx_style_evolution_user_id ON writing_style_evolution(user_id);
CREATE INDEX IF NOT EXISTS idx_style_evolution_created_at ON writing_style_evolution(user_id, created_at DESC);

-- Add updated_at trigger for new tables
CREATE TRIGGER update_writing_analytics_updated_at 
    BEFORE UPDATE ON user_writing_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for new tables
ALTER TABLE user_writing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_style_evolution ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Users can view own writing analytics" ON user_writing_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own writing analytics" ON user_writing_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own writing analytics" ON user_writing_analytics FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own style evolution" ON writing_style_evolution FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own style evolution" ON writing_style_evolution FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update existing user profiles with default values
UPDATE user_profiles
SET
    writing_style_confidence = 0.50,
    style_last_updated = NOW(),
    total_notes_generated = 0,
    style_learning_enabled = TRUE,
    style_confidence_level = 'medium'
WHERE writing_style_confidence IS NULL;

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
