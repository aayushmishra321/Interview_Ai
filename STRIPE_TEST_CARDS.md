# Stripe Test Card Credentials 💳

## Important Note
These are **TEST MODE** credentials provided by Stripe for testing purposes. No real money will be charged.

---

## 🇮🇳 Indian Test Cards (INR)

### 1. Successful Payment - Indian Card
```
Card Number:    4000 0035 6000 0008
Expiry Date:    Any future date (e.g., 12/25)
CVC:            Any 3 digits (e.g., 123)
ZIP/Postal:     Any 6 digits (e.g., 110001)
```
**Result**: Payment succeeds ✅

### 2. Requires Authentication (3D Secure)
```
Card Number:    4000 0027 6000 3184
Expiry Date:    Any future date (e.g., 12/25)
CVC:            Any 3 digits (e.g., 123)
ZIP/Postal:     Any 6 digits (e.g., 110001)
```
**Result**: Requires 3D Secure authentication, then succeeds ✅

---

## 🌍 International Test Cards (Also Work for INR)

### 3. Generic Successful Payment
```
Card Number:    4242 4242 4242 4242
Expiry Date:    Any future date (e.g., 12/25)
CVC:            Any 3 digits (e.g., 123)
ZIP/Postal:     Any valid postal code
```
**Result**: Payment succeeds ✅

### 4. Visa Debit Card
```
Card Number:    4000 0566 5566 5556
Expiry Date:    Any future date (e.g., 12/25)
CVC:            Any 3 digits (e.g., 123)
ZIP/Postal:     Any valid postal code
```
**Result**: Payment succeeds ✅

---

## ❌ Test Cards for Error Scenarios

### 5. Card Declined
```
Card Number:    4000 0000 0000 0002
Expiry Date:    Any future date
CVC:            Any 3 digits
```
**Result**: Card declined ❌

### 6. Insufficient Funds
```
Card Number:    4000 0000 0000 9995
Expiry Date:    Any future date
CVC:            Any 3 digits
```
**Result**: Insufficient funds ❌

### 7. Expired Card
```
Card Number:    4000 0000 0000 0069
Expiry Date:    Any future date
CVC:            Any 3 digits
```
**Result**: Expired card ❌

### 8. Incorrect CVC
```
Card Number:    4000 0000 0000 0127
Expiry Date:    Any future date
CVC:            Any 3 digits
```
**Result**: Incorrect CVC ❌

---

## 🎯 Recommended Cards for Testing

### For Quick Testing (Recommended)
Use this card for fastest testing:
```
Card:     4242 4242 4242 4242
Expiry:   12/25
CVC:      123
ZIP:      110001
```

### For India-Specific Testing (Recommended)
Use this card to test Indian payment flow:
```
Card:     4000 0035 6000 0008
Expiry:   12/25
CVC:      123
ZIP:      110001
```

---

## 📝 How to Test Payment Flow

### Step 1: Navigate to Subscription Page
```
http://localhost:5175/subscription
```

### Step 2: Click "Upgrade Now"
- Click on either "Pro" (₹2,499/month) or "Enterprise" (₹8,499/month)
- You'll be redirected to Stripe Checkout page

### Step 3: Enter Test Card Details
Use any of the test cards above. For example:
```
Email:          test@example.com
Card Number:    4242 4242 4242 4242
Expiry:         12/25
CVC:            123
Name on Card:   Test User
Country:        India
ZIP:            110001
```

### Step 4: Complete Payment
- Click "Subscribe"
- You'll be redirected back to your app
- Subscription will be activated

---

## 🔍 Verifying Payment

### Check in Your App
1. Go to Profile/Subscription page
2. You should see:
   - Plan: Pro or Enterprise
   - Status: Active
   - Subscription details

### Check Stripe Dashboard
1. Go to: https://dashboard.stripe.com/test/payments
2. Login with your Stripe account
3. You'll see the test payment listed

---

## 💡 Testing Different Scenarios

### Test Successful Subscription
```
Card: 4242 4242 4242 4242
Expected: Subscription activated, user upgraded to Pro/Enterprise
```

### Test 3D Secure Authentication
```
Card: 4000 0027 6000 3184
Expected: Authentication popup appears, then payment succeeds
```

### Test Card Decline
```
Card: 4000 0000 0000 0002
Expected: Payment fails with "Card declined" error
```

### Test Insufficient Funds
```
Card: 4000 0000 0000 9995
Expected: Payment fails with "Insufficient funds" error
```

---

## 🚨 Important Notes

1. **Test Mode Only**: These cards only work in Stripe test mode
2. **No Real Charges**: No actual money is charged
3. **Any Future Date**: Use any expiry date in the future (e.g., 12/25, 01/26)
4. **Any CVC**: Any 3-digit number works (e.g., 123, 456, 789)
5. **Any ZIP**: Any valid postal code works (e.g., 110001 for India)

---

## 🔐 Security

- Never use real card details in test mode
- Never share your Stripe secret keys
- Test mode data is separate from live mode
- Test payments don't affect real accounts

---

## 📚 Additional Resources

- **Stripe Test Cards**: https://stripe.com/docs/testing
- **Indian Cards**: https://stripe.com/docs/testing#international-cards
- **3D Secure**: https://stripe.com/docs/testing#regulatory-cards

---

## 🐛 Troubleshooting

### Payment Not Working?
1. Check backend is running: `http://localhost:5001`
2. Check Stripe key is set in `.env`: `STRIPE_SECRET_KEY`
3. Check browser console for errors
4. Check backend logs: `backend/logs/error.log`

### Stripe Checkout Not Opening?
1. Check network tab in browser DevTools
2. Verify API call to `/api/payment/create-checkout-session` succeeds
3. Check response contains `url` field
4. Ensure you're logged in

### Payment Succeeds but Subscription Not Updated?
1. Check webhook is configured (for production)
2. In test mode, subscription updates immediately
3. Refresh the page to see updated subscription status

---

## ✅ Quick Test Checklist

- [ ] Backend server running on port 5001
- [ ] Frontend running on port 5175
- [ ] Logged in to the application
- [ ] Navigate to /subscription page
- [ ] Click "Upgrade Now" on Pro or Enterprise
- [ ] Stripe checkout page opens
- [ ] Enter test card: 4242 4242 4242 4242
- [ ] Enter expiry: 12/25
- [ ] Enter CVC: 123
- [ ] Click "Subscribe"
- [ ] Redirected back to app
- [ ] Subscription status shows "Active"

---

## 🎉 Success!

If you can complete a test payment with any of these cards, your payment system is working correctly!

For production, you'll need to:
1. Switch to live mode in Stripe
2. Update `STRIPE_SECRET_KEY` with live key
3. Configure webhooks for production URL
4. Test with real cards (small amounts first)
