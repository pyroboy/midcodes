# ID Generator Monetization Setup

This guide helps you complete the PayMongo integration and monetization setup for your ID Generator application.

## Overview

Your Phase 2 implementation includes:

- ✅ PayMongo payment integration
- ✅ Credit system backend (already implemented in Phase 1)
- ✅ Pricing page with credit packages and premium features
- ✅ Account/billing management page
- ✅ Payment API endpoints
- ✅ Webhook handling for payment processing

## Setup Instructions

### 1. Environment Variables

1. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

2. Get your PayMongo API keys from https://dashboard.paymongo.com/developers
3. Update `.env.local` with your actual keys:

```env
PAYMONGO_SECRET_KEY=sk_test_your_actual_secret_key
PAYMONGO_PUBLIC_KEY=pk_test_your_actual_public_key
PAYMONGO_WEBHOOK_SECRET=whsec_your_webhook_secret
BASE_URL=https://your-domain.com
```

### 2. PayMongo Webhook Setup

1. In your PayMongo dashboard, create a webhook endpoint:
   - URL: `https://your-domain.com/api/payments/webhook`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`

2. Copy the webhook secret and add it to your `.env.local`

### 3. Database Schema (Already Done)

Your database already includes these tables from Phase 1:

- `profiles` - Extended with credit and premium feature columns
- `credit_transactions` - Transaction history
- `subscription_plans` - Pricing tier definitions
- `usage_limits` - Monthly/annual usage tracking

### 4. Test the Integration

#### Development Testing

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Visit the new pages:
   - **Pricing**: http://localhost:5173/pricing
   - **Account**: http://localhost:5173/account

3. Test purchase flow:
   - Go to pricing page
   - Click "Purchase Credits" on any package
   - You'll be redirected to PayMongo's checkout page
   - Use PayMongo test card numbers for testing

#### PayMongo Test Cards

Use these test card numbers in PayMongo's test environment:

- **Visa**: 4343434343434345
- **Mastercard**: 5555555555554444
- **GCash**: Any 11-digit mobile number

### 5. Pricing Configuration

Edit `src/lib/utils/credits.ts` to adjust your pricing:

```typescript
export const CREDIT_PACKAGES = [
	{
		id: 'small',
		name: 'Small Package',
		credits: 50,
		price: 250 // ₱250
		// ... other properties
	}
	// Add more packages
];

export const PREMIUM_FEATURES = [
	{
		id: 'unlimited_templates',
		name: 'Unlimited Templates',
		price: 99 // ₱99 one-time
		// ... other properties
	}
	// Add more features
];
```

## Features Implemented

### 1. Pricing Page (`/pricing`)

- Displays credit packages and premium features
- Handles payment initiation
- Mobile-responsive design
- FAQ section

### 2. Account Management (`/account`)

- Credit balance display
- Transaction history
- Premium feature status
- Usage statistics

### 3. Payment System

- PayMongo integration
- Secure webhook handling
- Automatic credit/feature fulfillment
- Transaction logging

### 4. Navigation Updates

- Added pricing and account links to navigation
- Updated mobile header dropdown
- Enhanced hamburger menu

## Usage Enforcement

The system automatically enforces limits:

- **Free tier**: 2 templates, 10 card generations
- **Template creation**: Checks `canCreateTemplate()`
- **Card generation**: Checks `canGenerateCard()` and deducts credits
- **Premium features**: Watermark removal, unlimited templates

## Deployment Notes

### Environment Variables for Production

Make sure to set these in your production environment:

```env
PAYMONGO_SECRET_KEY=sk_live_your_live_secret_key
PAYMONGO_PUBLIC_KEY=pk_live_your_live_public_key
PAYMONGO_WEBHOOK_SECRET=whsec_your_live_webhook_secret
BASE_URL=https://your-actual-domain.com
```

### Webhook Security

The webhook endpoint includes signature verification for security. Ensure:

1. HTTPS is enabled for webhook URLs
2. Webhook secret is kept secure
3. Only expected events are processed

## Next Steps

### Phase 3: UI/UX Enhancements

- [ ] Add usage warnings when approaching limits
- [ ] Implement upgrade prompts
- [ ] Add success/failure notifications
- [ ] Create usage dashboard widgets

### Phase 4: Advanced Features

- [ ] Bulk pricing for enterprises
- [ ] Subscription plans (monthly/yearly)
- [ ] Refund management
- [ ] Analytics and reporting

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is publicly accessible
   - Verify webhook secret matches
   - Check PayMongo dashboard for delivery attempts

2. **Payment not processing**
   - Verify API keys are correct
   - Check webhook signature verification
   - Review server logs for errors

3. **Credits not added after payment**
   - Check webhook processing logs
   - Verify payment intent metadata
   - Ensure user ID and org ID are correct

### Support

For PayMongo-specific issues, check:

- PayMongo documentation: https://developers.paymongo.com/docs
- PayMongo support: https://support.paymongo.com/

## Security Considerations

- Never expose secret keys in client-side code
- Always verify webhook signatures
- Use HTTPS for all payment-related endpoints
- Log payment events for audit trails
- Implement rate limiting on payment endpoints

---

Your ID Generator app is now ready for monetization! The implementation follows industry best practices and provides a solid foundation for your ₱50 per card printing cost business model.
