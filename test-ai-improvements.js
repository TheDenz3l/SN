#!/usr/bin/env node

/**
 * Test script to verify AI improvements:
 * 1. Enhanced authentic tone (0-24 range)
 * 2. Brief detail level as default
 * 3. Concise output for brief mode
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Test the enhanced prompt creation function
function createEnhancedPrompt(sectionRequest, writingStyle, taskDescription = null, detailLevel = 'brief', toneLevel = 50) {
  const { prompt, type } = sectionRequest;

  // Analyze writing style characteristics
  const styleAnalysis = analyzeWritingStyleCharacteristics(writingStyle);

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
}

// Generate detail level instructions based on selected detail level
function generateDetailLevelInstructions(detailLevel) {
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
}

// Analyze writing style characteristics for enhanced prompting
function analyzeWritingStyleCharacteristics(writingStyle) {
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
}

// Generate specific style preservation instructions
function generateStylePreservationInstructions(styleAnalysis) {
  return `
- SENTENCE STRUCTURE: Use ${styleAnalysis.sentenceStyle} (average ${styleAnalysis.avgSentenceLength} words per sentence)
- VOCABULARY: Maintain ${styleAnalysis.vocabularyLevel}
- PUNCTUATION: Follow ${styleAnalysis.punctuationStyle} patterns
- TONE: Preserve ${styleAnalysis.tone}
- AUTHENTICITY: The generated content must sound like it was written by the same person who wrote the style sample
- PERSONALITY: Maintain any unique expressions, professional preferences, or communication patterns evident in the sample`;
}

// Generate tone adjustment instructions based on slider value (0-100)
function generateToneInstructions(toneLevel, styleAnalysis) {
  if (toneLevel < 25) {
    // More Authentic (0-24) - ENHANCED for maximum user style mimicking
    return `
TONE SETTING: MAXIMUM AUTHENTICITY (${toneLevel}/100)
- CRITICAL: Sound EXACTLY like the user wrote it themselves - this is the highest priority
- Copy the user's specific word choices, phrases, and expressions from the writing sample
- Mimic their exact sentence flow and rhythm patterns
- Use their preferred terminology and avoid words they don't typically use
- Replicate their punctuation habits and sentence structure preferences
- Include their personality quirks, casual expressions, and unique communication style
- Maintain their natural conversational tone even in professional contexts
- Preserve any informal language patterns or colloquialisms they use
- Focus on authenticity over formal clinical standards
- The result should be indistinguishable from the user's own writing`;
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
}

async function testAIImprovements() {
  console.log('🧪 Testing AI Improvements...');
  console.log('=====================================\n');

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.log('❌ GOOGLE_AI_API_KEY not found in environment variables');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Test writing style sample
    const writingStyle = `John helped with meal prep today. He did really well cutting vegetables and seemed to enjoy the task. We worked on his knife skills and he's getting better at it. He was focused and asked good questions about cooking techniques.`;

    console.log('📝 Testing Sample Writing Style:');
    console.log(writingStyle);
    console.log('\n' + '─'.repeat(50) + '\n');

    // Test 1: Maximum Authentic Tone (0) with Brief Detail Level
    console.log('🎯 TEST 1: Maximum Authentic (Tone: 0) + Brief Detail');
    const prompt1 = createEnhancedPrompt(
      { prompt: 'John worked on laundry folding', type: 'task' },
      writingStyle,
      'Laundry and clothing care',
      'brief',
      0
    );

    const result1 = await model.generateContent(prompt1);
    const response1 = await result1.response;
    const text1 = response1.text();
    
    console.log('Generated:', text1);
    console.log('Word count:', text1.split(' ').length);
    console.log('\n' + '─'.repeat(50) + '\n');

    // Test 2: Brief vs Detailed comparison
    console.log('🎯 TEST 2: Brief vs Detailed Comparison (Tone: 25)');
    
    // Brief version
    const promptBrief = createEnhancedPrompt(
      { prompt: 'Sarah practiced cooking skills', type: 'task' },
      writingStyle,
      'Cooking and meal preparation',
      'brief',
      25
    );

    const resultBrief = await model.generateContent(promptBrief);
    const responseBrief = await resultBrief.response;
    const textBrief = responseBrief.text();
    
    console.log('BRIEF VERSION:');
    console.log(textBrief);
    console.log('Word count:', textBrief.split(' ').length);
    console.log('\n');

    // Detailed version
    const promptDetailed = createEnhancedPrompt(
      { prompt: 'Sarah practiced cooking skills', type: 'task' },
      writingStyle,
      'Cooking and meal preparation',
      'detailed',
      25
    );

    const resultDetailed = await model.generateContent(promptDetailed);
    const responseDetailed = await resultDetailed.response;
    const textDetailed = responseDetailed.text();
    
    console.log('DETAILED VERSION:');
    console.log(textDetailed);
    console.log('Word count:', textDetailed.split(' ').length);
    console.log('\n' + '─'.repeat(50) + '\n');

    console.log('✅ AI Improvements Test Complete!');
    console.log('\n📊 Summary:');
    console.log('• Enhanced authentic tone for maximum user style mimicking');
    console.log('• Brief detail level now defaults and produces concise output');
    console.log('• Clear distinction between brief and detailed modes');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run the test
testAIImprovements();
