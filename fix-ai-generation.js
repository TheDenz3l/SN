#!/usr/bin/env node

/**
 * SwiftNotes AI Generation Fix Script
 * 
 * This script diagnoses and fixes AI generation issues in SwiftNotes.
 * It checks for missing API keys, configuration issues, and provides solutions.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...\n');
  
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
  
  const issues = [];
  
  // Check backend .env
  if (!fs.existsSync(backendEnvPath)) {
    issues.push('❌ Backend .env file missing');
  } else {
    const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
    
    if (!backendEnv.includes('GOOGLE_AI_API_KEY=') || backendEnv.includes('your-google-ai-api-key-here')) {
      issues.push('❌ Google AI API Key not configured in backend');
    }
    
    if (!backendEnv.includes('JWT_SECRET=') || backendEnv.includes('your-jwt-secret-here')) {
      issues.push('❌ JWT Secret not configured in backend');
    }
  }
  
  // Check frontend .env
  if (!fs.existsSync(frontendEnvPath)) {
    issues.push('❌ Frontend .env file missing');
  }
  
  if (issues.length === 0) {
    console.log('✅ Environment files exist and appear configured');
  } else {
    console.log('Issues found:');
    issues.forEach(issue => console.log(`   ${issue}`));
  }
  
  return issues;
}

async function testGoogleAIConnection() {
  console.log('\n🤖 Testing Google AI API connection...\n');
  
  try {
    // Load environment variables
    require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
    
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey || apiKey === 'your-google-ai-api-key-here') {
      console.log('❌ Google AI API Key not configured');
      return false;
    }
    
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Test with a simple prompt
    const result = await model.generateContent('Hello, this is a test.');
    const response = await result.response;
    const text = response.text();
    
    if (text && text.length > 0) {
      console.log('✅ Google AI API connection successful');
      console.log(`   Test response: "${text.substring(0, 50)}..."`);
      return true;
    } else {
      console.log('❌ Google AI API returned empty response');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Google AI API connection failed:');
    console.log(`   Error: ${error.message}`);
    
    if (error.message.includes('403')) {
      console.log('   💡 This usually means the API key is invalid or not configured');
    }
    
    return false;
  }
}

async function testSupabaseConnection() {
  console.log('\n🗄️  Testing Supabase connection...\n');
  
  try {
    require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Supabase credentials not configured');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection with a simple query
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log('❌ Supabase connection failed:');
      console.log(`   Error: ${error.message}`);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
    
  } catch (error) {
    console.log('❌ Supabase connection failed:');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

function provideSolutions(issues) {
  console.log('\n🛠️  Solutions:\n');
  
  if (issues.some(issue => issue.includes('Google AI API Key'))) {
    console.log('📋 To fix Google AI API Key issues:');
    console.log('   1. Go to https://makersuite.google.com/app/apikey');
    console.log('   2. Create a new API key');
    console.log('   3. Run: node setup-api-keys.js');
    console.log('   4. Or manually edit backend/.env and set GOOGLE_AI_API_KEY\n');
  }
  
  if (issues.some(issue => issue.includes('JWT Secret'))) {
    console.log('🔐 To fix JWT Secret:');
    console.log('   1. Run: node setup-api-keys.js');
    console.log('   2. Or manually generate a secure random string for JWT_SECRET\n');
  }
  
  if (issues.some(issue => issue.includes('.env file missing'))) {
    console.log('📁 To fix missing .env files:');
    console.log('   1. Run: node setup-api-keys.js');
    console.log('   2. This will create the required .env files\n');
  }
  
  console.log('🔄 After fixing the issues:');
  console.log('   1. Restart your development server');
  console.log('   2. Run: npm run dev');
  console.log('   3. Test the AI features again\n');
}

async function main() {
  console.log('🚀 SwiftNotes AI Generation Diagnostic Tool');
  console.log('=============================================\n');
  
  const issues = await checkEnvironmentVariables();
  const googleAIWorking = await testGoogleAIConnection();
  const supabaseWorking = await testSupabaseConnection();
  
  console.log('\n📊 Summary:');
  console.log('===========');
  console.log(`Environment Config: ${issues.length === 0 ? '✅' : '❌'}`);
  console.log(`Google AI API: ${googleAIWorking ? '✅' : '❌'}`);
  console.log(`Supabase: ${supabaseWorking ? '✅' : '❌'}`);
  
  if (issues.length > 0 || !googleAIWorking) {
    provideSolutions(issues);
  } else {
    console.log('\n🎉 All systems appear to be working correctly!');
    console.log('   If you\'re still experiencing issues, try restarting the server.\n');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkEnvironmentVariables, testGoogleAIConnection, testSupabaseConnection };
