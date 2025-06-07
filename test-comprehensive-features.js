#!/usr/bin/env node

/**
 * Comprehensive Testing Suite for Generate Notes Alignment & Tone Slider Features
 * Using systematic analysis methodology for critical evaluation
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

class FeatureTestSuite {
  constructor() {
    this.token = null;
    this.testResults = {
      feature1: { passed: 0, failed: 0, tests: [] },
      feature2: { passed: 0, failed: 0, tests: [] },
      overall: { passed: 0, failed: 0 }
    };
  }

  async initialize() {
    console.log('🧪 COMPREHENSIVE FEATURE TESTING SUITE');
    console.log('=====================================\n');
    
    try {
      await this.authenticate();
      console.log('✅ Authentication successful\n');
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      throw error;
    }
  }

  async authenticate() {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const result = await response.json();
    this.token = result.session.access_token;
  }

  async runTest(testName, testFunction, feature) {
    console.log(`🔍 Running: ${testName}`);
    try {
      const result = await testFunction();
      this.testResults[feature].passed++;
      this.testResults[feature].tests.push({ name: testName, status: 'PASSED', result });
      console.log(`✅ PASSED: ${testName}\n`);
      return result;
    } catch (error) {
      this.testResults[feature].failed++;
      this.testResults[feature].tests.push({ name: testName, status: 'FAILED', error: error.message });
      console.log(`❌ FAILED: ${testName} - ${error.message}\n`);
      throw error;
    }
  }

  // FEATURE 1 TESTS: Generate Notes Button Functionality Alignment
  async testParameterAlignment() {
    const testPrompt = 'Client showed improvement in communication skills during today\'s session.';
    const testDetailLevel = 'detailed';
    const testToneLevel = 35;

    // Test Preview Enhanced
    const previewResponse = await fetch(`${API_BASE}/ai/preview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: testPrompt,
        detailLevel: testDetailLevel,
        toneLevel: testToneLevel
      })
    });

    if (!previewResponse.ok) {
      throw new Error(`Preview Enhanced failed: ${previewResponse.status}`);
    }

    const previewResult = await previewResponse.json();

    // Test Generate Notes with identical parameters
    const generateResponse = await fetch(`${API_BASE}/ai/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Parameter Alignment Test',
        sections: [{
          prompt: testPrompt,
          type: 'comment',
          detailLevel: testDetailLevel,
          toneLevel: testToneLevel
        }]
      })
    });

    if (!generateResponse.ok) {
      throw new Error(`Generate Notes failed: ${generateResponse.status}`);
    }

    const generateResult = await generateResponse.json();

    // Analyze results
    const previewContent = previewResult.preview.enhancedContent;
    const generateContent = generateResult.sections[0].generated_content;
    
    const lengthSimilarity = 1 - Math.abs(previewContent.length - generateContent.length) / Math.max(previewContent.length, generateContent.length);
    
    if (lengthSimilarity < 0.6) {
      throw new Error(`Content length similarity too low: ${(lengthSimilarity * 100).toFixed(1)}%`);
    }

    return {
      previewLength: previewContent.length,
      generateLength: generateContent.length,
      similarity: lengthSimilarity,
      detailLevel: testDetailLevel,
      toneLevel: testToneLevel
    };
  }

  async testEdgeCases() {
    // Test with missing parameters (should use defaults)
    const response = await fetch(`${API_BASE}/ai/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Edge Case Test',
        sections: [{
          prompt: 'Test prompt without explicit parameters',
          type: 'comment'
          // No detailLevel or toneLevel specified
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Edge case test failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.sections || result.sections.length === 0) {
      throw new Error('No sections generated for edge case');
    }

    return { success: true, sectionsGenerated: result.sections.length };
  }

  async testParameterValidation() {
    // Test with invalid parameters
    const response = await fetch(`${API_BASE}/ai/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Validation Test',
        sections: [{
          prompt: 'Test prompt',
          type: 'comment',
          detailLevel: 'invalid_level',
          toneLevel: 150 // Invalid range
        }]
      })
    });

    // Should still work with fallback to defaults
    if (!response.ok) {
      throw new Error(`Parameter validation test failed: ${response.status}`);
    }

    return { success: true };
  }

  // FEATURE 2 TESTS: Writing Tone Slider Smooth Transitions
  async testToneProgression() {
    const testPrompt = 'Client participated actively in today\'s therapy session.';
    const toneLevels = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const results = [];

    for (const toneLevel of toneLevels) {
      const response = await fetch(`${API_BASE}/ai/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: testPrompt,
          detailLevel: 'moderate',
          toneLevel: toneLevel
        })
      });

      if (!response.ok) {
        throw new Error(`Tone progression test failed at level ${toneLevel}: ${response.status}`);
      }

      const result = await response.json();
      const content = result.preview.enhancedContent;
      
      results.push({
        toneLevel,
        content,
        length: content.length,
        formalWords: this.countFormalWords(content),
        casualWords: this.countCasualWords(content)
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Analyze progression smoothness
    const formalProgression = results.map(r => r.formalWords);
    const isSmooth = this.checkSmoothProgression(formalProgression);

    if (!isSmooth) {
      throw new Error('Tone progression is not smooth - detected abrupt changes');
    }

    return { results, isSmooth, progressionData: formalProgression };
  }

  async testBoundaryElimination() {
    // Test the old problematic boundaries (24→25, 49→50, 74→75)
    const boundaries = [
      { before: 24, after: 25 },
      { before: 49, after: 50 },
      { before: 74, after: 75 }
    ];

    const testPrompt = 'Client showed progress in communication goals.';
    const boundaryResults = [];

    for (const boundary of boundaries) {
      // Test before boundary
      const beforeResponse = await fetch(`${API_BASE}/ai/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: testPrompt,
          detailLevel: 'moderate',
          toneLevel: boundary.before
        })
      });

      // Test after boundary
      const afterResponse = await fetch(`${API_BASE}/ai/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: testPrompt,
          detailLevel: 'moderate',
          toneLevel: boundary.after
        })
      });

      if (!beforeResponse.ok || !afterResponse.ok) {
        throw new Error(`Boundary test failed at ${boundary.before}→${boundary.after}`);
      }

      const beforeResult = await beforeResponse.json();
      const afterResult = await afterResponse.json();

      const beforeFormal = this.countFormalWords(beforeResult.preview.enhancedContent);
      const afterFormal = this.countFormalWords(afterResult.preview.enhancedContent);
      const change = Math.abs(afterFormal - beforeFormal);

      // Should not have large jumps (old discrete system would cause jumps > 3)
      if (change > 2) {
        throw new Error(`Large jump detected at boundary ${boundary.before}→${boundary.after}: ${change} formal words`);
      }

      boundaryResults.push({
        boundary: `${boundary.before}→${boundary.after}`,
        beforeFormal,
        afterFormal,
        change
      });

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return { boundaryResults, maxChange: Math.max(...boundaryResults.map(r => r.change)) };
  }

  // Helper methods
  countFormalWords(text) {
    const formalWords = ['professional', 'clinical', 'documentation', 'appropriate', 'comprehensive', 'facilitate', 'utilize', 'optimal', 'subsequently', 'designated'];
    return formalWords.reduce((count, word) => {
      return count + (text.toLowerCase().match(new RegExp(word, 'g')) || []).length;
    }, 0);
  }

  countCasualWords(text) {
    const casualWords = ['really', 'pretty', 'quite', 'kind of', 'sort of', 'actually', 'basically', 'just', 'like'];
    return casualWords.reduce((count, word) => {
      return count + (text.toLowerCase().match(new RegExp(word, 'g')) || []).length;
    }, 0);
  }

  checkSmoothProgression(values) {
    let smoothCount = 0;
    for (let i = 1; i < values.length; i++) {
      const change = Math.abs(values[i] - values[i - 1]);
      if (change <= 2) smoothCount++;
    }
    return smoothCount >= (values.length - 1) * 0.7;
  }

  async runAllTests() {
    await this.initialize();

    console.log('🎯 FEATURE 1: Generate Notes Button Functionality Alignment');
    console.log('=========================================================\n');

    try {
      await this.runTest('Parameter Alignment Test', () => this.testParameterAlignment(), 'feature1');
      await this.runTest('Edge Cases Test', () => this.testEdgeCases(), 'feature1');
      await this.runTest('Parameter Validation Test', () => this.testParameterValidation(), 'feature1');
    } catch (error) {
      console.log('⚠️  Feature 1 testing encountered errors\n');
    }

    console.log('🎚️  FEATURE 2: Writing Tone Slider Smooth Transitions');
    console.log('====================================================\n');

    try {
      await this.runTest('Tone Progression Test', () => this.testToneProgression(), 'feature2');
      await this.runTest('Boundary Elimination Test', () => this.testBoundaryElimination(), 'feature2');
    } catch (error) {
      console.log('⚠️  Feature 2 testing encountered errors\n');
    }

    this.generateReport();
  }

  generateReport() {
    console.log('📊 COMPREHENSIVE TEST RESULTS');
    console.log('==============================\n');

    const feature1Total = this.testResults.feature1.passed + this.testResults.feature1.failed;
    const feature2Total = this.testResults.feature2.passed + this.testResults.feature2.failed;
    const overallTotal = feature1Total + feature2Total;
    const overallPassed = this.testResults.feature1.passed + this.testResults.feature2.passed;

    console.log(`Feature 1 (Generate Notes Alignment): ${this.testResults.feature1.passed}/${feature1Total} tests passed`);
    console.log(`Feature 2 (Tone Slider Transitions): ${this.testResults.feature2.passed}/${feature2Total} tests passed`);
    console.log(`Overall: ${overallPassed}/${overallTotal} tests passed\n`);

    if (overallPassed === overallTotal) {
      console.log('🎉 ALL TESTS PASSED - Implementation is ready for production!');
    } else {
      console.log('⚠️  Some tests failed - Review required before deployment');
    }

    // Detailed results
    console.log('\n📋 Detailed Test Results:');
    ['feature1', 'feature2'].forEach(feature => {
      console.log(`\n${feature.toUpperCase()}:`);
      this.testResults[feature].tests.forEach(test => {
        console.log(`  ${test.status === 'PASSED' ? '✅' : '❌'} ${test.name}`);
        if (test.status === 'FAILED') {
          console.log(`     Error: ${test.error}`);
        }
      });
    });
  }
}

// Run the comprehensive test suite
const testSuite = new FeatureTestSuite();
testSuite.runAllTests().catch(console.error);
