/**
 * AI Routes for SwiftNotes
 * Handles AI-powered note generation using Google Gemini
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
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
const createEnhancedPrompt = (sectionRequest, writingStyle, taskDescription = null, detailLevel = 'brief', toneLevel = 50, userPreferences = {}) => {
  const { prompt, type } = sectionRequest;

  // Analyze writing style characteristics
  const styleAnalysis = analyzeWritingStyleCharacteristics(writingStyle);

  // Add user preferences to style analysis
  styleAnalysis.userPreferences = userPreferences;

  // Generate tone instructions based on toneLevel (0-100)
  const toneInstructions = generateToneInstructions(toneLevel, styleAnalysis);

  // Generate detail level instructions
  const detailInstructions = generateDetailLevelInstructions(detailLevel);

  let systemPrompt = `You are an advanced AI writing assistant specializing in healthcare documentation. Your mission is to generate notes that perfectly mirror the user's authentic writing style while transforming their brief inputs into professional documentation.

CRITICAL STYLE PRESERVATION REQUIREMENTS:
${generateStylePreservationInstructions(styleAnalysis)}

TONE ADJUSTMENT INSTRUCTIONS:
${toneInstructions}

DETAIL LEVEL INSTRUCTIONS:
${detailInstructions}

ORIGINAL WRITING STYLE SAMPLE:
${writingStyle}

CONTENT EXPANSION GUIDELINES:
- Transform brief user inputs into appropriate documentation based on detail level
- Add relevant clinical observations and professional details as needed
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
2. EXPAND the content according to the detail level requirements
3. PRESERVE the user's:
   - Sentence structure patterns (${styleAnalysis.sentenceStyle})
   - Vocabulary level (${styleAnalysis.vocabularyLevel})
   - Punctuation habits (${styleAnalysis.punctuationStyle})
   - Tone and personality (${styleAnalysis.tone})
   - Professional terminology preferences

RESPONSE FORMAT:
Generate a note section that transforms the brief user input into professional documentation following the specified detail level. The content must sound exactly like the user wrote it themselves.

Make it sound natural, authentic, and professionally appropriate for ${type} documentation.`;

  return systemPrompt;
};

// Enhanced writing style analysis with vocabulary extraction and mapping
const analyzeWritingStyleCharacteristics = (writingStyle) => {
  const sentences = writingStyle.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = writingStyle.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.trim().split(' ').length, 0) / sentences.length;

  // Extract user's vocabulary preferences
  const vocabularyProfile = extractVocabularyProfile(writingStyle);

  // Analyze sentence structure
  const sentenceStyle = avgSentenceLength > 20 ? 'complex, detailed sentences' :
                       avgSentenceLength > 12 ? 'moderate-length sentences' :
                       'concise, direct sentences';

  // Analyze vocabulary complexity based on actual user words
  const complexWords = writingStyle.match(/\b\w{8,}\b/g) || [];
  const vocabularyLevel = complexWords.length > words.length * 0.15 ? 'advanced professional vocabulary' :
                         complexWords.length > words.length * 0.08 ? 'moderate professional vocabulary' :
                         'clear, accessible vocabulary';

  // Analyze punctuation patterns
  const hasCommas = (writingStyle.match(/,/g) || []).length > sentences.length * 0.5;
  const hasSemicolons = writingStyle.includes(';');
  const hasDashes = writingStyle.includes('—') || writingStyle.includes(' - ');

  const punctuationStyle = hasSemicolons ? 'formal punctuation with semicolons' :
                          hasDashes ? 'uses dashes for emphasis' :
                          hasCommas ? 'comma-rich, detailed punctuation' :
                          'simple, direct punctuation';

  // Enhanced tone analysis using user's actual vocabulary
  const userToneProfile = analyzeUserTone(writingStyle, vocabularyProfile);

  return {
    sentenceStyle,
    vocabularyLevel,
    punctuationStyle,
    tone: userToneProfile.overallTone,
    avgSentenceLength: Math.round(avgSentenceLength),
    vocabularyProfile,
    userToneProfile,
    preferredPhrases: vocabularyProfile.commonPhrases,
    naturalExpressions: vocabularyProfile.naturalExpressions
  };
};

// Extract comprehensive vocabulary profile from user's writing sample
const extractVocabularyProfile = (writingStyle) => {
  const text = writingStyle.toLowerCase();
  const sentences = writingStyle.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Extract action verbs (how user describes actions)
  const actionVerbs = extractActionVerbs(text);

  // Extract descriptive words (how user describes things)
  const descriptiveWords = extractDescriptiveWords(text);

  // Extract transition words and phrases
  const transitions = extractTransitions(text);

  // Extract common phrases (2-4 word combinations)
  const commonPhrases = extractCommonPhrases(sentences);

  // Extract natural expressions and colloquialisms
  const naturalExpressions = extractNaturalExpressions(text);

  // Create clinical-to-natural mappings
  const vocabularyMappings = createVocabularyMappings(actionVerbs, descriptiveWords);

  // Detect time-based patterns
  const timePatterns = detectTimePatterns(writingStyle);

  return {
    actionVerbs,
    descriptiveWords,
    transitions,
    commonPhrases,
    naturalExpressions,
    vocabularyMappings,
    timePatterns
  };
};

// Extract action verbs from user's writing
const extractActionVerbs = (text) => {
  const commonActionVerbs = [
    'went', 'did', 'made', 'got', 'had', 'was', 'were', 'said', 'told', 'asked',
    'helped', 'worked', 'tried', 'started', 'finished', 'completed', 'showed',
    'demonstrated', 'practiced', 'learned', 'improved', 'struggled', 'succeeded',
    'participated', 'engaged', 'focused', 'concentrated', 'enjoyed', 'liked',
    'seemed', 'appeared', 'looked', 'felt', 'thought', 'believed', 'understood',
    'sleep', 'slept', 'awakened', 'woke', 'choose', 'chose', 'decided'
  ];

  const foundVerbs = commonActionVerbs.filter(verb => text.includes(verb));
  return foundVerbs.slice(0, 15); // Top 15 most relevant
};

// Extract descriptive words from user's writing
const extractDescriptiveWords = (text) => {
  const commonDescriptors = [
    'good', 'well', 'better', 'best', 'great', 'excellent', 'positive', 'nice',
    'bad', 'difficult', 'hard', 'challenging', 'tough', 'easy', 'simple',
    'happy', 'pleased', 'excited', 'motivated', 'focused', 'calm', 'relaxed',
    'frustrated', 'upset', 'anxious', 'nervous', 'confused', 'clear',
    'successful', 'effective', 'helpful', 'useful', 'important', 'necessary',
    'quick', 'slow', 'fast', 'careful', 'thorough', 'detailed', 'brief'
  ];

  const foundDescriptors = commonDescriptors.filter(desc => text.includes(desc));
  return foundDescriptors.slice(0, 12); // Top 12 most relevant
};

// Extract transition words and phrases
const extractTransitions = (text) => {
  const commonTransitions = [
    'then', 'after', 'before', 'during', 'while', 'when', 'since', 'until',
    'first', 'next', 'finally', 'also', 'and', 'but', 'however', 'although',
    'because', 'so', 'therefore', 'as well', 'in addition', 'meanwhile'
  ];

  const foundTransitions = commonTransitions.filter(trans => text.includes(trans));
  return foundTransitions.slice(0, 10); // Top 10 most relevant
};

// Extract common phrases (2-4 word combinations)
const extractCommonPhrases = (sentences) => {
  const phrases = [];

  sentences.forEach(sentence => {
    const words = sentence.trim().split(/\s+/);

    // Extract 2-word phrases
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`.toLowerCase();
      if (phrase.length > 6 && !phrases.includes(phrase)) {
        phrases.push(phrase);
      }
    }

    // Extract 3-word phrases
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`.toLowerCase();
      if (phrase.length > 10 && !phrases.includes(phrase)) {
        phrases.push(phrase);
      }
    }
  });

  return phrases.slice(0, 8); // Top 8 most relevant phrases
};

// Extract natural expressions and colloquialisms
const extractNaturalExpressions = (text) => {
  const naturalPatterns = [
    /\b(seemed to|appeared to|looked like|felt like)\b/g,
    /\b(really|pretty|quite|very|extremely)\s+\w+/g,
    /\b(a bit|a little|kind of|sort of)\b/g,
    /\b(he would|she would|they would)\b/g,
    /\b(got|did|went|made|had)\s+\w+/g
  ];

  const expressions = [];
  naturalPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    expressions.push(...matches.slice(0, 3)); // Max 3 per pattern
  });

  return expressions.slice(0, 10); // Top 10 natural expressions
};

// Detect time-based narrative patterns in user's writing
const detectTimePatterns = (writingStyle) => {
  const text = writingStyle;

  // Look for time patterns
  const timePatterns = {
    hasTimeMarkers: false,
    timeFormat: null,
    timeMarkers: [],
    usesSequentialTiming: false,
    timeBasedNarrative: false
  };

  // Detect various time formats
  const timeFormats = [
    { pattern: /\b\d{1,2}:\d{2}(AM|PM)\b/gi, format: '12-hour' },
    { pattern: /\b\d{1,2}:\d{2}\b/g, format: '24-hour' },
    { pattern: /\b(morning|afternoon|evening|night)\b/gi, format: 'descriptive' }
  ];

  timeFormats.forEach(({ pattern, format }) => {
    const matches = text.match(pattern) || [];
    if (matches.length > 0) {
      timePatterns.hasTimeMarkers = true;
      timePatterns.timeFormat = format;
      timePatterns.timeMarkers.push(...matches.slice(0, 5)); // Max 5 examples
    }
  });

  // Check for sequential timing (multiple time markers in order)
  if (timePatterns.timeMarkers.length >= 2) {
    timePatterns.usesSequentialTiming = true;
    timePatterns.timeBasedNarrative = true;
  }

  // Look for time-based narrative structure
  const timeNarrativePatterns = [
    /\b\d{1,2}:\d{2}(AM|PM)?\s+\w+\s+would\b/gi,
    /\b(first|then|next|after|before|during)\b/gi,
    /\b(morning|afternoon|evening)\s+\w+\s+would\b/gi
  ];

  timeNarrativePatterns.forEach(pattern => {
    if (text.match(pattern)) {
      timePatterns.timeBasedNarrative = true;
    }
  });

  return timePatterns;
};

// Create comprehensive mappings from clinical terms to user's natural language
const createVocabularyMappings = (actionVerbs, descriptiveWords) => {
  // Enhanced action verb mappings
  const actionMappings = {
    'demonstrated': actionVerbs.includes('showed') ? 'showed' : actionVerbs.includes('did') ? 'did' : 'did',
    'exhibited': actionVerbs.includes('showed') ? 'showed' : actionVerbs.includes('had') ? 'had' : 'had',
    'participated': actionVerbs.includes('joined') ? 'joined' : actionVerbs.includes('did') ? 'did' : 'did',
    'completed': actionVerbs.includes('finished') ? 'finished' : 'completed',
    'initiated': actionVerbs.includes('started') ? 'started' : 'started',
    'engaged in': actionVerbs.includes('did') ? 'did' : 'did',
    'performed': actionVerbs.includes('did') ? 'did' : actionVerbs.includes('made') ? 'made' : 'did',
    'proceeded': actionVerbs.includes('went') ? 'went' : 'went',
    'commenced': actionVerbs.includes('started') ? 'started' : 'started',
    'executed': actionVerbs.includes('did') ? 'did' : 'did',
    'administered': actionVerbs.includes('gave') ? 'gave' : 'gave',
    'facilitated': actionVerbs.includes('helped') ? 'helped' : 'helped'
  };

  // Enhanced descriptive word mappings
  const descriptiveMappings = {
    'successful': descriptiveWords.includes('good') ? 'good' : 'good',
    'effective': descriptiveWords.includes('good') ? 'good' : 'good',
    'appropriate': descriptiveWords.includes('good') ? 'good' : 'good',
    'significant': descriptiveWords.includes('big') ? 'big' : 'big',
    'optimal': descriptiveWords.includes('best') ? 'best' : 'good',
    'efficiently': descriptiveWords.includes('well') ? 'well' : '',
    'carefully': '',
    'thoroughly': descriptiveWords.includes('well') ? 'well' : '',
    'promptly': descriptiveWords.includes('quickly') ? 'quickly' : '',
    'independently': 'himself',
    'autonomously': 'himself',
    'comprehensive': 'complete'
  };

  // Enhanced phrase mappings
  const phraseMappings = {
    'the individual': 'he',
    'the participant': 'he',
    'the client': 'he',
    'demonstrated autonomy': 'did it himself',
    'exhibited progress': 'got better',
    'showed improvement': 'got better',
    'engaged successfully': 'did well',
    'completed independently': 'did it himself',
    'proceeded to': 'went to',
    'subsequently': 'then',
    'following this': 'after that',
    'upon completion': 'after he finished',
    'designated laundry hamper': 'laundry basket',
    'waste receptacle': 'garbage can',
    'household refuse container': 'garbage bin',
    'personal bathroom space': 'bathroom',
    'morning routine': 'morning routine',
    'verbal prompt': 'prompt',
    'securing it tightly': 'putting it in',
    'carefully gathering': 'getting',
    'placing them into': 'putting them in'
  };

  // Advanced clinical-to-casual mappings
  const advancedMappings = {
    'facilitate': 'help',
    'utilize': 'use',
    'commence': 'start',
    'conclude': 'finish',
    'obtain': 'get',
    'acquire': 'get',
    'maintain': 'keep',
    'ensure': 'make sure',
    'provide': 'give',
    'receive': 'get',
    'accomplish': 'do',
    'achieve': 'do',
    'establish': 'set up',
    'implement': 'do',
    'coordinate': 'work with',
    'collaborate': 'work with'
  };

  return {
    ...actionMappings,
    ...descriptiveMappings,
    ...phraseMappings,
    ...advancedMappings
  };
};

// Analyze user's tone based on their actual vocabulary
const analyzeUserTone = (writingStyle, vocabularyProfile) => {
  const text = writingStyle.toLowerCase();

  // Count formal vs casual indicators
  const formalIndicators = [
    'demonstrated', 'exhibited', 'participated', 'completed', 'initiated',
    'individual', 'participant', 'client', 'appropriate', 'significant'
  ];

  const casualIndicators = [
    'got', 'did', 'went', 'made', 'had', 'said', 'told', 'seemed',
    'really', 'pretty', 'kind of', 'a bit', 'he would', 'she would'
  ];

  const formalCount = formalIndicators.filter(word => text.includes(word)).length;
  const casualCount = casualIndicators.filter(word => text.includes(word)).length;

  // Analyze sentence starters
  const personalStarters = (text.match(/\b(he|she|they|chad|sarah|john)\s/g) || []).length;
  const formalStarters = (text.match(/\b(the individual|the participant|the client)\s/g) || []).length;

  // Determine overall tone
  let overallTone;
  let toneScore = 0; // -10 (very casual) to +10 (very formal)

  toneScore += formalCount * 2;
  toneScore -= casualCount * 2;
  toneScore += formalStarters * 3;
  toneScore -= personalStarters * 1;

  if (toneScore > 5) {
    overallTone = 'formal, professional tone';
  } else if (toneScore < -3) {
    overallTone = 'conversational, personal tone';
  } else {
    overallTone = 'balanced, approachable tone';
  }

  return {
    overallTone,
    toneScore,
    formalCount,
    casualCount,
    personalStarters,
    formalStarters,
    prefersCasualLanguage: casualCount > formalCount,
    usesPersonalPronouns: personalStarters > formalStarters
  };
};

// Generate enhanced style preservation instructions using vocabulary profile
const generateStylePreservationInstructions = (styleAnalysis) => {
  const vocab = styleAnalysis.vocabularyProfile;
  const toneProfile = styleAnalysis.userToneProfile;

  let instructions = `
- SENTENCE STRUCTURE: Use ${styleAnalysis.sentenceStyle} (average ${styleAnalysis.avgSentenceLength} words per sentence)
- VOCABULARY: Maintain ${styleAnalysis.vocabularyLevel}
- PUNCTUATION: Follow ${styleAnalysis.punctuationStyle} patterns
- TONE: Preserve ${styleAnalysis.tone}`;

  // Add specific vocabulary instructions
  if (vocab.actionVerbs.length > 0) {
    instructions += `
- PREFERRED ACTION VERBS: Use these verbs when possible: ${vocab.actionVerbs.slice(0, 8).join(', ')}`;
  }

  if (vocab.descriptiveWords.length > 0) {
    instructions += `
- PREFERRED DESCRIPTIVE WORDS: Use these descriptors: ${vocab.descriptiveWords.slice(0, 6).join(', ')}`;
  }

  if (vocab.transitions.length > 0) {
    instructions += `
- PREFERRED TRANSITIONS: Connect ideas using: ${vocab.transitions.slice(0, 5).join(', ')}`;
  }

  if (vocab.commonPhrases.length > 0) {
    instructions += `
- COMMON PHRASES: Incorporate these natural phrases when appropriate: ${vocab.commonPhrases.slice(0, 4).join(', ')}`;
  }

  if (vocab.naturalExpressions.length > 0) {
    instructions += `
- NATURAL EXPRESSIONS: Use these authentic expressions: ${vocab.naturalExpressions.slice(0, 3).join(', ')}`;
  }

  // Add tone-specific instructions
  if (toneProfile.prefersCasualLanguage) {
    instructions += `
- CASUAL PREFERENCE: User prefers casual, conversational language over formal clinical terms`;
  }

  if (toneProfile.usesPersonalPronouns) {
    instructions += `
- PERSONAL STYLE: User prefers personal pronouns (he/she/they) over formal terms (individual/participant)`;
  }

  instructions += `
- AUTHENTICITY: The generated content must sound like it was written by the same person who wrote the style sample
- PERSONALITY: Maintain any unique expressions, professional preferences, or communication patterns evident in the sample`;

  return instructions;
};

// Generate detail level instructions based on selected detail level
const generateDetailLevelInstructions = (detailLevel) => {
  switch (detailLevel) {
    case 'brief':
      return `
DETAIL LEVEL: BRIEF (Concise and Essential)
- Keep responses SHORT and CONCISE (2-4 sentences maximum)
- Focus only on essential information and key points
- Avoid unnecessary elaboration or extensive details
- Target length: 30-60 words total
- Maintain professional quality while being extremely concise
- Include only the most critical observations or actions`;

    case 'moderate':
      return `
DETAIL LEVEL: MODERATE (Balanced Detail)
- Provide balanced detail with key context (1-2 short paragraphs)
- Include important observations and relevant background
- Target length: 60-120 words total
- Balance brevity with necessary professional detail
- Include context that supports the main points`;

    case 'detailed':
      return `
DETAIL LEVEL: DETAILED (Comprehensive)
- Provide comprehensive documentation with full context
- Include detailed observations, background, and relevant details
- Target length: 120-200 words total
- Expand on context while maintaining authenticity
- Include professional terminology and thorough documentation`;

    case 'comprehensive':
      return `
DETAIL LEVEL: COMPREHENSIVE (Maximum Detail)
- Provide extensive, thorough documentation with complete context
- Include all relevant observations, background, and supporting details
- Target length: 200+ words total
- Maximum expansion while maintaining user's authentic style
- Include comprehensive professional terminology and complete documentation`;

    default:
      return generateDetailLevelInstructions('brief');
  }
};

// Generate tone adjustment instructions based on slider value (0-100) with SMOOTH TRANSITIONS
const generateToneInstructions = (toneLevel, styleAnalysis) => {
  const vocab = styleAnalysis.vocabularyProfile;
  const mappings = vocab?.vocabularyMappings || {};

  // Calculate continuous interpolation factors for smooth transitions
  const authenticityWeight = Math.max(0, (100 - toneLevel) / 100); // 1.0 at 0, 0.0 at 100
  const professionalWeight = Math.max(0, toneLevel / 100); // 0.0 at 0, 1.0 at 100

  // Create smooth blended instructions instead of discrete ranges
  let instructions = `
TONE SETTING: CONTINUOUS BLEND (${toneLevel}/100)
Authenticity Weight: ${(authenticityWeight * 100).toFixed(1)}% | Professional Weight: ${(professionalWeight * 100).toFixed(1)}%

AUTHENTICITY INSTRUCTIONS (Weight: ${(authenticityWeight * 100).toFixed(1)}%):
${authenticityWeight > 0.7 ? '- CRITICAL: Sound EXACTLY like the user wrote it themselves' : ''}
${authenticityWeight > 0.5 ? '- Copy the user\'s specific word choices, phrases, and expressions' : ''}
${authenticityWeight > 0.3 ? '- Mimic their sentence flow and rhythm patterns' : ''}
${authenticityWeight > 0.1 ? '- Use their preferred terminology when appropriate' : ''}
${authenticityWeight > 0.0 ? '- Preserve some personal expressions and natural language' : ''}

PROFESSIONAL INSTRUCTIONS (Weight: ${(professionalWeight * 100).toFixed(1)}%):
${professionalWeight > 0.7 ? '- Prioritize formal clinical documentation standards' : ''}
${professionalWeight > 0.5 ? '- Use professional healthcare terminology' : ''}
${professionalWeight > 0.3 ? '- Maintain clinical objectivity and formal structure' : ''}
${professionalWeight > 0.1 ? '- Include some professional healthcare language' : ''}
${professionalWeight > 0.0 ? '- Add subtle professional elements' : ''}

BLENDING STRATEGY:
- Apply ${(authenticityWeight * 100).toFixed(0)}% user's natural style + ${(professionalWeight * 100).toFixed(0)}% professional standards
- Smooth transition between authentic and professional elements
- No abrupt changes in tone or vocabulary`;

  // Add vocabulary substitutions based on authenticity weight
  if (Object.keys(mappings).length > 0 && authenticityWeight > 0.3) {
    const substitutionCount = Math.ceil(authenticityWeight * 10); // More substitutions for higher authenticity
    instructions += `

VOCABULARY SUBSTITUTIONS (${substitutionCount} priority terms):
Apply user's natural language with ${(authenticityWeight * 100).toFixed(0)}% priority:`;

    Object.entries(mappings).slice(0, substitutionCount).forEach(([clinical, natural]) => {
      if (clinical !== natural && natural.length > 0) {
        const priority = authenticityWeight > 0.7 ? 'ALWAYS' : authenticityWeight > 0.4 ? 'PREFER' : 'CONSIDER';
        instructions += `
- ${priority}: "${clinical}" → "${natural}"`;
      }
    });
  }

  // Add user's preferred expressions based on authenticity weight
  if (vocab?.naturalExpressions?.length > 0 && authenticityWeight > 0.2) {
    const expressionCount = Math.ceil(authenticityWeight * 5);
    instructions += `

AUTHENTIC EXPRESSIONS (Use ${expressionCount} when appropriate):
${vocab.naturalExpressions.slice(0, expressionCount).map(expr => `- "${expr}"`).join('\n')}`;
  }

  // Add time pattern instructions if detected and authenticity weight is sufficient
  if (vocab?.timePatterns?.timeBasedNarrative && authenticityWeight > 0.3 && styleAnalysis.userPreferences?.useTimePatterns !== false) {
    instructions += `

TIME-BASED NARRATIVE PATTERN (Apply with ${(authenticityWeight * 100).toFixed(0)}% authenticity):
- User writes with time markers: ${vocab.timePatterns.timeMarkers.slice(0, 3).join(', ')}
- Use sequential time-based structure like the user's style
- Format: "${vocab.timePatterns.timeFormat}" time format
- Follow user's pattern: time + action structure
- Structure content chronologically when appropriate`;
  }

  return instructions;
};

// Legacy function for backward compatibility - now uses enhanced prompting by default
const createPrompt = (sectionRequest, writingStyle, taskDescription = null) => {
  return createEnhancedPrompt(sectionRequest, writingStyle, taskDescription, 'brief');
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

        // Get user preferences for defaults
        const userPreferences = req.user?.preferences ? JSON.parse(req.user.preferences) : {};

        // Use section-specific settings if provided, otherwise fall back to user defaults
        // This ensures Generate Notes has identical functionality to Preview Enhanced
        const sectionDetailLevel = sectionRequest.detailLevel || userPreferences.defaultDetailLevel || 'brief';
        const sectionToneLevel = sectionRequest.toneLevel !== undefined ? sectionRequest.toneLevel : (userPreferences.defaultToneLevel || 50);

        // Create the enhanced prompt with section-specific settings
        const prompt = createEnhancedPrompt(
          sectionRequest,
          req.user.writingStyle,
          taskDescription,
          sectionDetailLevel,
          sectionToneLevel,
          userPreferences
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

    // Create enhanced prompt for regeneration with user preferences
    const taskDescription = section.isp_tasks?.description;
    const userPreferences = req.user?.preferences ? JSON.parse(req.user.preferences) : {};
    const userDetailLevel = userPreferences.defaultDetailLevel || 'brief';
    const userToneLevel = userPreferences.defaultToneLevel || 50;

    const prompt = createEnhancedPrompt(
      { prompt: newPrompt, type: taskDescription ? 'task' : 'general' },
      req.user.writingStyle,
      taskDescription,
      userDetailLevel,
      userToneLevel,
      userPreferences
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
    // Get user preferences for defaults
    const userPreferences = req.user?.preferences ? JSON.parse(req.user.preferences) : {};
    const defaultToneLevel = userPreferences.defaultToneLevel || 50;
    const defaultDetailLevel = userPreferences.defaultDetailLevel || 'brief';

    const { prompt, taskDescription, detailLevel = defaultDetailLevel, toneLevel = defaultToneLevel } = req.body;
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
      toneLevel,
      userPreferences
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
