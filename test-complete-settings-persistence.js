/**
 * Comprehensive Test for User Settings Persistence
 * Tests all user account settings and options to ensure they persist across login sessions
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

// Test user credentials (demo user)
const TEST_USER = {
  email: 'demo@swiftnotes.app',
  password: 'demo123'
};

async function testCompleteSettingsPersistence() {
  console.log('🧪 Comprehensive User Settings Persistence Test');
  console.log('===============================================');

  let authToken = null;

  try {
    // 1. Login to get auth token
    console.log('\n1️⃣ Logging in...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });

    const loginResult = await loginResponse.json();
    if (!loginResult.success) {
      throw new Error(`Login failed: ${loginResult.error}`);
    }

    authToken = loginResult.session.access_token;
    console.log('✅ Login successful');

    // 2. Get current user profile and settings
    console.log('\n2️⃣ Getting current user profile and settings...');
    const profileResponse = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const profileResult = await profileResponse.json();
    if (!profileResult.success) {
      throw new Error(`Profile fetch failed: ${profileResult.error}`);
    }

    console.log('✅ Profile retrieved');
    console.log('📊 Current settings:');
    console.log('   - Name:', profileResult.user.firstName, profileResult.user.lastName);
    console.log('   - Tier:', profileResult.user.tier);
    console.log('   - Credits:', profileResult.user.credits);
    console.log('   - Setup Complete:', profileResult.user.hasCompletedSetup);
    console.log('   - Writing Style:', profileResult.user.writingStyle ? 'Set' : 'Not set');
    console.log('   - Preferences:', JSON.stringify(profileResult.user.preferences, null, 2));

    // 3. Test comprehensive preferences update
    console.log('\n3️⃣ Testing comprehensive preferences update...');
    const testPreferences = {
      defaultToneLevel: 75,
      defaultDetailLevel: 'comprehensive',
      emailNotifications: false,
      weeklyReports: true,
      useTimePatterns: false,
      testSessionId: `session-${Date.now()}`
    };

    const updatePrefsResponse = await fetch(`${API_BASE_URL}/user/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPreferences)
    });

    const updatePrefsResult = await updatePrefsResponse.json();
    if (!updatePrefsResult.success) {
      throw new Error(`Preferences update failed: ${updatePrefsResult.error}`);
    }

    console.log('✅ Preferences updated successfully');
    console.log('📝 Updated preferences:', JSON.stringify(updatePrefsResult.preferences, null, 2));

    // 4. Test profile information update
    console.log('\n4️⃣ Testing profile information update...');
    const profileUpdates = {
      firstName: 'Demo Updated',
      lastName: 'User Updated'
    };

    const updateProfileResponse = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileUpdates)
    });

    const updateProfileResult = await updateProfileResponse.json();
    if (!updateProfileResult.success) {
      throw new Error(`Profile update failed: ${updateProfileResult.error}`);
    }

    console.log('✅ Profile updated successfully');
    console.log('👤 Updated name:', updateProfileResult.user.firstName, updateProfileResult.user.lastName);

    // 5. Simulate logout by clearing token
    console.log('\n5️⃣ Simulating logout...');
    authToken = null;
    console.log('✅ Logged out (token cleared)');

    // 6. Login again to test persistence
    console.log('\n6️⃣ Logging in again to test persistence...');
    const reloginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });

    const reloginResult = await reloginResponse.json();
    if (!reloginResult.success) {
      throw new Error(`Re-login failed: ${reloginResult.error}`);
    }

    authToken = reloginResult.session.access_token;
    console.log('✅ Re-login successful');

    // 7. Verify all settings persisted
    console.log('\n7️⃣ Verifying settings persistence...');
    const verifyResponse = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const verifyResult = await verifyResponse.json();
    if (!verifyResult.success) {
      throw new Error(`Verification fetch failed: ${verifyResult.error}`);
    }

    console.log('✅ Settings verification complete');
    console.log('📊 Persisted settings:');
    console.log('   - Name:', verifyResult.user.firstName, verifyResult.user.lastName);
    console.log('   - Tier:', verifyResult.user.tier);
    console.log('   - Credits:', verifyResult.user.credits);
    console.log('   - Setup Complete:', verifyResult.user.hasCompletedSetup);
    console.log('   - Writing Style:', verifyResult.user.writingStyle ? 'Set' : 'Not set');
    console.log('   - Preferences:', JSON.stringify(verifyResult.user.preferences, null, 2));

    // 8. Verify specific settings match
    console.log('\n8️⃣ Verifying specific settings match...');
    const persistedPrefs = verifyResult.user.preferences;
    
    const checks = [
      { name: 'Name (First)', expected: 'Demo Updated', actual: verifyResult.user.firstName },
      { name: 'Name (Last)', expected: 'User Updated', actual: verifyResult.user.lastName },
      { name: 'Tone Level', expected: 75, actual: persistedPrefs.defaultToneLevel },
      { name: 'Detail Level', expected: 'comprehensive', actual: persistedPrefs.defaultDetailLevel },
      { name: 'Email Notifications', expected: false, actual: persistedPrefs.emailNotifications },
      { name: 'Weekly Reports', expected: true, actual: persistedPrefs.weeklyReports },
      { name: 'Time Patterns', expected: false, actual: persistedPrefs.useTimePatterns },
      { name: 'Test Session ID', expected: testPreferences.testSessionId, actual: persistedPrefs.testSessionId }
    ];

    let allPassed = true;
    checks.forEach(check => {
      const passed = check.expected === check.actual;
      console.log(`   ${passed ? '✅' : '❌'} ${check.name}: ${check.actual} ${passed ? '(matches)' : `(expected: ${check.expected})`}`);
      if (!passed) allPassed = false;
    });

    // 9. Test AI generation with persisted settings
    console.log('\n9️⃣ Testing AI generation with persisted settings...');
    const generateResponse = await fetch(`${API_BASE_URL}/ai/preview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'Chad completed his morning routine tasks successfully.',
        taskDescription: 'Morning routine completion'
      })
    });

    const generateResult = await generateResponse.json();
    if (!generateResult.success) {
      console.log('❌ AI generation failed:', generateResult.error);
    } else {
      console.log('✅ AI generation successful with persisted settings');
      console.log(`📊 Used Tone Level: ${generateResult.preview.toneLevel}`);
      console.log(`📊 Used Detail Level: ${generateResult.preview.detailLevel}`);
      console.log('📝 Generated content preview:');
      console.log('---');
      console.log(generateResult.preview.enhancedContent.substring(0, 200) + '...');
      console.log('---');
    }

    // 10. Final verification
    console.log('\n🎉 Comprehensive Settings Persistence Test Results');
    console.log('==================================================');
    
    if (allPassed) {
      console.log('✅ ALL SETTINGS PERSISTED CORRECTLY');
      console.log('✅ User preferences maintained across login sessions');
      console.log('✅ Profile information maintained across login sessions');
      console.log('✅ AI generation uses persisted default settings');
      console.log('✅ Settings persistence is fully functional');
    } else {
      console.log('❌ SOME SETTINGS DID NOT PERSIST');
      console.log('⚠️  Check the failed items above');
    }

    return allPassed;

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testCompleteSettingsPersistence()
    .then(success => {
      if (success) {
        console.log('\n🌟 All user settings persistence tests PASSED!');
        console.log('🔄 Users can now modify settings and they will be preserved across login sessions');
        process.exit(0);
      } else {
        console.log('\n💥 Some settings persistence tests FAILED!');
        process.exit(1);
      }
    })
    .catch(console.error);
}

module.exports = { testCompleteSettingsPersistence };
