/**
 * Cleanup Orphaned Users Script
 * This script finds and cleans up users who exist in auth but have no profile
 */

const { createClient } = require('@supabase/supabase-js');

// Try to load dotenv if available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available, use hardcoded values
}

// Initialize Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL || 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function findOrphanedUsers() {
  console.log('🔍 Finding orphaned users...');

  try {
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      throw authError;
    }

    console.log(`Found ${authUsers.users.length} auth users`);

    // Get all user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id');

    if (profilesError) {
      throw profilesError;
    }

    console.log(`Found ${profiles.length} user profiles`);

    // Find users without profiles
    const profileUserIds = new Set(profiles.map(p => p.user_id));
    const orphanedUsers = authUsers.users.filter(user => !profileUserIds.has(user.id));

    console.log(`Found ${orphanedUsers.length} orphaned users`);

    return orphanedUsers;

  } catch (error) {
    console.error('❌ Error finding orphaned users:', error);
    return [];
  }
}

async function cleanupOrphanedUsers(orphanedUsers, options = {}) {
  const { dryRun = false, excludeEmails = [] } = options;
  
  console.log(`\n🧹 ${dryRun ? 'DRY RUN - ' : ''}Cleaning up ${orphanedUsers.length} orphaned users...`);

  let cleanedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const user of orphanedUsers) {
    try {
      // Skip excluded emails
      if (excludeEmails.some(email => user.email && user.email.includes(email))) {
        console.log(`⏭️  Skipping excluded user: ${user.email}`);
        skippedCount++;
        continue;
      }

      console.log(`${dryRun ? '🔍' : '🗑️'} ${dryRun ? 'Would delete' : 'Deleting'} orphaned user: ${user.email} (${user.id})`);

      if (!dryRun) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

        if (deleteError) {
          console.error(`   ❌ Failed to delete user ${user.email}:`, deleteError.message);
          errorCount++;
        } else {
          console.log(`   ✅ Successfully deleted user ${user.email}`);
          cleanedCount++;
        }
      } else {
        cleanedCount++;
      }

    } catch (error) {
      console.error(`   ❌ Exception deleting user ${user.email}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Cleanup Summary:`);
  console.log(`   ${dryRun ? 'Would clean' : 'Cleaned'}: ${cleanedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Errors: ${errorCount}`);

  return { cleanedCount, errorCount, skippedCount };
}

async function createMissingProfiles(orphanedUsers, options = {}) {
  const { dryRun = false } = options;
  
  console.log(`\n👤 ${dryRun ? 'DRY RUN - ' : ''}Creating missing profiles for ${orphanedUsers.length} users...`);

  let createdCount = 0;
  let errorCount = 0;

  for (const user of orphanedUsers) {
    try {
      console.log(`${dryRun ? '🔍' : '👤'} ${dryRun ? 'Would create' : 'Creating'} profile for: ${user.email} (${user.id})`);

      if (!dryRun) {
        // Extract metadata
        const firstName = user.user_metadata?.first_name || user.raw_user_meta_data?.first_name || null;
        const lastName = user.user_metadata?.last_name || user.raw_user_meta_data?.last_name || null;

        // Create profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            first_name: firstName,
            last_name: lastName,
            tier: 'free',
            credits: 10,
            has_completed_setup: false
          })
          .select()
          .single();

        if (profileError) {
          console.error(`   ❌ Failed to create profile for ${user.email}:`, profileError.message);
          errorCount++;
          continue;
        }

        // Create initial credits
        const { error: creditsError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            transaction_type: 'bonus',
            amount: 10,
            description: 'Welcome bonus - free tier starting credits'
          });

        if (creditsError) {
          console.error(`   ⚠️ Profile created but credits failed for ${user.email}:`, creditsError.message);
        }

        console.log(`   ✅ Successfully created profile for ${user.email}`);
        createdCount++;
      } else {
        createdCount++;
      }

    } catch (error) {
      console.error(`   ❌ Exception creating profile for ${user.email}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Profile Creation Summary:`);
  console.log(`   ${dryRun ? 'Would create' : 'Created'}: ${createdCount}`);
  console.log(`   Errors: ${errorCount}`);

  return { createdCount, errorCount };
}

async function main() {
  console.log('🚀 Starting orphaned users cleanup...\n');

  // Find orphaned users
  const orphanedUsers = await findOrphanedUsers();

  if (orphanedUsers.length === 0) {
    console.log('✅ No orphaned users found!');
    return;
  }

  // Show orphaned users
  console.log('\n📋 Orphaned users found:');
  orphanedUsers.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.email} (${user.id}) - Created: ${user.created_at}`);
  });

  // Ask user what to do
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise(resolve => rl.question(query, resolve));

  try {
    console.log('\nOptions:');
    console.log('1. Delete orphaned users (cleanup)');
    console.log('2. Create missing profiles (repair)');
    console.log('3. Dry run - show what would be done');
    console.log('4. Exit');

    const choice = await question('\nWhat would you like to do? (1-4): ');

    switch (choice) {
      case '1':
        await cleanupOrphanedUsers(orphanedUsers, { 
          excludeEmails: ['demo', 'admin'] // Don't delete demo/admin users
        });
        break;
      
      case '2':
        await createMissingProfiles(orphanedUsers);
        break;
      
      case '3':
        console.log('\n--- DRY RUN MODE ---');
        await cleanupOrphanedUsers(orphanedUsers, { dryRun: true });
        await createMissingProfiles(orphanedUsers, { dryRun: true });
        break;
      
      case '4':
        console.log('👋 Exiting...');
        break;
      
      default:
        console.log('❌ Invalid choice');
    }

  } finally {
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { findOrphanedUsers, cleanupOrphanedUsers, createMissingProfiles };
