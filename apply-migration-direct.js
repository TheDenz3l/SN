/**
 * Direct Migration Application
 * Apply the writing analytics migration directly to Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA';

const supabase = createClient(supabaseUrl, serviceKey);

async function checkTables() {
  console.log('🔍 Checking existing tables...');
  
  try {
    // Check if user_profiles table exists and get its structure
    const { data: userProfiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.log('❌ user_profiles table not found:', profileError.message);
      return false;
    }
    
    console.log('✅ user_profiles table exists');
    
    // Check if our new tables exist
    const { data: analytics, error: analyticsError } = await supabase
      .from('user_writing_analytics')
      .select('*')
      .limit(1);
    
    if (analyticsError) {
      console.log('ℹ️  user_writing_analytics table does not exist yet (expected)');
    } else {
      console.log('✅ user_writing_analytics table already exists');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    return false;
  }
}

async function addColumnsToUserProfiles() {
  console.log('📝 Adding new columns to user_profiles...');
  
  try {
    // Check current columns
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Cannot access user_profiles:', error);
      return false;
    }
    
    if (profiles && profiles.length > 0) {
      const profile = profiles[0];
      console.log('Current user_profiles columns:', Object.keys(profile));
      
      // Check if new columns already exist
      if (profile.hasOwnProperty('writing_style_confidence')) {
        console.log('✅ New columns already exist in user_profiles');
        return true;
      }
    }
    
    console.log('ℹ️  New columns need to be added via SQL editor');
    return true;
  } catch (error) {
    console.error('❌ Error checking user_profiles columns:', error);
    return false;
  }
}

async function testBasicFunctionality() {
  console.log('🧪 Testing basic functionality...');
  
  try {
    // Test basic table access
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, user_id, writing_style')
      .limit(1);
    
    if (profileError) {
      console.error('❌ Cannot access user_profiles:', profileError);
      return false;
    }
    
    console.log(`✅ Found ${profiles?.length || 0} user profiles`);
    
    // Test notes table
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('id, title')
      .limit(1);
    
    if (notesError) {
      console.error('❌ Cannot access notes:', notesError);
      return false;
    }
    
    console.log(`✅ Found ${notes?.length || 0} notes`);
    
    return true;
  } catch (error) {
    console.error('❌ Error testing functionality:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 SwiftNotes Writing Analytics Migration Check');
  console.log('==============================================\n');
  
  // Check basic connectivity and tables
  const tablesOk = await checkTables();
  if (!tablesOk) {
    console.error('❌ Basic table check failed');
    return;
  }
  
  // Check user_profiles columns
  const columnsOk = await addColumnsToUserProfiles();
  if (!columnsOk) {
    console.error('❌ Column check failed');
    return;
  }
  
  // Test basic functionality
  const functionalityOk = await testBasicFunctionality();
  if (!functionalityOk) {
    console.error('❌ Functionality test failed');
    return;
  }
  
  console.log('\n📋 Migration Status Summary:');
  console.log('============================');
  console.log('✅ Database connection: Working');
  console.log('✅ Basic tables: Present');
  console.log('ℹ️  New columns: Need to be added via SQL editor');
  console.log('ℹ️  New tables: Need to be created via SQL editor');
  console.log('ℹ️  New functions: Need to be created via SQL editor');
  
  console.log('\n🎯 Next Steps:');
  console.log('==============');
  console.log('1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/ppavdpzulvosmmkzqtgy/sql/new');
  console.log('2. Copy and paste the contents of database-migration-writing-analytics.sql');
  console.log('3. Run the SQL to create new tables and columns');
  console.log('4. Copy and paste the contents of writing-analytics-functions.sql');
  console.log('5. Run the SQL to create the new functions');
  console.log('6. Restart the backend server');
  
  console.log('\n📄 Files to apply:');
  console.log('==================');
  console.log('- database-migration-writing-analytics.sql');
  console.log('- writing-analytics-functions.sql');
}

main().catch(console.error);
