/**
 * Fix Demo User Profile Script
 * Ensures the demo user has a proper profile
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL || 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixDemoProfile() {
  console.log('🔧 Fixing Demo User Profile...');
  
  const demoEmail = 'demo@swiftnotes.app';

  try {
    // Find demo user
    console.log('🔍 Finding demo user...');
    const { data: users, error: searchError } = await supabase.auth.admin.listUsers();
    
    if (searchError) {
      console.error('❌ Error searching for users:', searchError);
      return;
    }

    const demoUser = users.users.find(user => user.email === demoEmail);
    
    if (!demoUser) {
      console.error('❌ Demo user not found');
      return;
    }

    console.log('✅ Demo user found:', demoUser.id);

    // Check if profile exists
    console.log('🔍 Checking profile...');
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', demoUser.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', profileError);
      return;
    }

    if (existingProfile) {
      console.log('✅ Profile exists, updating...');
      
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          first_name: 'Demo',
          last_name: 'User',
          tier: 'free',
          credits: 10,
          has_completed_setup: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', demoUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating profile:', updateError);
      } else {
        console.log('✅ Profile updated successfully');
        console.log('   Profile:', updatedProfile);
      }
    } else {
      console.log('📝 Creating new profile...');
      
      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: demoUser.id,
          first_name: 'Demo',
          last_name: 'User',
          tier: 'free',
          credits: 10,
          has_completed_setup: true
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating profile:', createError);
      } else {
        console.log('✅ Profile created successfully');
        console.log('   Profile:', newProfile);
      }
    }

    // Test login again
    console.log('\n🧪 Testing login after profile fix...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: 'demo123'
    });

    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
    } else {
      console.log('✅ Login successful!');
      
      // Get profile data
      const { data: profileData, error: getProfileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', loginData.user.id)
        .single();

      if (getProfileError) {
        console.error('❌ Error getting profile:', getProfileError);
      } else {
        console.log('✅ Profile retrieved successfully');
        console.log('   Profile data:', profileData);
      }
    }

    console.log('\n🎉 Demo Profile Fix Complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
fixDemoProfile().catch(console.error);
