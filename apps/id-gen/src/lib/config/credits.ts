/**
 * Credit system configuration
 * Defines costs for various actions and free tier limits
 */

export const CREDIT_COSTS = {
	/** Cost to create a template beyond free tier */
	TEMPLATE_CREATION: 5,
	/** Cost to generate an ID card beyond free tier */
	CARD_GENERATION: 1,
	/** Cost for bulk export per card */
	BULK_EXPORT_PER_CARD: 1,
	/** Cost for API usage per call */
	API_CALL: 1,
	/** Cost for AI image decomposition */
	AI_DECOMPOSE: 2,
	/** Cost for AI image upscale */
	AI_UPSCALE: 1,
	/** Cost for AI element removal */
	AI_REMOVE: 1
} as const;

export const FREE_TIER = {
	/** Number of free templates before credits required */
	TEMPLATES: 2,
	/** Number of free card generations before credits required */
	CARD_GENERATIONS: 10
} as const;

export type CreditCostType = keyof typeof CREDIT_COSTS;
export type FreeTierType = keyof typeof FREE_TIER;

/**
 * Transaction types for credit_transactions table
 */
export const TRANSACTION_TYPES = {
	PURCHASE: 'purchase',
	USAGE: 'usage',
	REFUND: 'refund',
	BONUS: 'bonus'
} as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];

/**
 * Usage types for tracking what credits were used for
 */
export const USAGE_TYPES = {
	CARD_GENERATION: 'card_generation',
	TEMPLATE_CREATION: 'template_creation',
	BULK_EXPORT: 'bulk_export',
	API_USAGE: 'api_usage',
	AI_DECOMPOSE: 'ai_decompose',
	AI_UPSCALE: 'ai_upscale',
	AI_REMOVE: 'ai_remove'
} as const;

export type UsageType = (typeof USAGE_TYPES)[keyof typeof USAGE_TYPES];

/**
 * Invoice types for categorizing invoices
 */
export const INVOICE_TYPES = {
	CREDIT_PURCHASE: 'credit_purchase',
	FEATURE_PURCHASE: 'feature_purchase',
	REFUND: 'refund',
	CORRECTION: 'correction',
	BONUS: 'bonus'
} as const;

export type InvoiceType = (typeof INVOICE_TYPES)[keyof typeof INVOICE_TYPES];

/**
 * Invoice status values
 */
export const INVOICE_STATUS = {
	DRAFT: 'draft',
	SENT: 'sent',
	PAID: 'paid',
	VOID: 'void',
	OVERDUE: 'overdue'
} as const;

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];
