require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function diagnoseProfiles() {
  console.log('🔍 Diagnosing user profile issues...');
  
  // Use the correct environment variable name
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // This is the correct name from .env
  );
  
  try {
    // Get all auth users
    console.log('📊 Fetching auth users...');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }
    
    console.log('📊 Total auth users:', authData.users.length);
    
    // Get all user profiles
    console.log('📊 Fetching user profiles...');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*');
      
    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError);
      return;
    }
    
    console.log('📊 Total user profiles:', profiles.length);
    
    // Check for duplicates
    const userIdCounts = {};
    profiles.forEach(profile => {
      userIdCounts[profile.user_id] = (userIdCounts[profile.user_id] || 0) + 1;
    });
    
    const duplicates = Object.entries(userIdCounts).filter(([userId, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log('🚨 DUPLICATE PROFILES FOUND:');
      duplicates.forEach(([userId, count]) => {
        console.log(`   User ID: ${userId} - Count: ${count}`);
        const userProfiles = profiles.filter(p => p.user_id === userId);
        userProfiles.forEach((profile, index) => {
          console.log(`     Profile ${index + 1}: ID=${profile.id}, Created=${profile.created_at}`);
        });
      });
    } else {
      console.log('✅ No duplicate profiles found');
    }
    
    // Check for orphaned auth users (no profile)
    const profileUserIds = new Set(profiles.map(p => p.user_id));
    const orphanedUsers = authData.users.filter(user => !profileUserIds.has(user.id));
    
    if (orphanedUsers.length > 0) {
      console.log('👻 ORPHANED AUTH USERS (no profile):');
      orphanedUsers.forEach(user => {
        console.log(`   Email: ${user.email} - ID: ${user.id}`);
      });
    } else {
      console.log('✅ No orphaned auth users found');
    }
    
    // Show current user details (demo user)
    const demoUser = authData.users.find(u => u.email === 'demo@swiftnotes.com');
    if (demoUser) {
      console.log('\n🎯 DEMO USER ANALYSIS:');
      console.log(`   Auth ID: ${demoUser.id}`);
      console.log(`   Email: ${demoUser.email}`);
      
      const demoProfiles = profiles.filter(p => p.user_id === demoUser.id);
      console.log(`   Profile count: ${demoProfiles.length}`);
      
      if (demoProfiles.length === 0) {
        console.log('   ❌ NO PROFILE FOUND - This is the problem!');
      } else if (demoProfiles.length > 1) {
        console.log('   ❌ MULTIPLE PROFILES FOUND - This is the problem!');
        demoProfiles.forEach((profile, index) => {
          console.log(`     Profile ${index + 1}: ${JSON.stringify(profile, null, 2)}`);
        });
      } else {
        console.log('   ✅ Single profile found:');
        console.log(`     ${JSON.stringify(demoProfiles[0], null, 2)}`);
      }
    }
    
    console.log('\n✅ Diagnosis complete');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  }
}

diagnoseProfiles();
