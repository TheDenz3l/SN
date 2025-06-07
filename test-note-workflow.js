#!/usr/bin/env node

/**
 * Test Note Workflow - Comprehensive testing of note generation, saving, and retrieval
 * Tests the complete workflow to identify data integrity issues
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'demo@swiftnotes.app',
  password: 'demo123'
};

let authToken = null;
let testNoteId = null;

async function login() {
  console.log('🔐 Logging in...');
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_CREDENTIALS),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      authToken = data.session.access_token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return false;
  }
}

async function generateNote() {
  console.log('\n🤖 Generating note...');
  try {
    const noteRequest = {
      title: 'Test Data Integrity Note - ' + new Date().toISOString(),
      sections: [
        {
          prompt: 'Client showed significant improvement in verbal communication during today\'s session. They were able to express their needs clearly and maintained eye contact throughout our conversation.',
          type: 'task'
        },
        {
          prompt: 'Overall, the session was very productive. The client was engaged and cooperative throughout the entire 45-minute session.',
          type: 'comment'
        }
      ],
      saveNote: false // Don't save automatically
    };

    const response = await fetch(`${API_BASE_URL}/ai/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteRequest),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Note generation successful');
      console.log(`   Generated ${data.sections.length} sections`);
      
      // Log section details
      data.sections.forEach((section, index) => {
        console.log(`   Section ${index + 1}:`);
        console.log(`     Prompt: ${section.user_prompt ? section.user_prompt.substring(0, 50) + '...' : 'N/A'}`);
        console.log(`     Generated: ${section.generated_content ? section.generated_content.substring(0, 50) + '...' : 'N/A'}`);
        console.log(`     Tokens: ${section.tokens_used || 0}`);
      });
      
      return data;
    } else {
      console.log('❌ Note generation failed:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Note generation error:', error.message);
    return null;
  }
}

async function saveNote(generatedData) {
  console.log('\n💾 Saving note...');
  try {
    const saveRequest = {
      title: generatedData.title || 'Test Data Integrity Note',
      sections: generatedData.sections.map(section => ({
        isp_task_id: section.isp_task_id || null,
        user_prompt: section.user_prompt,
        generated_content: section.generated_content,
        tokens_used: section.tokens_used || 0,
        is_edited: false
      }))
    };

    console.log('📤 Save request data:');
    console.log(`   Title: ${saveRequest.title}`);
    console.log(`   Sections: ${saveRequest.sections.length}`);
    saveRequest.sections.forEach((section, index) => {
      console.log(`   Section ${index + 1}:`);
      console.log(`     ISP Task ID: ${section.isp_task_id}`);
      console.log(`     User Prompt: ${section.user_prompt ? section.user_prompt.substring(0, 50) + '...' : 'N/A'}`);
      console.log(`     Generated Content: ${section.generated_content ? section.generated_content.substring(0, 50) + '...' : 'N/A'}`);
      console.log(`     Tokens Used: ${section.tokens_used}`);
    });

    const response = await fetch(`${API_BASE_URL}/ai/save-note`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saveRequest),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      testNoteId = data.note.id;
      console.log('✅ Note save successful');
      console.log(`   Note ID: ${testNoteId}`);
      console.log(`   Saved sections: ${data.note.sections?.length || 0}`);

      // Log the actual saved sections data
      if (data.note.sections && data.note.sections.length > 0) {
        console.log('📋 Saved sections details:');
        data.note.sections.forEach((section, index) => {
          console.log(`   Section ${index + 1}:`);
          console.log(`     ID: ${section.id}`);
          console.log(`     Note ID: ${section.note_id}`);
          console.log(`     User Prompt: ${section.user_prompt?.substring(0, 50)}...`);
          console.log(`     Generated Content: ${section.generated_content?.substring(0, 50)}...`);
        });
      } else {
        console.log('⚠️  Save response shows no sections saved');
      }

      return data;
    } else {
      console.log('❌ Note save failed:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Note save error:', error.message);
    return null;
  }
}

async function retrieveNote(noteId) {
  console.log('\n📖 Retrieving note...');
  try {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Note retrieval successful');
      console.log(`   Note ID: ${data.note.id}`);
      console.log(`   Title: ${data.note.title}`);
      console.log(`   Sections: ${data.note.sections?.length || 0}`);

      if (data.note.sections && data.note.sections.length > 0) {
        data.note.sections.forEach((section, index) => {
          console.log(`   Section ${index + 1}:`);
          console.log(`     ID: ${section.id}`);
          console.log(`     ISP Task ID: ${section.isp_task_id}`);
          console.log(`     User Prompt: ${section.user_prompt?.substring(0, 50)}...`);
          console.log(`     Generated Content: ${section.generated_content?.substring(0, 50)}...`);
          console.log(`     Tokens Used: ${section.tokens_used}`);
          console.log(`     Is Edited: ${section.is_edited}`);
        });
      } else {
        console.log('⚠️  No sections found in retrieved note');
      }

      return data;
    } else {
      console.log('❌ Note retrieval failed:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Note retrieval error:', error.message);
    return null;
  }
}

async function testDirectSectionsQuery(noteId) {
  console.log('\n🔍 Testing direct sections query...');
  try {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/sections`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Direct sections query successful');
      console.log(`   Sections found: ${data.sections?.length || 0}`);

      if (data.sections && data.sections.length > 0) {
        data.sections.forEach((section, index) => {
          console.log(`   Section ${index + 1}:`);
          console.log(`     ID: ${section.id}`);
          console.log(`     Note ID: ${section.note_id}`);
          console.log(`     ISP Task ID: ${section.isp_task_id}`);
          console.log(`     User Prompt: ${section.user_prompt?.substring(0, 50)}...`);
          console.log(`     Generated Content: ${section.generated_content?.substring(0, 50)}...`);
          console.log(`     Tokens Used: ${section.tokens_used}`);
        });
      } else {
        console.log('⚠️  No sections found via direct query');
      }

      return data;
    } else {
      console.log('❌ Direct sections query failed:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Direct sections query error:', error.message);
    return null;
  }
}

async function testRawDatabaseQuery(noteId) {
  console.log('\n🔍 Testing raw database query...');
  try {
    // Test the debug endpoint
    const response = await fetch(`${API_BASE_URL}/notes/debug/sections/${noteId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Debug endpoint successful');
      console.log(`   All sections found: ${data.debug?.allSections?.length || 0}`);
      console.log(`   User sections found: ${data.debug?.userSections?.length || 0}`);
      console.log(`   Total sections in DB: ${data.debug?.totalSectionsInDb || 0}`);

      if (data.debug?.allSections && data.debug.allSections.length > 0) {
        console.log('📋 All sections details:');
        data.debug.allSections.forEach((section, index) => {
          console.log(`   Section ${index + 1}:`);
          console.log(`     ID: ${section.id}`);
          console.log(`     Note ID: ${section.note_id}`);
          console.log(`     User Prompt: ${section.user_prompt?.substring(0, 50)}...`);
          console.log(`     Generated Content: ${section.generated_content?.substring(0, 50)}...`);
        });
      }

      if (data.debug?.errors) {
        console.log('🔍 Debug errors:');
        Object.entries(data.debug.errors).forEach(([key, error]) => {
          if (error) {
            console.log(`   ${key}: ${error.message || error}`);
          }
        });
      }

      return data;
    } else {
      console.log('⚠️  Debug endpoint failed, creating manual query...');

      // Let's try to understand what's in the database by checking all notes
      const allNotesResponse = await fetch(`${API_BASE_URL}/notes?limit=10`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (allNotesResponse.ok) {
        const allNotesData = await allNotesResponse.json();
        console.log('📋 All notes in database:');
        allNotesData.notes?.forEach((note, index) => {
          console.log(`   Note ${index + 1}: ${note.id} - "${note.title}" - Sections: ${note.sections?.length || 0}`);
        });
      }

      return null;
    }
  } catch (error) {
    console.log('❌ Raw database query error:', error.message);
    return null;
  }
}

async function listNotes() {
  console.log('\n📋 Listing notes...');
  try {
    const response = await fetch(`${API_BASE_URL}/notes?limit=5`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Notes list successful');
      console.log(`   Total notes: ${data.total}`);
      console.log(`   Returned notes: ${data.notes?.length || 0}`);
      
      if (data.notes && data.notes.length > 0) {
        data.notes.forEach((note, index) => {
          console.log(`   Note ${index + 1}:`);
          console.log(`     ID: ${note.id}`);
          console.log(`     Title: ${note.title}`);
          console.log(`     Sections: ${note.sections?.length || 0}`);
          console.log(`     Created: ${note.created_at}`);
        });
      }
      
      return data;
    } else {
      console.log('❌ Notes list failed:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Notes list error:', error.message);
    return null;
  }
}

async function runWorkflowTest() {
  console.log('🚀 SwiftNotes Data Integrity Workflow Test\n');
  console.log('=' .repeat(60));
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Test failed: Could not login');
    return;
  }

  // Step 2: Generate note
  const generatedData = await generateNote();
  if (!generatedData) {
    console.log('\n❌ Test failed: Could not generate note');
    return;
  }

  // Step 3: Save note
  const savedData = await saveNote(generatedData);
  if (!savedData) {
    console.log('\n❌ Test failed: Could not save note');
    return;
  }

  // Step 4: Retrieve note
  const retrievedData = await retrieveNote(testNoteId);
  if (!retrievedData) {
    console.log('\n❌ Test failed: Could not retrieve note');
    return;
  }

  // Step 4.5: Test direct sections query
  const sectionsData = await testDirectSectionsQuery(testNoteId);

  // Step 4.6: Test raw database query
  const rawData = await testRawDatabaseQuery(testNoteId);

  // Step 5: List notes to verify it appears
  await listNotes();

  // Step 6: Data integrity analysis
  console.log('\n' + '=' .repeat(60));
  console.log('🔍 DATA INTEGRITY ANALYSIS');
  console.log('=' .repeat(60));
  
  const originalSections = generatedData.sections;
  const savedSections = savedData.note.sections || [];
  const retrievedSections = retrievedData.note.sections || [];
  
  console.log(`Original sections: ${originalSections.length}`);
  console.log(`Saved sections: ${savedSections.length}`);
  console.log(`Retrieved sections: ${retrievedSections.length}`);
  
  // Check data preservation
  let dataIntegrityIssues = [];
  
  if (originalSections.length !== retrievedSections.length) {
    dataIntegrityIssues.push('Section count mismatch');
  }
  
  originalSections.forEach((original, index) => {
    const retrieved = retrievedSections[index];
    if (!retrieved) {
      dataIntegrityIssues.push(`Section ${index + 1} missing`);
      return;
    }

    if (original.user_prompt !== retrieved.user_prompt) {
      dataIntegrityIssues.push(`Section ${index + 1} prompt mismatch`);
    }

    if (original.generated_content !== retrieved.generated_content) {
      dataIntegrityIssues.push(`Section ${index + 1} generated content mismatch`);
    }
  });
  
  if (dataIntegrityIssues.length === 0) {
    console.log('✅ DATA INTEGRITY: PERFECT - All data preserved correctly');
  } else {
    console.log('❌ DATA INTEGRITY ISSUES FOUND:');
    dataIntegrityIssues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  console.log('=' .repeat(60));
}

// Run the test
runWorkflowTest().catch(console.error);
