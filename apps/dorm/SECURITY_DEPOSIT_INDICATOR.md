# Security Deposit Indicator Feature

This feature adds a visual indicator to lease cards showing when a tenant has fully paid their security deposit.

## How It Works

1. **Visual Indicator**: A small green shield icon appears next to the lease name when all security deposit billings are fully paid
2. **Feature Flag**: The indicator is controlled by a feature flag and disabled by default
3. **Responsive Design**: Different sizes for mobile (12px) and desktop (16px) displays

## Implementation Details

### Files Modified/Created:

- `src/lib/stores/featureFlags.ts` - Feature flag system
- `src/lib/utils/lease.ts` - Security deposit status helper function  
- `src/routes/leases/LeaseCard.svelte` - Visual indicator implementation
- `src/routes/leases/FeatureFlagToggle.svelte` - Development toggle (remove in production)

### Core Logic:

```typescript
// Helper function to check if security deposit is fully paid
export function isSecurityDepositFullyPaid(lease: any): boolean {
  const securityDepositBillings = lease.billings.filter(
    billing => billing.type === 'SECURITY_DEPOSIT'
  );
  
  return securityDepositBillings.length > 0 && 
         securityDepositBillings.every(billing => billing.balance <= 0);
}
```

## How to Enable/Test

### Development Mode:
1. Open `/leases` page in development
2. Use the feature flag toggle in the bottom-right corner
3. Toggle "Show Security Deposit Indicator" checkbox
4. Create test leases with security deposit billings to see the indicator

### Production Configuration:

#### Method 1: Environment Variable
Set environment variable (build-time):
```bash
VITE_FEATURE_SECURITY_DEPOSIT_INDICATOR=true
```

#### Method 2: Runtime Toggle
Access the feature flags store directly:
```javascript
import { featureFlags } from '$lib/stores/featureFlags';
featureFlags.setSecurityDepositIndicator(true);
```

#### Method 3: Admin Panel (Future)
Add admin interface to control feature flags.

## Visual Design

- **Icon**: Shield (from Lucide)
- **Size**: 12px (mobile), 16px (desktop) 
- **Color**: Green circle (`bg-green-500`) with white shield
- **Position**: Next to lease name
- **Tooltip**: "Security Deposit Fully Paid"

## Testing Scenarios

1. **No Security Deposit**: No indicator shows (expected)
2. **Partial Payment**: No indicator shows (expected)
3. **Fully Paid**: Green shield indicator shows (expected)  
4. **Feature Flag Off**: No indicator regardless of status (expected)
5. **Multiple Deposits**: All must be paid for indicator to show (expected)

## Database Requirements

The feature uses existing billing data with `type = 'SECURITY_DEPOSIT'`. No database changes required.

## Performance Impact

- Minimal: Simple array filtering and calculation
- Cached: Reactive derived state only recalculates when billings change
- Efficient: No additional database queries needed

## Future Enhancements

1. **Admin Panel**: GUI for feature flag management
2. **Hover Details**: Show security deposit amount/dates on hover
3. **Color Coding**: Different colors for partial vs full payment
4. **Export**: Include indicator status in reports