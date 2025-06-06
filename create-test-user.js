#!/usr/bin/env node

/**
 * Create Test User for OCR Testing
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Test user data
const TEST_USER = {
  email: 'ocr-test@swiftnotes.com',
  password: 'Test123456!',
  firstName: 'OCR',
  lastName: 'Tester'
};

async function createTestUser() {
  try {
    console.log('👤 Creating test user...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/register`, TEST_USER);
    
    if (response.data.success) {
      console.log('✅ Test user created successfully');
      console.log(`📧 Email: ${TEST_USER.email}`);
      console.log(`🔑 Password: ${TEST_USER.password}`);
      console.log(`🎫 Token: ${response.data.token || response.data.access_token || 'Token not found'}`);
      return response.data;
    } else {
      console.error('❌ User creation failed:', response.data.error);
      return null;
    }
  } catch (error) {
    if (error.response?.data?.error?.includes('already exists')) {
      console.log('👤 Test user already exists, trying to login...');
      return await loginTestUser();
    } else {
      console.error('❌ User creation error:', error.response?.data || error.message);
      return null;
    }
  }
}

async function loginTestUser() {
  try {
    console.log('🔐 Logging in test user...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (response.data.success) {
      console.log('✅ Test user login successful');
      console.log('📋 Full response:', JSON.stringify(response.data, null, 2));
      console.log(`🎫 Token: ${response.data.token || response.data.access_token || 'Token not found'}`);
      return response.data;
    } else {
      console.error('❌ Login failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return null;
  }
}

async function testOCRWithUser(userResult) {
  const authToken = userResult.session?.access_token || userResult.token;
  try {
    console.log('\n📝 Testing OCR functionality with authenticated user...');
    
    // Test the structured parsing
    const ocrService = require('./backend/services/ocrService');
    
    const sampleText = `
Goal: Chad will shower daily with staff encouragement and verbal prompts wash his body, hair to rinse all soap off completely and dry himself off head to toe.

Active Treatment:
Individual will complete daily hygiene routine with minimal supervision.

Individual Response:
Client demonstrates understanding of hygiene importance and follows routine consistently.

Scores/Comments:
Independent
`;

    const result = ocrService.parseStructuredISPForm(sampleText, 85);
    
    console.log('✅ OCR parsing completed');
    console.log(`📊 Found ${result.tasks.length} structured tasks`);
    
    if (result.tasks.length > 0) {
      // Test bulk task creation
      const tasksToCreate = result.tasks.map(task => ({
        description: task.description,
        structuredData: task.structuredData,
        formType: 'isp_form',
        extractionMethod: 'ocr',
        confidence: task.confidence
      }));
      
      const response = await axios.post(
        `${API_BASE_URL}/isp-tasks/bulk-create`,
        {
          tasks: tasksToCreate,
          extractionMetadata: {
            extractionMethod: 'ocr',
            confidence: result.confidence,
            formType: 'isp_form'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        console.log('✅ Bulk task creation successful');
        console.log(`📊 Created ${response.data.tasks.length} tasks`);
        
        // Show sample created task
        if (response.data.tasks.length > 0) {
          const createdTask = response.data.tasks[0];
          console.log('\n📋 Sample created task:');
          console.log(`  Description: ${createdTask.description.substring(0, 60)}...`);
          console.log(`  Form Type: ${createdTask.form_type}`);
          console.log(`  Extraction Method: ${createdTask.extraction_method}`);
          console.log(`  Confidence: ${createdTask.extraction_confidence}%`);
          console.log(`  Structured Data: ${JSON.stringify(createdTask.structured_data, null, 2)}`);
        }
        
        return true;
      } else {
        console.error('❌ Bulk task creation failed:', response.data.error);
        return false;
      }
    }
    
  } catch (error) {
    console.error('❌ OCR test failed:', error.response?.data || error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Setting up OCR test environment...');
    
    // Create or login test user
    const userResult = await createTestUser();
    if (!userResult) {
      console.error('❌ Failed to create/login test user');
      return;
    }
    
    // Test OCR functionality
    const ocrSuccess = await testOCRWithUser(userResult);
    if (!ocrSuccess) {
      console.error('❌ OCR test failed');
      return;
    }
    
    console.log('\n🎉 OCR test environment setup complete!');
    console.log('\n📋 Test Results:');
    console.log('  ✅ User authentication: Working');
    console.log('  ✅ Structured OCR parsing: Working');
    console.log('  ✅ Bulk task creation: Working');
    console.log('  ✅ Database integration: Working');
    console.log('\n🔧 You can now test the frontend with:');
    console.log(`  📧 Email: ${TEST_USER.email}`);
    console.log(`  🔑 Password: ${TEST_USER.password}`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✨ Setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createTestUser, loginTestUser, testOCRWithUser };
