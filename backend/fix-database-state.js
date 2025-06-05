require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function fixDatabaseState() {
  console.log('🔧 Fixing database state...');
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  try {
    // 1. Get all auth users
    console.log('📊 Fetching auth users...');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }
    
    console.log(`📊 Found ${authData.users.length} auth users`);
    
    // 2. Get all user profiles
    console.log('📊 Fetching user profiles...');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*');
      
    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError);
      return;
    }
    
    console.log(`📊 Found ${profiles.length} user profiles`);
    
    // 3. Find and fix duplicates
    const userIdCounts = {};
    profiles.forEach(profile => {
      userIdCounts[profile.user_id] = (userIdCounts[profile.user_id] || 0) + 1;
    });
    
    const duplicates = Object.entries(userIdCounts).filter(([userId, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.log('🚨 FIXING DUPLICATE PROFILES:');
      
      for (const [userId, count] of duplicates) {
        console.log(`   User ID: ${userId} - Count: ${count}`);
        
        // Get all profiles for this user
        const userProfiles = profiles.filter(p => p.user_id === userId);
        
        // Keep the most recent one (by created_at)
        userProfiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const keepProfile = userProfiles[0];
        const deleteProfiles = userProfiles.slice(1);
        
        console.log(`     Keeping profile: ${keepProfile.id} (${keepProfile.created_at})`);
        
        // Delete the older duplicates
        for (const profile of deleteProfiles) {
          console.log(`     Deleting profile: ${profile.id} (${profile.created_at})`);
          
          const { error: deleteError } = await supabase
            .from('user_profiles')
            .delete()
            .eq('id', profile.id);
            
          if (deleteError) {
            console.error(`     ❌ Failed to delete profile ${profile.id}:`, deleteError);
          } else {
            console.log(`     ✅ Deleted profile ${profile.id}`);
          }
        }
      }
    } else {
      console.log('✅ No duplicate profiles found');
    }
    
    // 4. Find and fix orphaned auth users (no profile)
    const profileUserIds = new Set(profiles.filter(p => !duplicates.some(([dupUserId]) => dupUserId === p.user_id)).map(p => p.user_id));
    const orphanedUsers = authData.users.filter(user => !profileUserIds.has(user.id));
    
    if (orphanedUsers.length > 0) {
      console.log('👻 FIXING ORPHANED AUTH USERS:');
      
      for (const user of orphanedUsers) {
        console.log(`   Creating profile for: ${user.email} (${user.id})`);
        
        const firstName = user.user_metadata?.first_name || user.raw_user_meta_data?.first_name || null;
        const lastName = user.user_metadata?.last_name || user.raw_user_meta_data?.last_name || null;
        
        const { data: newProfile, error: createError } = await supabase
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
          
        if (createError) {
          console.error(`   ❌ Failed to create profile:`, createError);
        } else {
          console.log(`   ✅ Created profile: ${newProfile.id}`);
          
          // Also create initial credit transaction
          await supabase
            .from('user_credits')
            .insert({
              user_id: user.id,
              transaction_type: 'bonus',
              amount: 10,
              description: 'Welcome bonus - free tier starting credits'
            });
        }
      }
    } else {
      console.log('✅ No orphaned auth users found');
    }
    
    // 5. Final verification
    console.log('\n🔍 Final verification...');
    const { data: finalProfiles } = await supabase
      .from('user_profiles')
      .select('*');
      
    const finalUserIdCounts = {};
    finalProfiles.forEach(profile => {
      finalUserIdCounts[profile.user_id] = (finalUserIdCounts[profile.user_id] || 0) + 1;
    });
    
    const finalDuplicates = Object.entries(finalUserIdCounts).filter(([userId, count]) => count > 1);
    
    if (finalDuplicates.length === 0) {
      console.log('✅ Database state fixed! No more duplicates.');
    } else {
      console.log('❌ Still have duplicates:', finalDuplicates);
    }
    
    console.log(`📊 Final state: ${authData.users.length} auth users, ${finalProfiles.length} profiles`);
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixDatabaseState();
