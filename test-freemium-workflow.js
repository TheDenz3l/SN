#!/usr/bin/env node

/**
 * SwiftNotes Freemium Workflow Test
 * Tests the new note generation workflow and pricing system
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';
let authToken = '';
let testUserId = '';

// Helper function to make authenticated requests
const authRequest = async (method, endpoint, data = null) => {
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
};

// Test functions
const login = async () => {
  console.log('🔐 Logging in...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'demo@swiftnotes.app',
      password: 'demo123'
    });
    
    if (response.data.success) {
      authToken = response.data.session.access_token;
      testUserId = response.data.user.id;
      console.log('✅ Login successful');
      console.log(`📊 Initial credits: ${response.data.user.credits}`);
      console.log(`🆓 Free generations used: ${response.data.user.freeGenerationsUsed || 0}`);
      return true;
    } else {
      console.error('❌ Login failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
};

const testFreeGeneration = async () => {
  console.log('\n🆓 Testing free note generation...');
  try {
    const response = await authRequest('POST', '/ai/generate', {
      title: 'Test Free Generation Note',
      sections: [{
        prompt: 'Write a brief summary about testing the freemium model',
        type: 'general'
      }],
      saveNote: false // Don't save automatically
    });
    
    if (response.data.success) {
      console.log('✅ Free generation successful');
      console.log(`📊 Credits used: ${response.data.creditsUsed}`);
      console.log(`🆓 Used free generation: ${response.data.usedFreeGeneration}`);
      console.log(`🆓 Free generations remaining: ${response.data.freeGenerationsRemaining}`);
      console.log(`💾 Note saved: ${response.data.saved}`);
      return response.data;
    } else {
      console.error('❌ Free generation failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Free generation failed:', error.response?.data || error.message);
    return null;
  }
};

const testSaveNote = async (generatedData) => {
  console.log('\n💾 Testing manual note saving...');
  try {
    if (!generatedData || !generatedData.sections) {
      console.error('❌ No generated data to save');
      return false;
    }
    
    const response = await authRequest('POST', '/ai/save-note', {
      title: 'Test Saved Note',
      sections: generatedData.sections.map(section => ({
        isp_task_id: section.isp_task_id,
        user_prompt: section.user_prompt,
        generated_content: section.generated_content,
        tokens_used: section.tokens_used,
        is_edited: section.is_edited
      }))
    });
    
    if (response.data.success) {
      console.log('✅ Note saved successfully');
      console.log(`📝 Note ID: ${response.data.note.id}`);
      return true;
    } else {
      console.error('❌ Note save failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Note save failed:', error.response?.data || error.message);
    return false;
  }
};

const testPreviewEnhanced = async () => {
  console.log('\n👁️ Testing Preview Enhanced (0.5 credits)...');
  try {
    const response = await authRequest('POST', '/ai/preview', {
      prompt: 'Test preview functionality with freemium model',
      detailLevel: 'brief',
      toneLevel: 50
    });
    
    if (response.data.success) {
      console.log('✅ Preview Enhanced successful');
      console.log(`📊 Credits used: ${response.data.creditsUsed}`);
      console.log(`📝 Preview length: ${response.data.preview.enhancedContent.length} characters`);
      return true;
    } else {
      console.error('❌ Preview Enhanced failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Preview Enhanced failed:', error.response?.data || error.message);
    return false;
  }
};

const testCreditGeneration = async () => {
  console.log('\n💳 Testing credit-based generation...');
  try {
    const response = await authRequest('POST', '/ai/generate', {
      title: 'Test Credit Generation Note',
      sections: [{
        prompt: 'Write about the credit-based generation system',
        type: 'general'
      }],
      saveNote: false
    });
    
    if (response.data.success) {
      console.log('✅ Credit generation successful');
      console.log(`📊 Credits used: ${response.data.creditsUsed}`);
      console.log(`🆓 Used free generation: ${response.data.usedFreeGeneration}`);
      console.log(`🆓 Free generations remaining: ${response.data.freeGenerationsRemaining}`);
      return true;
    } else {
      console.error('❌ Credit generation failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Credit generation failed:', error.response?.data || error.message);
    return false;
  }
};

const checkUserProfile = async () => {
  console.log('\n👤 Checking final user profile...');
  try {
    const response = await authRequest('GET', '/user/profile');
    
    if (response.data.success) {
      const profile = response.data.profile;
      console.log('✅ Profile retrieved');
      console.log(`📊 Final credits: ${profile.credits}`);
      console.log(`🆓 Free generations used: ${profile.free_generations_used || 0}`);
      console.log(`📅 Reset date: ${profile.free_generations_reset_date}`);
      return true;
    } else {
      console.error('❌ Profile check failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Profile check failed:', error.response?.data || error.message);
    return false;
  }
};

// Main test runner
const runFreemiumTests = async () => {
  console.log('🚀 Starting SwiftNotes Freemium Workflow Tests...\n');
  
  const tests = [
    { name: 'Login', fn: login },
    { name: 'Free Generation', fn: testFreeGeneration },
    { name: 'Preview Enhanced', fn: testPreviewEnhanced },
    { name: 'Credit Generation', fn: testCreditGeneration },
    { name: 'User Profile Check', fn: checkUserProfile }
  ];
  
  let passed = 0;
  let failed = 0;
  let generatedData = null;
  
  for (const test of tests) {
    console.log(`\n--- Testing: ${test.name} ---`);
    const result = await test.fn(generatedData);
    
    if (test.name === 'Free Generation' && result) {
      generatedData = result;
      // Test saving the generated note
      console.log('\n--- Testing: Save Note ---');
      const saveResult = await testSaveNote(generatedData);
      if (saveResult) {
        passed++;
        console.log('✅ Save Note PASSED');
      } else {
        failed++;
        console.log('❌ Save Note FAILED');
      }
    }
    
    if (result) {
      passed++;
      console.log(`✅ ${test.name} PASSED`);
    } else {
      failed++;
      console.log(`❌ ${test.name} FAILED`);
      
      // Stop on critical failures
      if (test.name === 'Login') {
        console.log('Cannot continue without authentication');
        break;
      }
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All freemium workflow tests PASSED! The implementation is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the implementation.');
  }
};

// Run the tests
runFreemiumTests().catch(console.error);
