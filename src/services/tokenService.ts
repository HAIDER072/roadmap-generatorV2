import { supabase } from '../lib/supabase';
import { 
  UserProfileRow,
  TokenTransactionRow,
  SubscriptionPlanRow,
  PaymentInsert,
  PaymentUpdate
} from '../lib/supabase';

export class TokenService {
  // Get user's current token balance and profile
  static async getUserProfile(userId: string): Promise<UserProfileRow | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  // Check if user has enough tokens
  static async hasEnoughTokens(userId: string, requiredTokens: number): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      return profile ? profile.tokens >= requiredTokens : false;
    } catch (error) {
      console.error('Error checking token balance:', error);
      return false;
    }
  }

  // Deduct tokens using database function (atomic operation)
  static async deductTokens(
    userId: string, 
    tokenAmount: number, 
    description: string, 
    roadmapId?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('deduct_user_tokens', {
        p_user_id: userId,
        p_tokens: tokenAmount,
        p_description: description,
        p_roadmap_id: roadmapId
      });

      if (error) {
        console.error('Error deducting tokens:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error in deductTokens:', error);
      return false;
    }
  }

  // Add tokens using database function (atomic operation)
  static async addTokens(
    userId: string, 
    tokenAmount: number, 
    description: string, 
    paymentId?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('add_user_tokens', {
        p_user_id: userId,
        p_tokens: tokenAmount,
        p_description: description,
        p_payment_id: paymentId
      });

      if (error) {
        console.error('Error adding tokens:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error in addTokens:', error);
      return false;
    }
  }

  // Get user's token transaction history
  static async getTokenTransactions(userId: string, limit: number = 50): Promise<TokenTransactionRow[]> {
    try {
      const { data, error } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching token transactions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTokenTransactions:', error);
      return [];
    }
  }

  // Get all subscription plans
  static async getSubscriptionPlans(): Promise<SubscriptionPlanRow[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching subscription plans:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSubscriptionPlans:', error);
      return [];
    }
  }

  // Create payment record
  static async createPaymentRecord(paymentData: PaymentInsert): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating payment record:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error in createPaymentRecord:', error);
      return null;
    }
  }

  // Update payment record
  static async updatePaymentRecord(paymentId: string, updates: PaymentUpdate): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', paymentId);

      if (error) {
        console.error('Error updating payment record:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updatePaymentRecord:', error);
      return false;
    }
  }

  // Get payment by Razorpay payment ID
  static async getPaymentByRazorpayId(razorpayPaymentId: string) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('razorpay_payment_id', razorpayPaymentId)
        .single();

      if (error) {
        console.error('Error fetching payment by Razorpay ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getPaymentByRazorpayId:', error);
      return null;
    }
  }

  // Validate token usage before roadmap generation
  static async validateAndDeductTokensForRoadmap(userId: string, roadmapTitle: string): Promise<{
    success: boolean;
    error?: string;
    tokensRemaining?: number;
  }> {
    try {
      // Check current token balance
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        return { success: false, error: 'User profile not found' };
      }

      const requiredTokens = parseInt(process.env.TOKENS_PER_ROADMAP || '1');
      
      if (profile.tokens < requiredTokens) {
        return { 
          success: false, 
          error: 'Insufficient tokens',
          tokensRemaining: profile.tokens
        };
      }

      // Deduct tokens
      const deductionSuccess = await this.deductTokens(
        userId,
        requiredTokens,
        `Roadmap generation: ${roadmapTitle}`
      );

      if (!deductionSuccess) {
        return { success: false, error: 'Failed to deduct tokens' };
      }

      return { 
        success: true, 
        tokensRemaining: profile.tokens - requiredTokens 
      };
    } catch (error) {
      console.error('Error in validateAndDeductTokensForRoadmap:', error);
      return { success: false, error: 'Internal error' };
    }
  }

  // Get user statistics
  static async getUserStats(userId: string) {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) return null;

      // Get roadmap count
      const { count: roadmapCount } = await supabase
        .from('roadmaps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get recent transactions
      const recentTransactions = await this.getTokenTransactions(userId, 5);

      return {
        currentTokens: profile.tokens,
        totalTokensUsed: profile.total_tokens_used,
        roadmapsCreated: roadmapCount || 0,
        subscriptionStatus: profile.subscription_status,
        recentTransactions
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }
}