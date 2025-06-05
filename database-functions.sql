-- SwiftNotes Database Functions for Writing Analytics

-- Function to log writing analytics
CREATE OR REPLACE FUNCTION log_writing_analytics(
    p_user_id UUID,
    p_note_id UUID,
    p_original_generated TEXT,
    p_note_section_id UUID DEFAULT NULL,
    p_user_edited_version TEXT DEFAULT NULL,
    p_edit_type edit_type DEFAULT NULL,
    p_confidence_score DECIMAL(3,2) DEFAULT 0.50,
    p_user_satisfaction_score INTEGER DEFAULT NULL,
    p_feedback_notes TEXT DEFAULT NULL,
    p_tokens_used INTEGER DEFAULT NULL,
    p_generation_time_ms INTEGER DEFAULT NULL,
    p_style_match_score DECIMAL(3,2) DEFAULT NULL
) RETURNS UUID AS $function$
DECLARE
    analytics_id UUID;
BEGIN
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
    ) VALUES (
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
    ) RETURNING id INTO analytics_id;

    -- Update user's total notes generated count
    UPDATE user_profiles
    SET total_notes_generated = total_notes_generated + 1
    WHERE user_id = p_user_id;

    RETURN analytics_id;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update style confidence
CREATE OR REPLACE FUNCTION update_style_confidence(p_user_id UUID)
RETURNS BOOLEAN AS $function$
DECLARE
    avg_satisfaction DECIMAL(3,2);
    avg_style_match DECIMAL(3,2);
    total_analytics INTEGER;
    new_confidence DECIMAL(3,2);
    confidence_level style_confidence_level;
BEGIN
    -- Calculate average satisfaction and style match scores
    SELECT 
        COALESCE(AVG(user_satisfaction_score::DECIMAL), 3.0),
        COALESCE(AVG(style_match_score), 0.50),
        COUNT(*)
    INTO avg_satisfaction, avg_style_match, total_analytics
    FROM user_writing_analytics 
    WHERE user_id = p_user_id 
    AND user_satisfaction_score IS NOT NULL;
    
    -- Calculate new confidence based on analytics
    IF total_analytics = 0 THEN
        new_confidence := 0.50;
        confidence_level := 'medium';
    ELSE
        -- Weighted calculation: 40% satisfaction, 60% style match
        new_confidence := (avg_satisfaction / 5.0) * 0.4 + avg_style_match * 0.6;
        
        -- Determine confidence level
        IF new_confidence >= 0.85 THEN
            confidence_level := 'excellent';
        ELSIF new_confidence >= 0.70 THEN
            confidence_level := 'high';
        ELSIF new_confidence >= 0.40 THEN
            confidence_level := 'medium';
        ELSE
            confidence_level := 'low';
        END IF;
    END IF;
    
    -- Update user profile
    UPDATE user_profiles 
    SET 
        writing_style_confidence = new_confidence,
        style_confidence_level = confidence_level,
        style_last_updated = NOW()
    WHERE user_id = p_user_id;
    
    RETURN TRUE;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get writing analytics summary
CREATE OR REPLACE FUNCTION get_writing_analytics_summary(p_user_id UUID)
RETURNS TABLE(
    total_notes_generated INTEGER,
    avg_confidence_score DECIMAL(3,2),
    avg_satisfaction_score DECIMAL(3,2),
    avg_style_match_score DECIMAL(3,2),
    most_common_edit_type edit_type,
    writing_style_confidence DECIMAL(3,2),
    style_confidence_level style_confidence_level,
    total_tokens_used BIGINT,
    avg_generation_time_ms INTEGER
) AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        up.total_notes_generated,
        COALESCE(AVG(uwa.confidence_score), 0.50)::DECIMAL(3,2) as avg_confidence_score,
        COALESCE(AVG(uwa.user_satisfaction_score::DECIMAL), 3.0)::DECIMAL(3,2) as avg_satisfaction_score,
        COALESCE(AVG(uwa.style_match_score), 0.50)::DECIMAL(3,2) as avg_style_match_score,
        (
            SELECT edit_type 
            FROM user_writing_analytics 
            WHERE user_id = p_user_id AND edit_type IS NOT NULL
            GROUP BY edit_type 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ) as most_common_edit_type,
        up.writing_style_confidence,
        up.style_confidence_level,
        COALESCE(SUM(uwa.tokens_used), 0)::BIGINT as total_tokens_used,
        COALESCE(AVG(uwa.generation_time_ms), 0)::INTEGER as avg_generation_time_ms
    FROM user_profiles up
    LEFT JOIN user_writing_analytics uwa ON up.user_id = uwa.user_id
    WHERE up.user_id = p_user_id
    GROUP BY up.user_id, up.total_notes_generated, up.writing_style_confidence, up.style_confidence_level;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to evolve writing style
CREATE OR REPLACE FUNCTION evolve_writing_style(
    p_user_id UUID,
    p_new_style TEXT,
    p_trigger_reason TEXT,
    p_notes_analyzed INTEGER DEFAULT 0,
    p_improvement_metrics JSONB DEFAULT NULL
) RETURNS BOOLEAN AS $function$
DECLARE
    current_style TEXT;
    current_confidence DECIMAL(3,2);
BEGIN
    -- Get current style and confidence
    SELECT writing_style, writing_style_confidence
    INTO current_style, current_confidence
    FROM user_profiles
    WHERE user_id = p_user_id;
    
    -- Log the style evolution
    INSERT INTO writing_style_evolution (
        user_id,
        previous_style,
        updated_style,
        confidence_before,
        confidence_after,
        trigger_reason,
        notes_analyzed,
        improvement_metrics
    ) VALUES (
        p_user_id,
        current_style,
        p_new_style,
        current_confidence,
        LEAST(current_confidence + 0.1, 1.0), -- Slight confidence boost
        p_trigger_reason,
        p_notes_analyzed,
        p_improvement_metrics
    );
    
    -- Update user's writing style
    UPDATE user_profiles 
    SET 
        writing_style = p_new_style,
        writing_style_confidence = LEAST(writing_style_confidence + 0.1, 1.0),
        style_last_updated = NOW()
    WHERE user_id = p_user_id;
    
    RETURN TRUE;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION log_writing_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION update_style_confidence TO authenticated;
GRANT EXECUTE ON FUNCTION get_writing_analytics_summary TO authenticated;
GRANT EXECUTE ON FUNCTION evolve_writing_style TO authenticated;
