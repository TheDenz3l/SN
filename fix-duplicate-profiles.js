const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findDuplicateProfiles() {
  console.log('🔍 Checking for duplicate user profiles...');
  
  try {
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('user_id, created_at');

    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return [];
    }

    console.log(`📊 Found ${profiles.length} total profiles`);

    // Group by user_id
    const userGroups = {};
    profiles.forEach(profile => {
      if (!userGroups[profile.user_id]) {
        userGroups[profile.user_id] = [];
      }
      userGroups[profile.user_id].push(profile);
    });

    // Find duplicates
    const duplicates = [];
    Object.entries(userGroups).forEach(([userId, userProfiles]) => {
      if (userProfiles.length > 1) {
        duplicates.push({
          userId,
          profiles: userProfiles,
          count: userProfiles.length
        });
      }
    });

    console.log(`🔍 Found ${duplicates.length} users with duplicate profiles`);
    
    duplicates.forEach(dup => {
      console.log(`   User ${dup.userId}: ${dup.count} profiles`);
      dup.profiles.forEach((profile, index) => {
        console.log(`     ${index + 1}. ID: ${profile.id}, Created: ${profile.created_at}, Setup: ${profile.has_completed_setup}`);
      });
    });

    return duplicates;
  } catch (error) {
    console.error('❌ Error checking duplicates:', error);
    return [];
  }
}

async function cleanupDuplicates(duplicates, dryRun = true) {
  console.log(`\n🧹 ${dryRun ? 'DRY RUN - ' : ''}Cleaning up duplicate profiles...`);
  
  let cleanedCount = 0;
  let errorCount = 0;

  for (const dup of duplicates) {
    try {
      // Sort profiles by created_at (newest first)
      const sortedProfiles = dup.profiles.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

      // Keep the newest profile (first in sorted array)
      const keepProfile = sortedProfiles[0];
      const deleteProfiles = sortedProfiles.slice(1);

      console.log(`\n👤 User ${dup.userId}:`);
      console.log(`   ✅ Keeping profile: ${keepProfile.id} (${keepProfile.created_at})`);
      
      for (const deleteProfile of deleteProfiles) {
        console.log(`   ${dryRun ? '🔍 Would delete' : '🗑️ Deleting'} profile: ${deleteProfile.id} (${deleteProfile.created_at})`);
        
        if (!dryRun) {
          const { error } = await supabase
            .from('user_profiles')
            .delete()
            .eq('id', deleteProfile.id);

          if (error) {
            console.error(`     ❌ Error deleting profile ${deleteProfile.id}:`, error.message);
            errorCount++;
          } else {
            console.log(`     ✅ Deleted profile ${deleteProfile.id}`);
            cleanedCount++;
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error processing user ${dup.userId}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Cleanup Summary:`);
  console.log(`   ${dryRun ? 'Would clean' : 'Cleaned'}: ${cleanedCount}`);
  console.log(`   Errors: ${errorCount}`);

  return { cleanedCount, errorCount };
}

async function main() {
  console.log('🚀 Starting duplicate profile cleanup...\n');

  // Find duplicates
  const duplicates = await findDuplicateProfiles();
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicate profiles found!');
    return;
  }

  // First run as dry run
  console.log('\n🔍 Running dry run first...');
  await cleanupDuplicates(duplicates, true);

  // Ask for confirmation (in a real scenario)
  console.log('\n⚠️  This is a dry run. To actually clean up duplicates, run with --execute flag');
  
  // Check if --execute flag is provided
  if (process.argv.includes('--execute')) {
    console.log('\n🚨 EXECUTING CLEANUP...');
    await cleanupDuplicates(duplicates, false);
    console.log('\n✅ Cleanup completed!');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { findDuplicateProfiles, cleanupDuplicates };
