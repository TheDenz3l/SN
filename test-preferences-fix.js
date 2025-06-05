const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

async function testPreferencesFix() {
  console.log('🧪 Testing Preferences Fix');
  console.log('='.repeat(50));

  try {
    // Step 1: Login
    console.log('\n1. 🔐 Logging in...');
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
      console.log('❌ Login failed:', loginResult.error);
      return;
    }

    const token = loginResult.session.access_token;
    console.log('✅ Login successful');

    // Step 2: Get current profile (should include preferences)
    console.log('\n2. 👤 Getting user profile...');
    const profileResponse = await fetch(`${API_BASE}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const profileResult = await profileResponse.json();
    if (!profileResult.success) {
      console.log('❌ Profile fetch failed:', profileResult.error);
      return;
    }

    console.log('✅ Profile fetched successfully');
    console.log('Current preferences:', profileResult.user.preferences);

    // Step 3: Update preferences
    console.log('\n3. ⚙️ Updating preferences...');
    const preferencesResponse = await fetch(`${API_BASE}/user/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        defaultToneLevel: 75,
        defaultDetailLevel: 'comprehensive'
      })
    });

    const preferencesResult = await preferencesResponse.json();
    if (!preferencesResult.success) {
      console.log('❌ Preferences update failed:', preferencesResult.error);
      return;
    }

    console.log('✅ Preferences updated successfully');
    console.log('Updated preferences:', preferencesResult.preferences);

    // Step 4: Verify preferences were saved
    console.log('\n4. 🔍 Verifying preferences were saved...');
    const verifyResponse = await fetch(`${API_BASE}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const verifyResult = await verifyResponse.json();
    if (!verifyResult.success) {
      console.log('❌ Verification failed:', verifyResult.error);
      return;
    }

    console.log('✅ Verification successful');
    console.log('Saved preferences:', verifyResult.user.preferences);

    // Parse and check the preferences
    let savedPrefs = {};
    try {
      savedPrefs = typeof verifyResult.user.preferences === 'string' 
        ? JSON.parse(verifyResult.user.preferences)
        : verifyResult.user.preferences || {};
    } catch (e) {
      console.log('⚠️ Could not parse preferences:', e.message);
    }

    // Step 5: Validate the saved values
    console.log('\n5. ✅ Validation Results:');
    console.log(`   Tone Level: ${savedPrefs.defaultToneLevel} (expected: 75)`);
    console.log(`   Detail Level: ${savedPrefs.defaultDetailLevel} (expected: comprehensive)`);

    if (savedPrefs.defaultToneLevel === 75 && savedPrefs.defaultDetailLevel === 'comprehensive') {
      console.log('\n🎉 SUCCESS: Preferences are saving and loading correctly!');
    } else {
      console.log('\n❌ FAILURE: Preferences are not saving correctly');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testPreferencesFix();
