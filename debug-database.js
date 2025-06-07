// Direct database query to debug the note sections issue
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugDatabase() {
  console.log('🔍 SwiftNotes Database Debug Tool');
  console.log('==================================');

  try {
    // 1. Check total notes
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('id, title, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (notesError) {
      console.error('❌ Error fetching notes:', notesError);
      return;
    }

    console.log(`📋 Found ${notes.length} notes:`);
    notes.forEach((note, index) => {
      console.log(`   ${index + 1}. ${note.id} - "${note.title}" (User: ${note.user_id})`);
    });

    // 2. Check total note sections
    const { data: sections, error: sectionsError } = await supabase
      .from('note_sections')
      .select('id, note_id, user_prompt, generated_content, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (sectionsError) {
      console.error('❌ Error fetching sections:', sectionsError);
      return;
    }

    console.log(`\n📝 Found ${sections.length} note sections:`);
    sections.forEach((section, index) => {
      console.log(`   ${index + 1}. Section ${section.id}`);
      console.log(`      Note ID: ${section.note_id}`);
      console.log(`      Prompt: ${section.user_prompt?.substring(0, 50)}...`);
      console.log(`      Content: ${section.generated_content?.substring(0, 50)}...`);
      console.log(`      Created: ${section.created_at}`);
      console.log('');
    });

    // 3. Check for specific test notes
    const testNotes = notes.filter(note => note.title === 'Test Data Integrity Note');
    if (testNotes.length > 0) {
      console.log(`\n🧪 Found ${testNotes.length} test notes, checking their sections:`);
      
      for (const note of testNotes) {
        const { data: noteSections, error: noteSectionsError } = await supabase
          .from('note_sections')
          .select('*')
          .eq('note_id', note.id);

        if (noteSectionsError) {
          console.error(`❌ Error fetching sections for note ${note.id}:`, noteSectionsError);
          continue;
        }

        console.log(`   Note ${note.id}: ${noteSections.length} sections`);
        noteSections.forEach((section, index) => {
          console.log(`     Section ${index + 1}: ${section.id}`);
          console.log(`       Prompt: ${section.user_prompt?.substring(0, 30)}...`);
          console.log(`       Content: ${section.generated_content?.substring(0, 30)}...`);
        });
      }
    }

    // 4. Check RLS policies
    console.log('\n🔒 Checking RLS status:');
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('check_rls_status');

    if (rlsError) {
      console.log('⚠️  Could not check RLS status (this is normal)');
    } else {
      console.log('✅ RLS status checked');
    }

    // 5. Test user-specific query
    const demoUserId = '7db1b95f-4572-46f2-b023-1015983b1b92';
    console.log(`\n👤 Checking data for demo user (${demoUserId}):`);
    
    const { data: userNotes, error: userNotesError } = await supabase
      .from('notes')
      .select('id, title, created_at')
      .eq('user_id', demoUserId)
      .order('created_at', { ascending: false });

    if (userNotesError) {
      console.error('❌ Error fetching user notes:', userNotesError);
    } else {
      console.log(`   User has ${userNotes.length} notes`);
      
      for (const note of userNotes) {
        const { data: userSections, error: userSectionsError } = await supabase
          .from('note_sections')
          .select('id')
          .eq('note_id', note.id);

        if (userSectionsError) {
          console.error(`❌ Error fetching sections for note ${note.id}:`, userSectionsError);
        } else {
          console.log(`     Note "${note.title}": ${userSections.length} sections`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Database debug error:', error);
  }
}

debugDatabase();
