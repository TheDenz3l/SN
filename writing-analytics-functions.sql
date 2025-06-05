-- SwiftNotes Writing Analytics Functions
-- Additional functions for the writing style learning system
-- Run this AFTER the migration script

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

-- Function to get user's writing analytics summary
CREATE OR REPLACE FUNCTION public.get_writing_analytics_summary(p_user_id UUID)
RETURNS TABLE (
    total_notes INTEGER,
    avg_confidence DECIMAL(3,2),
    avg_satisfaction DECIMAL(3,2),
    avg_style_match DECIMAL(3,2),
    recent_notes INTEGER,
    improvement_trend TEXT
) AS $$
DECLARE
    old_confidence DECIMAL(3,2);
    current_confidence DECIMAL(3,2);
BEGIN
    -- Get current confidence
    SELECT writing_style_confidence INTO current_confidence
    FROM user_profiles
    WHERE user_id = p_user_id;
    
    -- Get confidence from 30 days ago
    SELECT COALESCE(AVG(confidence_score), current_confidence) INTO old_confidence
    FROM user_writing_analytics
    WHERE user_id = p_user_id 
    AND created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days';
    
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM user_writing_analytics WHERE user_id = p_user_id),
        (SELECT COALESCE(AVG(confidence_score), 0.50) FROM user_writing_analytics WHERE user_id = p_user_id),
        (SELECT COALESCE(AVG(user_satisfaction_score), 3.0) FROM user_writing_analytics WHERE user_id = p_user_id AND user_satisfaction_score IS NOT NULL),
        (SELECT COALESCE(AVG(style_match_score), 0.50) FROM user_writing_analytics WHERE user_id = p_user_id AND style_match_score IS NOT NULL),
        (SELECT COUNT(*)::INTEGER FROM user_writing_analytics WHERE user_id = p_user_id AND created_at > NOW() - INTERVAL '30 days'),
        CASE 
            WHEN current_confidence > old_confidence + 0.1 THEN 'improving'
            WHEN current_confidence < old_confidence - 0.1 THEN 'declining'
            ELSE 'stable'
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
