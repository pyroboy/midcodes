# Spec-20-Aug20-PURCHASE-BUTTON-IMPLEMENTATION

## Technical Specification: Purchase Button Implementation

**Date:** August 20, 2024  
**Version:** 1.0  
**Complexity:** Low (3/10)  
**Scope:** Payment Integration & UX Enhancement

---

## Step 1 – Requirement Extraction

### Core Requirements

- **Implement actual purchase logic** in `PurchaseButton.svelte` (currently has TODO comment)
- **Integrate with existing payment system** using PayMongo or payment bypass functionality
- **Add loading states** during purchase processing
- **Provide user feedback** for successful and failed purchases
- **Handle error scenarios** gracefully with clear messaging
- **Maintain existing component API** to avoid breaking changes
- **Keep bite-sized scope** - focus only on purchase button functionality

---

## Step 2 – Context Awareness

### Technology Stack & Integration Points

- **Component**: `src/lib/components/ui/PurchaseButton.svelte` with TODO implementation
- **Payment System**: Existing PayMongo integration and payment bypass flags
- **Remote Functions**: `src/lib/remote/billing.remote.ts` for payment operations
- **Feature Flags**: `paymentFlags` from `$lib/stores/featureFlags` for bypass logic
- **Toast System**: `svelte-sonner` for user feedback notifications

### Current Implementation Analysis

```typescript
// Current handlePurchase function
function handlePurchase() {
	console.log('Purchase clicked:', { packageId, featureId, amount, currency });
	// TODO: Implement actual purchase logic
}
```

---

## Step 3 – Spec Expansion

### Enhanced Purchase Flow Architecture

```
Purchase Click → Loading State → Payment Processing → Result Handling
      ↓               ↓                    ↓               ↓
  Disable Button → Show Spinner → Call Payment API → Success/Error Toast
```

### Function-Level Behavior

#### Enhanced Purchase Handler

```typescript
async function handlePurchase() {
	// 1. Set loading state
	// 2. Disable button to prevent double-clicks
	// 3. Check payment bypass flags
	// 4. Process payment or simulate bypass
	// 5. Handle success/error responses
	// 6. Show user feedback
	// 7. Reset loading state
}
```

#### State Management Enhancement

```typescript
let isProcessing = $state(false);
let processingMessage = $state('Processing...');

$: isDisabled = disabled || isProcessing;
```

#### Payment Integration Logic

```typescript
// Integration with existing payment system
import { createPayment } from '$lib/remote/billing.remote';
import { paymentFlags } from '$lib/stores/featureFlags';
import { toast } from 'svelte-sonner';

async function processPayment() {
	if ($paymentFlags.bypass) {
		return simulateBypassPayment();
	}

	return await createPayment({
		packageId,
		featureId,
		amount,
		currency
	});
}
```

### UI Implementation Details

#### Loading States

- **Button Text**: Changes to "Processing..." during payment
- **Spinner Icon**: Replace CreditCard icon with loading spinner
- **Button Disabled**: Prevent multiple clicks during processing
- **Visual Feedback**: Subtle button style changes to indicate processing

#### Success/Error Handling

- **Success Toast**: "Payment successful! Credits have been added to your account."
- **Error Toast**: Specific error messages based on failure type
- **Retry Logic**: Option to retry failed payments
- **Fallback Handling**: Graceful degradation for payment service issues

### Error Scenarios & Handling

#### Payment Failure Types

```typescript
enum PaymentError {
	NETWORK_ERROR = 'network_error',
	PAYMENT_DECLINED = 'payment_declined',
	INSUFFICIENT_FUNDS = 'insufficient_funds',
	SERVICE_UNAVAILABLE = 'service_unavailable',
	VALIDATION_ERROR = 'validation_error'
}

function getErrorMessage(error: PaymentError): string {
	switch (error) {
		case PaymentError.NETWORK_ERROR:
			return 'Network error. Please check your connection and try again.';
		case PaymentError.PAYMENT_DECLINED:
			return 'Payment was declined. Please check your payment method.';
		// ... other cases
	}
}
```

---

## Step 4 – Implementation Guidance

### Enhanced PurchaseButton Component

```svelte
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { CreditCard, Loader2 } from '@lucide/svelte';
	import { createPayment } from '$lib/remote/billing.remote';
	import { paymentFlags } from '$lib/stores/featureFlags';
	import { toast } from 'svelte-sonner';

	let {
		/* existing props */
	} = $props();

	let isProcessing = $state(false);
	let processingMessage = $state('Processing...');

	$: isDisabled = disabled || isProcessing;
	$: buttonIcon = isProcessing ? Loader2 : CreditCard;
	$: buttonText = isProcessing ? processingMessage : `Purchase ₱${amount}`;

	async function handlePurchase() {
		if (isProcessing) return;

		try {
			isProcessing = true;
			processingMessage = 'Processing payment...';

			let result;
			if ($paymentFlags.bypass) {
				processingMessage = 'Simulating payment...';
				result = await simulateBypassPayment();
			} else {
				result = await createPayment({
					packageId,
					featureId,
					amount,
					currency
				});
			}

			if (result.success) {
				toast.success('Payment successful!', {
					description: `₱${amount} payment completed. Credits added to your account.`
				});

				// Optional: Emit success event for parent components
				dispatch('success', { result });
			} else {
				throw new Error(result.error || 'Payment failed');
			}
		} catch (error) {
			const errorMessage = getErrorMessage(error);
			toast.error('Payment failed', {
				description: errorMessage,
				action: {
					label: 'Retry',
					onClick: () => handlePurchase()
				}
			});

			dispatch('error', { error });
		} finally {
			isProcessing = false;
			processingMessage = 'Processing...';
		}
	}

	async function simulateBypassPayment() {
		// Simulate network delay
		await new Promise((resolve) => setTimeout(resolve, 1500));
		return { success: true, message: 'Bypass payment successful' };
	}

	function getErrorMessage(error: unknown): string {
		if (error instanceof Error) {
			// Map specific error messages to user-friendly text
			if (error.message.includes('network')) {
				return 'Network error. Please check your connection.';
			}
			if (error.message.includes('declined')) {
				return 'Payment declined. Please check your payment method.';
			}
		}
		return 'An unexpected error occurred. Please try again.';
	}
</script>

<Button
	onclick={handlePurchase}
	disabled={isDisabled}
	{variant}
	{size}
	class="flex items-center gap-2 min-w-[120px] {isProcessing ? 'cursor-not-allowed' : ''}"
>
	<svelte:component this={buttonIcon} class="w-4 h-4 {isProcessing ? 'animate-spin' : ''}" />
	{#if children}
		{@render children()}
	{:else}
		{buttonText}
	{/if}
</Button>
```

### Integration Requirements

1. **Import Payment Functions**: Use existing `billing.remote.ts` functions
2. **Feature Flag Integration**: Respect payment bypass settings
3. **Event Dispatching**: Emit success/error events for parent components
4. **Toast Notifications**: Provide immediate user feedback
5. **Error Mapping**: Convert technical errors to user-friendly messages

### Testing Considerations

- **Bypass Mode**: Test with payment bypass enabled
- **Network Errors**: Simulate network failures
- **Double Clicks**: Ensure button disabling prevents multiple requests
- **Error Scenarios**: Test various payment failure types
- **Success Flow**: Verify successful payment handling

---

## Step 5 – Output Checklist

✅ **Checklist:**

1. **UI Changes (Complexity: 2/10)** – Minor button state changes with loading spinner and text updates
2. **UX Changes (Complexity: 4/10)** – Significant UX improvement with proper feedback, loading states, and error handling
3. **Data Handling (Complexity: 3/10)** – Integration with existing payment system and proper error response handling
4. **Function Logic (Complexity: 3/10)** – New payment processing logic with bypass support and error mapping
5. **ID/Key Consistency (Complexity: 1/10)** – No changes to ID generation, only payment processing enhancement

---

⚡ **Implementation Priority**: Replace TODO with complete payment flow, add loading states, integrate existing payment system, and provide comprehensive user feedback.

**Estimated Development Time:** 2-3 hours  
**Testing Requirements:** Payment bypass mode, error scenarios, success flow  
**Success Criteria:** Functional purchase button with proper loading states and user feedback
