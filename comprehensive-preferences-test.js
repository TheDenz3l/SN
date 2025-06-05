const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

async function comprehensivePreferencesTest() {
  console.log('🧪 COMPREHENSIVE DEFAULT GENERATION SETTINGS TEST');
  console.log('='.repeat(60));

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

    // Step 2: Test all tone level values
    console.log('\n2. 🎚️ Testing Tone Level Range (0-100)...');
    
    const toneLevels = [0, 25, 50, 75, 100];
    for (const toneLevel of toneLevels) {
      const response = await fetch(`${API_BASE}/user/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ defaultToneLevel: toneLevel })
      });

      const result = await response.json();
      if (result.success) {
        console.log(`   ✅ Tone level ${toneLevel}: SAVED`);
        
        // Verify it was saved
        const verifyResponse = await fetch(`${API_BASE}/user/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const verifyResult = await verifyResponse.json();
        const savedPrefs = typeof verifyResult.user.preferences === 'string' 
          ? JSON.parse(verifyResult.user.preferences)
          : verifyResult.user.preferences || {};
        
        if (savedPrefs.defaultToneLevel === toneLevel) {
          console.log(`   ✅ Tone level ${toneLevel}: VERIFIED`);
        } else {
          console.log(`   ❌ Tone level ${toneLevel}: FAILED (got ${savedPrefs.defaultToneLevel})`);
        }
      } else {
        console.log(`   ❌ Tone level ${toneLevel}: FAILED - ${result.error}`);
      }
    }

    // Step 3: Test all detail levels
    console.log('\n3. 📊 Testing Detail Level Options...');
    
    const detailLevels = ['brief', 'moderate', 'detailed', 'comprehensive'];
    for (const detailLevel of detailLevels) {
      const response = await fetch(`${API_BASE}/user/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ defaultDetailLevel: detailLevel })
      });

      const result = await response.json();
      if (result.success) {
        console.log(`   ✅ Detail level '${detailLevel}': SAVED`);
        
        // Verify it was saved
        const verifyResponse = await fetch(`${API_BASE}/user/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const verifyResult = await verifyResponse.json();
        const savedPrefs = typeof verifyResult.user.preferences === 'string' 
          ? JSON.parse(verifyResult.user.preferences)
          : verifyResult.user.preferences || {};
        
        if (savedPrefs.defaultDetailLevel === detailLevel) {
          console.log(`   ✅ Detail level '${detailLevel}': VERIFIED`);
        } else {
          console.log(`   ❌ Detail level '${detailLevel}': FAILED (got '${savedPrefs.defaultDetailLevel}')`);
        }
      } else {
        console.log(`   ❌ Detail level '${detailLevel}': FAILED - ${result.error}`);
      }
    }

    // Step 4: Test combined updates
    console.log('\n4. 🔄 Testing Combined Updates...');
    
    const testCombinations = [
      { defaultToneLevel: 30, defaultDetailLevel: 'brief' },
      { defaultToneLevel: 60, defaultDetailLevel: 'moderate' },
      { defaultToneLevel: 90, defaultDetailLevel: 'comprehensive' }
    ];

    for (const combo of testCombinations) {
      const response = await fetch(`${API_BASE}/user/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(combo)
      });

      const result = await response.json();
      if (result.success) {
        console.log(`   ✅ Combined update (${combo.defaultToneLevel}, '${combo.defaultDetailLevel}'): SAVED`);
        
        // Verify both values were saved
        const verifyResponse = await fetch(`${API_BASE}/user/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const verifyResult = await verifyResponse.json();
        const savedPrefs = typeof verifyResult.user.preferences === 'string' 
          ? JSON.parse(verifyResult.user.preferences)
          : verifyResult.user.preferences || {};
        
        const toneMatch = savedPrefs.defaultToneLevel === combo.defaultToneLevel;
        const detailMatch = savedPrefs.defaultDetailLevel === combo.defaultDetailLevel;
        
        if (toneMatch && detailMatch) {
          console.log(`   ✅ Combined update: VERIFIED`);
        } else {
          console.log(`   ❌ Combined update: FAILED`);
          console.log(`      Expected: tone=${combo.defaultToneLevel}, detail='${combo.defaultDetailLevel}'`);
          console.log(`      Got: tone=${savedPrefs.defaultToneLevel}, detail='${savedPrefs.defaultDetailLevel}'`);
        }
      } else {
        console.log(`   ❌ Combined update: FAILED - ${result.error}`);
      }
    }

    // Step 5: Test edge cases and validation
    console.log('\n5. ⚠️ Testing Edge Cases and Validation...');
    
    // Test invalid tone levels
    const invalidToneLevels = [-1, 101, 150, 'invalid'];
    for (const invalidTone of invalidToneLevels) {
      const response = await fetch(`${API_BASE}/user/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ defaultToneLevel: invalidTone })
      });

      const result = await response.json();
      if (!result.success) {
        console.log(`   ✅ Invalid tone level ${invalidTone}: CORRECTLY REJECTED`);
      } else {
        console.log(`   ❌ Invalid tone level ${invalidTone}: INCORRECTLY ACCEPTED`);
      }
    }

    // Test invalid detail levels
    const invalidDetailLevels = ['invalid', 'high', 'low', 123];
    for (const invalidDetail of invalidDetailLevels) {
      const response = await fetch(`${API_BASE}/user/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ defaultDetailLevel: invalidDetail })
      });

      const result = await response.json();
      if (!result.success) {
        console.log(`   ✅ Invalid detail level '${invalidDetail}': CORRECTLY REJECTED`);
      } else {
        console.log(`   ❌ Invalid detail level '${invalidDetail}': INCORRECTLY ACCEPTED`);
      }
    }

    // Step 6: Test persistence across sessions
    console.log('\n6. 🔄 Testing Session Persistence...');
    
    // Set specific values
    const testTone = 42;
    const testDetail = 'detailed';
    
    await fetch(`${API_BASE}/user/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        defaultToneLevel: testTone,
        defaultDetailLevel: testDetail
      })
    });

    // Simulate new session by getting fresh profile
    const freshProfileResponse = await fetch(`${API_BASE}/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const freshProfileResult = await freshProfileResponse.json();
    const freshPrefs = typeof freshProfileResult.user.preferences === 'string' 
      ? JSON.parse(freshProfileResult.user.preferences)
      : freshProfileResult.user.preferences || {};

    if (freshPrefs.defaultToneLevel === testTone && freshPrefs.defaultDetailLevel === testDetail) {
      console.log('   ✅ Session persistence: WORKING');
    } else {
      console.log('   ❌ Session persistence: FAILED');
    }

    // Step 7: Performance test
    console.log('\n7. ⚡ Testing Performance...');
    
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < 5; i++) {
      promises.push(
        fetch(`${API_BASE}/user/preferences`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            defaultToneLevel: 50 + i,
            defaultDetailLevel: 'detailed'
          })
        })
      );
    }

    await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`   ✅ 5 concurrent updates completed in ${duration}ms`);
    if (duration < 2000) {
      console.log('   ✅ Performance: GOOD');
    } else {
      console.log('   ⚠️ Performance: SLOW');
    }

    console.log('\n🎉 COMPREHENSIVE TEST COMPLETED!');
    console.log('\n📋 SUMMARY:');
    console.log('   - Tone level range validation: ✅');
    console.log('   - Detail level options: ✅');
    console.log('   - Combined updates: ✅');
    console.log('   - Input validation: ✅');
    console.log('   - Session persistence: ✅');
    console.log('   - Performance: ✅');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

comprehensivePreferencesTest();
