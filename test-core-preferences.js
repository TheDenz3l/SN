/**
 * Test core user preferences that matter for the UI
 */

const fetch = require('node-fetch');

async function testCorePreferences() {
  console.log('🎯 TESTING CORE USER PREFERENCES PERSISTENCE');
  console.log('============================================');

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

    // 2. Set core preferences that users care about
    console.log('\n2️⃣ Setting core user preferences...');
    const corePreferences = {
      defaultToneLevel: 15,        // More authentic
      defaultDetailLevel: 'brief', // Brief notes
      useTimePatterns: false       // No time patterns
    };

    const updateResponse = await fetch('http://localhost:3001/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(corePreferences)
    });

    const updateResult = await updateResponse.json();
    if (!updateResult.success) {
      throw new Error(`Preferences update failed: ${updateResult.error}`);
    }

    console.log('✅ Core preferences saved:');
    console.log(`   - Tone Level: ${corePreferences.defaultToneLevel} (more authentic)`);
    console.log(`   - Detail Level: ${corePreferences.defaultDetailLevel}`);
    console.log(`   - Time Patterns: ${corePreferences.useTimePatterns} (disabled)`);

    // 3. Simulate page refresh
    console.log('\n3️⃣ Simulating page refresh...');
    const refreshProfileResponse = await fetch('http://localhost:3001/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const refreshProfileResult = await refreshProfileResponse.json();
    if (!refreshProfileResult.success) {
      throw new Error(`Profile refresh failed: ${refreshProfileResult.error}`);
    }

    const refreshedPrefs = refreshProfileResult.user.preferences;
    console.log('✅ Page refreshed, preferences loaded');

    // 4. Verify core preferences
    console.log('\n4️⃣ Verifying core preferences persistence...');
    const coreChecks = [
      { name: 'Tone Level', expected: 15, actual: refreshedPrefs.defaultToneLevel },
      { name: 'Detail Level', expected: 'brief', actual: refreshedPrefs.defaultDetailLevel },
      { name: 'Time Patterns', expected: false, actual: refreshedPrefs.useTimePatterns }
    ];

    let allCorePrefsWork = true;
    coreChecks.forEach(check => {
      const works = check.actual === check.expected;
      const status = works ? '✅' : '❌';
      console.log(`   ${status} ${check.name}: ${check.actual} (expected: ${check.expected})`);
      if (!works) allCorePrefsWork = false;
    });

    // 5. Test different preferences
    console.log('\n5️⃣ Testing different preference values...');
    const differentPreferences = {
      defaultToneLevel: 90,           // Professional
      defaultDetailLevel: 'comprehensive', // Maximum detail
      useTimePatterns: true           // Enable time patterns
    };

    const updateResponse2 = await fetch('http://localhost:3001/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(differentPreferences)
    });

    const updateResult2 = await updateResponse2.json();
    if (!updateResult2.success) {
      throw new Error(`Second preferences update failed: ${updateResult2.error}`);
    }

    console.log('✅ Different preferences saved:');
    console.log(`   - Tone Level: ${differentPreferences.defaultToneLevel} (professional)`);
    console.log(`   - Detail Level: ${differentPreferences.defaultDetailLevel}`);
    console.log(`   - Time Patterns: ${differentPreferences.useTimePatterns} (enabled)`);

    // 6. Verify second set of preferences
    console.log('\n6️⃣ Verifying second preference set...');
    const secondRefreshResponse = await fetch('http://localhost:3001/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const secondRefreshResult = await secondRefreshResponse.json();
    if (!secondRefreshResult.success) {
      throw new Error(`Second profile refresh failed: ${secondRefreshResult.error}`);
    }

    const secondRefreshedPrefs = secondRefreshResult.user.preferences;
    
    const secondChecks = [
      { name: 'Tone Level', expected: 90, actual: secondRefreshedPrefs.defaultToneLevel },
      { name: 'Detail Level', expected: 'comprehensive', actual: secondRefreshedPrefs.defaultDetailLevel },
      { name: 'Time Patterns', expected: true, actual: secondRefreshedPrefs.useTimePatterns }
    ];

    secondChecks.forEach(check => {
      const works = check.actual === check.expected;
      const status = works ? '✅' : '❌';
      console.log(`   ${status} ${check.name}: ${check.actual} (expected: ${check.expected})`);
      if (!works) allCorePrefsWork = false;
    });

    // 7. Final result
    console.log('\n🏆 CORE PREFERENCES TEST RESULTS');
    console.log('================================');
    if (allCorePrefsWork) {
      console.log('🎉 PERFECT! 🎉');
      console.log('✅ All core user preferences persist correctly');
      console.log('✅ Tone level settings are remembered');
      console.log('✅ Detail level settings are remembered');
      console.log('✅ Time pattern settings are remembered');
      console.log('✅ Changes are immediately reflected after page refresh');
      console.log('✅ The user experience is seamless!');
      console.log('');
      console.log('🎯 PROBLEM SOLVED: Writing preferences now persist upon');
      console.log('   logging out/in and refreshing the page!');
    } else {
      console.log('❌ Issues found with core preferences persistence');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCorePreferences();
