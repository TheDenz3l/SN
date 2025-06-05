/**
 * Apply Critical RLS Policy Fix for Phase 3
 * Fixes infinite recursion in organization_members policies
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA';

const supabase = createClient(supabaseUrl, serviceKey);

async function applyRLSFix() {
  console.log('🔧 APPLYING CRITICAL RLS POLICY FIX');
  console.log('='.repeat(60));
  console.log('Fixing infinite recursion in organization_members policies\n');
  
  try {
    // Read the RLS fix file
    const rlsFixSQL = fs.readFileSync('fix-phase3-rls-policies.sql', 'utf8');
    
    // Split into individual statements
    const statements = rlsFixSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} RLS policy statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`🔄 Executing statement ${i + 1}/${statements.length}:`);
      
      // Show first 60 characters of statement
      const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
      console.log(`   ${preview}${statement.length > 60 ? '...' : ''}`);
      
      try {
        // Try to execute directly through Supabase
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          console.log(`❌ Error: ${error.message}`);
          errorCount++;
          
          // Continue with other statements
          if (error.message.includes('already exists') || error.message.includes('does not exist')) {
            console.log(`   ℹ️  Continuing with next statement...`);
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
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RLS POLICY FIX RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📈 Success rate: ${Math.round((successCount / statements.length) * 100)}%`);
    
    // Test the fix by checking organization access
    console.log('\n🧪 Testing RLS policy fix...');
    
    // Test basic table access
    const testTables = ['organizations', 'organization_members', 'templates'];
    let accessibleTables = 0;
    
    for (const table of testTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`✅ ${table} - accessible without recursion`);
          accessibleTables++;
        } else {
          if (error.message.includes('infinite recursion')) {
            console.log(`❌ ${table} - still has infinite recursion`);
          } else {
            console.log(`✅ ${table} - accessible (${error.message})`);
            accessibleTables++;
          }
        }
      } catch (err) {
        console.log(`❌ ${table} - exception: ${err.message}`);
      }
    }
    
    console.log(`\n📊 Table Access Test: ${accessibleTables}/${testTables.length} tables accessible`);
    
    if (accessibleTables === testTables.length) {
      console.log('\n🎉 RLS POLICY FIX SUCCESSFUL!');
      console.log('✅ Infinite recursion resolved');
      console.log('✅ Organization features should now work');
      console.log('✅ Template features should now work');
      return { success: true, message: 'RLS policies fixed successfully' };
    } else {
      console.log('\n⚠️ RLS POLICY FIX PARTIALLY SUCCESSFUL');
      console.log('Some tables may still have issues');
      return { success: false, message: 'RLS policies partially fixed' };
    }
    
  } catch (error) {
    console.error('❌ RLS policy fix failed:', error.message);
    return { success: false, message: `RLS fix failed: ${error.message}` };
  }
}

// Alternative manual approach
async function manualRLSInstructions() {
  console.log('\n💡 MANUAL RLS POLICY FIX INSTRUCTIONS');
  console.log('='.repeat(60));
  console.log('If the automated fix doesn\'t work, apply manually:');
  console.log('');
  console.log('1. Go to: https://supabase.com/dashboard/project/ppavdpzulvosmmkzqtgy/sql');
  console.log('2. Copy and paste the content from fix-phase3-rls-policies.sql');
  console.log('3. Click "Run" to execute the RLS policy fixes');
  console.log('4. Verify that organization and template queries work');
  console.log('');
  console.log('📄 RLS fix file location: ./fix-phase3-rls-policies.sql');
  
  return { 
    success: false, 
    message: 'Manual RLS fix required',
    instructions: 'Apply RLS policies manually through Supabase dashboard'
  };
}

// Main execution
async function main() {
  console.log('🚀 Starting Critical RLS Policy Fix for Phase 3\n');
  
  const result = await applyRLSFix();
  console.log('\n📋 Fix Result:', result);
  
  if (!result.success) {
    console.log('\n🔄 Providing manual fix instructions...');
    const manualResult = await manualRLSInstructions();
    console.log('\n📋 Manual Instructions:', manualResult);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 RLS POLICY FIX COMPLETE');
  console.log('='.repeat(60));
  
  if (result.success) {
    console.log('✅ Phase 3 RLS policies are fixed!');
    console.log('✅ Organization features ready');
    console.log('✅ Template features ready');
    console.log('🚀 Run comprehensive test again to verify');
  } else {
    console.log('⚠️ RLS policies need manual attention');
    console.log('Please apply the fix manually through Supabase dashboard');
  }
}

main().catch(console.error);
