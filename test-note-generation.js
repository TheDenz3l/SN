/**
 * Test Note Generation Feature
 * This script tests the complete note generation flow
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

// Test credentials - using a user with completed setup
const TEST_EMAIL = 'phase1test@swiftnotes.app'; // Phase1 Tester - has completed setup
const TEST_PASSWORD = 'Test123!'; // From test-phase1.js

async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testNoteGeneration() {
  console.log('🚀 Testing Note Generation Feature\n');

  // Step 1: Login
  console.log('1. 🔐 Logging in...');
  const loginResult = await apiRequest('/auth/login', 'POST', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });

  if (!loginResult.success) {
    console.log('❌ Login failed:', loginResult.data?.error || loginResult.error);
    return;
  }

  const token = loginResult.data.session?.access_token || loginResult.data.token;
  console.log('✅ Login successful');
  console.log('   Token:', token ? 'Present' : 'Missing');

  // Step 2: Get user profile
  console.log('\n2. 👤 Getting user profile...');
  const profileResult = await apiRequest('/user/profile', 'GET', null, token);
  
  if (!profileResult.success) {
    console.log('❌ Profile fetch failed:', profileResult.data?.error || profileResult.error);
    return;
  }

  const user = profileResult.data.user;
  console.log('✅ Profile retrieved');
  console.log(`   - Setup Complete: ${user.hasCompletedSetup}`);
  console.log(`   - Writing Style: ${user.writingStyle ? 'Set' : 'Not set'}`);
  console.log(`   - Credits: ${user.credits}`);

  // Step 3: Get ISP tasks
  console.log('\n3. 📋 Getting ISP tasks...');
  const tasksResult = await apiRequest('/isp-tasks', 'GET', null, token);
  
  if (!tasksResult.success) {
    console.log('❌ ISP tasks fetch failed:', tasksResult.data?.error || tasksResult.error);
    return;
  }

  const tasks = tasksResult.data.tasks || [];
  console.log(`✅ Found ${tasks.length} ISP tasks`);
  tasks.forEach((task, i) => {
    console.log(`   ${i + 1}. ${task.description} (ID: ${task.id})`);
  });

  // Step 4: Generate note
  console.log('\n4. 🤖 Generating note...');
  
  const noteRequest = {
    title: 'Test Progress Note - ' + new Date().toISOString(),
    sections: [
      {
        taskId: tasks[0]?.id,
        prompt: 'Client showed significant improvement in verbal communication during today\'s session. They were able to express their needs clearly and maintained eye contact throughout our conversation.',
        type: 'task'
      },
      {
        prompt: 'Overall, the session was very productive. The client was engaged and cooperative throughout the entire 45-minute session.',
        type: 'comment'
      }
    ]
  };

  console.log('📤 Request:', JSON.stringify(noteRequest, null, 2));

  const generateResult = await apiRequest('/ai/generate', 'POST', noteRequest, token);
  
  if (!generateResult.success) {
    console.log('❌ Note generation failed:', generateResult.data?.error || generateResult.error);
    console.log('   Status:', generateResult.status);
    console.log('   Full response:', JSON.stringify(generateResult.data, null, 2));
    return;
  }

  console.log('✅ Note generation successful!');
  console.log('📥 Response:', JSON.stringify(generateResult.data, null, 2));
  console.log('📥 Full Result:', JSON.stringify(generateResult, null, 2));

  const noteData = generateResult.data;
  console.log(`\n📝 Generated Note Details:`);
  console.log(`   - Note ID: ${noteData.note?.id}`);
  console.log(`   - Title: ${noteData.note?.title}`);
  console.log(`   - Sections: ${noteData.sections?.length || 0}`);
  console.log(`   - Credits Used: ${noteData.creditsUsed}`);
  console.log(`   - Total Tokens: ${noteData.totalTokens}`);

  if (noteData.sections && noteData.sections.length > 0) {
    console.log('\n📄 Generated Content:');
    noteData.sections.forEach((section, i) => {
      console.log(`\n   Section ${i + 1}:`);
      console.log(`   - Prompt: "${section.user_prompt}"`);
      console.log(`   - Generated: "${section.generated_content}"`);
      console.log(`   - Tokens: ${section.tokens_used || 0}`);
    });
  }

  console.log('\n🎉 Test completed successfully!');
}

// Run the test
testNoteGeneration().catch(error => {
  console.error('💥 Test failed with error:', error);
});
