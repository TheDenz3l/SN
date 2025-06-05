require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addPreferencesColumn() {
  console.log('🔄 Checking if preferences column exists...');

  try {
    // First, let's check if the column already exists by trying to select it
    const { data, error } = await supabase
      .from('user_profiles')
      .select('preferences')
      .limit(1);

    if (!error) {
      console.log('✅ Preferences column already exists');
      return true;
    }

    // If we get here, the column doesn't exist, so we need to add it
    // Since we can't use DDL directly, let's try a different approach
    console.log('❌ Preferences column does not exist. Manual intervention required.');
    console.log('Please run this SQL command in your Supabase SQL editor:');
    console.log('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT \'{}\' NOT NULL;');
    return false;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

async function updateExistingUsers() {
  console.log('🔄 Updating existing users with empty preferences...');
  
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ preferences: '{}' })
      .is('preferences', null);

    if (error) {
      console.error('❌ Error updating existing users:', error);
      return false;
    }

    console.log('✅ Existing users updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Update failed:', error);
    return false;
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying migration...');
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('preferences')
      .limit(1);

    if (error) {
      console.error('❌ Verification failed:', error);
      return false;
    }

    console.log('✅ Migration verified successfully');
    console.log('Sample preferences data:', data?.[0]?.preferences);
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting preferences column migration...');
  
  const columnAdded = await addPreferencesColumn();
  if (!columnAdded) {
    process.exit(1);
  }

  const usersUpdated = await updateExistingUsers();
  if (!usersUpdated) {
    process.exit(1);
  }

  const verified = await verifyMigration();
  if (!verified) {
    process.exit(1);
  }

  console.log('🎉 Migration completed successfully!');
}

main().catch(console.error);
