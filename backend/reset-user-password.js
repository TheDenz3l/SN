/**
 * Reset User Password Script
 * This script resets the password for a specific user
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ppavdpzulvosmmkzqtgy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function resetUserPassword() {
  const email = 'bmar201989@gmail.com';
  const newPassword = 'TestPassword123';
  
  console.log(`🔧 Resetting password for user: ${email}`);

  try {
    // Get the user
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      throw authError;
    }

    const user = authUsers.users.find(u => u.email === email);
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', user.id);

    // Update the user with new password and confirm email
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          first_name: 'joe',
          last_name: 'lewis'
        }
      }
    );

    if (updateError) {
      console.error('❌ Failed to update user:', updateError);
      return;
    }

    console.log('✅ User updated successfully');

    // Update the profile to match
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        first_name: 'joe',
        last_name: 'lewis'
      })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('❌ Failed to update profile:', profileError);
    } else {
      console.log('✅ Profile updated successfully');
    }

    // Test the new password
    console.log('\n🔐 Testing new password...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: email,
      password: newPassword
    });

    if (loginError) {
      console.log('❌ Login still failed:', loginError.message);
    } else {
      console.log('✅ Login successful with new password!');
      console.log('   User ID:', loginData.user.id);
    }

  } catch (error) {
    console.error('❌ Error resetting password:', error);
  }
}

// Run the reset
resetUserPassword().catch(console.error);
