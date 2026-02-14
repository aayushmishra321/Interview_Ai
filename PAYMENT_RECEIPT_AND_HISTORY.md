# Payment Receipt Email & Payment History Feature

## Overview
This document describes the implementation of payment receipt emails and payment history tracking for the Smart Interview AI platform.

## Features Implemented

### 1. Payment Receipt Email
- **Automatic Email Sending**: After successful payment, users receive a professional receipt email
- **Email Template**: Beautiful HTML email with:
  - Success confirmation with checkmark icon
  - Transaction details (ID, date, plan, amount)
  - Payment method information
  - Formatted currency (INR with Indian number formatting)
  - Link to download official Stripe receipt
  - Next steps and helpful information
  - Professional branding and styling

### 2. Payment History Storage
- **Payment Model**: New MongoDB model to store all payment transactions
- **Fields Tracked**:
  - User ID (reference to User model)
  - Stripe Session ID (unique identifier)
  - Stripe Payment Intent ID
  - Stripe Customer ID
  - Stripe Subscription ID
  - Amount (in cents/paise)
  - Currency (INR)
  - Plan (pro/enterprise)
  - Status (pending/completed/failed/refunded)
  - Payment Method (card, etc.)
  - Receipt URL (Stripe receipt link)
  - Invoice URL
  - Metadata (additional information)
  - Timestamps (created/updated)

### 3. Payment History API
- **Endpoint**: `GET /api/payment/history`
- **Authentication**: Required (JWT token)
- **Response**: Array of payment records sorted by date (newest first)
- **Usage**: Frontend fetches and displays user's payment history

### 4. Profile Page Enhancement
- **Payment History Section**: New section in profile page showing:
  - All past transactions
  - Transaction ID, date, plan, amount
  - Payment status with color-coded badges
  - Payment method
  - Link to view Stripe receipt (external)
  - Empty state with call-to-action to view plans
  - Loading state while fetching data

## Technical Implementation

### Backend Changes

#### 1. Payment Model (`backend/src/models/Payment.ts`)
```typescript
interface IPayment {
  userId: ObjectId;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  amount: number;
  currency: string;
  plan: 'pro' | 'enterprise';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  receiptUrl?: string;
  invoiceUrl?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2. Email Service (`backend/src/services/email.ts`)
- Added `sendPaymentReceiptEmail()` method
- Parameters:
  - `email`: Recipient email address
  - `firstName`: User's first name
  - `paymentDetails`: Object with transaction info
- Features:
  - Professional HTML template
  - Indian currency formatting (₹)
  - Date/time formatting for Indian locale
  - Responsive design
  - Links to dashboard and receipt

#### 3. Payment Routes (`backend/src/routes/payment.ts`)
- **Enhanced `/verify-session/:sessionId`**:
  - Creates payment record in database
  - Retrieves payment intent details from Stripe
  - Extracts receipt URL from Stripe
  - Sends payment receipt email
  - Handles email failures gracefully (doesn't fail request)
  
- **New `/history` endpoint**:
  - Fetches all payments for authenticated user
  - Sorts by date (newest first)
  - Returns clean payment data

### Frontend Changes

#### Profile Page (`frontend/src/app/pages/ProfilePage.tsx`)
- Added payment history state management
- Added `useEffect` to fetch payment history on mount
- Added helper functions:
  - `formatCurrency()`: Formats amount in INR
  - `formatDate()`: Formats date in Indian locale
  - `getStatusBadge()`: Returns color-coded badge styles
- Added Payment History section with:
  - Loading state
  - Empty state
  - Transaction cards with all details
  - External link to Stripe receipt

## Email Configuration

### Environment Variables Required
```env
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=vikasmishra78000@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM_NAME=Smart Interview AI
FRONTEND_URL=http://localhost:5175
```

### Gmail Setup
1. Enable 2-Factor Authentication on Gmail account
2. Generate App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App Passwords
   - Generate password for "Mail" app
   - Use this password in `EMAIL_PASSWORD`

## Payment Flow

### Complete Payment Journey
1. **User selects plan** → Subscription page
2. **Creates checkout session** → Stripe checkout page
3. **Completes payment** → Stripe processes payment
4. **Redirects to success page** → `/payment/success?session_id=xxx`
5. **Success page calls verify endpoint** → Backend verifies payment
6. **Backend processes**:
   - Updates user subscription
   - Creates payment record
   - Sends receipt email
7. **User sees confirmation** → Success page with details
8. **User receives email** → Professional receipt in inbox
9. **User views history** → Profile page shows all payments

## Database Indexes

### Payment Collection
- `userId + createdAt` (compound, descending) - For efficient history queries
- `status` - For filtering by payment status
- `stripeCustomerId` - For Stripe customer lookups
- `stripeSessionId` (unique) - Prevents duplicate records

## Error Handling

### Email Failures
- Email sending failures are logged but don't fail the payment verification
- User still gets subscription activated
- Admin can check logs to resend emails manually

### Payment Record Failures
- If payment record creation fails, error is logged
- Subscription is still activated (payment already processed)
- Can be manually reconciled from Stripe dashboard

## Testing

### Manual Testing Steps
1. **Test Payment Flow**:
   ```bash
   # Use test card: 4242 4242 4242 4242
   # Any future expiry, any CVC
   ```

2. **Verify Email Receipt**:
   - Check inbox for receipt email
   - Verify all details are correct
   - Test receipt URL link

3. **Check Payment History**:
   - Go to Profile page
   - Scroll to Payment History section
   - Verify transaction appears
   - Test receipt link

4. **Test Multiple Payments**:
   - Make multiple test payments
   - Verify all appear in history
   - Verify sorting (newest first)

### Email Testing
```bash
# Check email service status
curl http://localhost:5001/api/payment/health

# Test email configuration
# (Add test endpoint if needed)
```

## Currency Formatting

### Indian Rupee (INR)
- Symbol: ₹
- Format: ₹2,499.00
- Locale: en-IN
- Amount stored in paise (multiply by 100)
- Display divided by 100

### Example
```typescript
// Stored in DB: 249900 (paise)
// Displayed: ₹2,499.00

const formatted = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
}).format(249900 / 100);
// Result: "₹2,499.00"
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **User Isolation**: Users can only see their own payment history
3. **Sensitive Data**: Payment card details never stored (handled by Stripe)
4. **Email Privacy**: Emails sent only to verified user email
5. **Receipt URLs**: Stripe-generated, secure, time-limited

## Future Enhancements

### Potential Improvements
1. **Invoice Generation**: Generate PDF invoices
2. **Email Preferences**: Allow users to opt-out of receipt emails
3. **Refund Handling**: Automatic refund notification emails
4. **Payment Reminders**: Email reminders before subscription renewal
5. **Export History**: Download payment history as CSV/PDF
6. **Tax Invoices**: GST-compliant invoices for Indian users
7. **Payment Analytics**: Dashboard with spending insights

## Troubleshooting

### Email Not Received
1. Check spam/junk folder
2. Verify email service is configured (check logs)
3. Check EMAIL_USER and EMAIL_PASSWORD in .env
4. Test Gmail app password is correct
5. Check backend logs for email errors

### Payment Not in History
1. Verify payment was successful in Stripe dashboard
2. Check if verify-session endpoint was called
3. Check backend logs for payment record creation
4. Verify user is logged in with correct account

### Receipt URL Not Working
1. Stripe receipt URLs expire after some time
2. Check if payment intent has receipt_url
3. Verify payment was completed (not pending)
4. Check Stripe dashboard for receipt

## API Reference

### GET /api/payment/history
**Description**: Get user's payment history

**Authentication**: Required (JWT)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "65f1234567890abcdef12345",
      "userId": "65f1234567890abcdef12340",
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
      "createdAt": "2026-02-14T15:30:00.000Z",
      "updatedAt": "2026-02-14T15:30:00.000Z"
    }
  ]
}
```

### GET /api/payment/verify-session/:sessionId
**Description**: Verify payment and activate subscription

**Authentication**: Required (JWT)

**Side Effects**:
- Updates user subscription
- Creates payment record
- Sends receipt email

**Response**:
```json
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

## Files Modified

### Backend
- `backend/src/models/Payment.ts` (NEW)
- `backend/src/services/email.ts` (MODIFIED)
- `backend/src/routes/payment.ts` (MODIFIED)

### Frontend
- `frontend/src/app/pages/ProfilePage.tsx` (MODIFIED)

## Deployment Notes

### Environment Variables
Ensure these are set in production:
- `EMAIL_USER`: Gmail account for sending emails
- `EMAIL_PASSWORD`: Gmail app password
- `EMAIL_FROM_NAME`: "Smart Interview AI"
- `FRONTEND_URL`: Production frontend URL

### Database Migration
No migration needed - Payment collection will be created automatically on first payment.

### Monitoring
- Monitor email delivery rates
- Track payment record creation success
- Alert on email service failures
- Monitor Stripe webhook events

## Support

For issues or questions:
- Check backend logs: `backend/logs/combined.log`
- Check email service status: `GET /api/payment/health`
- Verify Stripe dashboard for payment details
- Contact: vikasmishra78000@gmail.com
