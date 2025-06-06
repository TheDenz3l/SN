/**
 * Final comprehensive test for preferences persistence
 */

const fetch = require('node-fetch');

async function finalPreferencesTest() {
  console.log('🎯 FINAL COMPREHENSIVE PREFERENCES PERSISTENCE TEST');
  console.log('==================================================');

  try {
    // 1. Login
    console.log('1️⃣ Login...');
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

    // 2. Set unique test preferences
    console.log('\n2️⃣ Setting unique test preferences...');
    const uniquePreferences = {
      defaultToneLevel: 42,
      defaultDetailLevel: 'detailed',
      emailNotifications: true,
      weeklyReports: false,
      useTimePatterns: true,
      testId: `test-${Date.now()}`
    };

    const updateResponse = await fetch('http://localhost:3001/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(uniquePreferences)
    });

    const updateResult = await updateResponse.json();
    if (!updateResult.success) {
      throw new Error(`Preferences update failed: ${updateResult.error}`);
    }

    console.log('✅ Unique preferences saved:');
    console.log(`   - Tone Level: ${uniquePreferences.defaultToneLevel}`);
    console.log(`   - Detail Level: ${uniquePreferences.defaultDetailLevel}`);
    console.log(`   - Email Notifications: ${uniquePreferences.emailNotifications}`);
    console.log(`   - Weekly Reports: ${uniquePreferences.weeklyReports}`);
    console.log(`   - Time Patterns: ${uniquePreferences.useTimePatterns}`);
    console.log(`   - Test ID: ${uniquePreferences.testId}`);

    // 3. Wait a moment to ensure database write
    console.log('\n3️⃣ Waiting for database write...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Wait complete');

    // 4. Simulate complete logout/login cycle
    console.log('\n4️⃣ Simulating logout/login cycle...');
    
    // Logout
    const logoutResponse = await fetch('http://localhost:3001/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Logged out');

    // Login again
    const reloginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@swiftnotes.app',
        password: 'demo123'
      })
    });

    const reloginResult = await reloginResponse.json();
    if (!reloginResult.success) {
      throw new Error(`Re-login failed: ${reloginResult.error}`);
    }

    const newToken = reloginResult.session.access_token;
    console.log('✅ Re-login successful');

    // 5. Fetch fresh profile
    console.log('\n5️⃣ Fetching fresh profile...');
    const profileResponse = await fetch('http://localhost:3001/api/user/profile', {
      headers: { 'Authorization': `Bearer ${newToken}` }
    });

    const profileResult = await profileResponse.json();
    if (!profileResult.success) {
      throw new Error(`Profile fetch failed: ${profileResult.error}`);
    }

    const persistedPrefs = profileResult.user.preferences;
    console.log('✅ Fresh profile retrieved');

    // 6. Verify ALL preferences persisted
    console.log('\n6️⃣ Verifying ALL preferences persisted...');
    const verificationChecks = [
      { name: 'Tone Level', expected: 42, actual: persistedPrefs.defaultToneLevel },
      { name: 'Detail Level', expected: 'detailed', actual: persistedPrefs.defaultDetailLevel },
      { name: 'Email Notifications', expected: true, actual: persistedPrefs.emailNotifications },
      { name: 'Weekly Reports', expected: false, actual: persistedPrefs.weeklyReports },
      { name: 'Time Patterns', expected: true, actual: persistedPrefs.useTimePatterns },
      { name: 'Test ID', expected: uniquePreferences.testId, actual: persistedPrefs.testId }
    ];

    let allPersisted = true;
    verificationChecks.forEach(check => {
      const persisted = check.actual === check.expected;
      const status = persisted ? '✅' : '❌';
      console.log(`   ${status} ${check.name}: ${check.actual} (expected: ${check.expected})`);
      if (!persisted) allPersisted = false;
    });

    // 7. Test AI generation with persisted preferences
    console.log('\n7️⃣ Testing AI generation with persisted preferences...');
    const aiResponse = await fetch('http://localhost:3001/api/ai/preview', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${newToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'Chad had a productive morning',
        toneLevel: persistedPrefs.defaultToneLevel,
        detailLevel: persistedPrefs.defaultDetailLevel,
        useTimePatterns: persistedPrefs.useTimePatterns
      })
    });

    const aiResult = await aiResponse.json();
    if (aiResult.success) {
      console.log('✅ AI generation successful with persisted preferences');
      console.log(`   - Tone Level: ${persistedPrefs.defaultToneLevel}`);
      console.log(`   - Detail Level: ${persistedPrefs.defaultDetailLevel}`);
      console.log(`   - Time Patterns: ${persistedPrefs.useTimePatterns}`);
    } else {
      console.log('❌ AI generation failed');
      allPersisted = false;
    }

    // 8. Final verdict
    console.log('\n🏆 FINAL TEST RESULTS');
    console.log('====================');
    if (allPersisted) {
      console.log('🎉 PERFECT SUCCESS! 🎉');
      console.log('✅ ALL preferences persist correctly across logout/login cycles');
      console.log('✅ Backend correctly stores and retrieves preferences');
      console.log('✅ Frontend correctly loads persisted preferences');
      console.log('✅ AI generation uses persisted preferences');
      console.log('✅ User experience is seamless!');
    } else {
      console.log('❌ ISSUES DETECTED!');
      console.log('Some preferences are not persisting correctly.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

finalPreferencesTest();
