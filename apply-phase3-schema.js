/**
 * Apply Phase 3 Database Schema Extensions
 * Adds team/organizational accounts, templates, and analytics features
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA';

const supabase = createClient(supabaseUrl, serviceKey);

async function applyPhase3Schema() {
  console.log('🚀 Starting Phase 3 database schema application...');
  
  try {
    // Read the schema file
    const schemaSQL = fs.readFileSync('phase3-schema-extensions.sql', 'utf8');
    
    // Split into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}:`);
      
      // Show first 80 characters of statement
      const preview = statement.substring(0, 80).replace(/\s+/g, ' ');
      console.log(`   ${preview}${statement.length > 80 ? '...' : ''}`);
      
      try {
        // Execute the SQL statement
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          console.log(`❌ Error: ${error.message}`);
          errorCount++;
          
          // Continue with other statements unless it's a critical error
          if (error.message.includes('already exists')) {
            console.log(`   ℹ️  Skipping - already exists`);
          } else if (error.message.includes('does not exist')) {
            console.log(`   ⚠️  Warning - dependency missing, continuing...`);
          }
        } else {
          console.log(`✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Exception: ${err.message}`);
        errorCount++;
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 PHASE 3 SCHEMA APPLICATION RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📈 Success rate: ${Math.round((successCount / statements.length) * 100)}%`);
    
    if (errorCount === 0) {
      console.log('🎉 All Phase 3 schema extensions applied successfully!');
    } else if (successCount > errorCount) {
      console.log('⚠️  Phase 3 schema mostly applied with some warnings');
    } else {
      console.log('❌ Phase 3 schema application had significant issues');
    }
    
    // Test the new schema by checking if key tables exist
    console.log('\n🧪 Testing new schema...');
    
    const testTables = [
      'organizations',
      'organization_members', 
      'templates',
      'user_analytics',
      'organization_analytics'
    ];
    
    let tablesExist = 0;
    for (const table of testTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`✅ Table '${table}' exists and accessible`);
          tablesExist++;
        } else {
          console.log(`❌ Table '${table}' not accessible: ${error.message}`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' test failed: ${err.message}`);
      }
    }
    
    console.log(`\n📊 Schema Test Results: ${tablesExist}/${testTables.length} tables accessible`);
    
    if (tablesExist === testTables.length) {
      console.log('🎉 Phase 3 schema is fully functional!');
      return { success: true, message: 'Phase 3 schema applied successfully' };
    } else {
      console.log('⚠️  Some Phase 3 tables may need manual attention');
      return { success: false, message: 'Phase 3 schema partially applied' };
    }
    
  } catch (error) {
    console.error('❌ Phase 3 schema application failed:', error.message);
    return { success: false, message: `Schema application failed: ${error.message}` };
  }
}

// Alternative approach if RPC doesn't work
async function alternativeSchemaApplication() {
  console.log('\n🔄 Trying alternative schema application approach...');
  
  try {
    // Try to create a simple test table to verify permissions
    const testSQL = `
      CREATE TABLE IF NOT EXISTS phase3_test (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        test_data TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: testSQL });
    
    if (error) {
      console.log('❌ Alternative approach failed - RPC not available');
      console.log('\n💡 Manual Schema Application Required:');
      console.log('1. Go to: https://supabase.com/dashboard/project/ppavdpzulvosmmkzqtgy/sql');
      console.log('2. Copy and paste the content from phase3-schema-extensions.sql');
      console.log('3. Click "Run" to execute the schema extensions');
      console.log('4. Verify that all tables are created successfully');
      
      return { 
        success: false, 
        message: 'Manual schema application required',
        instructions: 'Apply schema manually through Supabase dashboard'
      };
    } else {
      console.log('✅ Alternative approach successful - proceeding with full schema');
      
      // Clean up test table
      await supabase.rpc('exec_sql', { sql_query: 'DROP TABLE IF EXISTS phase3_test;' });
      
      return await applyPhase3Schema();
    }
    
  } catch (error) {
    console.error('❌ Alternative approach failed:', error.message);
    return { success: false, message: `Alternative approach failed: ${error.message}` };
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Phase 3 Database Schema Application\n');
  
  const result = await applyPhase3Schema();
  
  if (!result.success) {
    console.log('\n🔄 Trying alternative approach...');
    const altResult = await alternativeSchemaApplication();
    console.log('\n📋 Alternative Result:', altResult);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 PHASE 3 SCHEMA APPLICATION COMPLETE');
  console.log('='.repeat(60));
  
  if (result.success) {
    console.log('✅ Phase 3 database schema is ready!');
    console.log('✅ Team/organizational accounts enabled');
    console.log('✅ Template library system ready');
    console.log('✅ Advanced analytics infrastructure ready');
    console.log('✅ Admin panel database support ready');
  } else {
    console.log('⚠️  Phase 3 schema needs attention');
    console.log('Please review the errors above and apply fixes as needed');
  }
}

main().catch(console.error);
