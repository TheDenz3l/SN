import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY || '');

// Get the Gemini 2.5 Flash model
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });

export interface GenerationRequest {
  taskDescription?: string;
  userPrompt: string;
  writingStyle: string;
  noteType: 'task' | 'comment' | 'general';
  userId?: string;
}

export interface GenerationResult {
  generatedText: string;
  tokensUsed: number;
  processingTime: number;
  cost: number;
}

export interface GenerationError {
  message: string;
  code?: string;
  retryable?: boolean;
}

class AIService {
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  /**
   * Generate AI content based on user input and writing style
   */
  async generateContent(request: GenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();
    
    try {
      // Validate inputs
      this.validateRequest(request);
      
      // Create the prompt
      const prompt = this.createPrompt(request);
      
      // Generate content with retry logic
      const result = await this.generateWithRetry(prompt);
      
      // Calculate metrics
      const processingTime = Date.now() - startTime;
      const tokensUsed = this.estimateTokens(prompt + result);
      const cost = this.calculateCost(tokensUsed);
      
      return {
        generatedText: result,
        tokensUsed,
        processingTime,
        cost,
      };
    } catch (error) {
      console.error('AI generation error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a well-structured prompt for the AI model
   */
  private createPrompt(request: GenerationRequest): string {
    const { taskDescription, userPrompt, writingStyle, noteType } = request;
    
    let prompt = `You are an AI assistant helping healthcare professionals write professional notes. Your task is to generate content that matches the user's unique writing style while addressing their specific prompt.

WRITING STYLE TO MATCH:
"""
${writingStyle}
"""

INSTRUCTIONS:
- Write in the EXACT same style, tone, and format as the writing style sample above
- Use similar vocabulary, sentence structure, and professional terminology
- Maintain the same level of detail and documentation approach
- Keep the response professional and appropriate for healthcare documentation
- Focus specifically on what the user is asking for in their prompt`;

    if (noteType === 'task' && taskDescription) {
      prompt += `

ISP TASK BEING DOCUMENTED:
"${taskDescription}"

USER'S SPECIFIC PROMPT FOR THIS TASK:
"${userPrompt}"

Generate a concise, professional note section (2-4 sentences) that documents progress or observations related to this specific ISP task. Base your response on the user's prompt while maintaining their writing style.`;
    } else if (noteType === 'comment') {
      prompt += `

USER'S PROMPT FOR GENERAL COMMENTS:
"${userPrompt}"

Generate a comprehensive general comment section (4-8 sentences) that provides overall observations, progress summary, or additional relevant information. Base your response on the user's prompt while maintaining their writing style.`;
    } else {
      prompt += `

USER'S PROMPT:
"${userPrompt}"

Generate professional documentation content based on the user's prompt while maintaining their writing style. Adjust the length appropriately for the context.`;
    }

    prompt += `

IMPORTANT GUIDELINES:
- Only include information that can be reasonably inferred from the user's prompt
- Do not make up specific details, names, or events not mentioned
- Use professional, objective language appropriate for healthcare documentation
- Maintain HIPAA compliance by using general terms when appropriate
- Match the writing style sample as closely as possible

Generate the note content now:`;

    return prompt;
  }

  /**
   * Generate content with retry logic for reliability
   */
  private async generateWithRetry(prompt: string): Promise<string> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (!text || text.trim().length === 0) {
          throw new Error('Empty response from AI model');
        }
        
        return text.trim();
      } catch (error) {
        lastError = error;
        console.warn(`AI generation attempt ${attempt} failed:`, error);
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }
        
        // Wait before retrying
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Validate the generation request
   */
  private validateRequest(request: GenerationRequest): void {
    if (!request.userPrompt || request.userPrompt.trim().length === 0) {
      throw new Error('User prompt is required');
    }
    
    if (!request.writingStyle || request.writingStyle.trim().length < 50) {
      throw new Error('Writing style sample is required and must be at least 50 characters');
    }
    
    if (request.userPrompt.length > 1000) {
      throw new Error('User prompt is too long (max 1000 characters)');
    }
    
    if (request.writingStyle.length > 3000) {
      throw new Error('Writing style sample is too long (max 3000 characters)');
    }
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(tokens: number): number {
    // Gemini 1.5 Pro pricing (approximate)
    const inputTokens = tokens * 0.7; // Assume 70% input
    const outputTokens = tokens * 0.3; // Assume 30% output
    
    const inputCostPer1K = 0.00125; // $0.00125 per 1K input tokens
    const outputCostPer1K = 0.00375; // $0.00375 per 1K output tokens
    
    return ((inputTokens / 1000) * inputCostPer1K) + ((outputTokens / 1000) * outputCostPer1K);
  }

  /**
   * Check if an error should not be retried
   */
  private isNonRetryableError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    
    // Don't retry on authentication, quota, or validation errors
    return (
      errorMessage.includes('api key') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('billing') ||
      errorMessage.includes('permission') ||
      errorMessage.includes('invalid') ||
      error?.status === 400 ||
      error?.status === 401 ||
      error?.status === 403
    );
  }

  /**
   * Handle and format errors
   */
  private handleError(error: any): GenerationError {
    const message = error?.message || 'AI generation failed';
    
    if (message.includes('API key')) {
      return {
        message: 'AI service configuration error. Please contact support.',
        code: 'CONFIG_ERROR',
        retryable: false,
      };
    }
    
    if (message.includes('quota') || message.includes('billing')) {
      return {
        message: 'AI service temporarily unavailable due to quota limits. Please try again later.',
        code: 'QUOTA_ERROR',
        retryable: true,
      };
    }
    
    if (error?.status >= 500) {
      return {
        message: 'AI service temporarily unavailable. Please try again.',
        code: 'SERVER_ERROR',
        retryable: true,
      };
    }
    
    return {
      message: 'AI generation failed. Please try again.',
      code: 'UNKNOWN_ERROR',
      retryable: true,
    };
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test the AI service connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const testRequest: GenerationRequest = {
        userPrompt: 'Test prompt',
        writingStyle: 'This is a test writing style sample that demonstrates professional healthcare documentation with clear, concise language and appropriate terminology.',
        noteType: 'general',
      };
      
      await this.generateContent(testRequest);
      return true;
    } catch (error) {
      console.error('AI service test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;
