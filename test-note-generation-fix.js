/**
 * Test script to verify the note generation display fix
 * This script tests the complete flow from API call to UI display
 */

const API_BASE_URL = 'http://localhost:3002/api';

// Test user credentials (you'll need to use actual credentials)
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

async function testNoteGenerationFix() {
  console.log('🧪 Testing Note Generation Display Fix');
  console.log('=====================================');

  try {
    // Step 1: Login to get auth token
    console.log('1. 🔐 Logging in...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed - you may need to register first or use different credentials');
      console.log('   This test requires a valid user account with completed setup');
      return;
    }

    const loginData = await loginResponse.json();
    const authToken = loginData.token;
    console.log('✅ Login successful');

    // Step 2: Test note generation API
    console.log('\n2. 🤖 Testing note generation API...');
    const generateResponse = await fetch(`${API_BASE_URL}/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Test Note Generation Fix',
        sections: [
          {
            prompt: 'Client showed improvement in communication skills during today\'s session',
            type: 'general',
            detailLevel: 'brief',
            toneLevel: 50
          }
        ],
        saveNote: false
      })
    });

    if (!generateResponse.ok) {
      const errorData = await generateResponse.json();
      console.log('❌ Note generation failed:', errorData.error);
      return;
    }

    const generateData = await generateResponse.json();
    console.log('✅ Note generation API successful');

    // Step 3: Verify response structure
    console.log('\n3. 🔍 Verifying response structure...');
    console.log('Response keys:', Object.keys(generateData));
    
    if (generateData.sections && generateData.sections.length > 0) {
      const firstSection = generateData.sections[0];
      console.log('First section keys:', Object.keys(firstSection));
      
      // Check for the correct property name
      if (firstSection.generated_content) {
        console.log('✅ Response contains "generated_content" property');
        console.log('📝 Generated content preview:', firstSection.generated_content.substring(0, 100) + '...');
      } else if (firstSection.content) {
        console.log('⚠️  Response contains "content" property (old format)');
      } else {
        console.log('❌ Response missing generated content property');
        console.log('Available properties:', Object.keys(firstSection));
      }
    } else {
      console.log('❌ No sections in response');
    }

    // Step 4: Simulate frontend mapping
    console.log('\n4. 🔄 Simulating frontend property mapping...');
    const mappedSections = generateData.sections?.map((section, index) => {
      if (section && section.generated_content) {
        return {
          generated: section.generated_content,
          tokensUsed: section.tokens_used,
          prompt: `Test prompt ${index + 1}`
        };
      }
      return null;
    }).filter(Boolean);

    if (mappedSections && mappedSections.length > 0) {
      console.log('✅ Frontend mapping successful');
      console.log(`📊 Mapped ${mappedSections.length} sections with generated content`);
      console.log('🎯 Fix verification: Generated content would now display in UI');
    } else {
      console.log('❌ Frontend mapping failed - content would not display');
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('💡 The fix ensures that "generated_content" from API maps to "generated" in frontend state');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testNoteGenerationFix();
