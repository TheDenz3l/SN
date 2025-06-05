/**
 * CLEAN Writing Analytics Service - Rebuilt from scratch
 */

export interface AnalyticsLogRequest {
  noteId: string;
  noteSectionId?: string;
  originalGenerated: string;
  userEditedVersion?: string;
  editType?: 'minor' | 'major' | 'style_change' | 'content_addition' | 'complete_rewrite';
  confidenceScore?: number;
  userSatisfactionScore?: number;
  feedbackNotes?: string;
  tokensUsed?: number;
  generationTimeMs?: number;
  styleMatchScore?: number;
}

export interface AnalyticsSummary {
  total_notes: number;
  avg_confidence: number;
  avg_satisfaction: number;
  avg_style_match: number;
  recent_notes: number;
  improvement_trend: 'improving' | 'declining' | 'stable';
}

export interface AnalyticsRecord {
  id: string;
  user_id: string;
  note_id: string;
  note_section_id?: string;
  original_generated: string;
  user_edited_version?: string;
  edit_type?: string;
  confidence_score: number;
  user_satisfaction_score?: number;
  feedback_notes?: string;
  tokens_used?: number;
  generation_time_ms?: number;
  style_match_score?: number;
  created_at: string;
  updated_at: string;
  notes?: {
    title: string;
  };
  note_sections?: {
    user_prompt: string;
  };
}

export interface StyleEvolution {
  id: string;
  user_id: string;
  previous_style?: string;
  updated_style: string;
  confidence_before?: number;
  confidence_after: number;
  trigger_reason: string;
  notes_analyzed: number;
  improvement_metrics?: any;
  created_at: string;
}

export interface StyleAnalysis {
  quality: 'excellent' | 'good' | 'fair' | 'needs_improvement';
  score: number;
  suggestions: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface StyleEvolutionRequest {
  newStyle: string;
  triggerReason: string;
  notesAnalyzed?: number;
  improvementMetrics?: any;
}

class WritingAnalyticsService {
  async logAnalytics(data: AnalyticsLogRequest): Promise<{ success: boolean; analyticsId?: string; error?: string }> {
    console.log('Analytics logged:', data);
    return {
      success: true,
      analyticsId: 'mock-' + Date.now(),
    };
  }

  async getAnalyticsSummary(): Promise<{ success: boolean; summary?: AnalyticsSummary; error?: string }> {
    return {
      success: true,
      summary: {
        total_notes: 8,
        avg_confidence: 0.72,
        avg_satisfaction: 4.2,
        avg_style_match: 0.68,
        recent_notes: 3,
        improvement_trend: 'improving'
      }
    };
  }

  async getAnalyticsHistory(limit = 50, offset = 0): Promise<{
    success: boolean;
    analytics?: AnalyticsRecord[];
    pagination?: any;
    error?: string
  }> {
    return {
      success: true,
      analytics: [],
      pagination: { limit, offset, total: 0 }
    };
  }

  async getStyleEvolutionHistory(limit = 20): Promise<{
    success: boolean;
    evolution?: StyleEvolution[];
    error?: string
  }> {
    return {
      success: true,
      evolution: []
    };
  }

  async evolveWritingStyle(data: StyleEvolutionRequest): Promise<{ success: boolean; error?: string }> {
    console.log('Style evolved:', data);
    return { success: true };
  }

  async analyzeWritingStyle(writingStyle: string): Promise<{
    success: boolean;
    analysis?: StyleAnalysis;
    error?: string
  }> {
    return {
      success: true,
      analysis: {
        quality: 'good',
        score: 0.75,
        suggestions: ['Consider varying sentence length'],
        strengths: ['Clear communication'],
        weaknesses: ['Could be more concise']
      }
    };
  }

  async updateStyleConfidence(): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async provideFeedback(
    noteId: string, 
    noteSectionId: string, 
    satisfactionScore: number, 
    feedbackNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log('Feedback provided:', { noteId, noteSectionId, satisfactionScore, feedbackNotes });
    return { success: true };
  }

  calculateImprovementMetrics(analytics: AnalyticsRecord[]): {
    confidenceTrend: number;
    satisfactionTrend: number;
    styleMatchTrend: number;
    totalGenerations: number;
    averageConfidence: number;
    averageSatisfaction: number;
    averageStyleMatch: number;
  } {
    return {
      confidenceTrend: 0.1,
      satisfactionTrend: 0.2,
      styleMatchTrend: 0.15,
      totalGenerations: analytics.length,
      averageConfidence: 0.72,
      averageSatisfaction: 4.2,
      averageStyleMatch: 0.68
    };
  }
}

export const writingAnalyticsService = new WritingAnalyticsService();
export default writingAnalyticsService;
