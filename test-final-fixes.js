/**
 * Final Test: Verify All Fixes Are Working
 * Tests: Time Pattern Toggle, Default Settings, Enhanced Vocabulary
 */

const fetch = require('node-fetch');

async function testAllFixes() {
  console.log('🧪 Testing All Fixes - Final Verification');
  console.log('============================================\n');

  try {
    // 1. Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@swiftnotes.app', password: 'demo123' })
    });
    const loginResult = await loginResponse.json();
    const token = loginResult.session.access_token;
    console.log('✅ Login successful\n');

    // 2. Set user preferences with time patterns enabled
    console.log('2️⃣ Setting preferences (useTimePatterns: true, tone: 15, detail: moderate)...');
    const prefsResponse = await fetch('http://localhost:3001/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        defaultToneLevel: 15,  // Very authentic
        defaultDetailLevel: 'moderate',
        useTimePatterns: true
      })
    });
    const prefsResult = await prefsResponse.json();
    console.log('✅ Preferences saved:', JSON.stringify(prefsResult.preferences, null, 2));
    console.log('');

    // 3. Verify preferences persistence
    console.log('3️⃣ Verifying preferences persistence...');
    const profileResponse = await fetch('http://localhost:3001/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const profileResult = await profileResponse.json();
    const savedPrefs = JSON.parse(profileResult.user.preferences);
    
    console.log('📊 Saved preferences:');
    console.log(`   - useTimePatterns: ${savedPrefs.useTimePatterns}`);
    console.log(`   - defaultToneLevel: ${savedPrefs.defaultToneLevel}`);
    console.log(`   - defaultDetailLevel: ${savedPrefs.defaultDetailLevel}`);
    
    if (savedPrefs.useTimePatterns === true) {
      console.log('✅ Time patterns toggle persistence: WORKING');
    } else {
      console.log('❌ Time patterns toggle persistence: FAILED');
    }
    console.log('');

    // 4. Test AI preview with default settings (no explicit tone/detail provided)
    console.log('4️⃣ Testing AI preview with default settings...');
    const previewResponse = await fetch('http://localhost:3001/api/ai/preview', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'Chad made his bed and took out trash',
        taskDescription: 'Morning routine tasks'
        // Note: NOT providing detailLevel or toneLevel - should use defaults
      })
    });
    const previewResult = await previewResponse.json();
    
    console.log('📊 AI Preview Results:');
    console.log(`   - Tone Level Used: ${previewResult.preview.toneLevel}`);
    console.log(`   - Detail Level Used: ${previewResult.preview.detailLevel}`);
    
    if (previewResult.preview.toneLevel === 15 && previewResult.preview.detailLevel === 'moderate') {
      console.log('✅ Default settings application: WORKING');
    } else {
      console.log('❌ Default settings application: FAILED');
      console.log(`   Expected: tone=15, detail=moderate`);
      console.log(`   Got: tone=${previewResult.preview.toneLevel}, detail=${previewResult.preview.detailLevel}`);
    }
    
    console.log('\n📝 Generated Content:');
    console.log(previewResult.preview.enhancedContent);
    console.log('');

    // 5. Check for enhanced vocabulary usage
    const content = previewResult.preview.enhancedContent.toLowerCase();
    const hasEnhancedVocab = 
      content.includes('went') || content.includes('did') || content.includes('got') ||
      content.includes('made') || content.includes('had') || content.includes('finished') ||
      content.includes('started') || content.includes('helped');
    
    const hasClinicialTerms = 
      content.includes('demonstrated') || content.includes('exhibited') || 
      content.includes('participated') || content.includes('individual') ||
      content.includes('client') || content.includes('facilitated');

    console.log('5️⃣ Enhanced Vocabulary Analysis:');
    console.log(`   - Contains natural language: ${hasEnhancedVocab ? '✅' : '❌'}`);
    console.log(`   - Avoids clinical terms: ${!hasClinicialTerms ? '✅' : '❌'}`);
    
    if (hasEnhancedVocab && !hasClinicialTerms) {
      console.log('✅ Enhanced vocabulary: WORKING');
    } else {
      console.log('❌ Enhanced vocabulary: NEEDS IMPROVEMENT');
    }

    console.log('\n🎉 FINAL RESULTS:');
    console.log('================');
    console.log(`✅ Time Pattern Toggle Persistence: ${savedPrefs.useTimePatterns === true ? 'FIXED' : 'FAILED'}`);
    console.log(`✅ Default Settings Application: ${previewResult.preview.toneLevel === 15 && previewResult.preview.detailLevel === 'moderate' ? 'FIXED' : 'FAILED'}`);
    console.log(`✅ Enhanced Vocabulary: ${hasEnhancedVocab && !hasClinicialTerms ? 'WORKING' : 'NEEDS WORK'}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAllFixes();
