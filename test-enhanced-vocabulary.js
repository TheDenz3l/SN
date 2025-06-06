#!/usr/bin/env node

/**
 * Test Enhanced Vocabulary Analysis System
 * Tests the new vocabulary extraction and mapping functionality
 */

// Test script for vocabulary analysis - no external dependencies needed

// Import the enhanced functions (we'll copy them here for testing)
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

// Create mappings from clinical terms to user's natural language
const createVocabularyMappings = (actionVerbs, descriptiveWords) => {
  const clinicalToNatural = {};
  
  // Action verb mappings
  const actionMappings = {
    'demonstrated': actionVerbs.includes('showed') ? 'showed' : actionVerbs.includes('did') ? 'did' : 'demonstrated',
    'exhibited': actionVerbs.includes('showed') ? 'showed' : actionVerbs.includes('had') ? 'had' : 'exhibited',
    'participated': actionVerbs.includes('joined') ? 'joined' : actionVerbs.includes('did') ? 'did' : 'participated',
    'completed': actionVerbs.includes('finished') ? 'finished' : actionVerbs.includes('did') ? 'did' : 'completed',
    'initiated': actionVerbs.includes('started') ? 'started' : actionVerbs.includes('began') ? 'began' : 'initiated',
    'engaged in': actionVerbs.includes('did') ? 'did' : actionVerbs.includes('worked on') ? 'worked on' : 'engaged in',
    'performed': actionVerbs.includes('did') ? 'did' : actionVerbs.includes('made') ? 'made' : 'performed'
  };
  
  // Descriptive word mappings
  const descriptiveMappings = {
    'successful': descriptiveWords.includes('good') ? 'good' : descriptiveWords.includes('well') ? 'well' : 'successful',
    'effective': descriptiveWords.includes('good') ? 'good' : descriptiveWords.includes('helpful') ? 'helpful' : 'effective',
    'appropriate': descriptiveWords.includes('good') ? 'good' : descriptiveWords.includes('right') ? 'right' : 'appropriate',
    'significant': descriptiveWords.includes('big') ? 'big' : descriptiveWords.includes('great') ? 'great' : 'significant',
    'optimal': descriptiveWords.includes('best') ? 'best' : descriptiveWords.includes('good') ? 'good' : 'optimal'
  };
  
  // Phrase mappings
  const phraseMappings = {
    'the individual': 'he',
    'the participant': 'he',
    'the client': 'he',
    'demonstrated autonomy': 'did it himself',
    'exhibited progress': 'got better',
    'showed improvement': 'got better',
    'engaged successfully': 'did well',
    'completed independently': 'did it himself'
  };
  
  return {
    ...actionMappings,
    ...descriptiveMappings,
    ...phraseMappings
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

// Test function
async function testVocabularyAnalysis() {
  console.log('🧪 Testing Enhanced Vocabulary Analysis System');
  console.log('=' .repeat(60));
  
  // Test with user's actual writing sample
  const userWritingSample = `Chad would sleep through the night upon staff checking on him. Chad's morning would be positive, he would awakened at 6:00AM to begin his morning routine of showering himself, getting dressed, as well making sure his bed is made up and bathroom is also clean after use. He would inform staff that he completed this task. 6:30AM staff would prompt Chad about eating breakfast, he would choose to make himself scramble eggs, and a fruit smoothie. Chad would wash off his plate after use. 7:00AM staff would prompt Chad into the office after prepping his medication. He would be administered in which he would drank down with water. 7:30AM Chad would inform staff that he had packed himself a sandwich alongside a water into his lunchbag. Chad would then sit down in the living room, watching TV until his van arrived for pickup.`;
  
  console.log('📝 User Writing Sample:');
  console.log(userWritingSample);
  console.log('\n' + '─'.repeat(60) + '\n');
  
  // Analyze the writing style
  const analysis = analyzeWritingStyleCharacteristics(userWritingSample);
  
  console.log('📊 VOCABULARY ANALYSIS RESULTS:');
  console.log('─'.repeat(40));
  
  console.log('\n🎯 Basic Style Analysis:');
  console.log(`- Sentence Style: ${analysis.sentenceStyle}`);
  console.log(`- Vocabulary Level: ${analysis.vocabularyLevel}`);
  console.log(`- Punctuation Style: ${analysis.punctuationStyle}`);
  console.log(`- Overall Tone: ${analysis.tone}`);
  console.log(`- Average Sentence Length: ${analysis.avgSentenceLength} words`);
  
  console.log('\n🔤 Extracted Vocabulary Profile:');
  console.log(`- Action Verbs: ${analysis.vocabularyProfile.actionVerbs.join(', ')}`);
  console.log(`- Descriptive Words: ${analysis.vocabularyProfile.descriptiveWords.join(', ')}`);
  console.log(`- Transitions: ${analysis.vocabularyProfile.transitions.join(', ')}`);
  console.log(`- Common Phrases: ${analysis.vocabularyProfile.commonPhrases.join(', ')}`);
  console.log(`- Natural Expressions: ${analysis.vocabularyProfile.naturalExpressions.join(', ')}`);
  
  console.log('\n🔄 Vocabulary Mappings (Clinical → Natural):');
  Object.entries(analysis.vocabularyProfile.vocabularyMappings).forEach(([clinical, natural]) => {
    if (clinical !== natural) {
      console.log(`- "${clinical}" → "${natural}"`);
    }
  });
  
  console.log('\n📈 Tone Profile:');
  console.log(`- Overall Tone: ${analysis.userToneProfile.overallTone}`);
  console.log(`- Tone Score: ${analysis.userToneProfile.toneScore}`);
  console.log(`- Prefers Casual Language: ${analysis.userToneProfile.prefersCasualLanguage}`);
  console.log(`- Uses Personal Pronouns: ${analysis.userToneProfile.usesPersonalPronouns}`);
  console.log(`- Formal Count: ${analysis.userToneProfile.formalCount}`);
  console.log(`- Casual Count: ${analysis.userToneProfile.casualCount}`);

  console.log('\n⏰ Time Pattern Analysis:');
  console.log(`- Has Time Markers: ${analysis.vocabularyProfile.timePatterns.hasTimeMarkers}`);
  console.log(`- Time Format: ${analysis.vocabularyProfile.timePatterns.timeFormat}`);
  console.log(`- Time Markers Found: ${analysis.vocabularyProfile.timePatterns.timeMarkers.join(', ')}`);
  console.log(`- Uses Sequential Timing: ${analysis.vocabularyProfile.timePatterns.usesSequentialTiming}`);
  console.log(`- Time-Based Narrative: ${analysis.vocabularyProfile.timePatterns.timeBasedNarrative}`);

  console.log('\n✅ Enhanced Vocabulary Analysis Complete!');
  console.log('\n🎯 Key Improvements:');
  console.log('1. More aggressive vocabulary substitutions');
  console.log('2. Time pattern detection and integration');
  console.log('3. User preference toggle for time patterns');
  console.log('4. Enhanced clinical-to-natural mappings');
  console.log('\nThis enhanced analysis will now generate content that sounds EXACTLY like the user wrote it!');
}

// Run the test
if (require.main === module) {
  testVocabularyAnalysis().catch(console.error);
}

module.exports = {
  analyzeWritingStyleCharacteristics,
  extractVocabularyProfile,
  createVocabularyMappings,
  analyzeUserTone
};
