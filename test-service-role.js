/**
 * Test Service Role Permissions
 * This script tests if the service role can bypass RLS and insert data directly
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA';

console.log('🔧 Testing Service Role Permissions...\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Key (first 20 chars):', supabaseServiceKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testServiceRole() {
  try {
    console.log('1. 🔍 Testing basic connection...');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name')
      .limit(1);

    if (testError) {
      console.error('❌ Basic connection failed:', testError);
      return;
    }

    console.log('✅ Basic connection successful');
    console.log('   Sample user:', testData[0]);

    // Get a test user
    const testUser = testData[0];
    if (!testUser) {
      console.error('❌ No users found in database');
      return;
    }

    console.log('\n2. 📝 Testing note creation...');
    
    // Try to create a test note
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: testUser.user_id,
        title: 'Service Role Test Note - ' + new Date().toISOString(),
        content: 'Test note content',
        tokens_used: 0,
        cost: 0
      })
      .select()
      .single();

    if (noteError) {
      console.error('❌ Note creation failed:', noteError);
      console.error('   Error details:', JSON.stringify(noteError, null, 2));
      return;
    }

    console.log('✅ Note creation successful');
    console.log('   Note ID:', note.id);

    console.log('\n3. 📄 Testing note section creation...');
    
    // Try to create a test note section
    const { data: section, error: sectionError } = await supabase
      .from('note_sections')
      .insert({
        note_id: note.id,
        user_prompt: 'Test prompt for service role',
        generated_content: 'Test generated content from service role',
        is_edited: false,
        tokens_used: 100
      })
      .select()
      .single();

    if (sectionError) {
      console.error('❌ Note section creation failed:', sectionError);
      console.error('   Error details:', JSON.stringify(sectionError, null, 2));
      
      // Try to clean up the note
      await supabase.from('notes').delete().eq('id', note.id);
      return;
    }

    console.log('✅ Note section creation successful');
    console.log('   Section ID:', section.id);

    console.log('\n4. 🧹 Cleaning up test data...');
    
    // Clean up test data
    await supabase.from('note_sections').delete().eq('id', section.id);
    await supabase.from('notes').delete().eq('id', note.id);
    
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Service role permissions test PASSED!');
    console.log('   The service role can bypass RLS and create notes/sections.');

  } catch (error) {
    console.error('💥 Service role test failed with error:', error);
  }
}

async function checkRLSStatus() {
  console.log('\n5. 🔒 Checking RLS status...');
  
  try {
    // This is a workaround to check RLS status since we can't directly query pg_tables
    const { data, error } = await supabase.rpc('check_rls_status');
    
    if (error) {
      console.log('⚠️ Cannot check RLS status directly (expected)');
      console.log('   Error:', error.message);
    } else {
      console.log('✅ RLS status check result:', data);
    }
  } catch (err) {
    console.log('⚠️ RLS status check not available (expected)');
  }
}

// Run the tests
testServiceRole().then(() => {
  checkRLSStatus();
});
