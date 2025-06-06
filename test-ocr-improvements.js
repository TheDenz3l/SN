#!/usr/bin/env node

/**
 * Test OCR Improvements
 * Tests the new structured OCR parsing functionality
 */

const path = require('path');
const fs = require('fs');

// Import the OCR service
const ocrService = require('./backend/services/ocrService');

async function testOCRImprovements() {
  try {
    console.log('🚀 Testing OCR Improvements...');
    
    // Test 1: Test structured form parsing
    console.log('\n📋 Test 1: Structured Form Parsing');
    
    const sampleFormText = `
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

Goal: Chad will clean his bathroom twice a week by wiping down his sink, toilet and shower, then sweeping and mopping the floor, wiping down the mirror and window ledges with verbal prompts from staff to stay on task and physical assistance if needed.

Active Treatment:
Structured cleaning schedule with step-by-step guidance.

Individual Response:
Client follows cleaning checklist with minimal prompting.

Scores/Comments:
Progressing well with bathroom maintenance tasks.
`;

    const parseResult = ocrService.parseStructuredISPForm(sampleFormText, 85);
    
    console.log('✅ Parsing completed');
    console.log(`📊 Found ${parseResult.tasks.length} structured tasks`);
    console.log(`📝 Form sections identified: ${parseResult.formSections?.length || 0}`);
    
    if (parseResult.tasks.length > 0) {
      console.log('\n📋 Sample structured task:');
      console.log(JSON.stringify(parseResult.tasks[0], null, 2));
    }
    
    if (parseResult.formSections && parseResult.formSections.length > 0) {
      console.log('\n📋 Sample form section:');
      console.log(JSON.stringify(parseResult.formSections[0], null, 2));
    }
    
    // Test 2: Test form section identification
    console.log('\n🔍 Test 2: Form Section Identification');
    
    const sections = ocrService.identifyFormSections(sampleFormText);
    console.log(`✅ Identified ${sections.length} form sections`);
    
    sections.forEach((section, index) => {
      console.log(`  ${index + 1}. ${section.type}: ${section.content.substring(0, 50)}...`);
    });
    
    // Test 3: Test task description detection
    console.log('\n🎯 Test 3: Task Description Detection');
    
    const testLines = [
      'Chad will shower daily with staff encouragement',
      'Individual will complete hygiene routine',
      'Client demonstrates understanding',
      'Random text that is not a task',
      'The client will maintain personal hygiene',
      'Staff will provide assistance'
    ];
    
    testLines.forEach(line => {
      const isTask = ocrService.looksLikeTaskDescription(line);
      console.log(`  "${line}" -> ${isTask ? '✅ Task' : '❌ Not a task'}`);
    });
    
    // Test 4: Test task finalization
    console.log('\n🏁 Test 4: Task Finalization');
    
    const sampleTaskData = {
      goal: 'Chad will shower daily with staff encouragement',
      activeTreatment: 'Individual will complete daily hygiene routine',
      individualResponse: 'Client demonstrates understanding',
      scoresComments: 'Independent',
      type: 'goal'
    };
    
    const finalizedTask = ocrService.finalizeTask(sampleTaskData, 85);
    console.log('✅ Task finalized:');
    console.log(JSON.stringify(finalizedTask, null, 2));
    
    console.log('\n🎉 All OCR improvement tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Test with a sample image (if available)
async function testWithSampleImage() {
  try {
    console.log('\n📸 Testing with sample image processing...');
    
    // Check if there's a sample image in the backend directory
    const sampleImagePath = path.join(__dirname, 'backend', 'test-isp-form.png');
    
    if (fs.existsSync(sampleImagePath)) {
      console.log('📄 Found sample image, processing...');
      
      const imageBuffer = fs.readFileSync(sampleImagePath);
      const result = await ocrService.processISPScreenshot(imageBuffer);
      
      console.log('✅ Image processing completed');
      console.log(`📊 Success: ${result.success}`);
      console.log(`📝 Tasks found: ${result.tasks?.length || 0}`);
      console.log(`🎯 Confidence: ${result.confidence}%`);
      
      if (result.tasks && result.tasks.length > 0) {
        console.log('\n📋 Sample extracted task:');
        console.log(JSON.stringify(result.tasks[0], null, 2));
      }
      
    } else {
      console.log('📄 No sample image found, skipping image test');
      console.log(`   Expected path: ${sampleImagePath}`);
    }
    
  } catch (error) {
    console.error('❌ Image test failed:', error);
  }
}

// Run the tests
if (require.main === module) {
  testOCRImprovements()
    .then(() => testWithSampleImage())
    .then(() => {
      console.log('\n✨ All tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testOCRImprovements, testWithSampleImage };
