#!/usr/bin/env node

/**
 * Test available Supabase functions
 */

const { createClient } = require('@supabase/supabase-js');

// Environment variables
const supabaseUrl = 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA';

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testFunctions() {
  try {
    console.log('🔍 Testing Supabase functions...');
    
    // Test 1: Check current table structure
    console.log('📊 Checking current isp_tasks table structure...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'isp_tasks')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('❌ Error checking table structure:', tableError);
    } else {
      console.log('✅ Current isp_tasks columns:');
      tableInfo.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    // Test 2: Check available functions
    console.log('\n🔧 Checking available functions...');
    
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_schema', 'public')
      .like('routine_name', '%sql%');
    
    if (funcError) {
      console.error('❌ Error checking functions:', funcError);
    } else {
      console.log('✅ Available SQL-related functions:');
      functions.forEach(func => {
        console.log(`  - ${func.routine_name} (${func.routine_type})`);
      });
    }
    
    // Test 3: Try to get a sample task
    console.log('\n📝 Testing current task structure...');
    
    const { data: sampleTask, error: sampleError } = await supabase
      .from('isp_tasks')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Error getting sample task:', sampleError);
    } else if (sampleTask && sampleTask.length > 0) {
      console.log('✅ Sample task structure:');
      console.log(JSON.stringify(sampleTask[0], null, 2));
    } else {
      console.log('📝 No tasks found in database');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testFunctions()
    .then(() => {
      console.log('\n✨ Test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testFunctions };
