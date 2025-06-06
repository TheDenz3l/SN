/**
 * Settings Persistence Test
 * Tests the specific issue where settings show default values after login until page refresh
 */

async function testSettingsPersistence() {
  console.log('🧪 Testing Settings Persistence Issue');
  console.log('=====================================\n');

  const testUser = {
    email: 'demo@swiftnotes.app',
    password: 'demo123'
  };

  try {
    // Step 1: Login and get initial state
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const loginResult = await loginResponse.json();
    const token = loginResult.session.access_token;
    console.log('✅ Login successful');

    // Step 2: Set specific test preferences
    console.log('\n2️⃣ Setting test preferences...');
    const testPreferences = {
      defaultToneLevel: 85, // Unique value to test
      defaultDetailLevel: 'detailed',
      useTimePatterns: false,
      emailNotifications: true,
      weeklyReports: false
    };

    const prefsResponse = await fetch('http://localhost:3001/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPreferences)
    });

    if (!prefsResponse.ok) {
      throw new Error('Failed to update preferences');
    }

    console.log('✅ Test preferences saved:', testPreferences);

    // Step 3: Simulate logout by clearing tokens (but not preferences)
    console.log('\n3️⃣ Simulating logout...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for save to complete

    // Step 4: Login again (simulating the user experience)
    console.log('\n4️⃣ Logging in again (simulating user experience)...');
    const secondLoginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (!secondLoginResponse.ok) {
      throw new Error('Second login failed');
    }

    const secondLoginResult = await secondLoginResponse.json();
    const secondToken = secondLoginResult.session.access_token;
    console.log('✅ Second login successful');

    // Step 5: IMMEDIATELY fetch profile (this is what the frontend does)
    console.log('\n5️⃣ Immediately fetching profile after login...');
    const immediateProfileResponse = await fetch('http://localhost:3001/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${secondToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!immediateProfileResponse.ok) {
      throw new Error('Failed to fetch profile immediately after login');
    }

    const immediateProfileData = await immediateProfileResponse.json();
    const immediatePrefs = immediateProfileData.user.preferences;

    console.log('📊 Immediate profile preferences:', immediatePrefs);

    // Step 6: Verify preferences match what we saved
    console.log('\n6️⃣ Verifying preferences persistence...');
    
    const prefsMatch = 
      immediatePrefs.defaultToneLevel === testPreferences.defaultToneLevel &&
      immediatePrefs.defaultDetailLevel === testPreferences.defaultDetailLevel &&
      immediatePrefs.useTimePatterns === testPreferences.useTimePatterns &&
      immediatePrefs.emailNotifications === testPreferences.emailNotifications &&
      immediatePrefs.weeklyReports === testPreferences.weeklyReports;

    if (prefsMatch) {
      console.log('✅ SUCCESS: All preferences persisted correctly after login!');
      console.log('✅ The settings persistence issue has been FIXED!');
    } else {
      console.log('❌ FAILURE: Preferences do not match');
      console.log('Expected:', testPreferences);
      console.log('Actual:', immediatePrefs);
      
      // Check individual fields
      console.log('\nField-by-field comparison:');
      console.log(`defaultToneLevel: Expected ${testPreferences.defaultToneLevel}, Got ${immediatePrefs.defaultToneLevel} ${immediatePrefs.defaultToneLevel === testPreferences.defaultToneLevel ? '✅' : '❌'}`);
      console.log(`defaultDetailLevel: Expected ${testPreferences.defaultDetailLevel}, Got ${immediatePrefs.defaultDetailLevel} ${immediatePrefs.defaultDetailLevel === testPreferences.defaultDetailLevel ? '✅' : '❌'}`);
      console.log(`useTimePatterns: Expected ${testPreferences.useTimePatterns}, Got ${immediatePrefs.useTimePatterns} ${immediatePrefs.useTimePatterns === testPreferences.useTimePatterns ? '✅' : '❌'}`);
      console.log(`emailNotifications: Expected ${testPreferences.emailNotifications}, Got ${immediatePrefs.emailNotifications} ${immediatePrefs.emailNotifications === testPreferences.emailNotifications ? '✅' : '❌'}`);
      console.log(`weeklyReports: Expected ${testPreferences.weeklyReports}, Got ${immediatePrefs.weeklyReports} ${immediatePrefs.weeklyReports === testPreferences.weeklyReports ? '✅' : '❌'}`);
    }

    // Step 7: Test multiple rapid logins (edge case)
    console.log('\n7️⃣ Testing multiple rapid logins...');
    for (let i = 1; i <= 3; i++) {
      const rapidLoginResponse = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
      });

      if (rapidLoginResponse.ok) {
        const rapidLoginResult = await rapidLoginResponse.json();
        const rapidToken = rapidLoginResult.session.access_token;
        
        const rapidProfileResponse = await fetch('http://localhost:3001/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${rapidToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (rapidProfileResponse.ok) {
          const rapidProfileData = await rapidProfileResponse.json();
          const rapidPrefs = rapidProfileData.user.preferences;
          
          const rapidMatch = rapidPrefs.defaultToneLevel === testPreferences.defaultToneLevel;
          console.log(`Rapid login ${i}: ${rapidMatch ? '✅' : '❌'} (tone level: ${rapidPrefs.defaultToneLevel})`);
        }
      }
      
      // Small delay between rapid logins
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n🎉 Settings Persistence Test Complete!');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Make sure backend server is running on port 3001');
    console.log('2. Make sure demo user exists with email: demo@swiftnotes.app');
    console.log('3. Check backend logs for any errors');
  }
}

// Run the test
if (require.main === module) {
  testSettingsPersistence();
}

module.exports = { testSettingsPersistence };
