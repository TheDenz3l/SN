/**
 * Test Bulk Delete Fix
 * Verifies that the bulk delete functionality works correctly with proper validation
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';
let authToken = '';
let testNoteIds = [];

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
      console.log('✅ Login successful');
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

const createTestNotes = async () => {
  console.log('\n📝 Creating test notes...');
  try {
    const notePromises = [];
    
    for (let i = 1; i <= 3; i++) {
      const noteData = {
        title: `Test Note ${i} for Bulk Delete`,
        content: { sections: [] },
        noteType: 'general'
      };
      
      notePromises.push(authRequest('POST', '/notes', noteData));
    }
    
    const responses = await Promise.all(notePromises);
    testNoteIds = responses.map(response => response.data.note.id);
    
    console.log(`✅ Created ${testNoteIds.length} test notes:`, testNoteIds);
    return true;
  } catch (error) {
    console.error('❌ Failed to create test notes:', error.response?.data || error.message);
    return false;
  }
};

const testBulkDeleteValidation = async () => {
  console.log('\n🔍 Testing bulk delete validation...');
  
  // Test 1: Empty array
  try {
    await authRequest('DELETE', '/notes/bulk', { noteIds: [] });
    console.log('❌ Should have failed with empty array');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Correctly rejected empty array');
    } else {
      console.log('❌ Unexpected error for empty array:', error.response?.data);
      return false;
    }
  }
  
  // Test 2: Invalid UUID format
  try {
    await authRequest('DELETE', '/notes/bulk', { noteIds: ['invalid-uuid', 'another-invalid'] });
    console.log('❌ Should have failed with invalid UUIDs');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.includes('Validation failed')) {
      console.log('✅ Correctly rejected invalid UUIDs');
    } else {
      console.log('❌ Unexpected error for invalid UUIDs:', error.response?.data);
      return false;
    }
  }
  
  // Test 3: Non-existent but valid UUID
  try {
    const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';
    await authRequest('DELETE', '/notes/bulk', { noteIds: [fakeUuid] });
    console.log('❌ Should have failed with non-existent note');
    return false;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Correctly rejected non-existent note');
    } else {
      console.log('❌ Unexpected error for non-existent note:', error.response?.data);
      return false;
    }
  }
  
  return true;
};

const testSuccessfulBulkDelete = async () => {
  console.log('\n🗑️ Testing successful bulk delete...');
  try {
    const response = await authRequest('DELETE', '/notes/bulk', { 
      noteIds: testNoteIds.slice(0, 2) // Delete first 2 notes
    });
    
    if (response.data.success && response.data.deletedCount === 2) {
      console.log('✅ Successfully deleted 2 notes');
      
      // Verify notes are actually deleted
      try {
        await authRequest('GET', `/notes/${testNoteIds[0]}`);
        console.log('❌ Note should have been deleted');
        return false;
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('✅ Confirmed notes were deleted');
          return true;
        }
      }
    } else {
      console.log('❌ Bulk delete response was not successful:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Bulk delete failed:', error.response?.data || error.message);
    return false;
  }
};

const cleanup = async () => {
  console.log('\n🧹 Cleaning up remaining test notes...');
  try {
    // Delete any remaining test notes
    const remainingNotes = testNoteIds.slice(2);
    if (remainingNotes.length > 0) {
      await authRequest('DELETE', '/notes/bulk', { noteIds: remainingNotes });
      console.log('✅ Cleanup completed');
    }
  } catch (error) {
    console.log('⚠️ Cleanup failed (this is okay):', error.response?.data || error.message);
  }
};

// Main test runner
const runBulkDeleteTests = async () => {
  console.log('🚀 Starting Bulk Delete Fix Tests...\n');
  
  const tests = [
    { name: 'Login', fn: login },
    { name: 'Create Test Notes', fn: createTestNotes },
    { name: 'Bulk Delete Validation', fn: testBulkDeleteValidation },
    { name: 'Successful Bulk Delete', fn: testSuccessfulBulkDelete },
    { name: 'Cleanup', fn: cleanup }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n--- Testing: ${test.name} ---`);
    const result = await test.fn();
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
    console.log('\n🎉 All bulk delete tests PASSED! The fix is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the implementation.');
  }
};

// Run the tests
runBulkDeleteTests().catch(console.error);
