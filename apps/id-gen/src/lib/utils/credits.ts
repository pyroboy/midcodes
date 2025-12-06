import type { SupabaseClient } from '@supabase/supabase-js';
import {
	CREDIT_COSTS,
	FREE_TIER,
	TRANSACTION_TYPES,
	USAGE_TYPES,
	type UsageType
} from '$lib/config/credits';

export interface CreditTransaction {
	id: string;
	user_id: string;
	org_id: string;
	transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus';
	amount: number;
	credits_before: number;
	credits_after: number;
	description: string | null;
	reference_id: string | null;
	usage_type: UsageType | null;
	invoice_id: string | null;
	metadata: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

export interface UserCredits {
	credits_balance: number;
	card_generation_count: number;
	template_count: number;
	unlimited_templates: boolean;
	remove_watermarks: boolean;
}

/**
 * Get current user credit information
 */
export async function getUserCredits(
	supabase: SupabaseClient,
	userId: string
): Promise<UserCredits | null> {
	const { data, error } = await supabase
		.from('profiles')
		.select(
			'credits_balance, card_generation_count, template_count, unlimited_templates, remove_watermarks'
		)
		.eq('id', userId)
		.single();

	if (error) {
		console.error('Error fetching user credits:', error);
		return null;
	}

	return data;
}

/**
 * Check if user can create a new template (within free tier or has credits)
 */
export async function canCreateTemplate(
	supabase: SupabaseClient,
	userId: string
): Promise<{ canCreate: boolean; needsCredits: boolean; cost: number }> {
	const credits = await getUserCredits(supabase, userId);
	if (!credits) return { canCreate: false, needsCredits: false, cost: 0 };

	// Unlimited templates feature
	if (credits.unlimited_templates) {
		return { canCreate: true, needsCredits: false, cost: 0 };
	}

	// Within free tier
	if (credits.template_count < FREE_TIER.TEMPLATES) {
		return { canCreate: true, needsCredits: false, cost: 0 };
	}

	// Beyond free tier - needs credits
	const cost = CREDIT_COSTS.TEMPLATE_CREATION;
	if (credits.credits_balance >= cost) {
		return { canCreate: true, needsCredits: true, cost };
	}

	return { canCreate: false, needsCredits: true, cost };
}

/**
 * Check if user can generate a card (has free generations left or has credits)
 */
export async function canGenerateCard(
	supabase: SupabaseClient,
	userId: string
): Promise<{ canGenerate: boolean; needsCredits: boolean; cost: number }> {
	const credits = await getUserCredits(supabase, userId);
	if (!credits) return { canGenerate: false, needsCredits: false, cost: 0 };

	// Check if user has free generations left
	if (credits.card_generation_count < FREE_TIER.CARD_GENERATIONS) {
		return { canGenerate: true, needsCredits: false, cost: 0 };
	}

	// Check if user has credits
	const cost = CREDIT_COSTS.CARD_GENERATION;
	if (credits.credits_balance >= cost) {
		return { canGenerate: true, needsCredits: true, cost };
	}

	return { canGenerate: false, needsCredits: true, cost };
}

/**
 * Deduct credits for template creation (beyond free tier)
 */
export async function deductTemplateCreationCredit(
	supabase: SupabaseClient,
	userId: string,
	orgId: string,
	templateId?: string
): Promise<{ success: boolean; newBalance: number; usedFreeTier: boolean; error?: string }> {
	try {
		const credits = await getUserCredits(supabase, userId);
		if (!credits) {
			return { success: false, newBalance: 0, usedFreeTier: false, error: 'User not found' };
		}

		// Check if user has unlimited templates
		if (credits.unlimited_templates) {
			// Just increment template count, no credit deduction
			const { error: updateError } = await supabase
				.from('profiles')
				.update({ template_count: credits.template_count + 1 })
				.eq('id', userId);

			if (updateError) throw updateError;
			return { success: true, newBalance: credits.credits_balance, usedFreeTier: false };
		}

		// Check if within free tier
		if (credits.template_count < FREE_TIER.TEMPLATES) {
			// Use free tier slot
			const { error: updateError } = await supabase
				.from('profiles')
				.update({ template_count: credits.template_count + 1 })
				.eq('id', userId);

			if (updateError) throw updateError;
			return { success: true, newBalance: credits.credits_balance, usedFreeTier: true };
		}

		// Beyond free tier - deduct credits
		const cost = CREDIT_COSTS.TEMPLATE_CREATION;
		if (credits.credits_balance < cost) {
			return {
				success: false,
				newBalance: credits.credits_balance,
				usedFreeTier: false,
				error: `Insufficient credits. Need ${cost} credits, have ${credits.credits_balance}.`
			};
		}

		const newBalance = credits.credits_balance - cost;

		// Update balance and template count
		const { error: updateError } = await supabase
			.from('profiles')
			.update({
				credits_balance: newBalance,
				template_count: credits.template_count + 1
			})
			.eq('id', userId);

		if (updateError) throw updateError;

		// Create transaction record
		await createCreditTransaction(supabase, {
			user_id: userId,
			org_id: orgId,
			transaction_type: TRANSACTION_TYPES.USAGE,
			amount: -cost,
			credits_before: credits.credits_balance,
			credits_after: newBalance,
			description: 'Template creation',
			reference_id: templateId || null,
			usage_type: USAGE_TYPES.TEMPLATE_CREATION,
			invoice_id: null,
			metadata: { type: 'template_creation' }
		});

		return { success: true, newBalance, usedFreeTier: false };
	} catch (error) {
		console.error('Error deducting template creation credit:', error);
		return {
			success: false,
			newBalance: 0,
			usedFreeTier: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Deduct credits for card generation
 */
export async function deductCardGenerationCredit(
	supabase: SupabaseClient,
	userId: string,
	orgId: string,
	cardId?: string
): Promise<{ success: boolean; newBalance: number; usedFreeTier: boolean; error?: string }> {
	try {
		const credits = await getUserCredits(supabase, userId);
		if (!credits) {
			return { success: false, newBalance: 0, usedFreeTier: false, error: 'User not found' };
		}

		let newCardCount = credits.card_generation_count;
		let newBalance = credits.credits_balance;
		let usedFreeTier = false;

		// If user has free generations left, use those first
		if (credits.card_generation_count < FREE_TIER.CARD_GENERATIONS) {
			newCardCount = credits.card_generation_count + 1;
			usedFreeTier = true;
		} else if (credits.credits_balance >= CREDIT_COSTS.CARD_GENERATION) {
			// Use paid credits
			newBalance = credits.credits_balance - CREDIT_COSTS.CARD_GENERATION;
		} else {
			return {
				success: false,
				newBalance: credits.credits_balance,
				usedFreeTier: false,
				error: 'Insufficient credits'
			};
		}

		// Update user profile
		const { error: updateError } = await supabase
			.from('profiles')
			.update({
				card_generation_count: newCardCount,
				credits_balance: newBalance
			})
			.eq('id', userId);

		if (updateError) throw updateError;

		// Create transaction record if credits were used
		if (!usedFreeTier) {
			await createCreditTransaction(supabase, {
				user_id: userId,
				org_id: orgId,
				transaction_type: TRANSACTION_TYPES.USAGE,
				amount: -CREDIT_COSTS.CARD_GENERATION,
				credits_before: credits.credits_balance,
				credits_after: newBalance,
				description: 'Card generation',
				reference_id: cardId || null,
				usage_type: USAGE_TYPES.CARD_GENERATION,
				invoice_id: null,
				metadata: { type: 'card_generation' }
			});
		}

		return { success: true, newBalance, usedFreeTier };
	} catch (error) {
		console.error('Error deducting card generation credit:', error);
		return {
			success: false,
			newBalance: 0,
			usedFreeTier: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Add credits to user account (from invoice payment)
 */
export async function addCredits(
	supabase: SupabaseClient,
	userId: string,
	orgId: string,
	amount: number,
	invoiceId: string,
	description?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
	try {
		const credits = await getUserCredits(supabase, userId);
		if (!credits) {
			return { success: false, newBalance: 0, error: 'User not found' };
		}

		const newBalance = credits.credits_balance + amount;

		// Update user balance
		const { error: updateError } = await supabase
			.from('profiles')
			.update({ credits_balance: newBalance })
			.eq('id', userId);

		if (updateError) throw updateError;

		// Create transaction record
		await createCreditTransaction(supabase, {
			user_id: userId,
			org_id: orgId,
			transaction_type: TRANSACTION_TYPES.PURCHASE,
			amount: amount,
			credits_before: credits.credits_balance,
			credits_after: newBalance,
			description: description || 'Credit purchase',
			reference_id: null,
			usage_type: null,
			invoice_id: invoiceId,
			metadata: { type: 'credit_purchase' }
		});

		return { success: true, newBalance };
	} catch (error) {
		console.error('Error adding credits:', error);
		return {
			success: false,
			newBalance: 0,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Refund credits to user account
 */
export async function refundCredits(
	supabase: SupabaseClient,
	userId: string,
	orgId: string,
	amount: number,
	invoiceId: string,
	description?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
	try {
		const credits = await getUserCredits(supabase, userId);
		if (!credits) {
			return { success: false, newBalance: 0, error: 'User not found' };
		}

		const newBalance = credits.credits_balance + amount;

		// Update user balance
		const { error: updateError } = await supabase
			.from('profiles')
			.update({ credits_balance: newBalance })
			.eq('id', userId);

		if (updateError) throw updateError;

		// Create transaction record
		await createCreditTransaction(supabase, {
			user_id: userId,
			org_id: orgId,
			transaction_type: TRANSACTION_TYPES.REFUND,
			amount: amount,
			credits_before: credits.credits_balance,
			credits_after: newBalance,
			description: description || 'Credit refund',
			reference_id: null,
			usage_type: null,
			invoice_id: invoiceId,
			metadata: { type: 'credit_refund' }
		});

		return { success: true, newBalance };
	} catch (error) {
		console.error('Error refunding credits:', error);
		return {
			success: false,
			newBalance: 0,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Grant unlimited templates feature
 */
export async function grantUnlimitedTemplates(
	supabase: SupabaseClient,
	userId: string,
	orgId: string,
	invoiceId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const { error: updateError } = await supabase
			.from('profiles')
			.update({ unlimited_templates: true })
			.eq('id', userId);

		if (updateError) throw updateError;

		// Create transaction record
		await createCreditTransaction(supabase, {
			user_id: userId,
			org_id: orgId,
			transaction_type: TRANSACTION_TYPES.PURCHASE,
			amount: 0,
			credits_before: 0,
			credits_after: 0,
			description: 'Unlimited templates upgrade',
			reference_id: null,
			usage_type: null,
			invoice_id: invoiceId,
			metadata: { type: 'unlimited_templates_purchase' }
		});

		return { success: true };
	} catch (error) {
		console.error('Error granting unlimited templates:', error);
		return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}

/**
 * Grant watermark removal feature
 */
export async function grantWatermarkRemoval(
	supabase: SupabaseClient,
	userId: string,
	orgId: string,
	invoiceId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const { error: updateError } = await supabase
			.from('profiles')
			.update({ remove_watermarks: true })
			.eq('id', userId);

		if (updateError) throw updateError;

		// Create transaction record
		await createCreditTransaction(supabase, {
			user_id: userId,
			org_id: orgId,
			transaction_type: TRANSACTION_TYPES.PURCHASE,
			amount: 0,
			credits_before: 0,
			credits_after: 0,
			description: 'Remove watermarks upgrade',
			reference_id: null,
			usage_type: null,
			invoice_id: invoiceId,
			metadata: { type: 'watermark_removal_purchase' }
		});

		return { success: true };
	} catch (error) {
		console.error('Error granting watermark removal:', error);
		return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}

/**
 * Get user's credit transaction history
 */
export async function getCreditHistory(
	supabase: SupabaseClient,
	userId: string,
	limit = 50
): Promise<CreditTransaction[]> {
	const { data, error } = await supabase
		.from('credit_transactions')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(limit);

	if (error) {
		console.error('Error fetching credit history:', error);
		return [];
	}

	return data || [];
}

/**
 * Create a credit transaction record
 */
async function createCreditTransaction(
	supabase: SupabaseClient,
	transaction: Omit<CreditTransaction, 'id' | 'created_at' | 'updated_at'>
): Promise<CreditTransaction | null> {
	const { data, error } = await supabase
		.from('credit_transactions')
		.insert(transaction)
		.select()
		.single();

	if (error) {
		console.error('Error creating credit transaction:', error);
		return null;
	}

	return data;
}
