#!/usr/bin/env node

/**
 * Simple AI Test - Test the Google AI API directly
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testAI() {
  console.log('🤖 Testing SwiftNotes AI Integration');
  console.log('====================================\n');
  
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No API key found');
    return;
  }
  
  console.log('✅ API Key configured');
  console.log(`   Key starts with: ${apiKey.substring(0, 10)}...\n`);
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log('🧪 Testing AI generation...');
    const result = await model.generateContent('Generate a brief professional note about a patient meal preparation task.');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ AI Generation Successful!');
    console.log('\n📝 Sample Output:');
    console.log('─'.repeat(50));
    console.log(text);
    console.log('─'.repeat(50));
    
    console.log('\n🎉 SwiftNotes AI features should now work!');
    console.log('   • Preview Enhanced button ✅');
    console.log('   • Generate Note button ✅');
    
  } catch (error) {
    console.log('❌ AI test failed:', error.message);
  }
}

testAI().catch(console.error);
