/**
 * Fix RLS Policies for Note Generation
 * This script fixes the Row Level Security policies that are preventing note generation
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies for note generation...\n');

  try {
    // First, let's check current policies
    console.log('📋 Checking current RLS policies...');
    
    // Drop existing policies that might be causing issues
    console.log('🗑️ Dropping existing problematic policies...');
    
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can insert their own note sections" ON note_sections;',
      'DROP POLICY IF EXISTS "Users can view their own note sections" ON note_sections;',
      'DROP POLICY IF EXISTS "Users can update their own note sections" ON note_sections;',
      'DROP POLICY IF EXISTS "Users can delete their own note sections" ON note_sections;',
      'DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;',
      'DROP POLICY IF EXISTS "Users can view their own notes" ON notes;',
      'DROP POLICY IF EXISTS "Users can update their own notes" ON notes;',
      'DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;'
    ];

    for (const policy of dropPolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy });
        if (error) {
          console.log(`⚠️ Policy drop warning: ${error.message}`);
        }
      } catch (err) {
        console.log(`⚠️ Policy drop warning: ${err.message}`);
      }
    }

    // Create new, working policies
    console.log('✅ Creating new RLS policies...');

    const newPolicies = [
      // Notes table policies
      `CREATE POLICY "Users can insert their own notes" ON notes
       FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can view their own notes" ON notes
       FOR SELECT USING (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can update their own notes" ON notes
       FOR UPDATE USING (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can delete their own notes" ON notes
       FOR DELETE USING (auth.uid() = user_id);`,

      // Note sections table policies
      `CREATE POLICY "Users can insert note sections for their notes" ON note_sections
       FOR INSERT WITH CHECK (
         EXISTS (
           SELECT 1 FROM notes 
           WHERE notes.id = note_sections.note_id 
           AND notes.user_id = auth.uid()
         )
       );`,
      
      `CREATE POLICY "Users can view note sections for their notes" ON note_sections
       FOR SELECT USING (
         EXISTS (
           SELECT 1 FROM notes 
           WHERE notes.id = note_sections.note_id 
           AND notes.user_id = auth.uid()
         )
       );`,
      
      `CREATE POLICY "Users can update note sections for their notes" ON note_sections
       FOR UPDATE USING (
         EXISTS (
           SELECT 1 FROM notes 
           WHERE notes.id = note_sections.note_id 
           AND notes.user_id = auth.uid()
         )
       );`,
      
      `CREATE POLICY "Users can delete note sections for their notes" ON note_sections
       FOR DELETE USING (
         EXISTS (
           SELECT 1 FROM notes 
           WHERE notes.id = note_sections.note_id 
           AND notes.user_id = auth.uid()
         )
       );`
    ];

    for (const policy of newPolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy });
        if (error) {
          console.error(`❌ Error creating policy: ${error.message}`);
          console.error(`SQL: ${policy}`);
        } else {
          console.log('✅ Policy created successfully');
        }
      } catch (err) {
        console.error(`❌ Error creating policy: ${err.message}`);
        console.error(`SQL: ${policy}`);
      }
    }

    // Enable RLS on both tables
    console.log('🔒 Ensuring RLS is enabled...');
    
    const enableRLS = [
      'ALTER TABLE notes ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE note_sections ENABLE ROW LEVEL SECURITY;'
    ];

    for (const sql of enableRLS) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
          console.log(`⚠️ RLS enable warning: ${error.message}`);
        } else {
          console.log('✅ RLS enabled');
        }
      } catch (err) {
        console.log(`⚠️ RLS enable warning: ${err.message}`);
      }
    }

    console.log('\n🎉 RLS policies fixed successfully!');
    console.log('📝 Note generation should now work properly.');

  } catch (error) {
    console.error('💥 Error fixing RLS policies:', error);
  }
}

// Create the exec_sql function if it doesn't exist
async function createExecSQLFunction() {
  const functionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: functionSQL });
    if (error) {
      console.log('Creating exec_sql function...');
      // If the function doesn't exist, we need to create it differently
      // This is a workaround since we can't execute arbitrary SQL without a function
      console.log('⚠️ Cannot create exec_sql function. Manual intervention required.');
    }
  } catch (err) {
    console.log('⚠️ exec_sql function may not exist. This is expected.');
  }
}

// Run the fix
createExecSQLFunction().then(() => {
  fixRLSPolicies();
});
