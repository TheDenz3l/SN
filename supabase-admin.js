// Supabase Admin Client for Database Management
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA';

// Create admin client with service key for full database access
export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database management functions
export class SupabaseManager {
  
  // Execute raw SQL with proper error handling
  async executeSQL(sql) {
    try {
      console.log('🔧 Executing SQL:', sql.substring(0, 100) + '...');
      
      // Use the REST API directly for SQL execution
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey
        },
        body: JSON.stringify({ sql })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ SQL Error:', errorText);
        return { success: false, error: errorText };
      }
      
      const result = await response.json();
      console.log('✅ SQL executed successfully');
      return { success: true, data: result };
      
    } catch (error) {
      console.error('❌ SQL Execution failed:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  // Check if tables exist
  async checkTables() {
    const tables = ['user_profiles', 'isp_tasks', 'notes', 'note_sections', 'user_credits'];
    const results = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('count(*)')
          .limit(1);
        
        results[table] = !error;
        if (error) {
          console.log(`❌ Table '${table}' not found:`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists`);
        }
      } catch (err) {
        results[table] = false;
        console.log(`❌ Error checking table '${table}':`, err.message);
      }
    }
    
    return results;
  }
  
  // Setup complete database schema
  async setupDatabase() {
    console.log('🚀 Setting up SwiftNotes database schema...');
    
    const sqlStatements = [
      // Enable extensions
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
      
      // Create types (with error handling)
      `DO $$ BEGIN
         CREATE TYPE user_tier AS ENUM ('free', 'paid', 'premium');
       EXCEPTION
         WHEN duplicate_object THEN null;
       END $$;`,
       
      `DO $$ BEGIN
         CREATE TYPE note_type AS ENUM ('task', 'comment', 'general');
       EXCEPTION
         WHEN duplicate_object THEN null;
       END $$;`,
       
      `DO $$ BEGIN
         CREATE TYPE transaction_type AS ENUM ('purchase', 'usage', 'refund', 'bonus');
       EXCEPTION
         WHEN duplicate_object THEN null;
       END $$;`,
      
      // User Profiles Table
      `CREATE TABLE IF NOT EXISTS user_profiles (
         id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
         user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
         first_name TEXT,
         last_name TEXT,
         tier user_tier DEFAULT 'free' NOT NULL,
         credits INTEGER DEFAULT 10 NOT NULL,
         writing_style TEXT,
         has_completed_setup BOOLEAN DEFAULT FALSE NOT NULL,
         created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
         updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
       );`,
      
      // ISP Tasks Table
      `CREATE TABLE IF NOT EXISTS isp_tasks (
         id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
         user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
         description TEXT NOT NULL,
         order_index INTEGER DEFAULT 0 NOT NULL,
         created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
         updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
       );`,
      
      // Notes Table
      `CREATE TABLE IF NOT EXISTS notes (
         id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
         user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
         title TEXT NOT NULL,
         content JSONB NOT NULL,
         note_type note_type DEFAULT 'general' NOT NULL,
         tokens_used INTEGER,
         cost DECIMAL(10,6),
         created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
         updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
       );`,
      
      // Note Sections Table
      `CREATE TABLE IF NOT EXISTS note_sections (
         id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
         note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
         isp_task_id UUID REFERENCES isp_tasks(id) ON DELETE SET NULL,
         user_prompt TEXT NOT NULL,
         generated_content TEXT NOT NULL,
         is_edited BOOLEAN DEFAULT FALSE NOT NULL,
         tokens_used INTEGER,
         created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
         updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
       );`,
      
      // User Credits Table
      `CREATE TABLE IF NOT EXISTS user_credits (
         id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
         user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
         transaction_type transaction_type NOT NULL,
         amount INTEGER NOT NULL,
         description TEXT NOT NULL,
         reference_id TEXT,
         created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
       );`
    ];
    
    // Execute table creation
    for (let i = 0; i < sqlStatements.length; i++) {
      console.log(`⏳ Executing statement ${i + 1}/${sqlStatements.length}...`);
      const result = await this.executeSQL(sqlStatements[i]);
      if (!result.success) {
        console.warn(`⚠️ Warning on statement ${i + 1}:`, result.error);
      }
    }
    
    console.log('✅ Tables created! Setting up security...');
    
    // Enable RLS and create policies
    await this.setupSecurity();
    
    // Create functions and triggers
    await this.setupFunctions();
    
    // Create indexes
    await this.setupIndexes();
    
    console.log('🎉 Database setup complete!');
    
    // Verify setup
    const tableStatus = await this.checkTables();
    const allTablesExist = Object.values(tableStatus).every(exists => exists);
    
    if (allTablesExist) {
      console.log('✅ All tables verified successfully!');
      return { success: true, message: 'Database setup completed successfully' };
    } else {
      console.log('⚠️ Some tables may not have been created properly');
      return { success: false, message: 'Database setup completed with warnings', tableStatus };
    }
  }
  
  // Setup security policies
  async setupSecurity() {
    const securityStatements = [
      // Enable RLS
      `ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE isp_tasks ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE notes ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE note_sections ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;`,
      
      // User profiles policies
      `CREATE POLICY IF NOT EXISTS "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY IF NOT EXISTS "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);`,
      `CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      
      // ISP tasks policies
      `CREATE POLICY IF NOT EXISTS "Users can view own ISP tasks" ON isp_tasks FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY IF NOT EXISTS "Users can insert own ISP tasks" ON isp_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `CREATE POLICY IF NOT EXISTS "Users can update own ISP tasks" ON isp_tasks FOR UPDATE USING (auth.uid() = user_id);`,
      `CREATE POLICY IF NOT EXISTS "Users can delete own ISP tasks" ON isp_tasks FOR DELETE USING (auth.uid() = user_id);`,
      
      // Notes policies
      `CREATE POLICY IF NOT EXISTS "Users can view own notes" ON notes FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY IF NOT EXISTS "Users can insert own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `CREATE POLICY IF NOT EXISTS "Users can update own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);`,
      `CREATE POLICY IF NOT EXISTS "Users can delete own notes" ON notes FOR DELETE USING (auth.uid() = user_id);`,
      
      // Credits policies
      `CREATE POLICY IF NOT EXISTS "Users can view own credit transactions" ON user_credits FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY IF NOT EXISTS "Users can insert own credit transactions" ON user_credits FOR INSERT WITH CHECK (auth.uid() = user_id);`
    ];
    
    for (const stmt of securityStatements) {
      await this.executeSQL(stmt);
    }
  }
  
  // Setup functions and triggers
  async setupFunctions() {
    // User creation trigger function
    await this.executeSQL(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.user_profiles (user_id, first_name, last_name, credits)
        VALUES (
          NEW.id,
          NEW.raw_user_meta_data->>'first_name',
          NEW.raw_user_meta_data->>'last_name',
          10
        );
        
        INSERT INTO public.user_credits (user_id, transaction_type, amount, description)
        VALUES (
          NEW.id,
          'bonus',
          10,
          'Welcome bonus - free tier starting credits'
        );
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    
    // Create trigger
    await this.executeSQL(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);
  }
  
  // Setup database indexes
  async setupIndexes() {
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_isp_tasks_user_id ON isp_tasks(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);`
    ];
    
    for (const index of indexes) {
      await this.executeSQL(index);
    }
  }
  
  // Get user profile by ID
  async getUserProfile(userId) {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return { data, error };
  }
  
  // Create or update user profile
  async upsertUserProfile(profile) {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .upsert(profile)
      .select()
      .single();
    
    return { data, error };
  }
  
  // Get user's ISP tasks
  async getUserISPTasks(userId) {
    const { data, error } = await supabaseAdmin
      .from('isp_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('order_index');
    
    return { data, error };
  }
  
  // Add ISP task
  async addISPTask(userId, description, orderIndex = 0) {
    const { data, error } = await supabaseAdmin
      .from('isp_tasks')
      .insert({
        user_id: userId,
        description,
        order_index: orderIndex
      })
      .select()
      .single();
    
    return { data, error };
  }
  
  // Deduct credits from user
  async deductCredits(userId, amount, description, referenceId = null) {
    // First check current credits
    const { data: profile } = await this.getUserProfile(userId);
    if (!profile || profile.credits < amount) {
      return { success: false, error: 'Insufficient credits' };
    }
    
    // Deduct credits
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ credits: profile.credits - amount })
      .eq('user_id', userId);
    
    if (updateError) {
      return { success: false, error: updateError.message };
    }
    
    // Log transaction
    const { error: logError } = await supabaseAdmin
      .from('user_credits')
      .insert({
        user_id: userId,
        transaction_type: 'usage',
        amount: -amount,
        description,
        reference_id: referenceId
      });
    
    if (logError) {
      console.warn('Failed to log credit transaction:', logError.message);
    }
    
    return { success: true, newBalance: profile.credits - amount };
  }
}

// Export singleton instance
export const supabaseManager = new SupabaseManager();

// Quick setup function
export async function setupSupabaseDatabase() {
  return await supabaseManager.setupDatabase();
}
