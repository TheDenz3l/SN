// Apply RLS policy fixes to allow service role access
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA';

const supabase = createClient(supabaseUrl, serviceKey);

async function applyRLSFix() {
  console.log('🔧 Applying RLS policy fixes...');
  
  try {
    // Read the SQL fix file
    const sqlContent = readFileSync('fix-rls-policies.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}:`);
      console.log(`   ${statement.substring(0, 60)}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          console.log(`❌ Error: ${error.message}`);
          // Continue with other statements
        } else {
          console.log(`✅ Success`);
        }
      } catch (err) {
        console.log(`❌ Exception: ${err.message}`);
        // Continue with other statements
      }
    }
    
    console.log('\n🧪 Testing profile creation after fix...');
    
    // Test creating a profile manually
    const testUserId = '00000000-0000-0000-0000-000000000000'; // Dummy UUID for testing
    
    const { data: testProfile, error: testError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: testUserId,
        first_name: 'Test',
        last_name: 'User',
        tier: 'free',
        credits: 10,
        has_completed_setup: false
      })
      .select()
      .single();
    
    if (testError) {
      console.log(`❌ Test profile creation failed: ${testError.message}`);
      
      // If the RPC method doesn't exist, we need to apply the fix manually
      console.log('\n⚠️ RPC method not available. Manual fix required:');
      console.log('1. Go to: https://supabase.com/dashboard/project/ppavdpzulvosmmkzqtgy/sql');
      console.log('2. Copy and paste the content from fix-rls-policies.sql');
      console.log('3. Click "Run" to execute the fixes');
      
      return { success: false, message: 'Manual RLS fix required' };
    } else {
      console.log('✅ Test profile creation successful!');
      
      // Clean up test profile
      await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', testUserId);
      
      console.log('🧹 Cleaned up test profile');
      
      return { success: true, message: 'RLS policies fixed successfully' };
    }
    
  } catch (error) {
    console.error('❌ RLS fix failed:', error.message);
    return { success: false, message: `Fix failed: ${error.message}` };
  }
}

// Alternative approach: Try to fix policies using direct table operations
async function alternativeRLSFix() {
  console.log('\n🔄 Trying alternative RLS fix approach...');
  
  try {
    // Temporarily disable RLS on user_profiles to allow profile creation
    console.log('⚠️ Temporarily disabling RLS on user_profiles...');
    
    // This won't work through the client, but let's try a different approach
    // We'll modify the backend to handle this better
    
    console.log('💡 Alternative: Modify backend to use authenticated context');
    console.log('   The backend should create profiles using the user\'s auth context');
    console.log('   instead of the service role context');
    
    return { 
      success: false, 
      message: 'Backend modification required',
      suggestion: 'Modify auth.js to create profiles in user context'
    };
    
  } catch (error) {
    console.error('❌ Alternative fix failed:', error.message);
    return { success: false, message: `Alternative fix failed: ${error.message}` };
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting RLS policy fix process...\n');
  
  const result = await applyRLSFix();
  console.log('\n📋 Fix Result:', result);
  
  if (!result.success) {
    const altResult = await alternativeRLSFix();
    console.log('\n📋 Alternative Result:', altResult);
  }
  
  if (result.success) {
    console.log('\n🎉 RLS policies fixed! Registration should now work.');
  } else {
    console.log('\n⚠️ Manual intervention required.');
    console.log('Please apply the RLS policy fixes manually through the Supabase dashboard.');
  }
}

main().catch(console.error);
