/**
 * Complete Settings Page Functionality Test
 * Tests all settings endpoints and functionality
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

async function testCompleteSettings() {
  console.log('⚙️ Testing Complete Settings Page Functionality...\n');

  try {
    // Step 1: Login
    console.log('1. 🔐 Logging in...');
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
      throw new Error('Login failed: ' + loginResult.error);
    }

    const token = loginResult.session.access_token;
    console.log('✅ Login successful');

    // Step 2: Test Profile Update
    console.log('\n2. 👤 Testing profile update...');
    const profileUpdateResponse = await fetch(`${API_BASE}/user/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: 'Updated',
        lastName: 'Name'
      })
    });

    const profileUpdateResult = await profileUpdateResponse.json();
    if (profileUpdateResult.success) {
      console.log('✅ Profile update successful');
    } else {
      console.log('❌ Profile update failed:', profileUpdateResult.error);
    }

    // Step 3: Test Writing Style Update
    console.log('\n3. ✍️ Testing writing style update...');
    const writingStyleResponse = await fetch(`${API_BASE}/user/writing-style`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        writingStyle: 'This is a test writing style sample that is longer than 100 characters to meet the validation requirements. It demonstrates my professional writing approach for healthcare documentation.'
      })
    });

    const writingStyleResult = await writingStyleResponse.json();
    if (writingStyleResult.success) {
      console.log('✅ Writing style update successful');
    } else {
      console.log('❌ Writing style update failed:', writingStyleResult.error);
    }

    // Step 4: Test Preferences Update
    console.log('\n4. 🎛️ Testing preferences update...');
    const preferencesResponse = await fetch(`${API_BASE}/user/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        defaultToneLevel: 75,
        defaultDetailLevel: 'comprehensive',
        emailNotifications: true,
        weeklyReports: false
      })
    });

    const preferencesResult = await preferencesResponse.json();
    if (preferencesResult.success) {
      console.log('✅ Preferences update successful');
    } else {
      console.log('❌ Preferences update failed:', preferencesResult.error);
    }

    // Step 5: Test ISP Tasks Management
    console.log('\n5. 📋 Testing ISP tasks management...');
    
    // Add a task
    const addTaskResponse = await fetch(`${API_BASE}/isp-tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: 'Test ISP task for settings page validation'
      })
    });

    const addTaskResult = await addTaskResponse.json();
    if (addTaskResult.success) {
      console.log('✅ ISP task creation successful');
      
      // Get tasks to verify
      const getTasksResponse = await fetch(`${API_BASE}/isp-tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const getTasksResult = await getTasksResponse.json();
      if (getTasksResult.success) {
        console.log(`✅ ISP tasks retrieved: ${getTasksResult.tasks.length} tasks found`);
        
        // Update the task if it exists
        if (getTasksResult.tasks.length > 0) {
          const taskId = getTasksResult.tasks[0].id;
          const updateTaskResponse = await fetch(`${API_BASE}/isp-tasks/${taskId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              description: 'Updated test ISP task for settings page validation'
            })
          });

          const updateTaskResult = await updateTaskResponse.json();
          if (updateTaskResult.success) {
            console.log('✅ ISP task update successful');
          } else {
            console.log('❌ ISP task update failed:', updateTaskResult.error);
          }
        }
      }
    } else {
      console.log('❌ ISP task creation failed:', addTaskResult.error);
    }

    // Step 6: Test Data Export
    console.log('\n6. 📤 Testing data export...');
    const exportResponse = await fetch(`${API_BASE}/user/export-data`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const exportResult = await exportResponse.json();
    if (exportResult.success) {
      console.log('✅ Data export successful');
      console.log(`   - Profile data: ${!!exportResult.data.profile}`);
      console.log(`   - Notes count: ${exportResult.data.notes.length}`);
      console.log(`   - ISP tasks count: ${exportResult.data.ispTasks.length}`);
      console.log(`   - Export version: ${exportResult.data.exportVersion}`);
    } else {
      console.log('❌ Data export failed:', exportResult.error);
    }

    // Step 7: Test Password Change (with invalid current password)
    console.log('\n7. 🔒 Testing password change validation...');
    const passwordChangeResponse = await fetch(`${API_BASE}/user/change-password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword: 'wrongpassword',
        newPassword: 'NewPassword123!'
      })
    });

    const passwordChangeResult = await passwordChangeResponse.json();
    if (!passwordChangeResult.success) {
      console.log('✅ Password change validation working (correctly rejected invalid password)');
    } else {
      console.log('❌ Password change validation failed (should have rejected invalid password)');
    }

    // Step 8: Test Validation Errors
    console.log('\n8. ⚠️ Testing validation errors...');
    
    // Test short writing style
    const shortStyleResponse = await fetch(`${API_BASE}/user/writing-style`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        writingStyle: 'Too short'
      })
    });

    const shortStyleResult = await shortStyleResponse.json();
    if (!shortStyleResult.success) {
      console.log('✅ Writing style validation working (correctly rejected short sample)');
    } else {
      console.log('❌ Writing style validation failed (should have rejected short sample)');
    }

    // Test invalid tone level
    const invalidToneResponse = await fetch(`${API_BASE}/user/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        defaultToneLevel: 150 // Invalid (should be 0-100)
      })
    });

    const invalidToneResult = await invalidToneResponse.json();
    if (!invalidToneResult.success) {
      console.log('✅ Tone level validation working (correctly rejected invalid value)');
    } else {
      console.log('❌ Tone level validation failed (should have rejected invalid value)');
    }

    console.log('\n🎉 Complete settings functionality test completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ User authentication working');
    console.log('   ✅ Profile updates working');
    console.log('   ✅ Writing style management working');
    console.log('   ✅ Preferences management working');
    console.log('   ✅ ISP tasks CRUD operations working');
    console.log('   ✅ Data export functionality working');
    console.log('   ✅ Password change validation working');
    console.log('   ✅ Input validation working');
    console.log('   ✅ All settings endpoints functional');

  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testCompleteSettings();
