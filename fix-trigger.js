/**
 * Fix Database Trigger for User Profile Creation
 * This script fixes the trigger function to properly handle user metadata
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

async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      console.error('SQL Error:', error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (error) {
    console.error('Exception:', error);
    return { success: false, error };
  }
}

async function fixTrigger() {
  console.log('🔧 Fixing database trigger for user profile creation...');

  // Drop existing trigger
  console.log('1. Dropping existing trigger...');
  await executeSQL(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`);

  // Create improved trigger function with better error handling
  console.log('2. Creating improved trigger function...');
  const triggerFunction = `
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    DECLARE
        first_name_val TEXT;
        last_name_val TEXT;
    BEGIN
        -- Log the trigger execution
        RAISE LOG 'handle_new_user trigger fired for user: %', NEW.id;
        
        -- Extract metadata with fallback handling
        BEGIN
            first_name_val := COALESCE(
                NEW.raw_user_meta_data->>'first_name',
                NEW.user_metadata->>'first_name'
            );
            last_name_val := COALESCE(
                NEW.raw_user_meta_data->>'last_name',
                NEW.user_metadata->>'last_name'
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE LOG 'Error extracting metadata for user %: %', NEW.id, SQLERRM;
            first_name_val := NULL;
            last_name_val := NULL;
        END;
        
        -- Log extracted values
        RAISE LOG 'Extracted metadata - first_name: %, last_name: %', first_name_val, last_name_val;
        
        -- Insert user profile
        BEGIN
            INSERT INTO public.user_profiles (user_id, first_name, last_name, credits)
            VALUES (
                NEW.id,
                first_name_val,
                last_name_val,
                10
            );
            
            RAISE LOG 'User profile created for user: %', NEW.id;
        EXCEPTION WHEN OTHERS THEN
            RAISE LOG 'Error creating user profile for %: %', NEW.id, SQLERRM;
            -- Don't fail the trigger, let the application handle it
        END;
        
        -- Insert initial credit transaction
        BEGIN
            INSERT INTO public.user_credits (user_id, transaction_type, amount, description)
            VALUES (
                NEW.id,
                'bonus',
                10,
                'Welcome bonus - free tier starting credits'
            );
            
            RAISE LOG 'Initial credits added for user: %', NEW.id;
        EXCEPTION WHEN OTHERS THEN
            RAISE LOG 'Error creating initial credits for %: %', NEW.id, SQLERRM;
            -- Don't fail the trigger, let the application handle it
        END;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  const result = await executeSQL(triggerFunction);
  if (!result.success) {
    console.error('❌ Failed to create trigger function:', result.error);
    return false;
  }

  // Create the trigger
  console.log('3. Creating trigger...');
  const createTrigger = `
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `;

  const triggerResult = await executeSQL(createTrigger);
  if (!triggerResult.success) {
    console.error('❌ Failed to create trigger:', triggerResult.error);
    return false;
  }

  console.log('✅ Trigger fixed successfully!');
  return true;
}

async function testTrigger() {
  console.log('\n🧪 Testing trigger with a test user...');
  
  const testEmail = `trigger-test-${Date.now()}@example.com`;
  
  try {
    // Create test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Trigger',
        last_name: 'Test'
      }
    });

    if (authError) {
      console.error('❌ Test user creation failed:', authError);
      return false;
    }

    console.log('✅ Test user created:', authData.user.id);

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if profile was created
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile not found:', profileError);
      
      // Cleanup
      await supabase.auth.admin.deleteUser(authData.user.id);
      return false;
    }

    console.log('✅ Profile created successfully:', {
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      credits: profile.credits
    });

    // Check credits
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', authData.user.id);

    if (creditsError || !credits.length) {
      console.error('❌ Credits not found:', creditsError);
    } else {
      console.log('✅ Credits created successfully:', credits[0]);
    }

    // Cleanup
    await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', authData.user.id);
    
    await supabase.auth.admin.deleteUser(authData.user.id);
    
    console.log('✅ Test user cleaned up');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting trigger fix process...\n');
  
  const triggerFixed = await fixTrigger();
  if (!triggerFixed) {
    console.error('❌ Failed to fix trigger');
    process.exit(1);
  }

  const testPassed = await testTrigger();
  if (!testPassed) {
    console.error('❌ Trigger test failed');
    process.exit(1);
  }

  console.log('\n🎉 Trigger fix completed successfully!');
  console.log('The database trigger should now properly create user profiles.');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixTrigger, testTrigger };
