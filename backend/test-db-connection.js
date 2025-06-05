/**
 * Test Database Connection
 * Verifies Supabase connection and database schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', process.env.SUPABASE_URL);
    console.log('Service Key:', process.env.SUPABASE_SERVICE_KEY ? 'Present' : 'Missing');

    // Test basic connection
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Auth connection failed:', usersError);
      return false;
    }

    console.log('✅ Auth connection successful');
    console.log(`Found ${users.users.length} users in auth`);

    // Test database tables
    const tables = ['user_profiles', 'isp_tasks', 'notes', 'note_sections', 'user_credits'];
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`❌ Table '${table}' error:`, error);
        } else {
          console.log(`✅ Table '${table}' accessible, ${count || 0} rows`);
        }
      } catch (err) {
        console.error(`❌ Table '${table}' exception:`, err.message);
      }
    }

    // Test creating a simple user profile
    console.log('\n🔍 Testing user creation...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123',
      email_confirm: true
    });

    if (authError) {
      console.error('❌ User creation failed:', authError);
      return false;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        first_name: 'Test',
        last_name: 'User',
        tier: 'free',
        credits: 10,
        has_completed_setup: false
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError);
      
      // Cleanup auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return false;
    }

    console.log('✅ Profile created successfully:', profile.id);

    // Cleanup test user
    await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', authData.user.id);
    
    await supabase.auth.admin.deleteUser(authData.user.id);
    
    console.log('✅ Test user cleaned up');

    return true;

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testConnection()
    .then(success => {
      if (success) {
        console.log('\n🎉 Database connection and schema are working correctly!');
        process.exit(0);
      } else {
        console.log('\n❌ Database connection or schema issues detected');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal test error:', error);
      process.exit(1);
    });
}

module.exports = { testConnection };
