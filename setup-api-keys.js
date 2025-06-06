#!/usr/bin/env node

/**
 * SwiftNotes API Keys Setup Script
 * 
 * This script helps you configure the required API keys for SwiftNotes to work properly.
 * Run this script to set up your environment variables.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupAPIKeys() {
  console.log('🚀 SwiftNotes API Keys Setup');
  console.log('=====================================\n');
  
  console.log('This script will help you configure the required API keys for SwiftNotes.\n');
  
  console.log('📋 Required API Keys:');
  console.log('1. Google AI API Key (for AI-powered note generation)');
  console.log('2. Supabase Anon Key (for frontend database access)');
  console.log('3. JWT Secret (for authentication security)\n');
  
  // Get Google AI API Key
  console.log('🤖 Google AI API Key Setup:');
  console.log('   1. Go to https://makersuite.google.com/app/apikey');
  console.log('   2. Create a new API key');
  console.log('   3. Copy the API key\n');
  
  const googleApiKey = await question('Enter your Google AI API Key: ');
  
  if (!googleApiKey || googleApiKey.trim() === '') {
    console.log('❌ Google AI API Key is required for AI features to work.');
    process.exit(1);
  }
  
  // Get Supabase Anon Key
  console.log('\n🗄️  Supabase Anon Key Setup:');
  console.log('   1. Go to your Supabase project dashboard');
  console.log('   2. Go to Settings > API');
  console.log('   3. Copy the "anon public" key\n');
  
  const supabaseAnonKey = await question('Enter your Supabase Anon Key (optional for now): ');
  
  // Generate JWT Secret
  const jwtSecret = require('crypto').randomBytes(64).toString('hex');
  console.log('\n🔐 Generated JWT Secret automatically for security.');
  
  // Update backend .env
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  let backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
  
  backendEnv = backendEnv.replace(
    'GOOGLE_AI_API_KEY=your-google-ai-api-key-here',
    `GOOGLE_AI_API_KEY=${googleApiKey}`
  );
  
  backendEnv = backendEnv.replace(
    'JWT_SECRET=your-jwt-secret-here-development-only',
    `JWT_SECRET=${jwtSecret}`
  );
  
  fs.writeFileSync(backendEnvPath, backendEnv);
  
  // Update frontend .env
  const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
  let frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
  
  frontendEnv = frontendEnv.replace(
    'VITE_GOOGLE_AI_API_KEY=your-google-ai-api-key-here',
    `VITE_GOOGLE_AI_API_KEY=${googleApiKey}`
  );
  
  if (supabaseAnonKey && supabaseAnonKey.trim() !== '') {
    frontendEnv = frontendEnv.replace(
      'VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here',
      `VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}`
    );
  }
  
  fs.writeFileSync(frontendEnvPath, frontendEnv);
  
  console.log('\n✅ API Keys configured successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Restart your development server');
  console.log('   2. Run: npm run dev');
  console.log('   3. Test the AI features in the application\n');
  
  console.log('🔒 Security Note:');
  console.log('   - Never commit .env files to version control');
  console.log('   - Keep your API keys secure and private\n');
  
  rl.close();
}

if (require.main === module) {
  setupAPIKeys().catch(console.error);
}

module.exports = { setupAPIKeys };
