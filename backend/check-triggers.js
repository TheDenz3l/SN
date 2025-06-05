/**
 * Check Database Triggers
 * Checks for any triggers that might be interfering with user creation
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkTriggers() {
  try {
    console.log('🔍 Checking for database triggers...\n');

    // Check for triggers on auth.users table
    const { data: triggers, error: triggerError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            trigger_name,
            event_manipulation,
            event_object_table,
            action_statement,
            action_timing
          FROM information_schema.triggers 
          WHERE event_object_schema = 'auth' 
             OR event_object_table = 'user_profiles'
             OR trigger_name ILIKE '%user%'
             OR trigger_name ILIKE '%profile%'
          ORDER BY event_object_table, trigger_name;
        `
      });

    if (triggerError) {
      console.error('❌ Error checking triggers:', triggerError);
      return false;
    }

    console.log(`📊 Found ${triggers.length} relevant triggers:`);
    
    if (triggers.length === 0) {
      console.log('✅ No triggers found that might interfere with user creation');
      return true;
    }

    triggers.forEach((trigger, index) => {
      console.log(`\n${index + 1}. ${trigger.trigger_name}`);
      console.log(`   Table: ${trigger.event_object_table}`);
      console.log(`   Event: ${trigger.event_manipulation}`);
      console.log(`   Timing: ${trigger.action_timing}`);
      console.log(`   Action: ${trigger.action_statement}`);
    });

    return true;

  } catch (error) {
    console.error('❌ Failed to check triggers:', error);
    return false;
  }
}

async function checkFunctions() {
  try {
    console.log('\n🔍 Checking for database functions...\n');

    const { data: functions, error: functionError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            routine_name,
            routine_type,
            routine_definition
          FROM information_schema.routines 
          WHERE routine_schema = 'public'
            AND (routine_name ILIKE '%user%' OR routine_name ILIKE '%profile%')
          ORDER BY routine_name;
        `
      });

    if (functionError) {
      console.error('❌ Error checking functions:', functionError);
      return false;
    }

    console.log(`📊 Found ${functions.length} relevant functions:`);
    
    if (functions.length === 0) {
      console.log('✅ No functions found that might interfere with user creation');
      return true;
    }

    functions.forEach((func, index) => {
      console.log(`\n${index + 1}. ${func.routine_name} (${func.routine_type})`);
      if (func.routine_definition) {
        console.log(`   Definition: ${func.routine_definition.substring(0, 200)}...`);
      }
    });

    return true;

  } catch (error) {
    console.error('❌ Failed to check functions:', error);
    return false;
  }
}

async function runChecks() {
  console.log('🚀 Database Trigger and Function Check\n');
  
  const triggerCheck = await checkTriggers();
  const functionCheck = await checkFunctions();
  
  if (triggerCheck && functionCheck) {
    console.log('\n✅ Database check completed successfully!');
    return true;
  } else {
    console.log('\n⚠️  Database check completed with issues.');
    return false;
  }
}

if (require.main === module) {
  runChecks()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal check error:', error);
      process.exit(1);
    });
}

module.exports = { checkTriggers, checkFunctions };
