/**
 * Test what the backend is actually returning for user preferences
 */

const fetch = require('node-fetch');

async function testBackendResponse() {
  console.log('🧪 Testing Backend Response Format');
  console.log('==================================');

  try {
    // 1. Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@swiftnotes.app',
        password: 'demo123'
      })
    });

    const loginResult = await loginResponse.json();
    if (!loginResult.success) {
      throw new Error(`Login failed: ${loginResult.error}`);
    }

    const token = loginResult.session.access_token;
    console.log('✅ Login successful');

    // 2. Get profile
    console.log('\n2️⃣ Getting user profile...');
    const profileResponse = await fetch('http://localhost:3001/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const profileResult = await profileResponse.json();
    if (!profileResult.success) {
      throw new Error(`Profile fetch failed: ${profileResult.error}`);
    }

    console.log('✅ Profile retrieved');
    console.log('\n📊 Raw Backend Response:');
    console.log('========================');
    console.log(JSON.stringify(profileResult, null, 2));

    console.log('\n🔍 Preferences Analysis:');
    console.log('========================');
    console.log('Preferences type:', typeof profileResult.user.preferences);
    console.log('Preferences value:', profileResult.user.preferences);
    
    if (typeof profileResult.user.preferences === 'string') {
      console.log('⚠️  Preferences is a STRING - needs parsing');
      try {
        const parsed = JSON.parse(profileResult.user.preferences);
        console.log('✅ Parsed preferences:', parsed);
      } catch (e) {
        console.log('❌ Failed to parse preferences:', e.message);
      }
    } else if (typeof profileResult.user.preferences === 'object') {
      console.log('✅ Preferences is already an OBJECT');
      console.log('   - defaultToneLevel:', profileResult.user.preferences.defaultToneLevel);
      console.log('   - defaultDetailLevel:', profileResult.user.preferences.defaultDetailLevel);
      console.log('   - emailNotifications:', profileResult.user.preferences.emailNotifications);
    } else {
      console.log('❓ Preferences is:', typeof profileResult.user.preferences);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBackendResponse();
