import crypto from 'crypto';

// Test payment verification logic
const RAZORPAY_KEY_SECRET = 'FYaGyLqO5qVtmIOTjfLwBRyR'; // From your .env file

// Simulate a test payment scenario
function testPaymentVerification() {
  console.log('🔍 Testing payment verification logic...\n');
  
  // Test case 1: Mock Razorpay test payment
  const testOrder = 'order_RNnvSvn3oE3pbX'; // Example from earlier test
  const testPayment = 'pay_RNnvSvn3oE3pbX'; // Mock payment ID
  
  // Generate the expected signature
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(testOrder + '|' + testPayment)
    .digest('hex');
  
  console.log('Expected signature for test payment:');
  console.log('Order ID:', testOrder);
  console.log('Payment ID:', testPayment);
  console.log('Secret length:', RAZORPAY_KEY_SECRET.length);
  console.log('Expected signature:', expectedSignature);
  console.log('');
  
  // Test environment detection
  const RAZORPAY_KEY_ID = 'rzp_test_RNmTX5OnMSGa7f';
  const isTestEnvironment = RAZORPAY_KEY_ID.includes('_test_');
  
  console.log('Environment detection:');
  console.log('Key ID:', RAZORPAY_KEY_ID);
  console.log('Is test environment:', isTestEnvironment);
  console.log('');
  
  // Test with a real signature from Razorpay (you'll need to get this from browser logs)
  console.log('To complete verification:');
  console.log('1. Make a test payment and note the signature from browser console');
  console.log('2. Compare it with the expected signature above');
  console.log('3. If they don\'t match, the issue is with signature generation');
  console.log('4. If they match but verification fails, the issue is elsewhere');
}

testPaymentVerification();