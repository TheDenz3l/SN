/**
 * Test frontend preferences persistence after page refresh/login
 */

const fetch = require('node-fetch');

async function testFrontendPreferencesPersistence() {
  console.log('🧪 Testing Frontend Preferences Persistence');
  console.log('==========================================');

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

    // 2. Set specific preferences
    console.log('\n2️⃣ Setting test preferences...');
    const testPreferences = {
      defaultToneLevel: 85,
      defaultDetailLevel: 'comprehensive',
      emailNotifications: false,
      weeklyReports: true,
      useTimePatterns: true
    };

    const updateResponse = await fetch('http://localhost:3001/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPreferences)
    });

    const updateResult = await updateResponse.json();
    if (!updateResult.success) {
      throw new Error(`Preferences update failed: ${updateResult.error}`);
    }

    console.log('✅ Test preferences saved');
    console.log('   - Tone Level: 85');
    console.log('   - Detail Level: comprehensive');
    console.log('   - Email Notifications: false');
    console.log('   - Weekly Reports: true');
    console.log('   - Time Patterns: true');

    // 3. Simulate page refresh by getting fresh profile
    console.log('\n3️⃣ Simulating page refresh (fetching fresh profile)...');
    const profileResponse = await fetch('http://localhost:3001/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const profileResult = await profileResponse.json();
    if (!profileResult.success) {
      throw new Error(`Profile fetch failed: ${profileResult.error}`);
    }

    console.log('✅ Fresh profile retrieved');

    // 4. Verify preferences persistence
    console.log('\n4️⃣ Verifying preferences persistence...');
    const preferences = profileResult.user.preferences;

    const checks = [
      { name: 'Tone Level', expected: 85, actual: preferences.defaultToneLevel },
      { name: 'Detail Level', expected: 'comprehensive', actual: preferences.defaultDetailLevel },
      { name: 'Email Notifications', expected: false, actual: preferences.emailNotifications },
      { name: 'Weekly Reports', expected: true, actual: preferences.weeklyReports },
      { name: 'Time Patterns', expected: true, actual: preferences.useTimePatterns }
    ];

    let allPassed = true;
    checks.forEach(check => {
      const passed = check.actual === check.expected;
      const status = passed ? '✅' : '❌';
      console.log(`   ${status} ${check.name}: ${check.actual} (expected: ${check.expected})`);
      if (!passed) allPassed = false;
    });

    // 5. Test AI generation with persisted preferences
    console.log('\n5️⃣ Testing AI generation with persisted preferences...');
    const aiResponse = await fetch('http://localhost:3001/api/ai/preview', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'Chad had a good morning routine',
        toneLevel: preferences.defaultToneLevel,
        detailLevel: preferences.defaultDetailLevel,
        useTimePatterns: preferences.useTimePatterns
      })
    });

    const aiResult = await aiResponse.json();
    if (aiResult.success) {
      console.log('✅ AI generation successful with persisted preferences');
      console.log(`   Used Tone Level: ${preferences.defaultToneLevel}`);
      console.log(`   Used Detail Level: ${preferences.defaultDetailLevel}`);
      console.log(`   Used Time Patterns: ${preferences.useTimePatterns}`);
      if (aiResult.content) {
        console.log(`   Generated content preview: ${aiResult.content.substring(0, 100)}...`);
      } else {
        console.log('   Generated content: (preview not available)');
      }
    } else {
      console.log('❌ AI generation failed');
      allPassed = false;
    }

    // 6. Final result
    console.log('\n🎉 Frontend Preferences Persistence Test Results');
    console.log('===============================================');
    if (allPassed) {
      console.log('✅ ALL TESTS PASSED! Preferences persist correctly.');
    } else {
      console.log('❌ SOME TESTS FAILED! Check the issues above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendPreferencesPersistence();
