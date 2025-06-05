/**
 * Debug User Script
 * This script checks the specific user and their profile
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ppavdpzulvosmmkzqtgy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function debugUser() {
  const email = 'bmar201989@gmail.com';
  console.log(`🔍 Debugging user: ${email}`);

  try {
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      throw authError;
    }

    // Find the specific user
    const user = authUsers.users.find(u => u.email === email);
    if (!user) {
      console.log('❌ User not found in auth');
      return;
    }

    console.log('✅ User found in auth:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Created:', user.created_at);
    console.log('   Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
    console.log('   User metadata:', user.user_metadata);
    console.log('   Raw metadata:', user.raw_user_meta_data);

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.log('❌ Profile error:', profileError);
      return;
    }

    console.log('✅ Profile found:');
    console.log('   Profile ID:', profile.id);
    console.log('   First name:', profile.first_name);
    console.log('   Last name:', profile.last_name);
    console.log('   Tier:', profile.tier);
    console.log('   Credits:', profile.credits);
    console.log('   Setup completed:', profile.has_completed_setup);

    // Test login with Supabase directly
    console.log('\n🔐 Testing direct Supabase login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: email,
      password: 'TestPassword123'
    });

    if (loginError) {
      console.log('❌ Direct login failed:', loginError.message);
      
      // Try different passwords
      const passwords = ['TestPassword123', 'testpassword123', 'TestPassword', 'password123'];
      for (const pwd of passwords) {
        console.log(`   Trying password: ${pwd}`);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: pwd
        });
        if (!error) {
          console.log(`   ✅ Password works: ${pwd}`);
          break;
        }
      }
    } else {
      console.log('✅ Direct login successful!');
      console.log('   User ID:', loginData.user.id);
    }

  } catch (error) {
    console.error('❌ Error debugging user:', error);
  }
}

// Run the debug
debugUser().catch(console.error);
