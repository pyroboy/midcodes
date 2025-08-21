import { z } from 'zod';

// =============================================================================
// SHARED SCHEMAS
// =============================================================================

/**
 * Payment methods supported by the system
 * Optional since Checkout can handle multiple methods
 */
export const paymentMethodSchema = z
	.enum(['gcash', 'paymaya', 'card', 'online_banking'])
	.optional();

/**
 * Type of purchase being made
 */
export const purchaseKindSchema = z.enum(['credit', 'feature']);

// =============================================================================
// INPUT SCHEMAS (for commands)
// =============================================================================

/**
 * Schema for creating a credit payment
 */
export const createCreditPaymentInputSchema = z.object({
	packageId: z.string().min(1, 'Package ID is required'),
	method: paymentMethodSchema,
	returnTo: z.string().url('Must be a valid URL').optional()
});

/**
 * Schema for creating a feature payment
 */
export const createFeaturePaymentInputSchema = z.object({
	featureId: z.string().min(1, 'Feature ID is required'),
	method: paymentMethodSchema,
	returnTo: z.string().url('Must be a valid URL').optional()
});

// =============================================================================
// QUERY SCHEMAS (for queries)
// =============================================================================

/**
 * Schema for payment history query parameters
 */
export const paymentHistoryQuerySchema = z.object({
	cursor: z.string().optional(),
	limit: z.number().int().min(1).max(100).default(20)
});

// =============================================================================
// WEBHOOK SCHEMAS
// =============================================================================

/**
 * Minimal PayMongo webhook event parsing
 * Full validation should happen after signature verification
 */
export const payMongoEventSchema = z.object({
	id: z.string(),
	type: z.string(),
	data: z.any(), // Will be refined based on event type after signature verification
	created_at: z.number()
});

// =============================================================================
// OUTPUT SCHEMAS (for responses)
// =============================================================================

/**
 * Result from initializing a checkout session
 * Supports both standard PayMongo flow and bypass mode
 */
export const checkoutInitResultSchema = z.object({
	checkoutUrl: z.string().url(),
	sessionId: z.string(),
	provider: z.enum(['paymongo', 'bypass']),
	bypass: z.boolean().optional(),
	success: z.boolean().optional()
});

/**
 * Payment record schema matching the database table structure
 * Note: Using more permissive types to match actual database schema
 */
export const paymentRecordSchema = z.object({
	id: z.string(),
	user_id: z.string(),
	session_id: z.string().nullable(),
	provider_payment_id: z.string().nullable(),
	kind: z.string(), // Database stores as string, not enum
	sku_id: z.string(),
	amount_php: z.number(),
	currency: z.string(),
	status: z.string(), // Database stores as string, not enum
	method: z.string().nullable(),
	method_allowed: z.array(z.string()),
	metadata: z.any(), // Database stores as Json type
	reason: z.string().nullable(),
	paid_at: z.string().nullable().optional(),
	raw_event: z.any().optional(), // Database stores as Json type
	idempotency_key: z.string(),
	created_at: z.string(),
	updated_at: z.string()
});

/**
 * Payment history response structure
 */
export const paymentHistorySchema = z.object({
	items: z.array(paymentRecordSchema),
	nextCursor: z.string().nullable()
});

// =============================================================================
// TYPE EXPORTS (TypeScript types derived from schemas)
// =============================================================================

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type PurchaseKind = z.infer<typeof purchaseKindSchema>;
export type CreateCreditPaymentInput = z.infer<typeof createCreditPaymentInputSchema>;
export type CreateFeaturePaymentInput = z.infer<typeof createFeaturePaymentInputSchema>;
export type PaymentHistoryQuery = z.infer<typeof paymentHistoryQuerySchema>;
export type PayMongoEvent = z.infer<typeof payMongoEventSchema>;
export type CheckoutInitResult = z.infer<typeof checkoutInitResultSchema>;
export type PaymentRecord = z.infer<typeof paymentRecordSchema>;
export type PaymentHistory = z.infer<typeof paymentHistorySchema>;

// =============================================================================
// LEGACY EXPORTS (for backward compatibility)
// =============================================================================

// Keep old z-prefixed exports for existing code compatibility
export const zPaymentMethod = paymentMethodSchema;
export const zPurchaseKind = purchaseKindSchema;
export const zCreateCreditPaymentInput = createCreditPaymentInputSchema;
export const zCreateFeaturePaymentInput = createFeaturePaymentInputSchema;
export const zPaymentHistoryQuery = paymentHistoryQuerySchema;
export const zPayMongoEvent = payMongoEventSchema;
export const zCheckoutInitResult = checkoutInitResultSchema;
export const zPaymentRecord = paymentRecordSchema;
export const zPaymentHistory = paymentHistorySchema;
