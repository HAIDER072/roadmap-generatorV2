import React, { useState, useEffect } from 'react';
import { X, Coins, CreditCard, Shield, Zap, Star, Check, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { TokenService } from '../../services/tokenService';
import { RazorpayService } from '../../services/razorpayService';
import { SubscriptionPlanRow } from '../../lib/supabase';
import DatabaseSetupGuide from '../setup/DatabaseSetupGuide';

interface TokenRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (tokensAdded: number) => void;
}

const TokenRechargeModal: React.FC<TokenRechargeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlanRow[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSubscriptionPlans();
    }
  }, [isOpen]);

  const loadSubscriptionPlans = async () => {
    try {
      setLoading(true);
      const subscriptionPlans = await TokenService.getSubscriptionPlans();
      
      if (subscriptionPlans.length === 0) {
        setError('Database schema not set up. Please run the database setup first.');
        return;
      }
      
      setPlans(subscriptionPlans);
      
      // Auto-select the most popular plan (Professional Pack)
      const popularPlan = subscriptionPlans.find(p => p.name.includes('Professional'));
      if (popularPlan) {
        setSelectedPlan(popularPlan);
      }
    } catch (err) {
      console.error('Error loading subscription plans:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('relation') || errorMessage.includes('table')) {
        setError('Database tables not found. Please execute the database schema in Supabase first.');
      } else {
        setError('Failed to load subscription plans. Please check your database connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan || !user) return;

    try {
      setProcessingPayment(true);
      setError(null);

      await RazorpayService.initiatePayment(
        selectedPlan,
        user.email || '',
        user.user_metadata?.full_name || 'User',
        async (paymentData) => {
          // Payment success handler
          console.log('✅ Payment completed successfully:', paymentData?.razorpay_payment_id);
          
          try {
            // For test payments, Razorpay only provides payment_id, not signature or order_id
            // So we'll use our test verification endpoint for all test payments
            if (!paymentData.razorpay_signature || !paymentData.razorpay_order_id) {
              console.log('🧪 Using test payment verification...');
              
              try {
                const testVerificationResult = await fetch('http://localhost:3001/api/test-verify-payment', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    razorpay_order_id: paymentData?.razorpay_order_id || 'test_order_' + Date.now(),
                    razorpay_payment_id: paymentData?.razorpay_payment_id || 'test_payment_' + Date.now(),
                    user_id: user.id,
                    tokens_purchased: selectedPlan.tokens_included,
                    amount: selectedPlan.price_inr,
                  }),
                });
                
                const testResult = await testVerificationResult.json();
                
                if (testResult.success) {
                  console.log('✅ Tokens added successfully:', testResult.tokens_added);
                  onSuccess?.(selectedPlan.tokens_included);
                  onClose();
                } else {
                  console.error('❌ Test verification failed:', testResult);
                  setError('Payment verification failed: ' + (testResult.error || 'Unknown error'));
                }
              } catch (testError) {
                console.error('❌ Verification request failed:', testError);
                setError('Failed to verify payment: ' + testError.message);
              }
              setProcessingPayment(false);
              return;
            }
            
            const verificationResult = await RazorpayService.verifyPayment({
              razorpay_order_id: paymentData.razorpay_order_id,
              razorpay_payment_id: paymentData.razorpay_payment_id,
              razorpay_signature: paymentData.razorpay_signature,
              user_id: user.id,
              tokens_purchased: selectedPlan.tokens_included,
              amount: selectedPlan.price_inr,
            });

            if (verificationResult) {
              // Backend already added tokens during verification
              console.log('✅ Payment verified and tokens added successfully');
              onSuccess?.(selectedPlan.tokens_included);
              onClose();
            } else {
              setError('Payment verification failed - please contact support');
            }
          } catch (err) {
            console.error('Error in payment success handler:', err);
            setError('Payment processing failed');
          } finally {
            setProcessingPayment(false);
          }
        },
        (error) => {
          // Payment error handler
          console.error('Payment error:', error);
          setError(error.message || 'Payment failed');
          setProcessingPayment(false);
        }
      );
    } catch (err) {
      console.error('Error initiating payment:', err);
      setError('Failed to initiate payment');
      setProcessingPayment(false);
    }
  };

  if (!isOpen) return null;

  const isRazorpayConfigured = RazorpayService.isConfigured();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Coins className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recharge Tokens</h2>
              <p className="text-sm text-gray-500">Choose a plan to continue creating amazing roadmaps</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-red-600 text-sm">{error}</p>
                {(error.includes('Database') || error.includes('schema')) && (
                  <button
                    onClick={() => setShowSetupGuide(true)}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Setup Database</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {!isRazorpayConfigured && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-600 text-sm">
                Payment gateway is not configured. Please contact support.
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {plans.slice(0, 4).map((plan, index) => (
                <div
                  key={plan.id}
                  className={`
                    relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200
                    hover:shadow-lg transform hover:scale-[1.02] min-h-[280px] flex flex-col
                    ${selectedPlan?.id === plan.id
                      ? 'border-indigo-600 bg-indigo-50 shadow-lg'
                      : 'border-gray-200 hover:border-indigo-300'
                    }
                    ${index === 1 ? 'ring-2 ring-indigo-200 scale-105' : ''} // Highlight popular plan
                  `}
                  onClick={() => setSelectedPlan(plan)}
                >
                  {/* Popular badge */}
                  {index === 1 && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-3 py-1 rounded-full flex items-center space-x-1 shadow-lg">
                        <Star className="w-3 h-3" />
                        <span>Most Popular</span>
                      </div>
                    </div>
                  )}

                  <div className="text-center flex-1 flex flex-col">
                    <div className="mb-3">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        {plan.name}
                      </h3>
                      <div className="text-xs text-gray-500">
                        ₹{RazorpayService.calculateCostPerToken(plan).toFixed(2)} per token
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-gray-900">
                        {RazorpayService.formatCurrency(plan.price_inr)}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {RazorpayService.formatCurrency(plan.price_usd, 'USD')}
                      </div>
                    </div>

                    <div className="flex items-center justify-center space-x-2 mb-4 bg-indigo-50 rounded-lg p-2">
                      <Coins className="w-5 h-5 text-indigo-600" />
                      <span className="font-bold text-indigo-600">
                        {plan.tokens_included} tokens
                      </span>
                    </div>

                    <div className="space-y-1 flex-1">
                      {RazorpayService.formatPlanBenefits(plan).slice(0, 3).map((benefit, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs text-gray-600">
                          <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selection indicator */}
                  {selectedPlan?.id === plan.id && (
                    <div className="absolute top-3 right-3">
                      <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Payment section */}
          {selectedPlan && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium text-gray-900">Selected Plan:</span>
                  <span className="font-semibold text-indigo-600">{selectedPlan.name}</span>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">Tokens:</span>
                  <span className="font-semibold">{selectedPlan.tokens_included}</span>
                </div>
                
                <div className="flex items-center justify-between mb-6">
                  <span className="font-medium text-gray-900">Total:</span>
                  <span className="font-bold text-xl text-gray-900">
                    {RazorpayService.formatCurrency(selectedPlan.price_inr)}
                  </span>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={processingPayment || !isRazorpayConfigured}
                  className={`
                    w-full py-3 px-6 rounded-lg font-semibold text-white
                    flex items-center justify-center space-x-2
                    transition-all duration-200
                    ${processingPayment || !isRazorpayConfigured
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 transform hover:scale-[1.02]'
                    }
                  `}
                >
                  {processingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Pay Securely with Razorpay</span>
                    </>
                  )}
                </button>

                {/* Security badges */}
                <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Shield className="w-4 h-4" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className="w-4 h-4" />
                    <span>Instant Activation</span>
                  </div>
                </div>

                {/* Payment methods */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center mb-2">Accepted payment methods:</p>
                  <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-600">
                    {RazorpayService.getAvailablePaymentMethods().map((method) => (
                      <span key={method} className="px-2 py-1 bg-gray-100 rounded">
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Database Setup Guide */}
      <DatabaseSetupGuide 
        isOpen={showSetupGuide}
        onClose={() => setShowSetupGuide(false)}
      />
    </div>
  );
};

export default TokenRechargeModal;