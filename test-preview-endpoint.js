/**
 * Test Preview Endpoint Functionality
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

async function testPreviewEndpoint() {
  console.log('🔍 Testing Preview Endpoint...\n');

  try {
    // Step 1: Login to get a valid token
    console.log('1. 🔐 Logging in...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'phase1test@swiftnotes.app',
        password: 'password123'
      })
    });

    const loginResult = await loginResponse.json();
    console.log('Login status:', loginResponse.status);
    
    if (!loginResult.success) {
      console.error('❌ Login failed:', loginResult.error);
      return;
    }

    console.log('✅ Login successful');
    const token = loginResult.session.access_token;
    console.log('Token (first 20 chars):', token.substring(0, 20) + '...');

    // Step 2: Check user profile and setup status
    console.log('\n2. 👤 Checking user profile...');
    const profileResponse = await fetch(`${API_BASE}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const profileResult = await profileResponse.json();
    console.log('Profile status:', profileResponse.status);
    
    if (!profileResult.success) {
      console.error('❌ Profile fetch failed:', profileResult.error);
      return;
    }

    console.log('✅ Profile retrieved');
    console.log('   - Setup Complete:', profileResult.user.hasCompletedSetup);
    console.log('   - Writing Style:', profileResult.user.writingStyle ? 'Set' : 'Not set');
    console.log('   - Credits:', profileResult.user.credits);

    // Step 3: Test preview endpoint
    console.log('\n3. 🔮 Testing preview endpoint...');
    const previewResponse = await fetch(`${API_BASE}/ai/preview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'Client showed improvement in communication during today\'s session.',
        taskDescription: 'Communication goals - verbal requests',
        detailLevel: 'detailed'
      })
    });

    console.log('Preview status:', previewResponse.status);
    const previewResult = await previewResponse.json();
    
    if (!previewResult.success) {
      console.error('❌ Preview failed:', previewResult.error);
      console.log('Full response:', JSON.stringify(previewResult, null, 2));
      return;
    }

    console.log('✅ Preview successful!');
    console.log('📄 Preview Details:');
    console.log('   - Original Prompt:', previewResult.preview.originalPrompt);
    console.log('   - Enhanced Content Length:', previewResult.preview.enhancedContent.length);
    console.log('   - Detail Level:', previewResult.preview.detailLevel);
    console.log('   - Is Basic Preview:', previewResult.preview.isBasicPreview || false);
    console.log('   - Style Match Score:', previewResult.preview.metrics.styleMatchScore + '%');
    console.log('   - Expansion Ratio:', previewResult.preview.metrics.expansionRatio + 'x');
    console.log('   - Generation Time:', previewResult.preview.metrics.generationTimeMs + 'ms');
    console.log('   - Tokens Used:', previewResult.preview.metrics.tokensUsed);
    console.log('   - Estimated Cost:', '$' + previewResult.preview.metrics.estimatedCost.toFixed(4));

    console.log('\n📝 Enhanced Content Preview:');
    console.log('---');
    console.log(previewResult.preview.enhancedContent);
    console.log('---');

    // Step 4: Test preview without setup (if applicable)
    if (profileResult.user.hasCompletedSetup) {
      console.log('\n4. 🧪 Testing with different user (no setup)...');
      
      // Try to login with a user that hasn't completed setup
      const noSetupLoginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      if (noSetupLoginResponse.ok) {
        const noSetupLoginResult = await noSetupLoginResponse.json();
        if (noSetupLoginResult.success) {
          const noSetupToken = noSetupLoginResult.session.access_token;
          
          const noSetupPreviewResponse = await fetch(`${API_BASE}/ai/preview`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${noSetupToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: 'Client showed improvement in communication.',
              detailLevel: 'basic'
            })
          });

          const noSetupPreviewResult = await noSetupPreviewResponse.json();
          console.log('No-setup preview status:', noSetupPreviewResponse.status);
          
          if (noSetupPreviewResult.success) {
            console.log('✅ Basic preview successful!');
            console.log('   - Is Basic Preview:', noSetupPreviewResult.preview.isBasicPreview);
            console.log('   - Style Match Score:', noSetupPreviewResult.preview.metrics.styleMatchScore + '%');
          } else {
            console.log('❌ Basic preview failed:', noSetupPreviewResult.error);
          }
        }
      }
    }

    console.log('\n🎉 Preview endpoint test completed!');

  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPreviewEndpoint();
