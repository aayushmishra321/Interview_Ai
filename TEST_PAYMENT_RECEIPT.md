# Testing Payment Receipt & History Feature

## Quick Test Guide

### Prerequisites
1. Backend server running on `http://localhost:5001`
2. Frontend server running on `http://localhost:5175`
3. User account created and logged in
4. Email service configured (optional - will log if not configured)

### Test Steps

#### 1. Make a Test Payment
```bash
# Login to the application
# Navigate to: http://localhost:5175/subscription

# Click "Upgrade to Pro" or "Upgrade to Enterprise"
# Use Stripe test card: 4242 4242 4242 4242
# Any future expiry date (e.g., 12/34)
# Any 3-digit CVC (e.g., 123)
# Any ZIP code (e.g., 12345)

# Complete the payment
```

#### 2. Verify Payment Success Page
```
After payment, you should be redirected to:
http://localhost:5175/payment/success?session_id=cs_test_...

You should see:
✓ Payment successful message
✓ Your plan details (Pro or Enterprise)
✓ Amount paid in INR (₹)
✓ Subscription expiry date
✓ "Go to Dashboard" button
```

#### 3. Check Email Receipt
```
If email is configured:
✓ Check inbox: aayush.mishra17596@sakec.ac.in
✓ Subject: "Payment Receipt - Pro Plan - Smart Interview AI"
✓ Email should contain:
  - Success checkmark icon
  - Transaction ID
  - Date & Time
  - Plan name
  - Amount paid (₹2,499.00 or ₹8,499.00)
  - Payment method
  - Link to dashboard
  - Link to Stripe receipt (if available)

If email is NOT configured:
✓ Check backend logs for:
  "Email not sent to ... - service not configured"
  "Would have sent: Payment Receipt - Pro Plan - Smart Interview AI"
```

#### 4. View Payment History in Profile
```bash
# Navigate to: http://localhost:5175/profile
# Scroll down to "Payment History" section

You should see:
✓ Your recent payment transaction
✓ Transaction ID (MongoDB ObjectId)
✓ Date and time of payment
✓ Plan name (Pro or Enterprise)
✓ Status badge (green "Completed")
✓ Payment method (Card)
✓ Amount in INR (₹2,499.00 or ₹8,499.00)
✓ External link icon to view Stripe receipt
```

#### 5. Test Multiple Payments
```bash
# Make another test payment with different plan
# Go back to profile page
# Verify both payments appear in history
# Verify they are sorted by date (newest first)
```

### API Testing with cURL

#### Get Payment History
```bash
# Get your auth token from browser localStorage
# Key: "auth-storage"
# Extract the "token" value

curl -X GET http://localhost:5001/api/payment/history \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"

# Expected Response:
{
  "success": true,
  "data": [
    {
      "_id": "65f1234567890abcdef12345",
      "userId": "65f1234567890abcdef12340",
      "stripeSessionId": "cs_test_...",
      "amount": 249900,
      "currency": "INR",
      "plan": "pro",
      "status": "completed",
      "paymentMethod": "card",
      "receiptUrl": "https://pay.stripe.com/receipts/...",
      "createdAt": "2026-02-14T15:30:00.000Z"
    }
  ]
}
```

#### Verify Payment Session
```bash
# After payment, get session_id from URL
# Example: cs_test_a1DCzNcloYcqBNy8CX7CPnbc8m80v55fVW7UQxY84CDLfK9xeuvVPFRyxp

curl -X GET http://localhost:5001/api/payment/verify-session/SESSION_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"

# Expected Response:
{
  "success": true,
  "data": {
    "paymentStatus": "paid",
    "subscription": {
      "plan": "pro",
      "status": "active",
      "expiresAt": "2026-03-14T15:30:00.000Z",
      "stripeCustomerId": "cus_...",
      "stripeSubscriptionId": "sub_..."
    }
  }
}
```

### Database Verification

#### Check Payment Records in MongoDB
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/smart-interview-ai

# Query payments
db.payments.find().pretty()

# Expected fields:
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),
  "stripeSessionId": "cs_test_...",
  "stripePaymentIntentId": "pi_...",
  "stripeCustomerId": "cus_...",
  "stripeSubscriptionId": "sub_...",
  "amount": 249900,
  "currency": "INR",
  "plan": "pro",
  "status": "completed",
  "paymentMethod": "card",
  "receiptUrl": "https://pay.stripe.com/receipts/...",
  "createdAt": ISODate("2026-02-14T15:30:00.000Z"),
  "updatedAt": ISODate("2026-02-14T15:30:00.000Z")
}
```

### Backend Logs Verification

#### Check Logs for Payment Processing
```bash
# View combined logs
cat backend/logs/combined.log | grep -i payment

# Expected log entries:
"Checkout session created for user: aayush.mishra17596@sakec.ac.in, plan: pro"
"Payment record created for user: aayush.mishra17596@sakec.ac.in, amount: 249900, plan: pro"
"Payment receipt email sent to: aayush.mishra17596@sakec.ac.in"
"Subscription activated for user: aayush.mishra17596@sakec.ac.in, plan: pro"
```

### Email Service Configuration Test

#### Setup Gmail for Testing
```bash
# 1. Enable 2FA on Gmail account: vikasmishra78000@gmail.com
# 2. Generate App Password:
#    - Go to: https://myaccount.google.com/security
#    - 2-Step Verification → App Passwords
#    - Select "Mail" and generate password
# 3. Update backend/.env:

EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=vikasmishra78000@gmail.com
EMAIL_PASSWORD=your_16_char_app_password_here
EMAIL_FROM_NAME=Smart Interview AI
FRONTEND_URL=http://localhost:5175

# 4. Restart backend server
# 5. Make a test payment
# 6. Check email inbox
```

### Troubleshooting

#### Email Not Received
```bash
# Check if email service is configured
curl http://localhost:5001/api/payment/health

# Check backend logs
tail -f backend/logs/combined.log | grep -i email

# Common issues:
# - EMAIL_USER or EMAIL_PASSWORD not set
# - Gmail app password incorrect
# - 2FA not enabled on Gmail
# - Email in spam folder
```

#### Payment Not in History
```bash
# Check if payment was successful in Stripe
# Go to: https://dashboard.stripe.com/test/payments

# Check backend logs
tail -f backend/logs/combined.log | grep -i "payment record"

# Verify user is logged in
# Check browser console for errors
# Verify API endpoint is accessible
```

#### Receipt URL Not Working
```bash
# Stripe receipt URLs may expire
# Check Stripe dashboard for receipt
# Verify payment intent has receipt_url
# Try accessing from Stripe dashboard directly
```

### Success Criteria

✅ Payment completes successfully  
✅ User subscription updated to Pro/Enterprise  
✅ Payment record created in database  
✅ Email receipt sent (if configured)  
✅ Payment appears in profile history  
✅ All details are accurate (amount, date, plan)  
✅ Receipt URL works (if available)  
✅ Multiple payments show in correct order  

### Test Scenarios

#### Scenario 1: First Payment (Pro Plan)
1. New user signs up
2. Upgrades to Pro plan (₹2,499)
3. Completes payment with test card
4. Receives email receipt
5. Sees payment in profile history
6. Subscription status shows "Pro"

#### Scenario 2: Upgrade to Enterprise
1. Existing Pro user
2. Upgrades to Enterprise (₹8,499)
3. Completes payment
4. Receives email receipt
5. Both payments show in history
6. Subscription status shows "Enterprise"

#### Scenario 3: Multiple Payments
1. User makes 3 test payments
2. All 3 appear in payment history
3. Sorted by date (newest first)
4. Each has unique transaction ID
5. All receipt links work

### Performance Testing

#### Load Test Payment History
```bash
# Create multiple payment records
# Measure API response time
# Should be < 500ms for 100 records

# Test query:
time curl -X GET http://localhost:5001/api/payment/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Security Testing

#### Test Authorization
```bash
# Try accessing without token (should fail)
curl -X GET http://localhost:5001/api/payment/history

# Expected: 401 Unauthorized

# Try accessing with invalid token (should fail)
curl -X GET http://localhost:5001/api/payment/history \
  -H "Authorization: Bearer invalid_token"

# Expected: 401 Unauthorized

# Try accessing another user's payments (should only see own)
# Login as User A, get token
# Make payment as User A
# Login as User B, get token
# Try to access User A's payments with User B's token
# Should only see User B's payments (empty if none)
```

## Summary

This feature provides:
1. ✅ Automatic payment receipt emails
2. ✅ Complete payment history tracking
3. ✅ Professional email templates
4. ✅ Secure payment record storage
5. ✅ User-friendly profile display
6. ✅ Indian currency formatting
7. ✅ Stripe receipt integration
8. ✅ Comprehensive error handling

All tests should pass and the feature should work seamlessly for users!
