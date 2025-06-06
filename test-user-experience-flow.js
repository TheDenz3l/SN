/**
 * Test the complete user experience flow for preferences persistence
 */

const fetch = require('node-fetch');

async function testUserExperienceFlow() {
  console.log('🧪 Testing Complete User Experience Flow');
  console.log('=======================================');

  try {
    // 1. Login
    console.log('1️⃣ User logs in...');
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
    console.log('✅ User successfully logged in');

    // 2. Check current preferences
    console.log('\n2️⃣ Checking current preferences...');
    const profileResponse = await fetch('http://localhost:3001/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const profileResult = await profileResponse.json();
    if (!profileResult.success) {
      throw new Error(`Profile fetch failed: ${profileResult.error}`);
    }

    const currentPrefs = profileResult.user.preferences;
    console.log('✅ Current preferences retrieved:');
    console.log(`   - Tone Level: ${currentPrefs.defaultToneLevel}`);
    console.log(`   - Detail Level: ${currentPrefs.defaultDetailLevel}`);
    console.log(`   - Time Patterns: ${currentPrefs.useTimePatterns}`);

    // 3. User changes preferences
    console.log('\n3️⃣ User changes preferences in settings...');
    const newPreferences = {
      defaultToneLevel: 25,
      defaultDetailLevel: 'moderate',
      emailNotifications: true,
      weeklyReports: false,
      useTimePatterns: false
    };

    const updateResponse = await fetch('http://localhost:3001/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newPreferences)
    });

    const updateResult = await updateResponse.json();
    if (!updateResult.success) {
      throw new Error(`Preferences update failed: ${updateResult.error}`);
    }

    console.log('✅ User saved new preferences:');
    console.log(`   - Tone Level: ${newPreferences.defaultToneLevel}`);
    console.log(`   - Detail Level: ${newPreferences.defaultDetailLevel}`);
    console.log(`   - Time Patterns: ${newPreferences.useTimePatterns}`);

    // 4. Simulate user refreshing the page
    console.log('\n4️⃣ User refreshes the page...');
    const refreshProfileResponse = await fetch('http://localhost:3001/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const refreshProfileResult = await refreshProfileResponse.json();
    if (!refreshProfileResult.success) {
      throw new Error(`Profile fetch after refresh failed: ${refreshProfileResult.error}`);
    }

    const refreshedPrefs = refreshProfileResult.user.preferences;
    console.log('✅ Page refreshed, preferences loaded:');
    console.log(`   - Tone Level: ${refreshedPrefs.defaultToneLevel}`);
    console.log(`   - Detail Level: ${refreshedPrefs.defaultDetailLevel}`);
    console.log(`   - Time Patterns: ${refreshedPrefs.useTimePatterns}`);

    // 5. Verify preferences match
    console.log('\n5️⃣ Verifying preferences persistence...');
    const checks = [
      { name: 'Tone Level', expected: 25, actual: refreshedPrefs.defaultToneLevel },
      { name: 'Detail Level', expected: 'moderate', actual: refreshedPrefs.defaultDetailLevel },
      { name: 'Time Patterns', expected: false, actual: refreshedPrefs.useTimePatterns }
    ];

    let allMatched = true;
    checks.forEach(check => {
      const matched = check.actual === check.expected;
      const status = matched ? '✅' : '❌';
      console.log(`   ${status} ${check.name}: ${check.actual} (expected: ${check.expected})`);
      if (!matched) allMatched = false;
    });

    // 6. Test AI generation uses the persisted preferences
    console.log('\n6️⃣ Testing AI generation with persisted preferences...');
    const aiResponse = await fetch('http://localhost:3001/api/ai/preview', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'Chad completed his morning routine',
        // Use the persisted preferences
        toneLevel: refreshedPrefs.defaultToneLevel,
        detailLevel: refreshedPrefs.defaultDetailLevel,
        useTimePatterns: refreshedPrefs.useTimePatterns
      })
    });

    const aiResult = await aiResponse.json();
    if (aiResult.success) {
      console.log('✅ AI generation successful with persisted preferences');
      console.log(`   - Used Tone Level: ${refreshedPrefs.defaultToneLevel} (more authentic)`);
      console.log(`   - Used Detail Level: ${refreshedPrefs.defaultDetailLevel}`);
      console.log(`   - Used Time Patterns: ${refreshedPrefs.useTimePatterns} (disabled)`);
    } else {
      console.log('❌ AI generation failed');
      allMatched = false;
    }

    // 7. Final result
    console.log('\n🎉 User Experience Flow Test Results');
    console.log('===================================');
    if (allMatched) {
      console.log('✅ PERFECT! User preferences persist correctly across page refreshes.');
      console.log('✅ The user experience is seamless - settings are remembered!');
    } else {
      console.log('❌ ISSUES FOUND! User preferences are not persisting correctly.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUserExperienceFlow();
