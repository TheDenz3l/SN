/**
 * Cleanup Test Data Script
 * Removes test users and data for clean testing
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

async function cleanupTestData() {
  try {
    console.log('🧹 Cleaning up test data...');

    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    console.log(`Found ${users.users.length} users`);

    // Delete test users (those with test emails)
    for (const user of users.users) {
      if (user.email && (user.email.includes('test') || user.email.includes('example.com'))) {
        console.log(`Deleting test user: ${user.email}`);
        
        // Delete user profile first
        await supabase
          .from('user_profiles')
          .delete()
          .eq('user_id', user.id);
        
        // Delete user from auth
        await supabase.auth.admin.deleteUser(user.id);
      }
    }

    console.log('✅ Test data cleanup completed');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

if (require.main === module) {
  cleanupTestData()
    .then(() => {
      console.log('Cleanup finished');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal cleanup error:', error);
      process.exit(1);
    });
}

module.exports = { cleanupTestData };
