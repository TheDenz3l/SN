/**
 * Test Token Format and Authentication
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

async function testTokenFormat() {
  console.log('🔍 Testing Token Format and Authentication...\n');

  try {
    // Step 1: Login and get token
    console.log('1. 🔐 Attempting login...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'phase1test@swiftnotes.app',
        password: 'Test123!'
      })
    });

    console.log('Login response status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('❌ Login failed:', errorText);
      return;
    }

    const loginResult = await loginResponse.json();
    console.log('✅ Login successful');
    
    const token = loginResult.session.access_token;
    console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
    console.log('Token length:', token.length);

    // Step 2: Decode and inspect token
    console.log('\n2. 🔍 Inspecting token format...');
    try {
      const decodedToken = JSON.parse(Buffer.from(token, 'base64').toString());
      console.log('✅ Token decoded successfully:');
      console.log('   - User ID:', decodedToken.userId);
      console.log('   - Email:', decodedToken.email);
      console.log('   - Expires:', new Date(decodedToken.exp).toISOString());
      console.log('   - Is Expired:', decodedToken.exp < Date.now());
    } catch (error) {
      console.error('❌ Token decode failed:', error.message);
      return;
    }

    // Step 3: Test authenticated endpoint
    console.log('\n3. 🧪 Testing authenticated endpoint...');
    const profileResponse = await fetch(`${API_BASE}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Profile response status:', profileResponse.status);
    
    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('❌ Profile request failed:', errorText);
      return;
    }

    const profileResult = await profileResponse.json();
    console.log('✅ Profile request successful');
    console.log('   - User ID:', profileResult.user.id);
    console.log('   - Email:', profileResult.user.email);
    console.log('   - Setup Complete:', profileResult.user.hasCompletedSetup);

    // Step 4: Test preview endpoint specifically
    console.log('\n4. 🎯 Testing preview endpoint...');
    const previewResponse = await fetch(`${API_BASE}/ai/preview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'Client showed improvement in communication.',
        taskDescription: 'Communication goals',
        detailLevel: 'detailed'
      })
    });

    console.log('Preview response status:', previewResponse.status);
    
    if (!previewResponse.ok) {
      const errorText = await previewResponse.text();
      console.error('❌ Preview request failed:', errorText);
      
      // Try to parse as JSON for better error info
      try {
        const errorJson = JSON.parse(errorText);
        console.log('Error details:', errorJson);
      } catch (e) {
        console.log('Raw error:', errorText);
      }
      return;
    }

    const previewResult = await previewResponse.json();
    console.log('✅ Preview request successful!');
    console.log('   - Enhanced content length:', previewResult.preview.enhancedContent.length);
    console.log('   - Is basic preview:', previewResult.preview.isBasicPreview || false);
    console.log('   - Style match score:', previewResult.preview.metrics.styleMatchScore + '%');

    console.log('\n🎉 All tests passed! Token format is working correctly.');

  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testTokenFormat();
