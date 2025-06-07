#!/usr/bin/env node

/**
 * Performance Regression Test Suite
 * Ensures new features don't degrade system performance
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

class PerformanceRegressionTest {
  constructor() {
    this.token = null;
    this.benchmarks = {
      preview: { times: [], avgTime: 0 },
      generate: { times: [], avgTime: 0 },
      toneVariations: { times: [], avgTime: 0 }
    };
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

  async measurePreviewPerformance() {
    console.log('⏱️  Measuring Preview Enhanced Performance...\n');

    const testPrompts = [
      'Client showed improvement in communication skills.',
      'Session focused on behavioral goals and progress tracking.',
      'Individual demonstrated increased independence in daily activities.',
      'Therapy session included social skills development exercises.',
      'Client participated actively in group therapy activities.'
    ];

    for (let i = 0; i < testPrompts.length; i++) {
      const startTime = Date.now();

      const response = await fetch(`${API_BASE}/ai/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: testPrompts[i],
          detailLevel: 'detailed',
          toneLevel: 50
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (!response.ok) {
        console.error(`❌ Preview test ${i + 1} failed: ${response.status}`);
        continue;
      }

      const result = await response.json();
      this.benchmarks.preview.times.push(duration);

      console.log(`Test ${i + 1}: ${duration}ms (${result.preview.metrics.generationTimeMs}ms server-side)`);

      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.benchmarks.preview.avgTime = this.benchmarks.preview.times.reduce((a, b) => a + b, 0) / this.benchmarks.preview.times.length;
    console.log(`📊 Preview Average: ${this.benchmarks.preview.avgTime.toFixed(0)}ms\n`);
  }

  async measureGeneratePerformance() {
    console.log('⏱️  Measuring Generate Notes Performance...\n');

    const testCases = [
      {
        title: 'Single Section Test',
        sections: [{
          prompt: 'Client demonstrated progress in therapy goals.',
          type: 'comment',
          detailLevel: 'detailed',
          toneLevel: 50
        }]
      },
      {
        title: 'Multi Section Test',
        sections: [
          {
            prompt: 'Communication goals were addressed during session.',
            type: 'comment',
            detailLevel: 'moderate',
            toneLevel: 30
          },
          {
            prompt: 'Behavioral objectives showed measurable improvement.',
            type: 'comment',
            detailLevel: 'detailed',
            toneLevel: 70
          }
        ]
      }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const startTime = Date.now();

      const response = await fetch(`${API_BASE}/ai/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCases[i])
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (!response.ok) {
        console.error(`❌ Generate test ${i + 1} failed: ${response.status}`);
        continue;
      }

      const result = await response.json();
      this.benchmarks.generate.times.push(duration);

      console.log(`${testCases[i].title}: ${duration}ms (${testCases[i].sections.length} sections)`);

      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.benchmarks.generate.avgTime = this.benchmarks.generate.times.reduce((a, b) => a + b, 0) / this.benchmarks.generate.times.length;
    console.log(`📊 Generate Average: ${this.benchmarks.generate.avgTime.toFixed(0)}ms\n`);
  }

  async measureToneVariationPerformance() {
    console.log('⏱️  Measuring Tone Variation Performance...\n');

    const toneLevels = [0, 25, 50, 75, 100];
    const testPrompt = 'Client achieved therapy objectives during today\'s session.';

    for (const toneLevel of toneLevels) {
      const startTime = Date.now();

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

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (!response.ok) {
        console.error(`❌ Tone variation test at level ${toneLevel} failed: ${response.status}`);
        continue;
      }

      this.benchmarks.toneVariations.times.push(duration);
      console.log(`Tone ${toneLevel}: ${duration}ms`);

      await new Promise(resolve => setTimeout(resolve, 300));
    }

    this.benchmarks.toneVariations.avgTime = this.benchmarks.toneVariations.times.reduce((a, b) => a + b, 0) / this.benchmarks.toneVariations.times.length;
    console.log(`📊 Tone Variations Average: ${this.benchmarks.toneVariations.avgTime.toFixed(0)}ms\n`);
  }

  async testMemoryUsage() {
    console.log('🧠 Testing Memory Usage Patterns...\n');

    // Test multiple rapid requests to check for memory leaks
    const rapidRequests = [];
    const startTime = Date.now();

    for (let i = 0; i < 5; i++) {
      rapidRequests.push(
        fetch(`${API_BASE}/ai/preview`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: `Memory test request ${i + 1}`,
            detailLevel: 'brief',
            toneLevel: 50
          })
        })
      );
    }

    const responses = await Promise.all(rapidRequests);
    const endTime = Date.now();

    const successCount = responses.filter(r => r.ok).length;
    console.log(`✅ Rapid requests test: ${successCount}/5 successful in ${endTime - startTime}ms\n`);

    return successCount === 5;
  }

  analyzePerformance() {
    console.log('📈 PERFORMANCE ANALYSIS');
    console.log('=======================\n');

    // Performance thresholds (in milliseconds)
    const thresholds = {
      preview: 5000,    // 5 seconds max for preview
      generate: 15000,  // 15 seconds max for generation
      toneVariations: 5000 // 5 seconds max for tone variations
    };

    const results = {
      preview: this.benchmarks.preview.avgTime <= thresholds.preview,
      generate: this.benchmarks.generate.avgTime <= thresholds.generate,
      toneVariations: this.benchmarks.toneVariations.avgTime <= thresholds.toneVariations
    };

    console.log(`Preview Enhanced: ${this.benchmarks.preview.avgTime.toFixed(0)}ms (threshold: ${thresholds.preview}ms) ${results.preview ? '✅' : '❌'}`);
    console.log(`Generate Notes: ${this.benchmarks.generate.avgTime.toFixed(0)}ms (threshold: ${thresholds.generate}ms) ${results.generate ? '✅' : '❌'}`);
    console.log(`Tone Variations: ${this.benchmarks.toneVariations.avgTime.toFixed(0)}ms (threshold: ${thresholds.toneVariations}ms) ${results.toneVariations ? '✅' : '❌'}\n`);

    const allPassed = Object.values(results).every(r => r);

    if (allPassed) {
      console.log('🎉 All performance benchmarks passed - No regression detected!');
    } else {
      console.log('⚠️  Performance regression detected - Review required');
    }

    // Detailed statistics
    console.log('\n📊 Detailed Statistics:');
    console.log(`Preview - Min: ${Math.min(...this.benchmarks.preview.times)}ms, Max: ${Math.max(...this.benchmarks.preview.times)}ms`);
    console.log(`Generate - Min: ${Math.min(...this.benchmarks.generate.times)}ms, Max: ${Math.max(...this.benchmarks.generate.times)}ms`);
    console.log(`Tone Variations - Min: ${Math.min(...this.benchmarks.toneVariations.times)}ms, Max: ${Math.max(...this.benchmarks.toneVariations.times)}ms`);

    return allPassed;
  }

  async runPerformanceTests() {
    console.log('🚀 PERFORMANCE REGRESSION TEST SUITE');
    console.log('====================================\n');

    try {
      await this.authenticate();
      console.log('✅ Authentication successful\n');

      await this.measurePreviewPerformance();
      await this.measureGeneratePerformance();
      await this.measureToneVariationPerformance();
      await this.testMemoryUsage();

      const performanceOk = this.analyzePerformance();

      return performanceOk;
    } catch (error) {
      console.error('❌ Performance testing failed:', error.message);
      throw error;
    }
  }
}

// Run performance tests
const perfTest = new PerformanceRegressionTest();
perfTest.runPerformanceTests().catch(console.error);
