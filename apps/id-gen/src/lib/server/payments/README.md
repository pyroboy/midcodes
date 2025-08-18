# Payment Persistence Layer

This module provides a robust persistence layer for handling payment records with built-in idempotency guards and transaction support.

## Overview

The persistence layer is designed to handle the complete payment lifecycle:
1. **Checkout Initialization** - Record payment intent when user starts checkout
2. **Payment Processing** - Update status when payment provider processes payment
3. **Webhook Handling** - Process payment confirmation/failure events with idempotency
4. **Transaction Safety** - Ensure credits/features are granted atomically

## Database Schema

### payment_records Table
- `id` - UUID primary key
- `user_id` - UUID foreign key to auth.users
- `session_id` - Unique session identifier for checkout
- `provider_payment_id` - Payment provider's payment ID (e.g., PayMongo payment intent ID)
- `kind` - Purchase type ('credit' | 'feature')
- `sku_id` - SKU identifier for the product purchased
- `amount_php` - Amount in Philippine Peso
- `currency` - Currency code (default: 'PHP')
- `status` - Payment status ('pending' | 'paid' | 'failed' | 'expired' | 'refunded')
- `method` - Payment method used ('gcash' | 'paymaya' | 'card' | 'online_banking')
- `method_allowed` - Array of allowed payment methods
- `paid_at` - Timestamp when payment was completed
- `idempotency_key` - Unique key to prevent duplicate records
- `metadata` - JSONB field for additional data
- `raw_event` - Raw webhook payload for audit trail
- `reason` - Failure reason (if payment failed)
- `created_at` / `updated_at` - Timestamps

### webhook_events Table
- `id` - UUID primary key
- `event_id` - Unique event ID from payment provider
- `event_type` - Type of webhook event
- `provider` - Payment provider name (default: 'paymongo')
- `processed_at` - When the event was processed
- `raw_payload` - Complete webhook payload
- `created_at` - Timestamp

## Core Functions

### recordCheckoutInit
Records a new payment checkout initialization.
```typescript
const payment = await recordCheckoutInit({
  userId: 'user-123',
  sessionId: 'session-abc',
  kind: 'credit',
  skuId: 'credits-100',
  amountPhp: 500,
  methodAllowed: ['gcash', 'paymaya'],
  idempotencyKey: 'unique-key-123',
  metadata: { source: 'web-app' }
});
```

### markPaymentPaid
Marks a payment as successfully paid.
```typescript
const payment = await markPaymentPaid({
  providerPaymentId: 'pi_123456',
  method: 'gcash',
  paidAt: new Date(),
  rawEvent: webhookPayload
});
```

### markPaymentFailed
Marks a payment as failed.
```typescript
const payment = await markPaymentFailed({
  providerPaymentId: 'pi_123456',
  reason: 'Insufficient funds',
  rawEvent: webhookPayload
});
```

### Lookup Functions
```typescript
// By session ID
const payment = await getPaymentBySessionId('session-abc');

// By provider payment ID
const payment = await getPaymentByProviderId('pi_123456');

// User payment history with pagination
const result = await listPaymentsByUser({
  userId: 'user-123',
  limit: 25,
  cursor: '2024-01-01T00:00:00Z'
});
```

### Webhook Idempotency
```typescript
// Check if webhook was already processed
const processed = await hasProcessedWebhookEvent('evt_123');

// Mark webhook as processed
const event = await markWebhookEventProcessed(
  'evt_123',
  'payment.succeeded',
  webhookPayload
);
```

## Idempotency Features

### Checkout Initialization
- Uses `idempotency_key` to prevent duplicate payment records
- If duplicate key is found, returns existing record instead of creating new one

### Webhook Processing
- Tracks processed webhook events by `event_id`
- Prevents duplicate credit granting from webhook retries
- Returns existing result if event was already processed

### Database Constraints
- `idempotency_key` has unique constraint
- `session_id` has unique constraint  
- `provider_payment_id` has unique constraint
- `event_id` has unique constraint in webhook_events table

## Transaction Handling

Use `executeInTransaction` for operations that need atomicity:

```typescript
const result = await executeInTransaction(async () => {
  // Mark payment as paid
  const payment = await markPaymentPaid({...});
  
  // Grant credits to user
  await grantCreditsToUser(payment.user_id, 100);
  
  // Mark webhook as processed
  await markWebhookEventProcessed(...);
  
  return { success: true };
});
```

## Security Features

### Row Level Security (RLS)
- Users can only view their own payment records
- Users can create payment records for themselves
- Only service role can update payment records
- Only service role can manage webhook events

### Data Protection
- Sensitive payment data is stored in server-only tables
- Raw webhook events are stored for audit purposes
- Payment provider IDs are indexed but not exposed to client

## Usage Patterns

### 1. Checkout Flow
```typescript
// 1. Initialize checkout
const payment = await recordCheckoutInit({...});

// 2. Create payment with provider (PayMongo, etc.)
const providerResponse = await createPaymentIntent({...});

// 3. Update payment with provider ID
await updatePaymentWithProviderId(
  payment.session_id, 
  providerResponse.id
);
```

### 2. Webhook Processing
```typescript
export async function handleWebhook(request: Request) {
  const payload = await request.json();
  const eventId = payload.data.id;
  
  // Check idempotency
  if (await hasProcessedWebhookEvent(eventId)) {
    return Response.json({ status: 'already_processed' });
  }
  
  // Process payment
  const result = await executeInTransaction(async () => {
    await markPaymentPaid({...});
    await grantCreditsToUser(...);
    await markWebhookEventProcessed(...);
    return { success: true };
  });
  
  return Response.json(result);
}
```

### 3. User Dashboard
```typescript
// Get payment history
const history = await listPaymentsByUser({
  userId: user.id,
  limit: 10
});

// Get payment statistics
const stats = await getPaymentStats(user.id);
```

## Error Handling

All functions throw descriptive errors:
- Database connection errors
- Validation errors
- Not found errors (return null for lookup functions)
- Constraint violation errors

Always wrap calls in try-catch blocks:
```typescript
try {
  const payment = await recordCheckoutInit({...});
} catch (error) {
  console.error('Payment initialization failed:', error.message);
  // Handle error appropriately
}
```

## Testing

See `persistence-example.ts` for comprehensive usage examples and testing patterns.

## Performance Considerations

- All frequently queried fields are indexed
- Pagination is implemented for list operations
- Raw webhook payloads are stored but not indexed (audit only)
- Consider archiving old payment records based on your retention policy
