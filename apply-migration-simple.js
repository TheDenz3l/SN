#!/usr/bin/env node

/**
 * Simple ISP Structured Data Migration
 * Applies the migration using direct SQL execution
 */

const { createClient } = require('@supabase/supabase-js');

// Environment variables
const supabaseUrl = 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA';

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
    
    // Step 1: Add new columns
    console.log('📝 Adding new columns to isp_tasks table...');
    
    // Add structured_data column
    try {
      const { error: error1 } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE isp_tasks ADD COLUMN IF NOT EXISTS structured_data JSONB DEFAULT '{}'`
      });
      if (error1) console.log('Note: structured_data column may already exist');
    } catch (e) {
      console.log('Note: structured_data column may already exist');
    }
    
    // Add form_type column
    try {
      const { error: error2 } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE isp_tasks ADD COLUMN IF NOT EXISTS form_type VARCHAR(50) DEFAULT 'basic'`
      });
      if (error2) console.log('Note: form_type column may already exist');
    } catch (e) {
      console.log('Note: form_type column may already exist');
    }
    
    // Add extraction_method column
    try {
      const { error: error3 } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE isp_tasks ADD COLUMN IF NOT EXISTS extraction_method VARCHAR(20) DEFAULT 'manual'`
      });
      if (error3) console.log('Note: extraction_method column may already exist');
    } catch (e) {
      console.log('Note: extraction_method column may already exist');
    }
    
    // Add extraction_confidence column
    try {
      const { error: error4 } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE isp_tasks ADD COLUMN IF NOT EXISTS extraction_confidence DECIMAL(5,2) DEFAULT 100.00`
      });
      if (error4) console.log('Note: extraction_confidence column may already exist');
    } catch (e) {
      console.log('Note: extraction_confidence column may already exist');
    }
    
    console.log('✅ Columns added successfully');
    
    // Step 2: Test the new columns by querying
    console.log('🔍 Testing new columns...');
    
    const { data: testData, error: testError } = await supabase
      .from('isp_tasks')
      .select('id, structured_data, form_type, extraction_method, extraction_confidence')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error testing new columns:', testError);
      throw testError;
    }
    
    console.log('✅ New columns are working correctly');
    if (testData && testData.length > 0) {
      console.log('📊 Sample data:', testData[0]);
    }
    
    // Step 3: Update existing tasks with basic structured data
    console.log('🔄 Updating existing tasks with structured data...');
    
    const { data: existingTasks, error: fetchError } = await supabase
      .from('isp_tasks')
      .select('id, description, structured_data')
      .is('structured_data', null)
      .or('structured_data.eq.{}');
    
    if (fetchError) {
      console.error('❌ Error fetching existing tasks:', fetchError);
      throw fetchError;
    }
    
    if (existingTasks && existingTasks.length > 0) {
      console.log(`📝 Found ${existingTasks.length} tasks to update`);
      
      for (const task of existingTasks) {
        const { error: updateError } = await supabase
          .from('isp_tasks')
          .update({
            structured_data: {
              goal: task.description,
              activeTreatment: '',
              individualResponse: '',
              scoresComments: '',
              type: 'goal'
            },
            form_type: 'basic',
            extraction_method: 'manual',
            extraction_confidence: 100.00
          })
          .eq('id', task.id);
        
        if (updateError) {
          console.warn(`⚠️ Failed to update task ${task.id}:`, updateError);
        }
      }
      
      console.log('✅ Existing tasks updated with structured data');
    } else {
      console.log('📝 No existing tasks need updating');
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  applyMigration()
    .then(() => {
      console.log('✨ ISP Structured Data Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { applyMigration };
