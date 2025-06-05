/**
 * AI Routes for SwiftNotes
 * Handles AI-powered note generation using Google Gemini
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const WritingAnalyticsService = require('../services/writingAnalyticsService');
const router = express.Router();

// Create a dedicated admin client for AI operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || 'https://ppavdpzulvosmmkzqtgy.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });

// Validation middleware
const validateGenerateNote = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Note title must be between 1 and 200 characters'),
  body('sections')
    .isArray({ min: 1 })
    .withMessage('At least one section is required'),
  body('sections.*.prompt')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Section prompt must be between 1 and 1000 characters'),
  body('sections.*.type')
    .isIn(['task', 'comment', 'general'])
    .withMessage('Section type must be task, comment, or general'),
  body('sections.*.taskId')
    .optional()
    .isUUID()
    .withMessage('Task ID must be a valid UUID')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Helper function to estimate tokens
const estimateTokens = (text) => {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
};

// Helper function to calculate cost
const calculateCost = (tokensUsed) => {
  // Gemini 2.5 Flash pricing (approximate)
  const inputTokens = tokensUsed * 0.7; // Assume 70% input tokens
  const outputTokens = tokensUsed * 0.3; // Assume 30% output tokens
  
  const inputCostPer1K = 0.00125;
  const outputCostPer1K = 0.00375;
  
  return ((inputTokens / 1000) * inputCostPer1K) + ((outputTokens / 1000) * outputCostPer1K);
};

// Enhanced AI prompt creation with advanced style preservation and content expansion
const createEnhancedPrompt = (sectionRequest, writingStyle, taskDescription = null, detailLevel = 'detailed', toneLevel = 50) => {
  const { prompt, type } = sectionRequest;

  // Analyze writing style characteristics
  const styleAnalysis = analyzeWritingStyleCharacteristics(writingStyle);

  // Generate tone instructions based on toneLevel (0-100)
  const toneInstructions = generateToneInstructions(toneLevel, styleAnalysis);

  let systemPrompt = `You are an advanced AI writing assistant specializing in healthcare documentation. Your mission is to generate comprehensive, detailed notes that perfectly mirror the user's authentic writing style while expanding their brief inputs into full, professional documentation.

CRITICAL STYLE PRESERVATION REQUIREMENTS:
${generateStylePreservationInstructions(styleAnalysis)}

TONE ADJUSTMENT INSTRUCTIONS:
${toneInstructions}

ORIGINAL WRITING STYLE SAMPLE:
${writingStyle}

CONTENT EXPANSION GUIDELINES:
- Transform brief user inputs into detailed, comprehensive documentation
- Add relevant clinical observations and professional details
- Expand on context while maintaining authenticity
- Include appropriate healthcare terminology consistent with the user's vocabulary
- Maintain the user's natural flow of thought and expression patterns

TASK CONTEXT:
${taskDescription ? `ISP Task: ${taskDescription}` : 'General documentation task'}
Note Type: ${type}
Detail Level: ${detailLevel}

USER'S BRIEF INPUT:
"${prompt}"

ENHANCED GENERATION INSTRUCTIONS:
1. ANALYZE the user's brief input for key concepts and intent
2. EXPAND the content to include:
   - Detailed observations and context
   - Professional terminology matching the user's style
   - Relevant clinical or support details
   - Natural elaboration that sounds authentically written by the user
3. PRESERVE the user's:
   - Sentence structure patterns (${styleAnalysis.sentenceStyle})
   - Vocabulary level (${styleAnalysis.vocabularyLevel})
   - Punctuation habits (${styleAnalysis.punctuationStyle})
   - Tone and personality (${styleAnalysis.tone})
   - Professional terminology preferences

RESPONSE FORMAT:
Generate a comprehensive, detailed note section that transforms the brief user input into a full professional documentation entry. The response should be 2-3 times more detailed than the input while sounding exactly like the user wrote it themselves.

Make it sound natural, authentic, and professionally appropriate for ${type} documentation.`;

  return systemPrompt;
};

// Analyze writing style characteristics for enhanced prompting
const analyzeWritingStyleCharacteristics = (writingStyle) => {
  const sentences = writingStyle.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.trim().split(' ').length, 0) / sentences.length;

  // Analyze sentence structure
  const sentenceStyle = avgSentenceLength > 20 ? 'complex, detailed sentences' :
                       avgSentenceLength > 12 ? 'moderate-length sentences' :
                       'concise, direct sentences';

  // Analyze vocabulary complexity
  const complexWords = writingStyle.match(/\b\w{8,}\b/g) || [];
  const vocabularyLevel = complexWords.length > writingStyle.split(' ').length * 0.15 ? 'advanced professional vocabulary' :
                         complexWords.length > writingStyle.split(' ').length * 0.08 ? 'moderate professional vocabulary' :
                         'clear, accessible vocabulary';

  // Analyze punctuation patterns
  const hasCommas = (writingStyle.match(/,/g) || []).length > sentences.length * 0.5;
  const hasSemicolons = writingStyle.includes(';');
  const hasDashes = writingStyle.includes('—') || writingStyle.includes(' - ');

  const punctuationStyle = hasSemicolons ? 'formal punctuation with semicolons' :
                          hasDashes ? 'uses dashes for emphasis' :
                          hasCommas ? 'comma-rich, detailed punctuation' :
                          'simple, direct punctuation';

  // Analyze tone
  const formalWords = ['individual', 'demonstrated', 'exhibited', 'participated', 'completed'];
  const casualWords = ['got', 'did', 'went', 'said', 'made'];
  const formalCount = formalWords.filter(word => writingStyle.toLowerCase().includes(word)).length;
  const casualCount = casualWords.filter(word => writingStyle.toLowerCase().includes(word)).length;

  const tone = formalCount > casualCount ? 'formal, professional tone' :
               casualCount > formalCount ? 'conversational, approachable tone' :
               'balanced professional tone';

  return {
    sentenceStyle,
    vocabularyLevel,
    punctuationStyle,
    tone,
    avgSentenceLength: Math.round(avgSentenceLength)
  };
};

// Generate specific style preservation instructions
const generateStylePreservationInstructions = (styleAnalysis) => {
  return `
- SENTENCE STRUCTURE: Use ${styleAnalysis.sentenceStyle} (average ${styleAnalysis.avgSentenceLength} words per sentence)
- VOCABULARY: Maintain ${styleAnalysis.vocabularyLevel}
- PUNCTUATION: Follow ${styleAnalysis.punctuationStyle} patterns
- TONE: Preserve ${styleAnalysis.tone}
- AUTHENTICITY: The generated content must sound like it was written by the same person who wrote the style sample
- PERSONALITY: Maintain any unique expressions, professional preferences, or communication patterns evident in the sample`;
};

// Generate tone adjustment instructions based on slider value (0-100)
const generateToneInstructions = (toneLevel, styleAnalysis) => {
  if (toneLevel < 25) {
    // More Authentic (0-24)
    return `
TONE SETTING: MAXIMUM AUTHENTICITY (${toneLevel}/100)
- Prioritize the user's natural writing patterns and personal expressions
- Use conversational elements and personal touches from the writing style sample
- Maintain informal professional language that feels natural and personal
- Include personality quirks and unique phrasing patterns from the sample
- Focus on sounding exactly like the user wrote it themselves
- Allow for casual professional language and personal communication style`;
  } else if (toneLevel < 50) {
    // Balanced Authentic (25-49)
    return `
TONE SETTING: AUTHENTIC WITH PROFESSIONAL TOUCH (${toneLevel}/100)
- Balance personal writing style with professional healthcare standards
- Maintain the user's natural voice while ensuring clinical appropriateness
- Use the user's preferred terminology but ensure professional clarity
- Keep personal expressions while meeting documentation requirements
- Blend authentic style with necessary professional elements`;
  } else if (toneLevel < 75) {
    // Balanced Professional (50-74)
    return `
TONE SETTING: PROFESSIONAL WITH AUTHENTIC ELEMENTS (${toneLevel}/100)
- Emphasize professional healthcare documentation standards
- Maintain user's writing style but elevate to clinical professional level
- Use formal medical terminology while preserving user's sentence patterns
- Ensure clinical objectivity while keeping recognizable writing characteristics
- Professional tone with subtle personal style elements`;
  } else {
    // Maximum Professional (75-100)
    return `
TONE SETTING: MAXIMUM PROFESSIONAL CLINICAL STANDARD (${toneLevel}/100)
- Prioritize formal clinical documentation standards and medical terminology
- Use objective, professional healthcare language throughout
- Maintain clinical objectivity and formal documentation style
- Follow strict professional healthcare documentation guidelines
- Minimize personal expressions in favor of clinical precision
- Ensure content meets highest professional healthcare documentation standards`;
  }
};

// Legacy function for backward compatibility - now uses enhanced prompting by default
const createPrompt = (sectionRequest, writingStyle, taskDescription = null) => {
  return createEnhancedPrompt(sectionRequest, writingStyle, taskDescription, 'detailed');
};

/**
 * POST /api/ai/generate
 * Generate AI-powered note based on user input and writing style
 */
router.post('/generate', validateGenerateNote, handleValidationErrors, async (req, res) => {
  try {
    // Use dedicated admin client for AI operations
    const supabase = supabaseAdmin;
    const userId = req.user.id;
    const { title, sections } = req.body;

    // Check if user has completed setup
    if (!req.user.hasCompletedSetup || !req.user.writingStyle) {
      return res.status(400).json({
        success: false,
        error: 'Please complete your setup before generating notes'
      });
    }

    // Check user credits
    const creditsNeeded = sections.length;
    if (req.user.credits < creditsNeeded) {
      return res.status(400).json({
        success: false,
        error: `Insufficient credits. Need ${creditsNeeded}, have ${req.user.credits}`
      });
    }

    // Get ISP tasks for context
    const { data: ispTasks, error: tasksError } = await supabase
      .from('isp_tasks')
      .select('*')
      .eq('user_id', userId);

    if (tasksError) {
      console.error('ISP tasks fetch error:', tasksError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch ISP tasks'
      });
    }

    // Create the note first
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        title,
        content: { sections: sections.length },
        note_type: 'task',
        tokens_used: 0,
        cost: 0
      })
      .select()
      .single();

    if (noteError) {
      console.error('Note creation error:', noteError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create note'
      });
    }

    // Initialize analytics service
    const analyticsService = new WritingAnalyticsService(supabase);

    // Generate content for each section
    const generatedSections = [];
    let totalTokens = 0;
    let totalCost = 0;

    for (const sectionRequest of sections) {
      const startTime = Date.now();
      try {
        // Get task description if this is a task-related section
        let taskDescription = null;
        if (sectionRequest.taskId) {
          const task = ispTasks.find(t => t.id === sectionRequest.taskId);
          taskDescription = task?.description;
        }

        // Create the enhanced prompt with detailed level by default
        const prompt = createEnhancedPrompt(
          sectionRequest,
          req.user.writingStyle,
          taskDescription,
          'detailed'
        );

        // Generate content with retry logic
        let generatedText = '';
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
          try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            generatedText = response.text();

            if (generatedText && generatedText.trim().length > 0) {
              break;
            }
          } catch (aiError) {
            console.warn(`AI generation attempt ${attempts + 1} failed:`, aiError);
            attempts++;

            if (attempts >= maxAttempts) {
              throw new Error('AI generation failed after multiple attempts');
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }

        if (!generatedText || generatedText.trim().length === 0) {
          throw new Error('Empty response from AI model');
        }

        // Calculate metrics
        const tokensUsed = estimateTokens(prompt + generatedText);
        const cost = calculateCost(tokensUsed);
        const generationTime = Date.now() - startTime;

        // Create note section using dedicated admin client
        const { data: section, error: sectionError } = await supabase
          .from('note_sections')
          .insert({
            note_id: note.id,
            isp_task_id: sectionRequest.taskId || null,
            user_prompt: sectionRequest.prompt,
            generated_content: generatedText.trim(),
            is_edited: false,
            tokens_used: tokensUsed
          })
          .select()
          .single();

        if (sectionError) {
          console.error('Section creation error:', sectionError);
          throw new Error('Failed to create note section');
        }

        // Calculate initial confidence and style match scores
        const confidenceScore = Math.min(0.9, 0.5 + (req.user.writingStyle.length / 3000) * 0.3);
        const styleMatchScore = analyticsService.calculateStyleMatchScore(
          generatedText.trim(),
          req.user.writingStyle
        );

        // Log analytics for this generation
        await analyticsService.logAnalytics({
          userId,
          noteId: note.id,
          noteSectionId: section.id,
          originalGenerated: generatedText.trim(),
          confidenceScore,
          tokensUsed,
          generationTimeMs: generationTime,
          styleMatchScore
        });

        generatedSections.push(section);
        totalTokens += tokensUsed;
        totalCost += cost;

      } catch (error) {
        console.error('Section generation error:', error);
        // Continue with other sections, but log the error
        generatedSections.push({
          error: error.message,
          user_prompt: sectionRequest.prompt,
          generated_content: 'Failed to generate content for this section. Please try again.'
        });
      }
    }

    // Update note with total metrics
    await supabase
      .from('notes')
      .update({
        tokens_used: totalTokens,
        cost: totalCost,
        updated_at: new Date().toISOString()
      })
      .eq('id', note.id);

    // Deduct credits
    const creditsUsed = Math.min(creditsNeeded, generatedSections.filter(s => !s.error).length);
    await supabase
      .from('user_profiles')
      .update({
        credits: req.user.credits - creditsUsed,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    // Log credit transaction
    await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        transaction_type: 'usage',
        amount: -creditsUsed,
        description: `Note generation: ${title}`,
        reference_id: note.id
      });

    res.json({
      success: true,
      message: 'Note generated successfully',
      note: {
        ...note,
        tokens_used: totalTokens,
        cost: totalCost
      },
      sections: generatedSections,
      totalTokens,
      totalCost,
      creditsUsed
    });

  } catch (error) {
    console.error('Note generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate note. Please try again.'
    });
  }
});

/**
 * POST /api/ai/regenerate-section
 * Regenerate a specific section of a note
 */
router.post('/regenerate-section', async (req, res) => {
  try {
    const { sectionId, newPrompt } = req.body;
    // Use dedicated admin client for AI operations
    const supabase = supabaseAdmin;
    const userId = req.user.id;
    const startTime = Date.now();

    if (!sectionId || !newPrompt) {
      return res.status(400).json({
        success: false,
        error: 'Section ID and new prompt are required'
      });
    }

    // Check user credits
    if (req.user.credits < 1) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient credits for regeneration'
      });
    }

    // Get the section and verify ownership
    const { data: section, error: sectionError } = await supabase
      .from('note_sections')
      .select(`
        *,
        notes!inner(user_id),
        isp_tasks(description)
      `)
      .eq('id', sectionId)
      .eq('notes.user_id', userId)
      .single();

    if (sectionError || !section) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }

    // Create enhanced prompt for regeneration
    const taskDescription = section.isp_tasks?.description;
    const prompt = createEnhancedPrompt(
      { prompt: newPrompt, type: taskDescription ? 'task' : 'general' },
      req.user.writingStyle,
      taskDescription,
      'detailed'
    );

    // Generate new content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    if (!generatedText || generatedText.trim().length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate content'
      });
    }

    // Calculate metrics
    const tokensUsed = estimateTokens(prompt + generatedText);
    const generationTime = Date.now() - startTime;

    // Update section
    const { data: updatedSection, error: updateError } = await supabase
      .from('note_sections')
      .update({
        user_prompt: newPrompt,
        generated_content: generatedText.trim(),
        tokens_used: tokensUsed,
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', sectionId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update section'
      });
    }

    // Initialize analytics service and log regeneration
    const analyticsService = new WritingAnalyticsService(supabase);
    const confidenceScore = Math.min(0.9, 0.5 + (req.user.writingStyle.length / 3000) * 0.3);
    const styleMatchScore = analyticsService.calculateStyleMatchScore(
      generatedText.trim(),
      req.user.writingStyle
    );

    await analyticsService.logAnalytics({
      userId,
      noteId: section.note_id,
      noteSectionId: sectionId,
      originalGenerated: generatedText.trim(),
      userEditedVersion: section.generated_content, // Previous version as "edited"
      editType: 'complete_rewrite',
      confidenceScore,
      tokensUsed,
      generationTimeMs: generationTime,
      styleMatchScore
    });

    // Deduct credit
    await supabase
      .from('user_profiles')
      .update({
        credits: req.user.credits - 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    // Log credit transaction
    await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        transaction_type: 'usage',
        amount: -1,
        description: 'Section regeneration',
        reference_id: sectionId
      });

    res.json({
      success: true,
      message: 'Section regenerated successfully',
      section: updatedSection,
      tokensUsed,
      creditsUsed: 1
    });

  } catch (error) {
    console.error('Section regeneration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate section'
    });
  }
});

/**
 * POST /api/ai/preview
 * Generate a preview of enhanced content without saving
 */
router.post('/preview', async (req, res) => {
  try {
    const { prompt, taskDescription, detailLevel = 'detailed', toneLevel = 50 } = req.body;
    const userId = req.user.id;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required for preview'
      });
    }

    // Check if user has completed setup - if not, provide basic preview
    let writingStyle = req.user.writingStyle;
    let isBasicPreview = false;

    if (!req.user.hasCompletedSetup || !writingStyle) {
      // Use a default professional writing style for preview
      writingStyle = `Professional healthcare documentation style with clear, concise language.
        Uses appropriate medical terminology while maintaining readability.
        Focuses on objective observations and factual reporting.
        Maintains professional tone throughout all documentation.`;
      isBasicPreview = true;
    }

    const startTime = Date.now();

    // Create enhanced prompt for preview
    const enhancedPrompt = createEnhancedPrompt(
      { prompt: prompt.trim(), type: taskDescription ? 'task' : 'general' },
      writingStyle,
      taskDescription,
      detailLevel,
      toneLevel
    );

    // Generate preview content
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const generatedText = response.text();

    if (!generatedText || generatedText.trim().length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate preview content'
      });
    }

    // Calculate metrics for preview
    const tokensUsed = estimateTokens(enhancedPrompt + generatedText);
    const cost = calculateCost(tokensUsed);
    const generationTime = Date.now() - startTime;

    // Calculate style match score for preview
    let styleMatchScore = 85; // Default score for basic preview

    if (!isBasicPreview) {
      const analyticsService = new WritingAnalyticsService(supabaseAdmin);
      styleMatchScore = Math.round(analyticsService.calculateStyleMatchScore(
        generatedText.trim(),
        writingStyle
      ) * 100);
    }

    res.json({
      success: true,
      preview: {
        originalPrompt: prompt.trim(),
        enhancedContent: generatedText.trim(),
        detailLevel,
        toneLevel,
        isBasicPreview,
        metrics: {
          tokensUsed,
          estimatedCost: cost,
          generationTimeMs: generationTime,
          styleMatchScore,
          expansionRatio: Math.round((generatedText.trim().length / prompt.trim().length) * 10) / 10
        }
      }
    });

  } catch (error) {
    console.error('Preview generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate preview'
    });
  }
});

module.exports = router;
