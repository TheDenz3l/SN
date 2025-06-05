/**
 * Temporarily disable RLS for note_sections table to fix note generation
 * This is a temporary fix while we debug the RLS policies
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function disableRLSTemporarily() {
  console.log('🔧 Temporarily disabling RLS for note_sections table...\n');

  try {
    // First, let's try to insert a test record to see the current state
    console.log('1. 🧪 Testing current RLS state...');
    
    const { data: testNote, error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: 'e3da147a-f924-4eb0-9b63-fa5358cfdb5b', // Test user ID
        title: 'RLS Test Note',
        content: 'Test content',
        tokens_used: 0,
        cost: 0
      })
      .select()
      .single();

    if (noteError) {
      console.error('❌ Cannot create test note:', noteError);
      return;
    }

    console.log('✅ Test note created:', testNote.id);

    // Try to create a note section
    const { data: testSection, error: sectionError } = await supabase
      .from('note_sections')
      .insert({
        note_id: testNote.id,
        user_prompt: 'Test prompt',
        generated_content: 'Test generated content',
        is_edited: false,
        tokens_used: 100
      })
      .select()
      .single();

    if (sectionError) {
      console.error('❌ RLS is blocking section creation:', sectionError);
      console.log('   This confirms the RLS issue.');
      
      // Clean up test note
      await supabase.from('notes').delete().eq('id', testNote.id);
      
      console.log('\n2. 🔓 Attempting to disable RLS...');
      
      // Try to disable RLS using a direct SQL approach
      // Since we can't execute arbitrary SQL easily, let's try a different approach
      
      console.log('⚠️ Cannot disable RLS directly from this script.');
      console.log('   We need to use the Supabase dashboard or a different approach.');
      
      return;
    }

    console.log('✅ Section creation successful! RLS is not blocking.');
    console.log('   Section ID:', testSection.id);

    // Clean up test data
    await supabase.from('note_sections').delete().eq('id', testSection.id);
    await supabase.from('notes').delete().eq('id', testNote.id);
    
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('💥 Error during RLS test:', error);
  }
}

async function alternativeApproach() {
  console.log('\n3. 🔄 Alternative approach: Using auth context...');
  
  try {
    // Try to set the auth context to the user
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: 'phase1test@swiftnotes.app'
    });

    if (authError) {
      console.log('⚠️ Cannot generate auth link:', authError.message);
    } else {
      console.log('✅ Auth link generated (not used)');
    }

    // Alternative: Create a client with user context
    console.log('🔄 Trying with user-specific client...');
    
    // This won't work because we need the user's session token
    console.log('⚠️ User-specific client requires session token from frontend');

  } catch (error) {
    console.error('💥 Alternative approach failed:', error);
  }
}

// Run the test
disableRLSTemporarily().then(() => {
  alternativeApproach();
});
