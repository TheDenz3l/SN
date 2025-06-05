const fetch = require('node-fetch');

async function testPreferences() {
  try {
    // Login first
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'phase1test@swiftnotes.app',
        password: 'Test123!'
      })
    });

    const loginResult = await loginResponse.json();
    const token = loginResult.session.access_token;

    console.log('✅ Login successful');

    // Test preferences update
    const preferencesResponse = await fetch('http://localhost:3001/api/user/preferences', {
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

    console.log('Preferences Status:', preferencesResponse.status);
    const result = await preferencesResponse.json();
    console.log('Preferences Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPreferences();
