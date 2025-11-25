import type { SupabaseClient } from '@supabase/supabase-js';

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
	metadata: Record<string, any>;
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
export async function getUserCredits(userId: string): Promise<UserCredits | null> {
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
 * Check if user can create a new template
 */
export async function canCreateTemplate(userId: string): Promise<boolean> {
	const credits = await getUserCredits(userId);
	if (!credits) return false;

	return credits.unlimited_templates || credits.template_count < 2;
}

/**
 * Check if user can generate a card (has free generations left or has credits)
 */
export async function canGenerateCard(
	userId: string
): Promise<{ canGenerate: boolean; needsCredits: boolean }> {
	const credits = await getUserCredits(userId);
	if (!credits) return { canGenerate: false, needsCredits: false };

	// Check if user has free generations left
	if (credits.card_generation_count < 10) {
		return { canGenerate: true, needsCredits: false };
	}

	// Check if user has credits
	if (credits.credits_balance > 0) {
		return { canGenerate: true, needsCredits: false };
	}

	return { canGenerate: false, needsCredits: true };
}

/**
 * Deduct credits for card generation
 */
export async function deductCardGenerationCredit(
	userId: string,
	orgId: string,
	cardId?: string
): Promise<{ success: boolean; newBalance: number }> {
	try {
		// Get current user state
		const credits = await getUserCredits(userId);
		if (!credits) {
			throw new Error('User not found');
		}

		let newCardCount = credits.card_generation_count;
		let newBalance = credits.credits_balance;
		let usedFreeGeneration = false;

		// If user has free generations left, use those first
		if (credits.card_generation_count < 10) {
			newCardCount = credits.card_generation_count + 1;
			usedFreeGeneration = true;
		} else if (credits.credits_balance > 0) {
			// Use paid credits
			newBalance = credits.credits_balance - 1;
		} else {
			throw new Error('Insufficient credits');
		}

		// Update user profile
		const { error: updateError } = await supabase
			.from('profiles')
			.update({
				card_generation_count: newCardCount,
				credits_balance: newBalance
			})
			.eq('id', userId);

		if (updateError) {
			throw updateError;
		}

		// Create transaction record if credits were used
		if (!usedFreeGeneration) {
			await createCreditTransaction({
				user_id: userId,
				org_id: orgId,
				transaction_type: 'usage',
				amount: -1,
				credits_before: credits.credits_balance,
				credits_after: newBalance,
				description: 'Card generation',
				reference_id: cardId || null,
				metadata: { type: 'card_generation' }
			});
		}

		return { success: true, newBalance };
	} catch (error) {
		console.error('Error deducting card generation credit:', error);
		return { success: false, newBalance: 0 };
	}
}

/**
 * Add credits to user account (from purchase)
 */
export async function addCredits(
	userId: string,
	orgId: string,
	amount: number,
	paymentReference: string,
	description?: string
): Promise<{ success: boolean; newBalance: number }> {
	try {
		const credits = await getUserCredits(userId);
		if (!credits) {
			throw new Error('User not found');
		}

		const newBalance = credits.credits_balance + amount;

		// Update user balance
		const { error: updateError } = await supabase
			.from('profiles')
			.update({
				credits_balance: newBalance
			})
			.eq('id', userId);

		if (updateError) {
			throw updateError;
		}

		// Create transaction record
		await createCreditTransaction({
			user_id: userId,
			org_id: orgId,
			transaction_type: 'purchase',
			amount: amount,
			credits_before: credits.credits_balance,
			credits_after: newBalance,
			description: description || 'Credit purchase',
			reference_id: paymentReference,
			metadata: { type: 'credit_purchase' }
		});

		return { success: true, newBalance };
	} catch (error) {
		console.error('Error adding credits:', error);
		return { success: false, newBalance: 0 };
	}
}

/**
 * Grant unlimited templates feature
 */
export async function grantUnlimitedTemplates(
	userId: string,
	orgId: string,
	paymentReference: string
): Promise<{ success: boolean }> {
	try {
		const { error: updateError } = await supabase
			.from('profiles')
			.update({
				unlimited_templates: true
			})
			.eq('id', userId);

		if (updateError) {
			throw updateError;
		}

		// Create transaction record
		await createCreditTransaction({
			user_id: userId,
			org_id: orgId,
			transaction_type: 'purchase',
			amount: 0, // No credits added, just feature unlock
			credits_before: 0,
			credits_after: 0,
			description: 'Unlimited templates upgrade',
			reference_id: paymentReference,
			metadata: { type: 'unlimited_templates_purchase', amount_paid: 99 }
		});

		return { success: true };
	} catch (error) {
		console.error('Error granting unlimited templates:', error);
		return { success: false };
	}
}

/**
 * Grant watermark removal feature
 */
export async function grantWatermarkRemoval(
	userId: string,
	orgId: string,
	paymentReference: string
): Promise<{ success: boolean }> {
	try {
		const { error: updateError } = await supabase
			.from('profiles')
			.update({
				remove_watermarks: true
			})
			.eq('id', userId);

		if (updateError) {
			throw updateError;
		}

		// Create transaction record
		await createCreditTransaction({
			user_id: userId,
			org_id: orgId,
			transaction_type: 'purchase',
			amount: 0, // No credits added, just feature unlock
			credits_before: 0,
			credits_after: 0,
			description: 'Remove watermarks upgrade',
			reference_id: paymentReference,
			metadata: { type: 'watermark_removal_purchase', amount_paid: 199 }
		});

		return { success: true };
	} catch (error) {
		console.error('Error granting watermark removal:', error);
		return { success: false };
	}
}

/**
 * Increment template count (for tracking limits)
 */
export async function incrementTemplateCount(
	userId: string
): Promise<{ success: boolean; newCount: number }> {
	try {
		const credits = await getUserCredits(userId);
		if (!credits) {
			throw new Error('User not found');
		}

		const newCount = credits.template_count + 1;

		const { error } = await supabase
			.from('profiles')
			.update({
				template_count: newCount
			})
			.eq('id', userId);

		if (error) {
			throw error;
		}

		return { success: true, newCount };
	} catch (error) {
		console.error('Error incrementing template count:', error);
		return { success: false, newCount: 0 };
	}
}

/**
 * Get user's credit transaction history
 */
export async function getCreditHistory(userId: string, limit = 50): Promise<CreditTransaction[]> {
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

// NOTE: CREDIT_PACKAGES and PREMIUM_FEATURES removed to prevent circular dependency
// Import directly from '$lib/payments/catalog' where needed
