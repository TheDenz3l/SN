/**
 * Quick Fix for Auth Issue
 * This script creates missing profiles for orphaned users
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ppavdpzulvosmmkzqtgy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function fixAuthIssue() {
  console.log('🔧 Fixing auth issue by creating missing profiles...');

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

    if (orphanedUsers.length === 0) {
      console.log('✅ No orphaned users found!');
      return;
    }

    // Create profiles for orphaned users
    let createdCount = 0;
    let errorCount = 0;

    for (const user of orphanedUsers) {
      try {
        console.log(`👤 Creating profile for: ${user.email} (${user.id})`);

        // Extract metadata
        const firstName = user.user_metadata?.first_name || user.raw_user_meta_data?.first_name || null;
        const lastName = user.user_metadata?.last_name || user.raw_user_meta_data?.last_name || null;

        console.log(`   Metadata: ${firstName} ${lastName}`);

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
          console.error(`   ❌ Failed to create profile:`, profileError.message);
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
          console.error(`   ⚠️ Profile created but credits failed:`, creditsError.message);
        }

        console.log(`   ✅ Successfully created profile: ${profile.id}`);
        createdCount++;

      } catch (error) {
        console.error(`   ❌ Exception creating profile for ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${createdCount}`);
    console.log(`   Errors: ${errorCount}`);

    if (createdCount > 0) {
      console.log('\n🎉 Auth issue fixed! Users should now be able to log in.');
    }

  } catch (error) {
    console.error('❌ Error fixing auth issue:', error);
  }
}

// Run the fix
fixAuthIssue().catch(console.error);
