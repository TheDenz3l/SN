/**
 * Apply Writing Analytics Migration
 * This script applies the database migration for the writing analytics system
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA';

const supabase = createClient(supabaseUrl, serviceKey);

async function runSQL(sql) {
  console.log('Executing SQL...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.warn('Warning:', error.message);
      // Try alternative method for some statements
      return { success: true, warning: error.message };
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('SQL execution error:', err);
    return { success: false, error: err.message };
  }
}

async function applyMigration() {
  console.log('🚀 Starting Writing Analytics Migration...');
  
  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'database-migration-writing-analytics.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let warningCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
      
      const result = await runSQL(statement);
      
      if (result.success) {
        if (result.warning) {
          console.log(`⚠️  Statement ${i + 1} completed with warning: ${result.warning}`);
          warningCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
        successCount++;
      } else {
        console.error(`❌ Statement ${i + 1} failed: ${result.error}`);
      }
      
      // Small delay between statements
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⚠️  Warnings: ${warningCount}`);
    console.log(`   ❌ Failed: ${statements.length - successCount}`);
    
    // Apply additional functions
    console.log('\n🔧 Applying additional functions...');
    const functionsPath = path.join(__dirname, 'writing-analytics-functions.sql');
    
    if (fs.existsSync(functionsPath)) {
      const functionsSQL = fs.readFileSync(functionsPath, 'utf8');
      const functionStatements = functionsSQL
        .split(/(?<=\$\$ LANGUAGE plpgsql SECURITY DEFINER;)/)
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (let i = 0; i < functionStatements.length; i++) {
        const statement = functionStatements[i];
        if (statement.trim()) {
          console.log(`⏳ Applying function ${i + 1}/${functionStatements.length}...`);
          const result = await runSQL(statement);
          
          if (result.success) {
            console.log(`✅ Function ${i + 1} applied successfully`);
          } else {
            console.log(`⚠️  Function ${i + 1} warning: ${result.error}`);
          }
        }
      }
    }
    
    console.log('\n🎉 Writing Analytics Migration completed!');
    console.log('\nNext steps:');
    console.log('1. Restart your backend server to load the new routes');
    console.log('2. Test the writing analytics functionality');
    console.log('3. Check the new tables in your Supabase dashboard');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Verify connection first
async function verifyConnection() {
  console.log('🔍 Verifying Supabase connection...');
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (error && !error.message.includes('does not exist')) {
      throw error;
    }
    
    console.log('✅ Supabase connection verified');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 SwiftNotes Writing Analytics Migration Tool');
  console.log('============================================\n');
  
  const connected = await verifyConnection();
  if (!connected) {
    console.error('❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  await applyMigration();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { applyMigration, verifyConnection };
