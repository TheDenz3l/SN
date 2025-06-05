/**
 * Test Tone Slider Functionality
 * Tests different tone levels from authentic to professional
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

async function testToneSlider() {
  console.log('🎚️ Testing Tone Slider Functionality...\n');

  try {
    // Step 1: Login
    console.log('1. 🔐 Logging in...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'phase1test@swiftnotes.app',
        password: 'Test123!'
      })
    });

    const loginResult = await loginResponse.json();
    if (!loginResult.success) {
      throw new Error('Login failed: ' + loginResult.error);
    }

    const token = loginResult.session.access_token;
    console.log('✅ Login successful');

    // Test different tone levels
    const testPrompt = 'Client showed improvement in communication during today\'s session.';
    const taskDescription = 'Communication goals - verbal requests';
    
    const toneLevels = [
      { level: 0, name: 'Maximum Authentic' },
      { level: 25, name: 'Balanced Authentic' },
      { level: 50, name: 'Balanced Professional' },
      { level: 75, name: 'High Professional' },
      { level: 100, name: 'Maximum Professional' }
    ];

    console.log('\n2. 🎯 Testing different tone levels...\n');

    for (const toneTest of toneLevels) {
      console.log(`--- Testing ${toneTest.name} (${toneTest.level}/100) ---`);
      
      const startTime = Date.now();
      const previewResponse = await fetch(`${API_BASE}/ai/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: testPrompt,
          taskDescription,
          detailLevel: 'detailed',
          toneLevel: toneTest.level
        })
      });

      if (!previewResponse.ok) {
        console.error(`❌ ${toneTest.name} failed:`, previewResponse.status);
        continue;
      }

      const previewResult = await previewResponse.json();
      if (!previewResult.success) {
        console.error(`❌ ${toneTest.name} failed:`, previewResult.error);
        continue;
      }

      const generationTime = Date.now() - startTime;
      const preview = previewResult.preview;

      console.log(`✅ ${toneTest.name} successful!`);
      console.log(`   📊 Metrics:`);
      console.log(`      - Tone Level: ${preview.toneLevel}/100`);
      console.log(`      - Style Match: ${preview.metrics.styleMatchScore}%`);
      console.log(`      - Expansion: ${preview.metrics.expansionRatio}x`);
      console.log(`      - Generation Time: ${generationTime}ms`);
      console.log(`      - Content Length: ${preview.enhancedContent.length} chars`);
      
      console.log(`   📝 Content Preview (first 150 chars):`);
      console.log(`      "${preview.enhancedContent.substring(0, 150)}..."`);
      
      // Analyze tone characteristics
      const content = preview.enhancedContent.toLowerCase();
      const formalWords = ['individual', 'demonstrated', 'exhibited', 'participated', 'completed', 'observed'];
      const casualWords = ['got', 'did', 'went', 'said', 'made', 'showed'];
      
      const formalCount = formalWords.filter(word => content.includes(word)).length;
      const casualCount = casualWords.filter(word => content.includes(word)).length;
      
      console.log(`   🔍 Tone Analysis:`);
      console.log(`      - Formal words: ${formalCount}`);
      console.log(`      - Casual words: ${casualCount}`);
      console.log(`      - Tone ratio: ${formalCount > casualCount ? 'More formal' : casualCount > formalCount ? 'More casual' : 'Balanced'}`);
      
      console.log(''); // Empty line for readability
    }

    // Test edge cases
    console.log('3. 🧪 Testing edge cases...\n');

    // Test with extreme values
    const edgeCases = [
      { level: -10, name: 'Below minimum' },
      { level: 110, name: 'Above maximum' },
      { level: 50.5, name: 'Decimal value' }
    ];

    for (const edgeCase of edgeCases) {
      console.log(`--- Testing ${edgeCase.name} (${edgeCase.level}) ---`);
      
      const previewResponse = await fetch(`${API_BASE}/ai/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: testPrompt,
          detailLevel: 'detailed',
          toneLevel: edgeCase.level
        })
      });

      if (previewResponse.ok) {
        const previewResult = await previewResponse.json();
        if (previewResult.success) {
          console.log(`✅ ${edgeCase.name} handled gracefully`);
          console.log(`   - Effective tone level: ${previewResult.preview.toneLevel}`);
        } else {
          console.log(`⚠️ ${edgeCase.name} failed: ${previewResult.error}`);
        }
      } else {
        console.log(`⚠️ ${edgeCase.name} failed with status: ${previewResponse.status}`);
      }
    }

    console.log('\n🎉 Tone slider functionality test completed!');

  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testToneSlider();
