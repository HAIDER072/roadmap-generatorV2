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
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          tokens: number;
          total_tokens_used: number;
          subscription_status: string;
          subscription_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          tokens?: number;
          total_tokens_used?: number;
          subscription_status?: string;
          subscription_expires_at?: string | null;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          tokens?: number;
          total_tokens_used?: number;
          subscription_status?: string;
          subscription_expires_at?: string | null;
        };
      };
      token_transactions: {
        Row: {
          id: string;
          user_id: string;
          transaction_type: string;
          tokens_amount: number;
          description: string;
          roadmap_id: string | null;
          payment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_type: string;
          tokens_amount: number;
          description: string;
          roadmap_id?: string | null;
          payment_id?: string | null;
        };
        Update: {
          transaction_type?: string;
          tokens_amount?: number;
          description?: string;
          roadmap_id?: string | null;
          payment_id?: string | null;
        };
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          tokens_included: number;
          price_inr: number;
          price_usd: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          tokens_included: number;
          price_inr: number;
          price_usd: number;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          name?: string;
          description?: string | null;
          tokens_included?: number;
          price_inr?: number;
          price_usd?: number;
          is_active?: boolean;
          sort_order?: number;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          razorpay_payment_id: string;
          razorpay_order_id: string;
          amount_inr: number;
          amount_usd: number;
          tokens_purchased: number;
          plan_id: string | null;
          status: string;
          payment_method: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          razorpay_payment_id: string;
          razorpay_order_id: string;
          amount_inr: number;
          amount_usd: number;
          tokens_purchased: number;
          plan_id?: string | null;
          status?: string;
          payment_method?: string | null;
          completed_at?: string | null;
        };
        Update: {
          status?: string;
          payment_method?: string | null;
          completed_at?: string | null;
        };
      };
      roadmaps: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: string;
          phases: any[];
          roadmap_nodes: any[];
          tokens_used: number;
          created_at: string;
          updated_at: string;
          generated_at: string;
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
          tokens_used?: number;
          created_at?: string;
          updated_at?: string;
          generated_at?: string;
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
          tokens_used?: number;
          created_at?: string;
          updated_at?: string;
          generated_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
      };
    };
    Functions: {
      deduct_user_tokens: {
        Args: {
          p_user_id: string;
          p_tokens: number;
          p_description: string;
          p_roadmap_id?: string;
        };
        Returns: boolean;
      };
      add_user_tokens: {
        Args: {
          p_user_id: string;
          p_tokens: number;
          p_description: string;
          p_payment_id?: string;
        };
        Returns: boolean;
      };
    };
  };
}

export type RoadmapRow = Database['public']['Tables']['roadmaps']['Row'];
export type RoadmapInsert = Database['public']['Tables']['roadmaps']['Insert'];
export type RoadmapUpdate = Database['public']['Tables']['roadmaps']['Update'];

// User profile types
export type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

// Token transaction types
export type TokenTransactionRow = Database['public']['Tables']['token_transactions']['Row'];
export type TokenTransactionInsert = Database['public']['Tables']['token_transactions']['Insert'];
export type TokenTransactionUpdate = Database['public']['Tables']['token_transactions']['Update'];

// Subscription plan types
export type SubscriptionPlanRow = Database['public']['Tables']['subscription_plans']['Row'];
export type SubscriptionPlanInsert = Database['public']['Tables']['subscription_plans']['Insert'];
export type SubscriptionPlanUpdate = Database['public']['Tables']['subscription_plans']['Update'];

// Payment types
export type PaymentRow = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];
