// Client-side Razorpay service
// Note: Razorpay SDK cannot be used directly in browser due to security
// This service handles the client-side integration with Razorpay

import { TokenService } from './tokenService';
import { SubscriptionPlanRow } from '../lib/supabase';

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

export interface CreateOrderRequest {
  amount: number;
  currency: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface CreateOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export class RazorpayService {
  private static razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
  
  // Load Razorpay script dynamically
  static loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      // Check if Razorpay is already loaded
      if (typeof window.Razorpay !== 'undefined') {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  // Create Razorpay order via backend
  static async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse | null> {
    try {
      const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://flowniq.onrender.com'
        : 'http://localhost:3001';
        
      const response = await fetch(`${API_BASE_URL}/api/create-razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      return null;
    }
  }

  // Verify payment via backend
  static async verifyPayment(paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    user_id: string;
    tokens_purchased: number;
    amount: number;
  }): Promise<boolean> {
    // Check if required fields are present
    if (!paymentData.razorpay_signature) {
      console.error('❌ Missing razorpay_signature in payment data:', paymentData);
      return false;
    }
    
    if (!paymentData.razorpay_order_id || !paymentData.razorpay_payment_id) {
      console.error('❌ Missing required payment fields:', paymentData);
      return false;
    }
    try {
      console.log('📝 Sending payment verification request:', {
        ...paymentData,
        razorpay_signature: paymentData.razorpay_signature ? paymentData.razorpay_signature.substring(0, 10) + '...' : 'undefined' // Don't log full signature
      });
      
      const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://flowniq.onrender.com'
        : 'http://localhost:3001';
        
      const response = await fetch(`${API_BASE_URL}/api/verify-razorpay-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();
      
      console.log('📝 Payment verification response:', {
        status: response.status,
        success: result.success,
        error: result.error,
        tokens_added: result.tokens_added
      });
      
      if (!result.success) {
        console.error('❌ Payment verification failed:', result.error);
      }
      
      return result.success === true;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  // Initialize payment process
  static async initiatePayment(
    plan: SubscriptionPlanRow,
    userEmail: string,
    userName: string,
    onSuccess: (paymentData: any) => void,
    onError: (error: any) => void
  ): Promise<void> {
    try {
      // Load Razorpay script
      const isScriptLoaded = await this.loadRazorpayScript();
      if (!isScriptLoaded) {
        onError(new Error('Failed to load Razorpay script'));
        return;
      }

      // Create order
      const order = await this.createOrder({
        amount: plan.price_inr * 100, // Convert to paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          plan_id: plan.id,
          tokens: plan.tokens_included.toString(),
        },
      });

      if (!order) {
        onError(new Error('Failed to create payment order'));
        return;
      }

      // Initialize Razorpay payment
      const options: RazorpayOptions = {
        key: this.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Flowniq.ai',
        description: `Purchase ${plan.name} - ${plan.tokens_included} tokens`,
        order_id: order.id,
        handler: onSuccess,
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: '#4F46E5', // Indigo color matching app theme
        },
      };

      const razorpay = new window.Razorpay(options);

      // Handle payment failure
      razorpay.on('payment.failed', (response: any) => {
        onError(new Error(`Payment failed: ${response.error.description}`));
      });

      // Open payment modal
      razorpay.open();
    } catch (error) {
      console.error('Error initiating payment:', error);
      onError(error);
    }
  }

  // Convert INR to USD (simplified - in production, use real-time rates)
  static convertINRtoUSD(inrAmount: number): number {
    const exchangeRate = 0.012; // Approximate rate, update with real API
    return parseFloat((inrAmount * exchangeRate).toFixed(2));
  }

  // Format currency for display
  static formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // Calculate savings percentage
  static calculateSavings(regularPrice: number, discountedPrice: number): number {
    if (regularPrice <= discountedPrice) return 0;
    return Math.round(((regularPrice - discountedPrice) / regularPrice) * 100);
  }

  // Get recommended plan based on usage
  static getRecommendedPlan(plans: SubscriptionPlanRow[], monthlyUsage: number): SubscriptionPlanRow | null {
    if (plans.length === 0) return null;

    // Sort plans by tokens included
    const sortedPlans = [...plans].sort((a, b) => a.tokens_included - b.tokens_included);

    // Find the plan that gives best value for estimated monthly usage
    for (const plan of sortedPlans) {
      if (plan.tokens_included >= monthlyUsage * 1.2) { // 20% buffer
        return plan;
      }
    }

    // If user needs more than the largest plan, return the largest
    return sortedPlans[sortedPlans.length - 1];
  }

  // Calculate cost per token
  static calculateCostPerToken(plan: SubscriptionPlanRow, currency: string = 'INR'): number {
    const price = currency === 'USD' ? plan.price_usd : plan.price_inr;
    return parseFloat((price / plan.tokens_included).toFixed(4));
  }

  // Validate Razorpay configuration
  static isConfigured(): boolean {
    return !!this.razorpayKeyId && this.razorpayKeyId !== 'your_razorpay_key_id_here';
  }

  // Get payment methods available
  static getAvailablePaymentMethods(): string[] {
    return [
      'UPI',
      'Debit Card',
      'Credit Card',
      'Net Banking',
      'Wallet',
      'EMI'
    ];
  }

  // Format plan benefits for display
  static formatPlanBenefits(plan: SubscriptionPlanRow): string[] {
    const benefits = [
      `${plan.tokens_included} AI generations`,
      'Priority support',
      'Advanced features access'
    ];

    // Add special benefits based on plan
    if (plan.tokens_included >= 1000) {
      benefits.push('Team collaboration');
      benefits.push('Export to multiple formats');
    }

    if (plan.tokens_included >= 5000) {
      benefits.push('White-label options');
      benefits.push('Custom integrations');
      benefits.push('Dedicated account manager');
    }

    return benefits;
  }
}