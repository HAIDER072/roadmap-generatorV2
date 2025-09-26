import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Database {
  public: {
    Tables: {
      roadmaps: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: string;
          phases: any[];
          roadmap_nodes: any[];
          created_at: string;
          updated_at: string;
          ip_address: string | null;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          category: string;
          phases: any[];
          roadmap_nodes: any[];
          created_at?: string;
          updated_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          category?: string;
          phases?: any[];
          roadmap_nodes?: any[];
          created_at?: string;
          updated_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
      };
    };
  };
}

export type RoadmapRow = Database['public']['Tables']['roadmaps']['Row'];
export type RoadmapInsert = Database['public']['Tables']['roadmaps']['Insert'];
export type RoadmapUpdate = Database['public']['Tables']['roadmaps']['Update'];