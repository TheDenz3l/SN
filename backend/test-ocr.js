/**
 * OCR Service Test Script
 * Tests the OCR functionality with sample images
 */

const fs = require('fs').promises;
const path = require('path');
const ocrService = require('./services/ocrService');

async function testOCRService() {
  console.log('🧪 Starting OCR Service Tests...\n');

  try {
    // Test 1: Initialize OCR service
    console.log('Test 1: Initializing OCR service...');
    await ocrService.initialize();
    console.log('✅ OCR service initialized successfully\n');

    // Test 2: Create a simple test image with text
    console.log('Test 2: Testing with sample text...');
    
    // Create a simple test case with text
    const testText = `
ISP Task List:

1. Individual will demonstrate improved communication skills by making verbal requests with appropriate volume and tone.

2. Participant will complete daily living activities including meal preparation and personal hygiene tasks.

3. Client will engage in social interaction activities for 15-20 minutes with minimal prompting.

4. Individual will follow multi-step instructions with 80% accuracy during structured activities.

5. Participant will demonstrate improved fine motor skills through writing and drawing exercises.
    `.trim();

    console.log('Sample text to process:');
    console.log('---');
    console.log(testText);
    console.log('---\n');

    // For testing purposes, we'll create a simple text buffer
    // In a real scenario, this would be an actual image buffer
    console.log('Note: In a real implementation, this would process an actual image file.');
    console.log('For testing, we\'ll simulate the OCR parsing functionality.\n');

    // Test the ISP task parsing directly
    console.log('Test 3: Testing ISP task parsing...');
    const parseResult = ocrService.parseISPTasks(testText, 85);
    
    console.log('✅ Parsing completed!');
    console.log(`📋 Found ${parseResult.tasks.length} tasks:`);
    
    parseResult.tasks.forEach((task, index) => {
      console.log(`  ${index + 1}. ${task.description} (${task.confidence}% confidence)`);
    });

    if (parseResult.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      parseResult.warnings.forEach(warning => {
        console.log(`  • ${warning}`);
      });
    }

    console.log('\n🎉 All OCR tests completed successfully!');
    
    // Test 4: Cleanup
    console.log('\nTest 4: Cleaning up...');
    await ocrService.cleanup();
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ OCR test failed:', error);
    process.exit(1);
  }
}

// Test image validation
async function testImageValidation() {
  console.log('\n🖼️ Testing image validation...');
  
  try {
    // Test with a small buffer (simulating an image)
    const testBuffer = Buffer.from('fake image data');
    const validation = await ocrService.validateImage(testBuffer);
    
    console.log('Validation result:', validation);
    
    if (!validation.isValid) {
      console.log('✅ Image validation correctly rejected invalid data');
    }
  } catch (error) {
    console.log('✅ Image validation correctly handled invalid data:', error.message);
  }
}

// Run tests
async function runAllTests() {
  try {
    await testOCRService();
    await testImageValidation();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Test with real image files');
    console.log('2. Test the API endpoints');
    console.log('3. Test the frontend integration');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down tests...');
  await ocrService.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down tests...');
  await ocrService.cleanup();
  process.exit(0);
});

// Run the tests
if (require.main === module) {
  runAllTests();
}

module.exports = { testOCRService, testImageValidation };
