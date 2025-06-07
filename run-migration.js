#!/usr/bin/env node

/**
 * SwiftNotes Database Migration Runner
 * Runs the freemium model migration safely
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting SwiftNotes Freemium Migration...\n');

  try {
    // Check if columns already exist
    console.log('🔍 Checking existing schema...');
    const { data: existingColumns, error: schemaError } = await supabase
      .from('user_profiles')
      .select('free_generations_used, free_generations_reset_date')
      .limit(1);

    if (!schemaError && existingColumns) {
      console.log('✅ Freemium columns already exist, skipping migration');
      return;
    }

    // Add new columns
    console.log('📝 Adding freemium tracking columns...');
    
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS free_generations_used INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS free_generations_reset_date DATE DEFAULT CURRENT_DATE;
      `
    });

    if (alterError) {
      console.error('❌ Failed to add columns:', alterError);
      throw alterError;
    }

    // Update existing users
    console.log('🔄 Updating existing user profiles...');
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        free_generations_used: 0,
        free_generations_reset_date: new Date().toISOString().split('T')[0]
      })
      .is('free_generations_used', null);

    if (updateError) {
      console.error('❌ Failed to update existing users:', updateError);
      throw updateError;
    }

    // Verify migration
    console.log('✅ Verifying migration...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_profiles')
      .select('user_id, credits, free_generations_used, free_generations_reset_date')
      .limit(3);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      throw verifyError;
    }

    console.log('📊 Sample user profiles after migration:');
    console.table(verifyData);

    console.log('\n🎉 Migration completed successfully!');
    console.log('✅ Added free_generations_used column');
    console.log('✅ Added free_generations_reset_date column');
    console.log('✅ Updated existing user profiles');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative approach using direct SQL if RPC doesn't work
async function runMigrationDirect() {
  console.log('🚀 Starting SwiftNotes Freemium Migration (Direct SQL)...\n');

  try {
    // Check current schema
    console.log('🔍 Checking current user profiles...');
    const { data: currentUsers, error: fetchError } = await supabase
      .from('user_profiles')
      .select('user_id, credits, created_at')
      .limit(3);

    if (fetchError) {
      console.error('❌ Failed to fetch users:', fetchError);
      throw fetchError;
    }

    console.log('📊 Current user profiles:');
    console.table(currentUsers);

    // Since we can't run DDL directly, let's update the backend to handle missing columns gracefully
    console.log('⚠️ Note: Database schema changes need to be applied manually in Supabase dashboard');
    console.log('📝 Please run the following SQL in your Supabase SQL editor:');
    console.log(`
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS free_generations_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_generations_reset_date DATE DEFAULT CURRENT_DATE;

UPDATE user_profiles 
SET 
  free_generations_used = 0,
  free_generations_reset_date = CURRENT_DATE
WHERE free_generations_used IS NULL OR free_generations_reset_date IS NULL;
    `);

    console.log('\n✅ Migration script prepared. Please apply manually in Supabase.');

  } catch (error) {
    console.error('❌ Migration check failed:', error);
    process.exit(1);
  }
}

// Run migration
if (process.argv.includes('--direct')) {
  runMigrationDirect();
} else {
  runMigration();
}
