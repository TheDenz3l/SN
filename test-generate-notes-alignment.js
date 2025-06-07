#!/usr/bin/env node

/**
 * Test script to verify Generate Notes button functionality alignment with Preview Enhanced
 * and smooth tone slider transitions
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

// Test credentials (replace with actual test user)
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

async function testGenerateNotesAlignment() {
  console.log('🧪 Testing Generate Notes Button Functionality Alignment\n');

  try {
    // 1. Login
    console.log('1. 🔐 Logging in...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginResponse.status);
      return;
    }

    const loginResult = await loginResponse.json();
    const token = loginResult.session.access_token;
    console.log('✅ Login successful');

    // 2. Test Preview Enhanced functionality
    console.log('\n2. 🔍 Testing Preview Enhanced functionality...');
    const testPrompt = 'Client showed improvement in communication during today\'s session.';
    const testDetailLevel = 'detailed';
    const testToneLevel = 35;

    const previewResponse = await fetch(`${API_BASE}/ai/preview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: testPrompt,
        taskDescription: 'Communication goals - verbal requests',
        detailLevel: testDetailLevel,
        toneLevel: testToneLevel
      })
    });

    if (!previewResponse.ok) {
      console.error('❌ Preview Enhanced failed:', previewResponse.status);
      return;
    }

    const previewResult = await previewResponse.json();
    console.log('✅ Preview Enhanced successful');
    console.log(`📊 Preview metrics: ${previewResult.preview.metrics.tokensUsed} tokens, ${previewResult.preview.metrics.generationTimeMs}ms`);
    console.log(`📝 Preview content length: ${previewResult.preview.enhancedContent.length} characters`);

    // 3. Test Generate Notes with identical parameters
    console.log('\n3. 📝 Testing Generate Notes with identical parameters...');
    const generateResponse = await fetch(`${API_BASE}/ai/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Alignment Note',
        sections: [{
          prompt: testPrompt,
          type: 'comment',
          detailLevel: testDetailLevel,
          toneLevel: testToneLevel
        }]
      })
    });

    if (!generateResponse.ok) {
      console.error('❌ Generate Notes failed:', generateResponse.status);
      const errorText = await generateResponse.text();
      console.error('Error details:', errorText);
      return;
    }

    const generateResult = await generateResponse.json();
    console.log('✅ Generate Notes successful');
    console.log(`📊 Generate metrics: ${generateResult.totalTokens} tokens`);
    
    if (generateResult.sections && generateResult.sections.length > 0) {
      const generatedSection = generateResult.sections[0];
      console.log(`📝 Generated content length: ${generatedSection.generated_content.length} characters`);
      
      // Compare content characteristics
      const previewLength = previewResult.preview.enhancedContent.length;
      const generateLength = generatedSection.generated_content.length;
      const lengthDifference = Math.abs(previewLength - generateLength);
      const lengthSimilarity = 1 - (lengthDifference / Math.max(previewLength, generateLength));
      
      console.log(`\n📈 FUNCTIONALITY ALIGNMENT ANALYSIS:`);
      console.log(`   Preview Enhanced length: ${previewLength} chars`);
      console.log(`   Generate Notes length: ${generateLength} chars`);
      console.log(`   Length similarity: ${(lengthSimilarity * 100).toFixed(1)}%`);
      
      if (lengthSimilarity > 0.7) {
        console.log('✅ ALIGNMENT SUCCESS: Generate Notes produces similar output to Preview Enhanced');
      } else {
        console.log('⚠️  ALIGNMENT WARNING: Significant difference in output length detected');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testToneSliderTransitions() {
  console.log('\n\n🎚️  Testing Writing Tone Slider Smooth Transitions\n');

  try {
    // Login (reuse from previous test)
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    const loginResult = await loginResponse.json();
    const token = loginResult.session.access_token;

    // Test tone levels across the spectrum for smooth transitions
    const testPrompt = 'Client participated actively in today\'s session.';
    const toneLevels = [0, 15, 30, 45, 60, 75, 90, 100];
    
    console.log('🔄 Testing tone transitions across spectrum...\n');

    const results = [];
    
    for (const toneLevel of toneLevels) {
      console.log(`--- Testing Tone Level ${toneLevel}/100 ---`);
      
      const response = await fetch(`${API_BASE}/ai/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: testPrompt,
          detailLevel: 'moderate',
          toneLevel: toneLevel
        })
      });

      if (response.ok) {
        const result = await response.json();
        const content = result.preview.enhancedContent;
        
        results.push({
          toneLevel,
          content,
          length: content.length,
          formalWords: countFormalWords(content),
          casualWords: countCasualWords(content)
        });
        
        console.log(`✅ Tone ${toneLevel}: ${content.length} chars, ${countFormalWords(content)} formal words`);
      } else {
        console.log(`❌ Tone ${toneLevel}: Failed`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Analyze transitions
    console.log('\n📊 TONE TRANSITION ANALYSIS:');
    for (let i = 1; i < results.length; i++) {
      const prev = results[i - 1];
      const curr = results[i];
      
      const formalChange = curr.formalWords - prev.formalWords;
      const lengthChange = curr.length - prev.length;
      
      console.log(`   ${prev.toneLevel}→${curr.toneLevel}: Formal words ${formalChange >= 0 ? '+' : ''}${formalChange}, Length ${lengthChange >= 0 ? '+' : ''}${lengthChange}`);
    }

    // Check for smooth progression
    const formalProgression = results.map(r => r.formalWords);
    const isSmooth = checkSmoothProgression(formalProgression);
    
    if (isSmooth) {
      console.log('\n✅ SMOOTH TRANSITIONS: Tone slider shows gradual changes across spectrum');
    } else {
      console.log('\n⚠️  TRANSITION WARNING: Detected abrupt changes in tone progression');
    }

  } catch (error) {
    console.error('❌ Tone slider test failed:', error.message);
  }
}

function countFormalWords(text) {
  const formalWords = ['professional', 'clinical', 'documentation', 'appropriate', 'comprehensive', 'facilitate', 'utilize', 'optimal'];
  return formalWords.reduce((count, word) => {
    return count + (text.toLowerCase().match(new RegExp(word, 'g')) || []).length;
  }, 0);
}

function countCasualWords(text) {
  const casualWords = ['really', 'pretty', 'quite', 'kind of', 'sort of', 'actually', 'basically'];
  return casualWords.reduce((count, word) => {
    return count + (text.toLowerCase().match(new RegExp(word, 'g')) || []).length;
  }, 0);
}

function checkSmoothProgression(values) {
  // Check if values generally increase without large jumps
  let smoothCount = 0;
  for (let i = 1; i < values.length; i++) {
    const change = Math.abs(values[i] - values[i - 1]);
    if (change <= 2) smoothCount++; // Allow small changes
  }
  return smoothCount >= (values.length - 1) * 0.7; // 70% of transitions should be smooth
}

// Run tests
async function runAllTests() {
  await testGenerateNotesAlignment();
  await testToneSliderTransitions();
  console.log('\n🏁 All tests completed!');
}

runAllTests().catch(console.error);
