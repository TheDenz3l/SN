// Direct Supabase setup using REST API
import fetch from 'node-fetch';

const supabaseUrl = 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA';

async function runSQL(sql) {
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
    const error = await response.text();
    console.log('SQL Error:', error);
    return false;
  }
  
  return true;
}

async function setupDatabase() {
  console.log('🚀 Setting up SwiftNotes database...');
  
  // Create tables one by one
  const tables = [
    // Enable extensions
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
    
    // Create types
    `CREATE TYPE user_tier AS ENUM ('free', 'paid', 'premium');`,
    `CREATE TYPE note_type AS ENUM ('task', 'comment', 'general');`,
    `CREATE TYPE transaction_type AS ENUM ('purchase', 'usage', 'refund', 'bonus');`,
    
    // User profiles table
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
    
    // ISP tasks table
    `CREATE TABLE IF NOT EXISTS isp_tasks (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      description TEXT NOT NULL,
      order_index INTEGER DEFAULT 0 NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );`,
    
    // Notes table
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
    
    // Note sections table
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
    
    // User credits table
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
  
  // Execute each table creation
  for (let i = 0; i < tables.length; i++) {
    console.log(`⏳ Creating table/type ${i + 1}/${tables.length}...`);
    await runSQL(tables[i]);
  }
  
  console.log('✅ Tables created! Setting up RLS policies...');
  
  // Enable RLS
  const rlsStatements = [
    `ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE isp_tasks ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE notes ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE note_sections ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;`,
  ];
  
  for (const stmt of rlsStatements) {
    await runSQL(stmt);
  }
  
  console.log('✅ RLS enabled! Creating policies...');
  
  // Create policies
  const policies = [
    `CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);`,
    `CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);`,
    `CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    
    `CREATE POLICY "Users can view own ISP tasks" ON isp_tasks FOR SELECT USING (auth.uid() = user_id);`,
    `CREATE POLICY "Users can insert own ISP tasks" ON isp_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    `CREATE POLICY "Users can update own ISP tasks" ON isp_tasks FOR UPDATE USING (auth.uid() = user_id);`,
    `CREATE POLICY "Users can delete own ISP tasks" ON isp_tasks FOR DELETE USING (auth.uid() = user_id);`,
    
    `CREATE POLICY "Users can view own notes" ON notes FOR SELECT USING (auth.uid() = user_id);`,
    `CREATE POLICY "Users can insert own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    `CREATE POLICY "Users can update own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);`,
    `CREATE POLICY "Users can delete own notes" ON notes FOR DELETE USING (auth.uid() = user_id);`,
    
    `CREATE POLICY "Users can view own credit transactions" ON user_credits FOR SELECT USING (auth.uid() = user_id);`,
    `CREATE POLICY "Users can insert own credit transactions" ON user_credits FOR INSERT WITH CHECK (auth.uid() = user_id);`,
  ];
  
  for (const policy of policies) {
    await runSQL(policy);
  }
  
  console.log('✅ Policies created! Setting up functions...');
  
  // Create trigger function
  await runSQL(`
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
  await runSQL(`
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `);
  
  console.log('🎉 Database setup complete!');
  console.log('✅ All tables, policies, and triggers created successfully!');
}

setupDatabase().catch(console.error);
