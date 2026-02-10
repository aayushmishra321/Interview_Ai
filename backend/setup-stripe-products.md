# Stripe Products Setup Guide

## Step 1: Create Products in Stripe Dashboard

### Go to Stripe Dashboard
1. Visit: https://dashboard.stripe.com/test/products
2. Click "Add product"

### Create Pro Plan
1. **Product Information:**
   - Name: `Pro Plan`
   - Description: `Unlimited interviews with advanced AI feedback and video analysis`
   
2. **Pricing:**
   - Price: `$29.00`
   - Billing period: `Monthly`
   - Currency: `USD`
   
3. Click "Save product"
4. **Copy the Price ID** (starts with `price_`)

### Create Enterprise Plan
1. **Product Information:**
   - Name: `Enterprise Plan`
   - Description: `Everything in Pro plus custom templates, team management, and API access`
   
2. **Pricing:**
   - Price: `$99.00`
   - Billing period: `Monthly`
   - Currency: `USD`
   
3. Click "Save product"
4. **Copy the Price ID** (starts with `price_`)

## Step 2: Update Environment Variables

Edit `backend/.env` and replace:

```env
STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxxxxxxxxxx
```

With your actual Price IDs from Stripe.

## Step 3: Register Webhook (For Production)

### Local Testing (Use Stripe CLI)
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:5001/api/payment/webhook
```

### Production Setup
1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. **Endpoint URL:** `https://yourdomain.com/api/payment/webhook`
4. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. **Copy the Signing secret** (starts with `whsec_`)
7. Update `backend/.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

## Step 4: Test Payment Flow

### Using Stripe Test Cards
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`

**Expiry:** Any future date  
**CVC:** Any 3 digits  
**ZIP:** Any 5 digits

### Test Flow
1. Register/Login to platform
2. Go to Profile → Subscription
3. Click "Upgrade to Pro"
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout
6. Verify subscription updated

## Current Status

✅ Stripe SDK configured  
✅ Test API keys set  
✅ Webhook secret configured  
⚠️ Products need to be created in dashboard  
⚠️ Price IDs need to be updated in .env  

## For Testing Without Stripe Products

The platform will work without Stripe products. Users just won't be able to upgrade plans. All other features (interviews, resume analysis, code execution) work on the free plan.
