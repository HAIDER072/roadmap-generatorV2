@echo off
echo Testing payment verification endpoint...

curl -X POST http://localhost:3001/api/verify-razorpay-payment ^
  -H "Content-Type: application/json" ^
  -d "{\"razorpay_order_id\":\"order_test_123\",\"razorpay_payment_id\":\"pay_test_123\",\"razorpay_signature\":\"test_signature\",\"user_id\":\"79e8c990-8c69-4287-ba26-fcc8f0aebbf1\",\"tokens_purchased\":500,\"amount\":899}"

echo.
echo Test completed!