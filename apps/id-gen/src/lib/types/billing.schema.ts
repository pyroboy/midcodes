import { z } from 'zod';

// Input schemas
export const addCreditsManualSchema = z.object({
	userId: z.string().uuid(),
	amount: z.number().positive(),
	reason: z.string().optional()
});

export const grantFeatureSchema = z.object({
	userId: z.string().uuid(),
	feature: z.enum(['unlimited_templates', 'remove_watermarks']),
	enabled: z.boolean()
});

export const adminCreditAdjustmentSchema = z.object({
	userId: z.string().uuid(),
	delta: z.number(),
	reason: z.string().optional()
});

export const togglePaymentsSchema = z.object({
	enabled: z.boolean(),
	keyword: z.string().min(1)
});

export const setPaymentsBypassSchema = z.object({
	bypass: z.boolean()
});

// Output schemas
export const creditActionResultSchema = z.object({
	success: z.boolean(),
	newBalance: z.number().optional(),
	message: z.string().optional()
});

export const featureGrantResultSchema = z.object({
	success: z.boolean(),
	message: z.string().optional()
});

export const billingOverviewSchema = z.object({
	payments_enabled: z.boolean(),
	payments_bypass: z.boolean(),
	updated_at: z.string(),
	updated_by: z.string().uuid().optional()
});

export const userCreditsSchema = z.object({
	id: z.string().uuid(),
	email: z.string().email(),
	role: z.string(),
	credits_balance: z.number(),
	card_generation_count: z.number(),
	template_count: z.number(),
	unlimited_templates: z.boolean(),
	remove_watermarks: z.boolean(),
	updated_at: z.string()
});

export const billingSettingsSchema = z.object({
	payments_enabled: z.boolean(),
	payments_bypass: z.boolean(),
	updated_at: z.string(),
	updated_by: z.string().uuid().optional()
});

// TypeScript types
export type AddCreditsManual = z.infer<typeof addCreditsManualSchema>;
export type GrantFeature = z.infer<typeof grantFeatureSchema>;
export type AdminCreditAdjustment = z.infer<typeof adminCreditAdjustmentSchema>;
export type TogglePayments = z.infer<typeof togglePaymentsSchema>;
export type SetPaymentsBypass = z.infer<typeof setPaymentsBypassSchema>;
export type CreditActionResult = z.infer<typeof creditActionResultSchema>;
export type FeatureGrantResult = z.infer<typeof featureGrantResultSchema>;
export type BillingOverview = z.infer<typeof billingOverviewSchema>;
export type UserCredits = z.infer<typeof userCreditsSchema>;
export type BillingSettings = z.infer<typeof billingSettingsSchema>;
