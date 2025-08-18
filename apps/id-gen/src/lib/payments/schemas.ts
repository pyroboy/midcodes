import { z } from 'zod';

// =============================================================================
// SHARED SCHEMAS
// =============================================================================

/**
 * Payment methods supported by the system
 * Optional since Checkout can handle multiple methods
 */
export const zPaymentMethod = z.enum(['gcash', 'paymaya', 'card', 'online_banking']).optional();

/**
 * Type of purchase being made
 */
export const zPurchaseKind = z.enum(['credit', 'feature']);

// =============================================================================
// COMMAND SCHEMAS (Input validation for operations)
// =============================================================================

/**
 * Schema for creating a credit payment
 */
export const zCreateCreditPaymentInput = z.object({
  packageId: z.string().min(1, 'Package ID is required'),
  method: zPaymentMethod,
  returnTo: z.string().url('Must be a valid URL').optional()
});

/**
 * Schema for creating a feature payment
 */
export const zCreateFeaturePaymentInput = z.object({
  featureId: z.string().min(1, 'Feature ID is required'),
  method: zPaymentMethod,
  returnTo: z.string().url('Must be a valid URL').optional()
});

// =============================================================================
// QUERY SCHEMAS (Input validation for queries)
// =============================================================================

/**
 * Schema for payment history query parameters
 */
export const zPaymentHistoryQuery = z.object({
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
export const zPayMongoEvent = z.object({
  id: z.string(),
  type: z.string(),
  data: z.any(), // Will be refined based on event type after signature verification
  created_at: z.number()
});

// =============================================================================
// OUTPUT SCHEMAS (Response validation)
// =============================================================================

/**
 * Result from initializing a checkout session
 * Supports both standard PayMongo flow and bypass mode
 */
export const zCheckoutInitResult = z.object({
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
export const zPaymentRecord = z.object({
  id: z.string(),
  user_id: z.string(),
  session_id: z.string(),
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
  paid_at: z.string().nullable(),
  raw_event: z.any(), // Database stores as Json type
  idempotency_key: z.string(),
  created_at: z.string(),
  updated_at: z.string()
});

/**
 * Payment history response structure
 */
export const zPaymentHistory = z.object({
  items: z.array(zPaymentRecord),
  nextCursor: z.string().nullable()
});

// =============================================================================
// TYPE EXPORTS (TypeScript types derived from schemas)
// =============================================================================

export type PaymentMethod = z.infer<typeof zPaymentMethod>;
export type PurchaseKind = z.infer<typeof zPurchaseKind>;
export type CreateCreditPaymentInput = z.infer<typeof zCreateCreditPaymentInput>;
export type CreateFeaturePaymentInput = z.infer<typeof zCreateFeaturePaymentInput>;
export type PaymentHistoryQuery = z.infer<typeof zPaymentHistoryQuery>;
export type PayMongoEvent = z.infer<typeof zPayMongoEvent>;
export type CheckoutInitResult = z.infer<typeof zCheckoutInitResult>;
export type PaymentRecord = z.infer<typeof zPaymentRecord>;
export type PaymentHistory = z.infer<typeof zPaymentHistory>;
