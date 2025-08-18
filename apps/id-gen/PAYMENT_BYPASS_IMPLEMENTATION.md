# PayMongo Bypass Implementation

## Overview

This implementation adds a payment bypass system that allows the application to simulate successful payments without making external PayMongo API calls. This is particularly useful for:

- Development and testing environments
- Demo environments where you need to show payment functionality without processing real payments
- Organizations that need to grant credits/features without payment processing

## Key Features

✅ **Organization-level Control**: Bypass is controlled via `org_settings` table
✅ **Super Admin Only**: Only super admins can enable/disable bypass mode
✅ **Server-side Security**: All bypass logic runs on the server with proper validation
✅ **Complete Audit Trail**: All bypass transactions are logged with metadata
✅ **Consistent API**: Same remote function calls work with and without bypass
✅ **Safe Fallback**: When payments are disabled, bypass can still work if enabled

## Files Modified/Created

### 1. Server-side Bypass Helpers
- **`src/lib/server/credits/bypass-helpers.ts`** (NEW)
  - `addCreditsBypass()` - Safely add credits during bypass
  - `grantFeatureBypass()` - Grant premium features during bypass
  - `generateBypassReference()` - Generate tracking IDs for bypass transactions

### 2. Payment Remote Functions
- **`src/lib/server/remotes/payments.remote.ts`** (MODIFIED)
  - `createCreditPayment()` - Added bypass mode support
  - `createFeaturePayment()` - Added bypass mode support

### 3. Schema Updates
- **`src/lib/payments/schemas.ts`** (MODIFIED)
  - `zCheckoutInitResult` - Updated to support bypass provider and flags

### 4. Admin Controls (Already Exists)
- **`src/routes/admin/billing.remote.ts`** (REFERENCE)
  - `setPaymentsBypass()` - Super admin function to toggle bypass mode

## Database Schema

The implementation uses existing tables with no schema changes required:

### org_settings table
```sql
org_id uuid PRIMARY KEY
payments_enabled boolean DEFAULT true
payments_bypass boolean DEFAULT false
updated_by uuid
updated_at timestamptz DEFAULT now()
```

### credit_transactions table
All bypass transactions are logged here with:
- `transaction_type: 'purchase'`
- `metadata.bypass: true`
- `metadata.type: 'credit_purchase_bypass'` or `'feature_purchase_bypass'`
- `reference_id: 'bypass_[timestamp]_[random]'`

## How It Works

### 1. Organization Settings Check
Every payment remote function first checks the `org_settings` table:

```sql
SELECT payments_enabled, payments_bypass 
FROM org_settings 
WHERE org_id = $1
```

### 2. Payment Flow Decision Tree
```
Payment Request
│
├── payments_enabled = false && payments_bypass = false
│   └── ❌ Error: "Payments are disabled"
│
├── payments_bypass = true
│   ├── ✅ Apply credits immediately
│   ├── ✅ Log bypass transaction
│   └── ✅ Return success with bypass flag
│
└── payments_enabled = true
    └── ✅ Standard PayMongo flow
```

### 3. Bypass Flow Details

**For Credit Purchases:**
1. Validate `packageId` against server-side catalog
2. Generate bypass reference: `bypass_1703123456_abc123`
3. Add credits using `supabaseAdmin` (server-only access)
4. Log transaction with bypass metadata
5. Return success response with `provider: 'bypass'`

**For Feature Purchases:**
1. Validate `featureId` against server-side catalog  
2. Generate bypass reference
3. Update user profile with feature flags
4. Log transaction with bypass metadata
5. Return success response with `provider: 'bypass'`

## Security Considerations

### ✅ **Super Admin Only**
- Only super admins can toggle `payments_bypass` flag
- Regular users cannot access bypass functionality directly
- Bypass status is not exposed in client-side code

### ✅ **Server-side Validation**
- Package/feature IDs are validated against server-side catalogs
- Credit amounts are never trusted from client
- All operations use `supabaseAdmin` for elevated privileges

### ✅ **Complete Audit Trail**
- All bypass transactions are logged in `credit_transactions`
- Metadata includes bypass flag and original amount
- Reference IDs are unique and trackable

### ✅ **No External API Exposure**
- Bypass logic is completely internal
- No PayMongo API calls are made during bypass
- Webhook endpoints are not involved in bypass flow

## Usage Examples

### Enable Bypass Mode (Super Admin Only)
```typescript
// In admin interface
await setPaymentsBypass({ bypass: true });
```

### Standard Payment Call (Works with Bypass)
```typescript
// Client code remains the same
const result = await createCreditPayment({
  packageId: 'credits_100',
  returnTo: '/success'
});

// Response varies based on bypass mode:
// Standard: { provider: 'paymongo', checkoutUrl: '...' }
// Bypass: { provider: 'bypass', bypass: true, success: true }
```

### Check Bypass Status
```typescript
// In client code, check the response
if (result.provider === 'bypass') {
  // Credits were added immediately
  // Show success message or redirect
} else {
  // Redirect to PayMongo checkout
  window.location.href = result.checkoutUrl;
}
```

## Monitoring and Logging

All bypass operations generate structured logs:

```json
{
  "action": "credit_payment_bypassed",
  "userId": "user_123",
  "packageId": "credits_100",
  "amountPhp": 50,
  "credits": 100,
  "bypassReference": "bypass_1703123456_abc123",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Error Handling

### Common Error Scenarios:
1. **Payments Disabled**: `"Payments are disabled for this organization"`
2. **Invalid Package**: `"Invalid or inactive credit package"`
3. **Database Error**: `"Failed to update user balance"`
4. **Permission Error**: Only triggered for non-super admins trying to access bypass controls

### Error Response Format:
```json
{
  "success": false,
  "error": "Failed to process bypass payment"
}
```

## Testing

### Development Testing
```bash
# Enable bypass in your test environment
# Via admin interface or database directly
UPDATE org_settings SET payments_bypass = true WHERE org_id = 'your_org_id';

# Test credit purchase
# Should complete immediately without PayMongo redirect
```

### Production Considerations
- Bypass should typically be disabled in production
- If enabled in production, monitor bypass transactions closely
- Consider automated alerts for bypass usage in production

## Integration Notes

### Client-side Handling
```typescript
// Handle both standard and bypass responses
const handlePurchase = async (packageId: string) => {
  try {
    const result = await createCreditPayment({ packageId });
    
    if (result.bypass) {
      // Bypass mode - credits added immediately
      showSuccess('Credits added successfully!');
      refreshUserProfile();
    } else {
      // Standard mode - redirect to checkout
      window.location.href = result.checkoutUrl;
    }
  } catch (error) {
    showError('Purchase failed');
  }
};
```

### Form Integration
```svelte
<!-- Form works the same for both modes -->
<form use:enhance action="?/purchaseCredits">
  <input type="hidden" name="packageId" value="credits_100" />
  <button type="submit">Purchase Credits</button>
</form>
```

## Migration Path

This implementation is fully backward compatible:

1. **Existing Code**: No changes needed to client-side payment code
2. **Default Behavior**: Bypass is disabled by default
3. **Gradual Rollout**: Can enable bypass per organization
4. **Easy Rollback**: Simply disable bypass flag to return to normal flow

## Future Enhancements

Potential improvements for the bypass system:

1. **Bypass Quotas**: Limit number of bypass transactions per organization
2. **Time-limited Bypass**: Auto-disable bypass after a certain time
3. **Bypass Notifications**: Email alerts when bypass is used
4. **Advanced Logging**: Export bypass transaction reports
5. **Multi-level Approval**: Require multiple super admin confirmations

---

✅ **Implementation Complete**: PayMongo bypass functionality is now fully integrated and ready for use.
