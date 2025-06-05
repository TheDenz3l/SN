import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Database types (will be auto-generated from Supabase in production)
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string | null;
          last_name: string | null;
          tier: 'free' | 'paid' | 'premium';
          credits: number;
          writing_style: string | null;
          has_completed_setup: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name?: string | null;
          last_name?: string | null;
          tier?: 'free' | 'paid' | 'premium';
          credits?: number;
          writing_style?: string | null;
          has_completed_setup?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string | null;
          last_name?: string | null;
          tier?: 'free' | 'paid' | 'premium';
          credits?: number;
          writing_style?: string | null;
          has_completed_setup?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      isp_tasks: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          description: string;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          description?: string;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: any; // JSON content
          note_type: 'task' | 'comment' | 'general';
          tokens_used: number | null;
          cost: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: any;
          note_type?: 'task' | 'comment' | 'general';
          tokens_used?: number | null;
          cost?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: any;
          note_type?: 'task' | 'comment' | 'general';
          tokens_used?: number | null;
          cost?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      note_sections: {
        Row: {
          id: string;
          note_id: string;
          isp_task_id: string | null;
          user_prompt: string;
          generated_content: string;
          is_edited: boolean;
          tokens_used: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          note_id: string;
          isp_task_id?: string | null;
          user_prompt: string;
          generated_content: string;
          is_edited?: boolean;
          tokens_used?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          note_id?: string;
          isp_task_id?: string | null;
          user_prompt?: string;
          generated_content?: string;
          is_edited?: boolean;
          tokens_used?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_credits: {
        Row: {
          id: string;
          user_id: string;
          transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus';
          amount: number;
          description: string;
          reference_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus';
          amount: number;
          description: string;
          reference_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          transaction_type?: 'purchase' | 'usage' | 'refund' | 'bonus';
          amount?: number;
          description?: string;
          reference_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error_description) {
    return error.error_description;
  }
  
  return 'An unexpected error occurred';
};

// Auth helpers
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export default supabase;
