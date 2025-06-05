/**
 * Test Password Script
 * This script tests the specific password from the screenshot
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ppavdpzulvosmmkzqtgy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testPassword() {
  const email = 'bmar201989@gmail.com';
  const passwordFromScreenshot = 'ESrEB7qePjFRZ_2';
  const currentPassword = 'TestPassword123';
  
  console.log(`🔐 Testing passwords for: ${email}`);

  // Test the password from screenshot
  console.log('\n1. Testing password from screenshot: ESrEB7qePjFRZ_2');
  try {
    const { data: loginData1, error: loginError1 } = await supabase.auth.signInWithPassword({
      email: email,
      password: passwordFromScreenshot
    });

    if (loginError1) {
      console.log('❌ Screenshot password failed:', loginError1.message);
    } else {
      console.log('✅ Screenshot password works!');
      return;
    }
  } catch (error) {
    console.log('❌ Screenshot password error:', error.message);
  }

  // Test the current password
  console.log('\n2. Testing current password: TestPassword123');
  try {
    const { data: loginData2, error: loginError2 } = await supabase.auth.signInWithPassword({
      email: email,
      password: currentPassword
    });

    if (loginError2) {
      console.log('❌ Current password failed:', loginError2.message);
    } else {
      console.log('✅ Current password works!');
    }
  } catch (error) {
    console.log('❌ Current password error:', error.message);
  }

  // Update password to match screenshot
  console.log('\n3. Updating password to match screenshot...');
  try {
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    const user = authUsers.users.find(u => u.email === email);
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: passwordFromScreenshot
      }
    );

    if (updateError) {
      console.error('❌ Failed to update password:', updateError);
      return;
    }

    console.log('✅ Password updated to match screenshot');

    // Test again
    console.log('\n4. Testing updated password...');
    const { data: loginData3, error: loginError3 } = await supabase.auth.signInWithPassword({
      email: email,
      password: passwordFromScreenshot
    });

    if (loginError3) {
      console.log('❌ Updated password failed:', loginError3.message);
    } else {
      console.log('✅ Updated password works! Login should now work in the UI.');
    }

  } catch (error) {
    console.error('❌ Error updating password:', error);
  }
}

// Run the test
testPassword().catch(console.error);
