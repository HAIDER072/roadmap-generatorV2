# 🚀 SaaS Token System Setup Guide

Your SmartLearn.io application has been successfully transformed into a SaaS application with a token-based system and Razorpay payment integration! 🎉

## 📋 What's Been Implemented

### ✅ Database Schema
- **User Profiles**: Extended with token balance, usage tracking, subscription status
- **Token Transactions**: Complete audit trail of token usage and purchases
- **Subscription Plans**: Pre-configured plans with different token packages
- **Payment Records**: Full payment history with Razorpay integration
- **Database Functions**: Atomic token operations (deduction/addition)

### ✅ Backend Features
- **Token Validation**: Server-side enforcement before AI generation
- **Razorpay Integration**: Order creation and payment verification
- **Secure Token Operations**: Using Supabase RPC functions
- **User Profile API**: Token balance and usage endpoints

### ✅ Frontend Features
- **Token Balance Display**: Shows current tokens in navbar
- **Token Recharge Modal**: Beautiful payment interface
- **Insufficient Tokens Modal**: Prompts users when tokens are depleted
- **Protected Roadmap Generation**: Pre-checks token balance

## 🔧 Setup Steps

### 1. Database Setup
Execute the SQL schema in your Supabase dashboard:
```sql
-- Copy and paste the content from database/schema.sql into Supabase SQL Editor
```

### 2. Environment Configuration
Update your `.env` file with the Supabase service role key:

```env
# Get this from Supabase Dashboard > Settings > API
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

**⚠️ Important**: Replace `your_service_role_key_here` with your actual service role key from Supabase.

### 3. Razorpay Configuration
Your test keys are already configured:
- Key ID: `rzp_test_RNmTX5OnMSGa7f`
- Key Secret: `FYaGyLqO5qVtmIOTjfLwBRyR`

### 4. Start the Application
```bash
npm run dev
```

## 🧪 Testing the SaaS Flow

### Test Scenario 1: New User Registration
1. **Sign up** for a new account
2. **Verify** that the user gets 100 free tokens automatically
3. **Check** the navbar shows the token balance

### Test Scenario 2: Token Usage
1. **Try generating a roadmap** with sufficient tokens
2. **Verify** that 1 token is deducted after successful generation
3. **Check** updated token balance in the navbar

### Test Scenario 3: Token Depletion
1. **Reduce tokens to 0** (can be done manually in Supabase dashboard for testing)
2. **Try generating a roadmap**
3. **Verify** that the "Insufficient Tokens" modal appears
4. **Check** that no generation occurs without tokens

### Test Scenario 4: Token Purchase Flow
1. **Click "Recharge Now"** from insufficient tokens modal
2. **Select a subscription plan**
3. **Proceed to payment** (use Razorpay test cards)
4. **Verify** tokens are added after successful payment

## 💳 Razorpay Test Cards

Use these test card numbers for testing payments:
- **Success**: `4111 1111 1111 1111`
- **Failure**: `4000 0000 0000 0002`
- **CVV**: Any 3-digit number
- **Expiry**: Any future date

## 📊 Subscription Plans

Pre-configured plans in the database:
1. **Starter Pack**: 100 tokens - ₹199 ($2.99)
2. **Professional Pack**: 500 tokens - ₹899 ($11.99) ⭐ Popular
3. **Business Pack**: 1000 tokens - ₹1,599 ($19.99)
4. **Enterprise Pack**: 5000 tokens - ₹6,999 ($89.99)

## 🔍 Monitoring & Debugging

### Database Queries for Testing
```sql
-- Check user profile
SELECT * FROM user_profiles WHERE email = 'your-test-email@example.com';

-- Check token transactions
SELECT * FROM token_transactions WHERE user_id = 'user-uuid' ORDER BY created_at DESC;

-- Check payments
SELECT * FROM payments WHERE user_id = 'user-uuid' ORDER BY created_at DESC;

-- Manually add tokens for testing
SELECT add_user_tokens('user-uuid', 50, 'Manual test addition');

-- Manually deduct tokens for testing
SELECT deduct_user_tokens('user-uuid', 10, 'Manual test deduction');
```

### Server Logs to Watch
- `🪙 Token validation: User {userId} requires 1 tokens`
- `🪙 Successfully deducted 1 tokens from user {userId}`
- `🎉 Successfully added {tokens} tokens to user {userId}`
- `✅ Payment signature verified for: {payment_id}`

## 🚨 Troubleshooting

### Common Issues

1. **"User profile not found"**
   - Ensure the database trigger `handle_new_user()` is working
   - Check if user exists in `user_profiles` table

2. **"Server configuration error (Supabase)"**
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
   - Check server console for connection errors

3. **"Payment gateway is not configured"**
   - Ensure Razorpay keys are set in environment
   - Check if keys are valid test keys

4. **Tokens not updating in UI**
   - Token balance fetches from database on component mount
   - Refresh the page or navigate to trigger re-fetch

### Debug Mode
Set this in your browser console for detailed logging:
```javascript
localStorage.setItem('debug-tokens', 'true');
```

## 🎯 Production Considerations

Before going live:
1. **Replace test keys** with live Razorpay keys
2. **Update currency conversion** rates (currently hardcoded)
3. **Add email notifications** for payments
4. **Implement proper error handling** for failed payments
5. **Add usage analytics** and reporting
6. **Set up monitoring** for token usage patterns
7. **Add rate limiting** to prevent abuse

## 💰 Business Model

Your app now operates on a freemium model:
- **Free tier**: 100 tokens (100 roadmaps)
- **Paid tiers**: Various token packages
- **Revenue stream**: Token purchases via Razorpay
- **Fair usage**: 1 token per roadmap ensures sustainability

## 📈 Next Steps

Consider adding:
- **Monthly subscriptions** with automatic token replenishment
- **Team/organization accounts** with shared token pools
- **Usage analytics dashboard** for users
- **Referral system** for bonus tokens
- **API access** with token-based pricing
- **Enterprise features** with higher token allocations

---

🎉 **Congratulations!** Your roadmap generator is now a fully functional SaaS application with:
- ✅ User authentication
- ✅ Token-based usage tracking
- ✅ Payment processing
- ✅ Subscription management
- ✅ Protected AI generation
- ✅ Beautiful user experience

The transformation from a simple tool to a monetizable SaaS platform is complete! 🚀