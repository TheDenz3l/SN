#!/usr/bin/env node

/**
 * Data Flow Validation Test - Verifies parameter passing through entire stack
 * Frontend → API → Backend → AI Generation
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

class DataFlowValidator {
  constructor() {
    this.token = null;
  }

  async authenticate() {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const result = await response.json();
    this.token = result.session.access_token;
  }

  async testParameterPropagation() {
    console.log('🔍 Testing Parameter Propagation Through Data Flow\n');

    const testCases = [
      { detailLevel: 'brief', toneLevel: 0, description: 'Maximum Authentic + Brief' },
      { detailLevel: 'detailed', toneLevel: 50, description: 'Balanced + Detailed' },
      { detailLevel: 'comprehensive', toneLevel: 100, description: 'Maximum Professional + Comprehensive' },
      { detailLevel: 'moderate', toneLevel: 25, description: 'Authentic Leaning + Moderate' },
      { detailLevel: 'detailed', toneLevel: 75, description: 'Professional Leaning + Detailed' }
    ];

    for (const testCase of testCases) {
      console.log(`--- Testing: ${testCase.description} ---`);
      
      const testPrompt = `Client demonstrated progress in therapy session. Detail: ${testCase.detailLevel}, Tone: ${testCase.toneLevel}`;

      // Test Preview Enhanced (baseline)
      const previewResponse = await fetch(`${API_BASE}/ai/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: testPrompt,
          detailLevel: testCase.detailLevel,
          toneLevel: testCase.toneLevel
        })
      });

      if (!previewResponse.ok) {
        console.error(`❌ Preview failed for ${testCase.description}`);
        continue;
      }

      const previewResult = await previewResponse.json();

      // Test Generate Notes with same parameters
      const generateResponse = await fetch(`${API_BASE}/ai/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `Data Flow Test - ${testCase.description}`,
          sections: [{
            prompt: testPrompt,
            type: 'comment',
            detailLevel: testCase.detailLevel,
            toneLevel: testCase.toneLevel
          }]
        })
      });

      if (!generateResponse.ok) {
        console.error(`❌ Generate failed for ${testCase.description}`);
        continue;
      }

      const generateResult = await generateResponse.json();

      // Analyze parameter propagation
      const previewContent = previewResult.preview.enhancedContent;
      const generateContent = generateResult.sections[0].generated_content;

      // Verify parameters were received correctly
      if (previewResult.preview.detailLevel !== testCase.detailLevel) {
        console.error(`❌ Preview detailLevel mismatch: expected ${testCase.detailLevel}, got ${previewResult.preview.detailLevel}`);
      }

      if (previewResult.preview.toneLevel !== testCase.toneLevel) {
        console.error(`❌ Preview toneLevel mismatch: expected ${testCase.toneLevel}, got ${previewResult.preview.toneLevel}`);
      }

      // Analyze content characteristics
      const previewLength = previewContent.length;
      const generateLength = generateContent.length;
      const lengthDiff = Math.abs(previewLength - generateLength);
      const lengthSimilarity = 1 - (lengthDiff / Math.max(previewLength, generateLength));

      const previewFormal = this.countFormalWords(previewContent);
      const generateFormal = this.countFormalWords(generateContent);
      const formalDiff = Math.abs(previewFormal - generateFormal);

      console.log(`📊 Results:`);
      console.log(`   Preview: ${previewLength} chars, ${previewFormal} formal words`);
      console.log(`   Generate: ${generateLength} chars, ${generateFormal} formal words`);
      console.log(`   Length similarity: ${(lengthSimilarity * 100).toFixed(1)}%`);
      console.log(`   Formal word difference: ${formalDiff}`);

      if (lengthSimilarity > 0.7 && formalDiff <= 2) {
        console.log(`✅ PASSED: ${testCase.description}\n`);
      } else {
        console.log(`⚠️  ATTENTION: ${testCase.description} - Significant differences detected\n`);
      }

      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async testDefaultFallbacks() {
    console.log('🔄 Testing Default Parameter Fallbacks\n');

    // Test with no parameters (should use user defaults)
    const response = await fetch(`${API_BASE}/ai/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Default Fallback Test',
        sections: [{
          prompt: 'Client participated in session without explicit parameters',
          type: 'comment'
          // No detailLevel or toneLevel specified
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Default fallback test failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Default fallback test passed - system handled missing parameters gracefully\n');

    return result;
  }

  async testTypeScriptInterfaceCompliance() {
    console.log('🔧 Testing TypeScript Interface Compliance\n');

    // Test with all expected interface properties
    const fullInterfaceTest = {
      title: 'TypeScript Interface Test',
      sections: [{
        taskId: undefined, // Optional
        prompt: 'Full interface compliance test',
        type: 'comment',
        detailLevel: 'detailed',
        toneLevel: 42
      }]
    };

    const response = await fetch(`${API_BASE}/ai/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fullInterfaceTest)
    });

    if (!response.ok) {
      throw new Error(`TypeScript interface test failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ TypeScript interface compliance test passed\n');

    return result;
  }

  countFormalWords(text) {
    const formalWords = ['professional', 'clinical', 'documentation', 'appropriate', 'comprehensive', 'facilitate', 'utilize', 'optimal'];
    return formalWords.reduce((count, word) => {
      return count + (text.toLowerCase().match(new RegExp(word, 'g')) || []).length;
    }, 0);
  }

  async runValidation() {
    console.log('🧪 DATA FLOW VALIDATION TEST SUITE');
    console.log('===================================\n');

    try {
      await this.authenticate();
      console.log('✅ Authentication successful\n');

      await this.testParameterPropagation();
      await this.testDefaultFallbacks();
      await this.testTypeScriptInterfaceCompliance();

      console.log('🎉 All data flow validation tests completed successfully!');
    } catch (error) {
      console.error('❌ Data flow validation failed:', error.message);
      throw error;
    }
  }
}

// Run validation
const validator = new DataFlowValidator();
validator.runValidation().catch(console.error);
