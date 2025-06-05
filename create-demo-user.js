/**
 * Create Demo User Script
 * Creates the demo user with correct credentials for testing
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

async function createDemoUser() {
  console.log('🚀 Creating Demo User for SwiftNotes...');
  
  const demoCredentials = {
    email: 'demo@swiftnotes.app',
    password: 'demo123',
    firstName: 'Demo',
    lastName: 'User'
  };

  try {
    // Check if demo user already exists
    console.log('🔍 Checking if demo user exists...');
    const { data: existingUsers, error: searchError } = await supabase.auth.admin.listUsers();
    
    if (searchError) {
      console.error('❌ Error searching for users:', searchError);
      return;
    }

    const existingUser = existingUsers.users.find(user => user.email === demoCredentials.email);
    
    if (existingUser) {
      console.log('✅ Demo user already exists:', existingUser.id);
      
      // Update password to ensure it's correct
      console.log('🔄 Updating demo user password...');
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: demoCredentials.password }
      );
      
      if (updateError) {
        console.error('❌ Error updating password:', updateError);
      } else {
        console.log('✅ Demo user password updated successfully');
      }
      
      // Test login
      console.log('🧪 Testing demo user login...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: demoCredentials.email,
        password: demoCredentials.password
      });
      
      if (loginError) {
        console.error('❌ Demo user login failed:', loginError.message);
      } else {
        console.log('✅ Demo user login successful!');
        console.log('   User ID:', loginData.user.id);
        console.log('   Email:', loginData.user.email);
      }
      
      return;
    }

    // Create new demo user
    console.log('📝 Creating new demo user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: demoCredentials.email,
      password: demoCredentials.password,
      email_confirm: true,
      user_metadata: {
        first_name: demoCredentials.firstName,
        last_name: demoCredentials.lastName
      }
    });

    if (authError) {
      console.error('❌ Error creating demo user:', authError);
      return;
    }

    console.log('✅ Demo user created successfully!');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);

    // Wait for profile trigger to create profile
    console.log('⏳ Waiting for profile creation...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify profile was created
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) {
      console.log('⚠️ Profile not found, creating manually...');
      
      // Create profile manually
      const { data: newProfile, error: createProfileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          first_name: demoCredentials.firstName,
          last_name: demoCredentials.lastName,
          tier: 'free',
          credits: 10,
          has_completed_setup: false
        })
        .select()
        .single();

      if (createProfileError) {
        console.error('❌ Error creating profile:', createProfileError);
      } else {
        console.log('✅ Profile created manually');
      }
    } else {
      console.log('✅ Profile created automatically');
    }

    // Test login
    console.log('🧪 Testing demo user login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: demoCredentials.email,
      password: demoCredentials.password
    });

    if (loginError) {
      console.error('❌ Demo user login failed:', loginError.message);
    } else {
      console.log('✅ Demo user login successful!');
      console.log('   User ID:', loginData.user.id);
      console.log('   Email:', loginData.user.email);
    }

    console.log('\n🎉 Demo User Setup Complete!');
    console.log('📋 Demo Credentials:');
    console.log(`   Email: ${demoCredentials.email}`);
    console.log(`   Password: ${demoCredentials.password}`);
    console.log('\n🌐 You can now use these credentials to sign in to SwiftNotes');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createDemoUser().catch(console.error);
