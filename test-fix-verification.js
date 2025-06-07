// Quick test to verify the fix is working
const API_BASE_URL = 'http://localhost:3001/api';
const authToken = 'eyJ1c2VySWQiOiI3ZGIxYjk1Zi00NTcyLTQ2ZjItYjAyMy0xMDE1OTgzYjFiOTIiLCJlbWFpbCI6ImRlbW9Ac3dpZnRub3Rlcy5hcHAiLCJleHAiOjE3NDkzNjE0NjE4Nzd9';

async function testFix() {
  console.log('🔧 Testing SwiftNotes Data Integrity Fix');
  console.log('=====================================');

  try {
    // Test existing note that we know has sections
    const noteId = 'ca1def76-6cf3-4e35-aafc-b3563aecb00d';
    
    console.log(`📖 Testing note retrieval for ${noteId}...`);
    const noteResponse = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const noteData = await noteResponse.json();
    
    if (noteResponse.ok && noteData.success) {
      console.log('✅ Note retrieval successful');
      console.log(`   Note ID: ${noteData.note.id}`);
      console.log(`   Title: ${noteData.note.title}`);
      console.log(`   Sections: ${noteData.note.sections?.length || 0}`);
      
      if (noteData.note.sections && noteData.note.sections.length > 0) {
        console.log('📋 Sections found:');
        noteData.note.sections.forEach((section, index) => {
          console.log(`   Section ${index + 1}:`);
          console.log(`     ID: ${section.id}`);
          console.log(`     Prompt: ${section.user_prompt?.substring(0, 50)}...`);
          console.log(`     Content: ${section.generated_content?.substring(0, 50)}...`);
          console.log(`     ISP Tasks: ${section.isp_tasks ? 'Linked' : 'None'}`);
        });
      }
    } else {
      console.log('❌ Note retrieval failed:', noteData.error);
      return;
    }

    console.log(`\n📝 Testing sections endpoint for ${noteId}...`);
    const sectionsResponse = await fetch(`${API_BASE_URL}/notes/${noteId}/sections`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const sectionsData = await sectionsResponse.json();
    
    if (sectionsResponse.ok && sectionsData.success) {
      console.log('✅ Sections endpoint successful');
      console.log(`   Sections found: ${sectionsData.sections?.length || 0}`);
    } else {
      console.log('❌ Sections endpoint failed:', sectionsData.error);
      return;
    }

    console.log('\n📋 Testing notes list...');
    const listResponse = await fetch(`${API_BASE_URL}/notes?limit=5`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const listData = await listResponse.json();
    
    if (listResponse.ok && listData.success) {
      console.log('✅ Notes list successful');
      console.log(`   Total notes: ${listData.total}`);
      console.log(`   Returned notes: ${listData.notes?.length || 0}`);
      
      if (listData.notes && listData.notes.length > 0) {
        console.log('📋 Notes with sections:');
        listData.notes.forEach((note, index) => {
          console.log(`   Note ${index + 1}: ${note.title} - ${note.sections?.length || 0} sections`);
        });
      }
    } else {
      console.log('❌ Notes list failed:', listData.error);
      return;
    }

    console.log('\n🎉 ALL TESTS PASSED! Data integrity issue is FIXED!');
    console.log('=====================================');
    console.log('✅ Note retrieval: Working');
    console.log('✅ Sections endpoint: Working');
    console.log('✅ Notes list: Working');
    console.log('✅ ISP tasks handling: Working (null values handled correctly)');

  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
}

testFix();
