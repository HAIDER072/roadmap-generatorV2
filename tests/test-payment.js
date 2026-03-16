// Test payment verification without Razorpay
import crypto from 'crypto';
import fetch from 'node-fetch';

// Test data
const testPayment = {
  razorpay_order_id: 'order_test_' + Date.now(),
  razorpay_payment_id: 'pay_test_' + Date.now(),
  user_id: '79e8c990-8c69-4287-ba26-fcc8f0aebbf1', // Replace with actual user ID
  tokens_purchased: 500,
  amount: 899
};

// Generate test signature
const RAZORPAY_KEY_SECRET = 'FYaGyLqO5qVtmIOTjfLwBRyR';
const expectedSignature = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(testPayment.razorpay_order_id + '|' + testPayment.razorpay_payment_id)
  .digest('hex');

testPayment.razorpay_signature = expectedSignature;

console.log('🧪 Testing Payment Verification');
console.log('Test Payment Data:', testPayment);

// Test the payment verification endpoint
const testPaymentVerification = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/verify-razorpay-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayment),
    });

    const result = await response.json();
    console.log('\nResponse Status:', response.status);
    console.log('Response Data:', result);

    if (result.success) {
      console.log('✅ Payment verification successful!');
      console.log('Tokens added:', result.tokens_added);
    } else {
      console.log('❌ Payment verification failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
};

testPaymentVerification();