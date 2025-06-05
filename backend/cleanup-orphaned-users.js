/**
 * Cleanup Orphaned Users Script
 * Removes users from Supabase Auth who don't have corresponding profiles
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

async function cleanupOrphanedUsers() {
  try {
    console.log('🧹 Starting cleanup of orphaned users...\n');

    // Get all users from Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return false;
    }

    console.log(`📊 Found ${authUsers.users.length} users in Supabase Auth`);

    // Get all user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id');

    if (profilesError) {
      console.error('❌ Error fetching user profiles:', profilesError);
      return false;
    }

    console.log(`📊 Found ${profiles.length} user profiles in database`);

    // Find orphaned users (users in auth but not in profiles)
    const profileUserIds = new Set(profiles.map(p => p.user_id));
    const orphanedUsers = authUsers.users.filter(user => !profileUserIds.has(user.id));

    // Find orphaned profiles (profiles without auth users)
    const authUserIds = new Set(authUsers.users.map(u => u.id));
    const orphanedProfiles = profiles.filter(profile => !authUserIds.has(profile.user_id));

    console.log(`🔍 Found ${orphanedUsers.length} orphaned auth users`);
    console.log(`🔍 Found ${orphanedProfiles.length} orphaned profiles`);

    if (orphanedUsers.length === 0 && orphanedProfiles.length === 0) {
      console.log('✅ No orphaned data found. Database is clean!');
      return true;
    }

    // Clean up orphaned users
    let cleanedUsersCount = 0;
    let cleanedProfilesCount = 0;
    let errorCount = 0;

    // Clean up orphaned auth users
    for (const user of orphanedUsers) {
      try {
        console.log(`🗑️  Deleting orphaned auth user: ${user.email} (${user.id})`);

        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

        if (deleteError) {
          console.error(`   ❌ Failed to delete user ${user.email}:`, deleteError.message);
          errorCount++;
        } else {
          console.log(`   ✅ Successfully deleted user ${user.email}`);
          cleanedUsersCount++;
        }
      } catch (error) {
        console.error(`   ❌ Exception deleting user ${user.email}:`, error.message);
        errorCount++;
      }
    }

    // Clean up orphaned profiles
    for (const profile of orphanedProfiles) {
      try {
        console.log(`🗑️  Deleting orphaned profile: ${profile.user_id}`);

        const { error: deleteError } = await supabase
          .from('user_profiles')
          .delete()
          .eq('user_id', profile.user_id);

        if (deleteError) {
          console.error(`   ❌ Failed to delete profile ${profile.user_id}:`, deleteError.message);
          errorCount++;
        } else {
          console.log(`   ✅ Successfully deleted profile ${profile.user_id}`);
          cleanedProfilesCount++;
        }
      } catch (error) {
        console.error(`   ❌ Exception deleting profile ${profile.user_id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Cleanup Results:`);
    console.log(`   ✅ Successfully cleaned auth users: ${cleanedUsersCount}`);
    console.log(`   ✅ Successfully cleaned profiles: ${cleanedProfilesCount}`);
    console.log(`   ❌ Failed operations: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 All orphaned users cleaned up successfully!');
      return true;
    } else {
      console.log('\n⚠️  Some users could not be cleaned up. Check the errors above.');
      return false;
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return false;
  }
}

async function verifyCleanup() {
  try {
    console.log('\n🔍 Verifying cleanup...');

    // Get all users from Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return false;
    }

    // Get all user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id');

    if (profilesError) {
      console.error('❌ Error fetching user profiles:', profilesError);
      return false;
    }

    // Check for orphaned data
    const profileUserIds = new Set(profiles.map(p => p.user_id));
    const authUserIds = new Set(authUsers.users.map(u => u.id));
    const orphanedUsers = authUsers.users.filter(user => !profileUserIds.has(user.id));
    const orphanedProfiles = profiles.filter(profile => !authUserIds.has(profile.user_id));

    console.log(`📊 Verification Results:`);
    console.log(`   - Auth users: ${authUsers.users.length}`);
    console.log(`   - User profiles: ${profiles.length}`);
    console.log(`   - Orphaned auth users: ${orphanedUsers.length}`);
    console.log(`   - Orphaned profiles: ${orphanedProfiles.length}`);

    if (orphanedUsers.length === 0 && orphanedProfiles.length === 0) {
      console.log('✅ Verification passed: No orphaned data found!');
      return true;
    } else {
      console.log('❌ Verification failed: Still have orphaned data');

      if (orphanedUsers.length > 0) {
        console.log('   Orphaned auth users:');
        orphanedUsers.forEach(user => {
          console.log(`     - ${user.email} (${user.id})`);
        });
      }

      if (orphanedProfiles.length > 0) {
        console.log('   Orphaned profiles:');
        orphanedProfiles.forEach(profile => {
          console.log(`     - ${profile.user_id}`);
        });
      }

      return false;
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

async function runCleanup() {
  console.log('🚀 SwiftNotes Orphaned Users Cleanup\n');
  
  const cleanupSuccess = await cleanupOrphanedUsers();
  const verificationSuccess = await verifyCleanup();
  
  if (cleanupSuccess && verificationSuccess) {
    console.log('\n🎉 Cleanup completed successfully!');
    console.log('✅ Database is now clean and ready for testing.');
    return true;
  } else {
    console.log('\n⚠️  Cleanup completed with issues. Check the logs above.');
    return false;
  }
}

if (require.main === module) {
  runCleanup()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal cleanup error:', error);
      process.exit(1);
    });
}

module.exports = { cleanupOrphanedUsers, verifyCleanup };
