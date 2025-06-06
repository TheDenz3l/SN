/**
 * Core Fixes Test: Verify Time Pattern Toggle and Default Settings
 * (Without AI generation to avoid API key issues)
 */

const fetch = require('node-fetch');

async function testCoreFixes() {
  console.log('🧪 Testing Core Fixes (No AI Required)');
  console.log('======================================\n');

  try {
    // 1. Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@swiftnotes.app', password: 'demo123' })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginResult = await loginResponse.json();
    const token = loginResult.session.access_token;
    console.log('✅ Login successful\n');

    // 2. Test 1: Set preferences with useTimePatterns = true
    console.log('2️⃣ Test 1: Setting useTimePatterns = true...');
    const prefsResponse1 = await fetch('http://localhost:3001/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        defaultToneLevel: 15,  // Very authentic
        defaultDetailLevel: 'moderate',
        useTimePatterns: true
      })
    });
    
    if (!prefsResponse1.ok) {
      throw new Error(`Preferences update failed: ${prefsResponse1.status}`);
    }
    
    const prefsResult1 = await prefsResponse1.json();
    console.log('✅ Preferences saved successfully');

    // 3. Verify persistence of useTimePatterns = true
    console.log('\n3️⃣ Verifying useTimePatterns = true persistence...');
    const profileResponse1 = await fetch('http://localhost:3001/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!profileResponse1.ok) {
      throw new Error(`Profile fetch failed: ${profileResponse1.status}`);
    }
    
    const profileResult1 = await profileResponse1.json();
    const savedPrefs1 = JSON.parse(profileResult1.user.preferences);
    
    console.log('📊 Saved preferences:');
    console.log(`   - useTimePatterns: ${savedPrefs1.useTimePatterns}`);
    console.log(`   - defaultToneLevel: ${savedPrefs1.defaultToneLevel}`);
    console.log(`   - defaultDetailLevel: ${savedPrefs1.defaultDetailLevel}`);
    
    const test1Pass = savedPrefs1.useTimePatterns === true && 
                      savedPrefs1.defaultToneLevel === 15 && 
                      savedPrefs1.defaultDetailLevel === 'moderate';
    
    console.log(`${test1Pass ? '✅' : '❌'} Test 1 Result: ${test1Pass ? 'PASSED' : 'FAILED'}`);

    // 4. Test 2: Set preferences with useTimePatterns = false
    console.log('\n4️⃣ Test 2: Setting useTimePatterns = false...');
    const prefsResponse2 = await fetch('http://localhost:3001/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        defaultToneLevel: 75,  // More professional
        defaultDetailLevel: 'detailed',
        useTimePatterns: false
      })
    });
    
    if (!prefsResponse2.ok) {
      throw new Error(`Preferences update 2 failed: ${prefsResponse2.status}`);
    }
    
    console.log('✅ Preferences updated successfully');

    // 5. Verify persistence of useTimePatterns = false
    console.log('\n5️⃣ Verifying useTimePatterns = false persistence...');
    const profileResponse2 = await fetch('http://localhost:3001/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!profileResponse2.ok) {
      throw new Error(`Profile fetch 2 failed: ${profileResponse2.status}`);
    }
    
    const profileResult2 = await profileResponse2.json();
    const savedPrefs2 = JSON.parse(profileResult2.user.preferences);
    
    console.log('📊 Updated preferences:');
    console.log(`   - useTimePatterns: ${savedPrefs2.useTimePatterns}`);
    console.log(`   - defaultToneLevel: ${savedPrefs2.defaultToneLevel}`);
    console.log(`   - defaultDetailLevel: ${savedPrefs2.defaultDetailLevel}`);
    
    const test2Pass = savedPrefs2.useTimePatterns === false && 
                      savedPrefs2.defaultToneLevel === 75 && 
                      savedPrefs2.defaultDetailLevel === 'detailed';
    
    console.log(`${test2Pass ? '✅' : '❌'} Test 2 Result: ${test2Pass ? 'PASSED' : 'FAILED'}`);

    // 6. Test 3: Reset to original settings
    console.log('\n6️⃣ Test 3: Resetting to original settings...');
    const prefsResponse3 = await fetch('http://localhost:3001/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        defaultToneLevel: 15,
        defaultDetailLevel: 'moderate',
        useTimePatterns: true
      })
    });
    
    if (!prefsResponse3.ok) {
      throw new Error(`Preferences reset failed: ${prefsResponse3.status}`);
    }
    
    console.log('✅ Preferences reset successfully');

    // Final verification
    const profileResponse3 = await fetch('http://localhost:3001/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const profileResult3 = await profileResponse3.json();
    const savedPrefs3 = JSON.parse(profileResult3.user.preferences);
    
    const test3Pass = savedPrefs3.useTimePatterns === true && 
                      savedPrefs3.defaultToneLevel === 15 && 
                      savedPrefs3.defaultDetailLevel === 'moderate';

    console.log(`${test3Pass ? '✅' : '❌'} Test 3 Result: ${test3Pass ? 'PASSED' : 'FAILED'}`);

    // Summary
    console.log('\n🎉 FINAL RESULTS:');
    console.log('================');
    console.log(`✅ Time Pattern Toggle (true): ${test1Pass ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Time Pattern Toggle (false): ${test2Pass ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Default Settings Persistence: ${test1Pass && test2Pass && test3Pass ? 'WORKING' : 'FAILED'}`);
    
    const allTestsPass = test1Pass && test2Pass && test3Pass;
    console.log(`\n🎯 Overall Status: ${allTestsPass ? '✅ ALL CORE FIXES WORKING!' : '❌ SOME ISSUES REMAIN'}`);

    if (allTestsPass) {
      console.log('\n🚀 Ready for AI testing once API key is configured!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCoreFixes();
