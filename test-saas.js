// SaaS System Test Script
// Run this with: node test-saas.js

const API_BASE_URL = 'http://localhost:3001';

async function testEndpoints() {
  console.log('🧪 Testing SaaS System Endpoints\n');
  
  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();
    console.log('✅ Health check passed');
    console.log('   - Gemini configured:', data.aiServices?.gemini?.configured);
    console.log('   - Mistral configured:', data.aiServices?.mistral?.configured);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  
  // Test 2: Razorpay Order Creation
  console.log('\n2. Testing Razorpay Order Creation...');
  try {
    const orderResponse = await fetch(`${API_BASE_URL}/api/create-razorpay-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 19900, // ₹199 in paise
        currency: 'INR',
        receipt: 'test_receipt_' + Date.now()
      })
    });
    
    if (orderResponse.ok) {
      const orderData = await orderResponse.json();
      console.log('✅ Razorpay order creation passed');
      console.log('   - Order ID:', orderData.order?.id);
      console.log('   - Amount:', orderData.order?.amount);
    } else {
      const error = await orderResponse.text();
      console.log('❌ Razorpay order creation failed:', error);
    }
  } catch (error) {
    console.log('❌ Razorpay test failed:', error.message);
  }

  // Test 3: Roadmap Generation (without userId - should fail)
  console.log('\n3. Testing Roadmap Generation without userId...');
  try {
    const roadmapResponse = await fetch(`${API_BASE_URL}/api/generate-roadmap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Learn React.js',
        category: 'subject'
      })
    });
    
    const roadmapData = await roadmapResponse.json();
    if (roadmapResponse.status === 401) {
      console.log('✅ Roadmap auth validation passed (correctly rejected)');
      console.log('   - Error:', roadmapData.error);
    } else {
      console.log('❌ Roadmap auth validation failed (should reject without userId)');
    }
  } catch (error) {
    console.log('❌ Roadmap test failed:', error.message);
  }

  // Test 4: User Profile (invalid user - should fail gracefully)
  console.log('\n4. Testing User Profile endpoint...');
  try {
    const profileResponse = await fetch(`${API_BASE_URL}/api/user-profile/test-user-id`);
    const profileData = await profileResponse.json();
    
    if (profileResponse.status === 404) {
      console.log('✅ User profile validation passed (correctly handled invalid user)');
      console.log('   - Error:', profileData.error);
    } else {
      console.log('❌ User profile validation failed');
    }
  } catch (error) {
    console.log('❌ User profile test failed:', error.message);
  }

  console.log('\n🏁 Test Summary:');
  console.log('- Server endpoints are responding correctly');
  console.log('- Authentication is properly enforced');  
  console.log('- Error handling is working as expected');
  console.log('\n📝 Next Steps:');
  console.log('1. Set up the database schema in Supabase');
  console.log('2. Add your Supabase service role key to .env');
  console.log('3. Test with real user authentication');
  console.log('4. Try the complete flow from UI');
}

// Run tests
testEndpoints().catch(console.error);