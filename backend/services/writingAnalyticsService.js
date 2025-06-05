/**
 * Writing Analytics Service for SwiftNotes
 * Handles writing style learning and analytics tracking
 */

const { createClient } = require('@supabase/supabase-js');

class WritingAnalyticsService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Log analytics data for a generated note section
   */
  async logAnalytics({
    userId,
    noteId,
    noteSectionId,
    originalGenerated,
    userEditedVersion = null,
    editType = null,
    confidenceScore = 0.50,
    userSatisfactionScore = null,
    feedbackNotes = null,
    tokensUsed = null,
    generationTimeMs = null,
    styleMatchScore = null
  }) {
    try {
      const { data, error } = await this.supabase.rpc('log_writing_analytics', {
        p_user_id: userId,
        p_note_id: noteId,
        p_note_section_id: noteSectionId,
        p_original_generated: originalGenerated,
        p_user_edited_version: userEditedVersion,
        p_edit_type: editType,
        p_confidence_score: confidenceScore,
        p_user_satisfaction_score: userSatisfactionScore,
        p_feedback_notes: feedbackNotes,
        p_tokens_used: tokensUsed,
        p_generation_time_ms: generationTimeMs,
        p_style_match_score: styleMatchScore
      });

      if (error) {
        console.error('Error logging writing analytics:', error);
        return { success: false, error: error.message };
      }

      return { success: true, analyticsId: data };
    } catch (error) {
      console.error('Writing analytics service error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate and update user's writing style confidence
   */
  async updateStyleConfidence(userId) {
    try {
      const { data, error } = await this.supabase.rpc('update_style_confidence', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error updating style confidence:', error);
        return { success: false, error: error.message };
      }

      return { success: true, updated: data };
    } catch (error) {
      console.error('Style confidence update error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's writing analytics summary
   */
  async getAnalyticsSummary(userId) {
    try {
      const { data, error } = await this.supabase.rpc('get_writing_analytics_summary', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error getting analytics summary:', error);
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        summary: data && data.length > 0 ? data[0] : null 
      };
    } catch (error) {
      console.error('Analytics summary error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Evolve user's writing style based on analytics
   */
  async evolveWritingStyle({
    userId,
    newStyle,
    triggerReason,
    notesAnalyzed = 0,
    improvementMetrics = null
  }) {
    try {
      const { data, error } = await this.supabase.rpc('evolve_writing_style', {
        p_user_id: userId,
        p_new_style: newStyle,
        p_trigger_reason: triggerReason,
        p_notes_analyzed: notesAnalyzed,
        p_improvement_metrics: improvementMetrics
      });

      if (error) {
        console.error('Error evolving writing style:', error);
        return { success: false, error: error.message };
      }

      return { success: true, evolved: data };
    } catch (error) {
      console.error('Writing style evolution error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's writing analytics history
   */
  async getAnalyticsHistory(userId, limit = 50, offset = 0) {
    try {
      const { data, error } = await this.supabase
        .from('user_writing_analytics')
        .select(`
          *,
          notes!inner(title),
          note_sections(user_prompt)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error getting analytics history:', error);
        return { success: false, error: error.message };
      }

      return { success: true, analytics: data || [] };
    } catch (error) {
      console.error('Analytics history error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's style evolution history
   */
  async getStyleEvolutionHistory(userId, limit = 20) {
    try {
      const { data, error } = await this.supabase
        .from('writing_style_evolution')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting style evolution history:', error);
        return { success: false, error: error.message };
      }

      return { success: true, evolution: data || [] };
    } catch (error) {
      console.error('Style evolution history error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyze writing style quality and provide suggestions
   */
  analyzeWritingStyleQuality(writingStyle) {
    // Enhanced analysis for better AI prompting
    const detailedAnalysis = this.performDetailedStyleAnalysis(writingStyle);

    // Calculate quality score based on multiple factors
    let score = 0.5; // Base score

    // Length factor (more detailed)
    if (detailedAnalysis.wordCount >= 300) score += 0.25;
    else if (detailedAnalysis.wordCount >= 200) score += 0.2;
    else if (detailedAnalysis.wordCount >= 100) score += 0.1;

    // Sentence variety and structure
    if (detailedAnalysis.avgWordsPerSentence >= 12 && detailedAnalysis.avgWordsPerSentence <= 20) score += 0.15;
    if (detailedAnalysis.sentenceVariety > 0.6) score += 0.1;

    // Professional terminology and vocabulary richness
    score += Math.min(0.2, detailedAnalysis.professionalTermCount * 0.03);
    score += Math.min(0.1, detailedAnalysis.vocabularyRichness * 0.2);

    // Writing style consistency
    if (detailedAnalysis.styleConsistency > 0.7) score += 0.1;

    // Determine quality level
    let quality = 'needs_improvement';
    if (score >= 0.85) quality = 'excellent';
    else if (score >= 0.7) quality = 'good';
    else if (score >= 0.5) quality = 'fair';

    // Generate enhanced suggestions
    const suggestions = this.generateEnhancedSuggestions(detailedAnalysis);
    const strengths = this.identifyStrengths(detailedAnalysis);
    const weaknesses = this.identifyWeaknesses(detailedAnalysis);

    return {
      quality,
      score: Math.round(score * 100) / 100,
      suggestions,
      strengths,
      weaknesses,
      detailedAnalysis
    };
  }

  /**
   * Perform detailed style analysis for enhanced AI prompting
   */
  performDetailedStyleAnalysis(writingStyle) {
    const sentences = writingStyle.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = writingStyle.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const avgWordsPerSentence = wordCount / sentenceCount;

    // Analyze sentence length variety
    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
    const sentenceVariety = this.calculateVariety(sentenceLengths);

    // Analyze vocabulary richness
    const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^\w]/g, '')));
    const vocabularyRichness = uniqueWords.size / wordCount;

    // Analyze professional terminology
    const professionalTerms = [
      'individual', 'demonstrated', 'participated', 'completed', 'achieved',
      'exhibited', 'maintained', 'progressed', 'responded', 'engaged',
      'intervention', 'assessment', 'documentation', 'observation', 'support',
      'assistance', 'independence', 'communication', 'behavior', 'skills'
    ];
    const professionalTermCount = professionalTerms.filter(term =>
      writingStyle.toLowerCase().includes(term)
    ).length;

    // Analyze punctuation patterns
    const commaCount = (writingStyle.match(/,/g) || []).length;
    const semicolonCount = (writingStyle.match(/;/g) || []).length;
    const dashCount = (writingStyle.match(/—|--/g) || []).length;

    // Analyze tone indicators
    const formalWords = ['individual', 'demonstrated', 'exhibited', 'participated', 'completed'];
    const casualWords = ['got', 'did', 'went', 'said', 'made', 'really', 'pretty', 'kind of'];
    const formalCount = formalWords.filter(word => writingStyle.toLowerCase().includes(word)).length;
    const casualCount = casualWords.filter(word => writingStyle.toLowerCase().includes(word)).length;

    // Calculate style consistency (simplified metric)
    const styleConsistency = Math.min(1, (professionalTermCount + formalCount) / (casualCount + 1));

    return {
      wordCount,
      sentenceCount,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      sentenceVariety,
      vocabularyRichness,
      professionalTermCount,
      punctuationProfile: {
        commasPerSentence: commaCount / sentenceCount,
        usesSemicolons: semicolonCount > 0,
        usesDashes: dashCount > 0
      },
      toneProfile: {
        formalityScore: formalCount / (formalCount + casualCount + 1),
        professionalTermDensity: professionalTermCount / wordCount
      },
      styleConsistency
    };
  }

  /**
   * Calculate variety in a set of numbers (coefficient of variation)
   */
  calculateVariety(numbers) {
    if (numbers.length < 2) return 0;
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
    const stdDev = Math.sqrt(variance);
    return stdDev / mean; // Coefficient of variation
  }

  /**
   * Generate enhanced suggestions based on detailed analysis
   */
  generateEnhancedSuggestions(analysis) {
    const suggestions = [];

    if (analysis.wordCount < 150) {
      suggestions.push('Provide a longer writing sample (150+ words) for more accurate style analysis');
    }

    if (analysis.sentenceVariety < 0.3) {
      suggestions.push('Try varying sentence lengths more for better flow and readability');
    }

    if (analysis.vocabularyRichness < 0.6) {
      suggestions.push('Consider using more varied vocabulary to enhance writing richness');
    }

    if (analysis.professionalTermCount < 3) {
      suggestions.push('Include more professional healthcare terminology in your writing');
    }

    if (analysis.avgWordsPerSentence < 8) {
      suggestions.push('Consider combining some shorter sentences for better flow');
    } else if (analysis.avgWordsPerSentence > 25) {
      suggestions.push('Break up longer sentences for improved clarity');
    }

    if (analysis.toneProfile.formalityScore < 0.3) {
      suggestions.push('Consider using more formal language for professional documentation');
    }

    return suggestions;
  }

  /**
   * Identify writing strengths
   */
  identifyStrengths(analysis) {
    const strengths = [];

    if (analysis.wordCount >= 200) {
      strengths.push('Provides comprehensive detail in documentation');
    }

    if (analysis.sentenceVariety > 0.5) {
      strengths.push('Good sentence length variation creates engaging flow');
    }

    if (analysis.vocabularyRichness > 0.7) {
      strengths.push('Rich vocabulary demonstrates strong communication skills');
    }

    if (analysis.professionalTermCount >= 5) {
      strengths.push('Excellent use of professional healthcare terminology');
    }

    if (analysis.avgWordsPerSentence >= 12 && analysis.avgWordsPerSentence <= 20) {
      strengths.push('Well-balanced sentence structure for professional writing');
    }

    if (analysis.toneProfile.formalityScore > 0.7) {
      strengths.push('Maintains appropriate professional tone throughout');
    }

    if (analysis.punctuationProfile.usesSemicolons) {
      strengths.push('Sophisticated punctuation usage enhances readability');
    }

    return strengths;
  }

  /**
   * Identify areas for improvement
   */
  identifyWeaknesses(analysis) {
    const weaknesses = [];

    if (analysis.wordCount < 100) {
      weaknesses.push('Writing sample too brief for comprehensive analysis');
    }

    if (analysis.sentenceVariety < 0.2) {
      weaknesses.push('Limited sentence length variation may affect readability');
    }

    if (analysis.vocabularyRichness < 0.5) {
      weaknesses.push('Vocabulary could be more varied and rich');
    }

    if (analysis.professionalTermCount < 2) {
      weaknesses.push('Limited use of professional healthcare terminology');
    }

    if (analysis.avgWordsPerSentence < 6) {
      weaknesses.push('Sentences tend to be very short and choppy');
    } else if (analysis.avgWordsPerSentence > 30) {
      weaknesses.push('Sentences tend to be overly long and complex');
    }

    if (analysis.toneProfile.formalityScore < 0.2) {
      weaknesses.push('Writing style may be too casual for professional documentation');
    }

    if (analysis.styleConsistency < 0.5) {
      weaknesses.push('Inconsistent writing style throughout the sample');
    }

    return weaknesses;
  }

  /**
   * Calculate style match score between generated content and user's style
   */
  calculateStyleMatchScore(generatedContent, userStyle, userEditedVersion = null) {
    // This is a simplified implementation
    // In a real system, you might use more sophisticated NLP techniques
    
    let baseScore = 0.50; // Default score
    
    // Length similarity
    const lengthRatio = Math.min(generatedContent.length, userStyle.length) / 
                       Math.max(generatedContent.length, userStyle.length);
    baseScore += (lengthRatio - 0.5) * 0.2;
    
    // If user edited the content, analyze the changes
    if (userEditedVersion) {
      const editDistance = this.calculateEditDistance(generatedContent, userEditedVersion);
      const editRatio = editDistance / generatedContent.length;
      
      // Less editing means better style match
      if (editRatio < 0.1) {
        baseScore += 0.3; // Minimal edits
      } else if (editRatio < 0.3) {
        baseScore += 0.1; // Some edits
      } else {
        baseScore -= 0.2; // Major edits
      }
    }
    
    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, baseScore));
  }

  /**
   * Simple edit distance calculation (Levenshtein distance)
   */
  calculateEditDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

module.exports = WritingAnalyticsService;
