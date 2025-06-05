/**
 * Check existing users in the database
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsers() {
  console.log('🔍 Checking existing users...\n');

  try {
    // Get all user profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError);
      return;
    }

    console.log(`📊 Found ${profiles.length} user profiles:`);
    
    profiles.forEach((profile, i) => {
      console.log(`\n${i + 1}. User Profile:`);
      console.log(`   - ID: ${profile.user_id}`);
      console.log(`   - Email: ${profile.email || 'Not set'}`);
      console.log(`   - Name: ${profile.first_name || ''} ${profile.last_name || ''}`);
      console.log(`   - Setup Complete: ${profile.has_completed_setup}`);
      console.log(`   - Writing Style: ${profile.writing_style ? 'Set' : 'Not set'}`);
      console.log(`   - Credits: ${profile.credits}`);
      console.log(`   - Tier: ${profile.tier}`);
      console.log(`   - Created: ${profile.created_at}`);
    });

    // Get auth users (if accessible)
    console.log('\n🔐 Checking auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('⚠️ Cannot access auth users:', authError.message);
    } else {
      console.log(`📊 Found ${authUsers.users.length} auth users:`);
      authUsers.users.forEach((user, i) => {
        console.log(`\n${i + 1}. Auth User:`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Created: ${user.created_at}`);
        console.log(`   - Last Sign In: ${user.last_sign_in_at || 'Never'}`);
      });
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkUsers();
