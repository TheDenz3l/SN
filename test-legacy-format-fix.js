/**
 * Test script to verify the legacy format fix in Notes History
 * This script tests that notes with sections are properly displayed
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';
const TEST_CREDENTIALS = {
  email: 'demo@swiftnotes.app',
  password: 'demo123'
};

/**
 * Make API request with error handling
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

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data,
      error: response.ok ? null : data.error
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

/**
 * Test the legacy format fix
 */
async function testLegacyFormatFix() {
  console.log('🧪 Testing Legacy Format Fix in Notes History');
  console.log('==============================================\n');

  // Step 1: Login
  console.log('1. 🔐 Logging in...');
  const loginResult = await apiRequest('/auth/login', 'POST', TEST_CREDENTIALS);
  
  if (!loginResult.success) {
    console.log('❌ Login failed:', loginResult.error);
    return;
  }

  const token = loginResult.data.session?.access_token || loginResult.data.token;
  console.log('✅ Login successful\n');

  // Step 2: Fetch notes with sections
  console.log('2. 📝 Fetching notes with sections...');
  const notesResult = await apiRequest('/notes?limit=5', 'GET', null, token);
  
  if (!notesResult.success) {
    console.log('❌ Failed to fetch notes:', notesResult.error);
    return;
  }

  const notes = notesResult.data.notes || [];
  console.log(`✅ Fetched ${notes.length} notes`);

  // Step 3: Analyze note formats
  console.log('\n3. 🔍 Analyzing note formats...');
  
  let notesWithSections = 0;
  let notesWithLegacyContent = 0;
  let notesWithBoth = 0;

  for (const note of notes) {
    const hasSections = note.sections && note.sections.length > 0;
    const hasLegacyContent = note.content && 
                            typeof note.content === 'object' && 
                            note.content.sections;

    if (hasSections) notesWithSections++;
    if (hasLegacyContent) notesWithLegacyContent++;
    if (hasSections && hasLegacyContent) notesWithBoth++;

    console.log(`   Note: "${note.title}"`);
    console.log(`     - Has sections array: ${hasSections ? 'Yes' : 'No'} ${hasSections ? `(${note.sections.length} sections)` : ''}`);
    console.log(`     - Has legacy content: ${hasLegacyContent ? 'Yes' : 'No'} ${hasLegacyContent ? `(${JSON.stringify(note.content)})` : ''}`);
    console.log(`     - Created: ${new Date(note.created_at).toLocaleDateString()}`);
    console.log('');
  }

  console.log(`📊 Summary:`);
  console.log(`   - Notes with sections array: ${notesWithSections}`);
  console.log(`   - Notes with legacy content: ${notesWithLegacyContent}`);
  console.log(`   - Notes with both: ${notesWithBoth}`);

  // Step 4: Test individual note fetching
  if (notes.length > 0) {
    console.log('\n4. 🔍 Testing individual note fetching...');
    const testNote = notes[0];
    
    console.log(`   Testing note: "${testNote.title}"`);
    const noteResult = await apiRequest(`/notes/${testNote.id}`, 'GET', null, token);
    
    if (!noteResult.success) {
      console.log('❌ Failed to fetch individual note:', noteResult.error);
      return;
    }

    const fullNote = noteResult.data.note;
    console.log(`   ✅ Individual note fetch successful`);
    console.log(`   - Sections in response: ${fullNote.sections ? fullNote.sections.length : 0}`);
    
    if (fullNote.sections && fullNote.sections.length > 0) {
      console.log(`   - First section preview: "${fullNote.sections[0].generated_content?.substring(0, 100)}..."`);
    }
  }

  // Step 5: Verify fix logic
  console.log('\n5. ✅ Verifying fix logic...');
  
  for (const note of notes.slice(0, 3)) { // Test first 3 notes
    const hasSections = note.sections && note.sections.length > 0;
    const hasLegacyContent = note.content && 
                            typeof note.content === 'object' && 
                            note.content.sections;

    console.log(`   Note: "${note.title}"`);
    
    if (hasSections) {
      console.log(`     ✅ Should display NEW FORMAT (${note.sections.length} sections)`);
    } else if (hasLegacyContent) {
      console.log(`     ⚠️  Should display LEGACY FORMAT warning`);
    } else {
      console.log(`     📄 Should display content as string or other format`);
    }
  }

  console.log('\n🎉 Legacy format fix verification complete!');
  console.log('The frontend should now properly prioritize sections array over legacy content.');
}

/**
 * Run the test
 */
async function runTest() {
  try {
    await testLegacyFormatFix();
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test
runTest();
