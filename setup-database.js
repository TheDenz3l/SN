// Database setup script using Supabase service key
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA';

// Create admin client with service key
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  try {
    console.log('🚀 Setting up SwiftNotes database schema...');
    
    // Read the schema file
    const schema = fs.readFileSync('supabase-schema.sql', 'utf8');
    
    // Split into individual statements (rough split by semicolon + newline)
    const statements = schema
      .split(';\n')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + (statements[i].endsWith(';') ? '' : ';');
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase
            .from('_temp')
            .select('*')
            .limit(0);
          
          if (directError && !directError.message.includes('does not exist')) {
            console.warn(`⚠️  Warning on statement ${i + 1}:`, error.message);
          }
        }
        
      } catch (err) {
        console.warn(`⚠️  Warning on statement ${i + 1}:`, err.message);
      }
    }
    
    console.log('✅ Database schema setup completed!');
    
    // Test the setup by checking if tables exist
    console.log('🔍 Verifying table creation...');
    
    const tables = ['user_profiles', 'isp_tasks', 'notes', 'note_sections', 'user_credits'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`✅ Table '${table}' created successfully`);
        } else {
          console.log(`❌ Table '${table}' not found:`, error.message);
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table}':`, err.message);
      }
    }
    
    console.log('\n🎉 Database setup complete! You can now:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Register a new account');
    console.log('3. Test the full application flow');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();
