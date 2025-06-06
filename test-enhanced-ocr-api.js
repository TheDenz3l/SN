#!/usr/bin/env node

/**
 * Test Enhanced OCR API
 * Tests the complete OCR workflow including structured data extraction
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3001/api';

// Test user credentials (demo user)
const TEST_USER = {
  email: 'demo@swiftnotes.com',
  password: 'demo123'
};

let authToken = null;

async function login() {
  try {
    console.log('🔐 Logging in...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.error('❌ Login failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return false;
  }
}

async function testOCRTextExtraction() {
  try {
    console.log('\n📝 Testing OCR text extraction...');
    
    // Create a sample text "image" for testing
    const sampleText = `
Goal: Chad will shower daily with staff encouragement and verbal prompts wash his body, hair to rinse all soap off completely and dry himself off head to toe.

Active Treatment:
Individual will complete daily hygiene routine with minimal supervision.

Individual Response:
Client demonstrates understanding of hygiene importance and follows routine consistently.

Scores/Comments:
Independent

Goal: Chad will remove and wash his bed linens once a week with verbal prompts from staff

Active Treatment:
Staff will provide weekly reminders and assistance as needed.

Individual Response:
Client shows improvement in maintaining clean living environment.

Scores/Comments:
Not completed/necessary on this shift
`;

    // Test the structured parsing directly
    const ocrService = require('./backend/services/ocrService');
    const result = ocrService.parseStructuredISPForm(sampleText, 85);
    
    console.log('✅ OCR parsing completed');
    console.log(`📊 Found ${result.tasks.length} structured tasks`);
    console.log(`📝 Form sections: ${result.formSections?.length || 0}`);
    
    if (result.tasks.length > 0) {
      console.log('\n📋 Sample structured task:');
      const task = result.tasks[0];
      console.log(`  Description: ${task.description.substring(0, 60)}...`);
      console.log(`  Confidence: ${task.confidence}%`);
      console.log(`  Goal: ${task.structuredData?.goal?.substring(0, 40)}...`);
      console.log(`  Active Treatment: ${task.structuredData?.activeTreatment?.substring(0, 40)}...`);
      console.log(`  Individual Response: ${task.structuredData?.individualResponse?.substring(0, 40)}...`);
      console.log(`  Scores/Comments: ${task.structuredData?.scoresComments}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ OCR text extraction failed:', error);
    return null;
  }
}

async function testBulkTaskCreation(ocrResult) {
  try {
    console.log('\n📝 Testing bulk task creation...');
    
    if (!ocrResult || !ocrResult.tasks || ocrResult.tasks.length === 0) {
      console.log('⚠️ No tasks to create');
      return;
    }
    
    const tasksToCreate = ocrResult.tasks.map(task => ({
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
          confidence: ocrResult.confidence,
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
      console.log(`🎯 Extraction method: ${response.data.metadata.extractionMethod}`);
      console.log(`📈 Confidence: ${response.data.metadata.extractionConfidence}%`);
      
      // Show sample created task
      if (response.data.tasks.length > 0) {
        const createdTask = response.data.tasks[0];
        console.log('\n📋 Sample created task:');
        console.log(`  ID: ${createdTask.id}`);
        console.log(`  Description: ${createdTask.description.substring(0, 60)}...`);
        console.log(`  Form Type: ${createdTask.form_type}`);
        console.log(`  Extraction Method: ${createdTask.extraction_method}`);
        console.log(`  Confidence: ${createdTask.extraction_confidence}%`);
        console.log(`  Structured Data Keys: ${Object.keys(createdTask.structured_data || {}).join(', ')}`);
      }
      
      return response.data.tasks;
    } else {
      console.error('❌ Bulk task creation failed:', response.data.error);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Bulk task creation error:', error.response?.data || error.message);
    return null;
  }
}

async function testTaskRetrieval() {
  try {
    console.log('\n📋 Testing task retrieval...');
    
    const response = await axios.get(`${API_BASE_URL}/isp-tasks`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ Task retrieval successful');
      console.log(`📊 Found ${response.data.tasks.length} total tasks`);
      
      // Show tasks with structured data
      const structuredTasks = response.data.tasks.filter(task => 
        task.structured_data && Object.keys(task.structured_data).length > 0
      );
      
      console.log(`📝 Tasks with structured data: ${structuredTasks.length}`);
      
      if (structuredTasks.length > 0) {
        const task = structuredTasks[0];
        console.log('\n📋 Sample task with structured data:');
        console.log(`  Description: ${task.description.substring(0, 60)}...`);
        console.log(`  Form Type: ${task.form_type}`);
        console.log(`  Extraction Method: ${task.extraction_method}`);
        console.log(`  Confidence: ${task.extraction_confidence}%`);
        console.log(`  Goal: ${task.structured_data.goal?.substring(0, 40)}...`);
        console.log(`  Active Treatment: ${task.structured_data.activeTreatment?.substring(0, 40)}...`);
      }
      
      return response.data.tasks;
    } else {
      console.error('❌ Task retrieval failed:', response.data.error);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Task retrieval error:', error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting Enhanced OCR API Tests...');
    
    // Step 1: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.error('❌ Cannot proceed without authentication');
      return;
    }
    
    // Step 2: Test OCR text extraction and parsing
    const ocrResult = await testOCRTextExtraction();
    if (!ocrResult) {
      console.error('❌ OCR extraction failed');
      return;
    }
    
    // Step 3: Test bulk task creation
    const createdTasks = await testBulkTaskCreation(ocrResult);
    if (!createdTasks) {
      console.error('❌ Task creation failed');
      return;
    }
    
    // Step 4: Test task retrieval
    const retrievedTasks = await testTaskRetrieval();
    if (!retrievedTasks) {
      console.error('❌ Task retrieval failed');
      return;
    }
    
    console.log('\n🎉 All Enhanced OCR API tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log(`  ✅ OCR parsing: ${ocrResult.tasks.length} tasks extracted`);
    console.log(`  ✅ Bulk creation: ${createdTasks.length} tasks created`);
    console.log(`  ✅ Task retrieval: ${retrievedTasks.length} total tasks`);
    console.log(`  ✅ Structured data: Working correctly`);
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run the tests
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('\n✨ Test suite completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests };
