/**
 * Test Script for Writing Analytics Endpoints
 * Tests all the analytics endpoints to ensure they're working correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test user credentials (you'll need to replace these with actual test user credentials)
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

let authToken = '';
let testNoteId = '';
let testSectionId = '';

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    
    if (response.data.success) {
      authToken = response.data.session.access_token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function createTestNote() {
  try {
    console.log('📝 Creating test note...');
    const response = await axios.post(`${BASE_URL}/notes`, {
      title: 'Test Analytics Note',
      content: { test: true },
      noteType: 'general'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      testNoteId = response.data.note.id;
      console.log('✅ Test note created:', testNoteId);
      return true;
    } else {
      console.log('❌ Note creation failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Note creation error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testLogAnalytics() {
  try {
    console.log('📊 Testing analytics logging...');
    const response = await axios.post(`${BASE_URL}/writing-analytics/log`, {
      noteId: testNoteId,
      originalGenerated: 'This is a test generated content that demonstrates the AI writing capabilities.',
      userEditedVersion: 'This is a test generated content that demonstrates the AI writing capabilities with some user edits.',
      editType: 'minor',
      confidenceScore: 0.85,
      userSatisfactionScore: 4,
      feedbackNotes: 'Good quality content, minor adjustments needed.',
      tokensUsed: 50,
      generationTimeMs: 1500,
      styleMatchScore: 0.78
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Analytics logged successfully:', response.data.analyticsId);
      return true;
    } else {
      console.log('❌ Analytics logging failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Analytics logging error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testGetAnalyticsSummary() {
  try {
    console.log('📈 Testing analytics summary...');
    const response = await axios.get(`${BASE_URL}/writing-analytics/summary`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Analytics summary retrieved:', {
        totalNotes: response.data.summary.total_notes,
        avgConfidence: response.data.summary.avg_confidence,
        avgSatisfaction: response.data.summary.avg_satisfaction,
        trend: response.data.summary.improvement_trend
      });
      return true;
    } else {
      console.log('❌ Analytics summary failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Analytics summary error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testGetAnalyticsHistory() {
  try {
    console.log('📚 Testing analytics history...');
    const response = await axios.get(`${BASE_URL}/writing-analytics/history?limit=10`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Analytics history retrieved:', {
        count: response.data.analytics.length,
        pagination: response.data.pagination
      });
      return true;
    } else {
      console.log('❌ Analytics history failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Analytics history error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testStyleEvolution() {
  try {
    console.log('🔄 Testing style evolution...');
    const response = await axios.get(`${BASE_URL}/writing-analytics/style-evolution`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Style evolution retrieved:', {
        count: response.data.evolution.length
      });
      return true;
    } else {
      console.log('❌ Style evolution failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Style evolution error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testAnalyzeStyle() {
  try {
    console.log('🔍 Testing style analysis...');
    const response = await axios.post(`${BASE_URL}/writing-analytics/analyze-style`, {
      writingStyle: 'This is a professional healthcare documentation style with clear, concise language and appropriate medical terminology. The writing is structured, informative, and maintains a formal tone while being accessible to healthcare professionals.'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Style analysis completed:', {
        qualityScore: response.data.analysis.qualityScore,
        suggestions: response.data.analysis.suggestions.length,
        strengths: response.data.analysis.strengths.length
      });
      return true;
    } else {
      console.log('❌ Style analysis failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Style analysis error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testUpdateConfidence() {
  try {
    console.log('🎯 Testing confidence update...');
    const response = await axios.put(`${BASE_URL}/writing-analytics/update-confidence`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Confidence updated successfully');
      return true;
    } else {
      console.log('❌ Confidence update failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Confidence update error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Writing Analytics Endpoint Tests\n');
  
  const tests = [
    { name: 'Login', fn: login },
    { name: 'Create Test Note', fn: createTestNote },
    { name: 'Log Analytics', fn: testLogAnalytics },
    { name: 'Get Analytics Summary', fn: testGetAnalyticsSummary },
    { name: 'Get Analytics History', fn: testGetAnalyticsHistory },
    { name: 'Get Style Evolution', fn: testStyleEvolution },
    { name: 'Analyze Style', fn: testAnalyzeStyle },
    { name: 'Update Confidence', fn: testUpdateConfidence }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n--- Testing: ${test.name} ---`);
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n🏁 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Writing Analytics system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

// Run the tests
runAllTests().catch(console.error);
