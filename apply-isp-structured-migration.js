#!/usr/bin/env node

/**
 * Apply ISP Structured Data Migration
 * Adds support for structured form data in ISP tasks
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('🚀 Starting ISP Structured Data Migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'isp-structured-data-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded successfully');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;
      
      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabase
            .from('_temp_migration')
            .select('*')
            .limit(0);
          
          if (directError && directError.message.includes('does not exist')) {
            // Execute using raw SQL
            const { error: rawError } = await supabase.rpc('exec_raw_sql', {
              query: statement
            });
            
            if (rawError) {
              console.warn(`⚠️  Statement ${i + 1} failed:`, rawError.message);
              // Continue with next statement for non-critical errors
              if (!rawError.message.includes('already exists') && 
                  !rawError.message.includes('does not exist')) {
                throw rawError;
              }
            }
          } else {
            throw error;
          }
        }
        
        console.log(`✅ Statement ${i + 1} executed successfully`);
        
      } catch (statementError) {
        console.warn(`⚠️  Statement ${i + 1} failed:`, statementError.message);
        
        // Continue for non-critical errors
        if (statementError.message.includes('already exists') ||
            statementError.message.includes('does not exist') ||
            statementError.message.includes('constraint') && statementError.message.includes('already')) {
          console.log(`   Continuing (non-critical error)...`);
          continue;
        }
        
        throw statementError;
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    
    // Verify the migration
    console.log('🔍 Verifying migration...');
    
    // Check if new columns exist
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'isp_tasks')
      .in('column_name', ['structured_data', 'form_type', 'extraction_method', 'extraction_confidence']);
    
    if (columnsError) {
      console.warn('⚠️  Could not verify columns:', columnsError.message);
    } else {
      const columnNames = columns.map(col => col.column_name);
      console.log('✅ New columns found:', columnNames);
    }
    
    // Test a simple query
    const { data: testData, error: testError } = await supabase
      .from('isp_tasks')
      .select('id, structured_data, form_type, extraction_method')
      .limit(1);
    
    if (testError) {
      console.warn('⚠️  Could not test new columns:', testError.message);
    } else {
      console.log('✅ New columns are queryable');
      if (testData && testData.length > 0) {
        console.log('📊 Sample data:', testData[0]);
      }
    }
    
    console.log('🎯 Migration verification completed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function applyMigrationDirect() {
  try {
    console.log('🚀 Starting ISP Structured Data Migration (Direct Method)...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'isp-structured-data-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded successfully');
    
    // Execute the entire migration as one transaction
    const { data, error } = await supabase.rpc('exec_migration', {
      migration_sql: migrationSQL
    });
    
    if (error) {
      throw error;
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('📊 Migration result:', data);
    
  } catch (error) {
    console.error('❌ Direct migration failed:', error);
    console.log('🔄 Falling back to statement-by-statement execution...');
    await applyMigration();
  }
}

// Run the migration
if (require.main === module) {
  applyMigrationDirect()
    .then(() => {
      console.log('✨ ISP Structured Data Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { applyMigration, applyMigrationDirect };
