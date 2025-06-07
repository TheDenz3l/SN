/**
 * Real-time debugging script for Notes History legacy format issue
 * This script will test the exact user experience and identify the problem
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:5173';
const TEST_CREDENTIALS = {
  email: 'demo@swiftnotes.app',
  password: 'demo123'
};

/**
 * Make API request with detailed logging
 */
async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`🔗 API Request: ${method} ${url}`);
  if (body) {
    console.log(`📤 Request Body:`, JSON.stringify(body, null, 2));
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    console.log(`📥 Response Status: ${response.status}`);
    console.log(`📥 Response Data:`, JSON.stringify(data, null, 2));

    return {
      success: response.ok,
      status: response.status,
      data,
      error: response.ok ? null : data.error
    };
  } catch (error) {
    console.log(`❌ Request Error:`, error.message);
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

/**
 * Debug the exact Notes History issue
 */
async function debugNotesHistoryRealtime() {
  console.log('🔍 REAL-TIME NOTES HISTORY DEBUG');
  console.log('================================\n');

  // Step 1: Login
  console.log('1. 🔐 Authenticating with demo credentials...');
  const loginResult = await apiRequest('/auth/login', 'POST', TEST_CREDENTIALS);
  
  if (!loginResult.success) {
    console.log('❌ Login failed:', loginResult.error);
    return;
  }

  const token = loginResult.data.session?.access_token || loginResult.data.token;
  console.log('✅ Login successful');
  console.log(`🎫 Token: ${token?.substring(0, 20)}...`);

  // Step 2: Fetch notes exactly as the frontend does
  console.log('\n2. 📋 Fetching notes (exactly as frontend does)...');
  const notesResult = await apiRequest('/notes?page=1&limit=10&sortBy=updated_at&sortOrder=desc', 'GET', null, token);
  
  if (!notesResult.success) {
    console.log('❌ Failed to fetch notes:', notesResult.error);
    return;
  }

  const notes = notesResult.data.notes || [];
  console.log(`✅ Fetched ${notes.length} notes\n`);

  // Step 3: Analyze each note in detail
  console.log('3. 🔍 DETAILED NOTE ANALYSIS (Frontend Perspective)');
  console.log('================================================');
  
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    console.log(`\n📝 NOTE ${i + 1}: "${note.title}"`);
    console.log(`   ID: ${note.id}`);
    console.log(`   Type: ${note.note_type}`);
    console.log(`   Created: ${note.created_at}`);
    
    // Check sections array (what our fix should prioritize)
    const hasSections = note.sections && note.sections.length > 0;
    console.log(`   📊 Sections Array: ${hasSections ? 'YES' : 'NO'}`);
    if (hasSections) {
      console.log(`      - Count: ${note.sections.length}`);
      console.log(`      - First section preview: "${note.sections[0].generated_content?.substring(0, 100)}..."`);
    } else {
      console.log(`      - Value: ${JSON.stringify(note.sections)}`);
    }
    
    // Check legacy content (what was causing the problem)
    const hasLegacyContent = note.content && 
                            typeof note.content === 'object' && 
                            note.content.sections;
    console.log(`   🗂️  Legacy Content: ${hasLegacyContent ? 'YES' : 'NO'}`);
    if (hasLegacyContent) {
      console.log(`      - Value: ${JSON.stringify(note.content)}`);
    }
    
    // Determine what the frontend SHOULD display based on our fix
    console.log(`   🎯 EXPECTED FRONTEND BEHAVIOR:`);
    if (hasSections) {
      console.log(`      ✅ Should display NEW FORMAT with ${note.sections.length} sections`);
    } else if (hasLegacyContent) {
      console.log(`      ⚠️  Should display LEGACY FORMAT warning`);
    } else if (typeof note.content === 'string') {
      console.log(`      📄 Should display content as string`);
    } else {
      console.log(`      ❓ Should display "No content available"`);
    }
  }

  // Step 4: Test individual note fetching
  if (notes.length > 0) {
    console.log('\n4. 🔍 TESTING INDIVIDUAL NOTE FETCHING');
    console.log('=====================================');
    
    const testNote = notes[0];
    console.log(`\n🎯 Testing note: "${testNote.title}" (${testNote.id})`);
    
    const noteResult = await apiRequest(`/notes/${testNote.id}`, 'GET', null, token);
    
    if (!noteResult.success) {
      console.log(`❌ Failed to fetch individual note: ${noteResult.error}`);
    } else {
      const fullNote = noteResult.data.note;
      console.log(`✅ Individual note fetch successful`);
      console.log(`📊 Full note sections: ${fullNote.sections ? fullNote.sections.length : 0}`);
      
      if (fullNote.sections && fullNote.sections.length > 0) {
        console.log(`📝 Section details:`);
        fullNote.sections.forEach((section, idx) => {
          console.log(`   Section ${idx + 1}:`);
          console.log(`     - ID: ${section.id}`);
          console.log(`     - User Prompt: "${section.user_prompt?.substring(0, 80)}..."`);
          console.log(`     - Generated Content: "${section.generated_content?.substring(0, 80)}..."`);
          console.log(`     - Tokens: ${section.tokens_used || 'N/A'}`);
          console.log(`     - Edited: ${section.is_edited || false}`);
        });
      }
    }
  }

  // Step 5: Frontend conditional logic simulation
  console.log('\n5. 🧪 SIMULATING FRONTEND CONDITIONAL LOGIC');
  console.log('==========================================');
  
  for (let i = 0; i < Math.min(notes.length, 2); i++) {
    const note = notes[i];
    console.log(`\n🎯 Note: "${note.title}"`);
    
    // Simulate the exact conditional logic from our fix
    console.log(`   🔍 Checking conditions in order:`);
    
    // PRIORITY 1: Check sections array first
    if (note.sections && note.sections.length > 0) {
      console.log(`   ✅ CONDITION 1 MET: note.sections && note.sections.length > 0`);
      console.log(`      → Should display NEW FORMAT with ${note.sections.length} sections`);
      console.log(`      → This is the CORRECT behavior for notes with sections`);
    } else {
      console.log(`   ❌ CONDITION 1 NOT MET: note.sections && note.sections.length > 0`);
      console.log(`      → sections: ${JSON.stringify(note.sections)}`);
      
      // PRIORITY 2: Check legacy content only if no sections
      if (note.content && 
          typeof note.content === 'object' && 
          note.content.sections &&
          (!note.sections || note.sections.length === 0)) {
        console.log(`   ✅ CONDITION 2 MET: Legacy content with no sections`);
        console.log(`      → Should display LEGACY FORMAT warning`);
        console.log(`      → This is CORRECT for legacy notes`);
      } else {
        console.log(`   ❌ CONDITION 2 NOT MET: No legacy content or has sections`);
        
        // Check other conditions
        if (typeof note.content === 'string') {
          console.log(`   ✅ CONDITION 3 MET: String content`);
          console.log(`      → Should display content as string`);
        } else if (note.content) {
          console.log(`   ✅ CONDITION 4 MET: Other content format`);
          console.log(`      → Should display raw content data`);
        } else {
          console.log(`   ✅ CONDITION 5 MET: No content`);
          console.log(`      → Should display "No content available"`);
        }
      }
    }
  }

  console.log('\n🎉 REAL-TIME DEBUG COMPLETE');
  console.log('===========================');
  console.log('If you are still seeing legacy format issues, the problem may be:');
  console.log('1. Browser cache not cleared');
  console.log('2. Frontend not properly reloaded');
  console.log('3. Different data than what we see in the API');
  console.log('4. JavaScript errors preventing the fix from working');
  console.log('\nNext steps: Check browser console for errors and clear cache.');
}

/**
 * Run the debug
 */
async function runDebug() {
  try {
    await debugNotesHistoryRealtime();
  } catch (error) {
    console.error('❌ Debug failed with error:', error);
    process.exit(1);
  }
}

// Run the debug
runDebug();
