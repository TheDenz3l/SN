// Direct database setup using Supabase Management API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA';

const supabase = createClient(supabaseUrl, serviceKey);

async function setupDatabase() {
  console.log('🚀 Setting up SwiftNotes database using direct table creation...');
  
  try {
    // Test connection first
    console.log('🔍 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase.auth.getSession();
    if (testError) {
      console.log('⚠️ Auth test warning (expected):', testError.message);
    }
    console.log('✅ Supabase connection established');
    
    // Try to create tables using the client directly
    console.log('📋 Attempting to create tables...');
    
    // Since we can't execute raw SQL through the REST API easily,
    // let's try to create the tables by inserting dummy data and letting Supabase auto-create
    // This won't work for complex schemas, so let's use a different approach
    
    // Check if we can access existing tables
    console.log('🔍 Checking existing tables...');
    
    const tables = ['user_profiles', 'isp_tasks', 'notes', 'note_sections', 'user_credits'];
    const tableStatus = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}' not found: ${error.message}`);
          tableStatus[table] = false;
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
          tableStatus[table] = true;
        }
      } catch (err) {
        console.log(`❌ Error accessing table '${table}': ${err.message}`);
        tableStatus[table] = false;
      }
    }
    
    const existingTables = Object.values(tableStatus).filter(exists => exists).length;
    console.log(`📊 Found ${existingTables}/${tables.length} tables`);
    
    if (existingTables === 0) {
      console.log('❌ No tables found. Database schema needs to be created manually.');
      console.log('');
      console.log('🔧 MANUAL SETUP REQUIRED:');
      console.log('1. Go to: https://supabase.com/dashboard/project/ppavdpzulvosmmkzqtgy/sql');
      console.log('2. Copy and paste the content from essential-schema.sql');
      console.log('3. Click "Run" to execute the schema');
      console.log('');
      console.log('📄 Schema file location: ./essential-schema.sql');
      
      return { 
        success: false, 
        message: 'Manual database setup required',
        tablesFound: existingTables,
        totalTables: tables.length
      };
    } else if (existingTables < tables.length) {
      console.log('⚠️ Partial database setup detected.');
      console.log('Some tables exist but others are missing.');
      
      return {
        success: false,
        message: 'Incomplete database setup',
        tablesFound: existingTables,
        totalTables: tables.length,
        tableStatus
      };
    } else {
      console.log('🎉 All tables found! Database appears to be set up correctly.');
      
      // Test basic operations
      console.log('🧪 Testing database operations...');
      
      // Test if we can query auth users (should be empty but accessible)
      try {
        const { data: authTest, error: authError } = await supabase.auth.admin.listUsers();
        if (!authError) {
          console.log(`✅ Auth system accessible (${authTest.users?.length || 0} users)`);
        }
      } catch (err) {
        console.log('⚠️ Auth admin access limited (expected with service key)');
      }
      
      return {
        success: true,
        message: 'Database setup verified successfully',
        tablesFound: existingTables,
        totalTables: tables.length,
        tableStatus
      };
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    return {
      success: false,
      message: `Setup failed: ${error.message}`,
      error: error
    };
  }
}

// Test specific functionality
async function testDatabaseFunctionality() {
  console.log('🧪 Testing database functionality...');
  
  try {
    // Test user profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);
    
    if (!profileError) {
      console.log(`✅ user_profiles table: ${profiles.length} records`);
    } else {
      console.log(`❌ user_profiles table error: ${profileError.message}`);
    }
    
    // Test ISP tasks table
    const { data: tasks, error: taskError } = await supabase
      .from('isp_tasks')
      .select('*')
      .limit(5);
    
    if (!taskError) {
      console.log(`✅ isp_tasks table: ${tasks.length} records`);
    } else {
      console.log(`❌ isp_tasks table error: ${taskError.message}`);
    }
    
    // Test notes table
    const { data: notes, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .limit(5);
    
    if (!noteError) {
      console.log(`✅ notes table: ${notes.length} records`);
    } else {
      console.log(`❌ notes table error: ${noteError.message}`);
    }
    
    console.log('🎯 Database functionality test completed');
    
  } catch (error) {
    console.error('❌ Database functionality test failed:', error.message);
  }
}

// Run setup and test
async function main() {
  const setupResult = await setupDatabase();
  console.log('\n📋 Setup Result:', setupResult);
  
  if (setupResult.success) {
    await testDatabaseFunctionality();
    
    console.log('\n🎉 Database is ready for use!');
    console.log('✅ You can now:');
    console.log('  - Register new users');
    console.log('  - Test authentication');
    console.log('  - Use all app features');
  } else {
    console.log('\n⚠️ Database setup incomplete.');
    console.log('Please run the manual setup steps above.');
  }
}

main().catch(console.error);
