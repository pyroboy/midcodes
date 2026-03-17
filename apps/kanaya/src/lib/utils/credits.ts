import { db } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { eq, sql, and, desc } from 'drizzle-orm';
import {
	CREDIT_COSTS,
	FREE_TIER,
	TRANSACTION_TYPES,
	USAGE_TYPES,
	type UsageType
} from '$lib/config/credits';

export interface CreditTransaction {
	id: string;
	userId: string;
	orgId: string;
	transactionType: string;
	amount: number;
	creditsBefore: number;
	creditsAfter: number;
	description: string | null;
	referenceId: string | null;
	usageType: string | null;
	invoiceId: string | null;
	metadata: Record<string, unknown> | null;
	createdAt: Date | null;
}

export interface UserCredits {
	creditsBalance: number;
	cardGenerationCount: number;
	templateCount: number;
	unlimitedTemplates: boolean;
	removeWatermarks: boolean;
}

/**
 * Get current user credit information
 */
export async function getUserCredits(userId: string): Promise<UserCredits | null> {
	try {
		const profile = await db.query.profiles.findFirst({
			where: eq(schema.profiles.id, userId),
			columns: {
				creditsBalance: true,
				cardGenerationCount: true,
				templateCount: true,
				unlimitedTemplates: true,
				removeWatermarks: true
			}
		});

		if (!profile) return null;
		return profile;
	} catch (err) {
		console.error('Error fetching user credits:', err);
		return null;
	}
}

/**
 * Check if user can create a new template (within free tier or has credits)
 */
export async function canCreateTemplate(
	userId: string
): Promise<{ canCreate: boolean; needsCredits: boolean; cost: number }> {
	const credits = await getUserCredits(userId);
	if (!credits) return { canCreate: false, needsCredits: false, cost: 0 };

	// Unlimited templates feature
	if (credits.unlimitedTemplates) {
		return { canCreate: true, needsCredits: false, cost: 0 };
	}

	// Within free tier
	if (credits.templateCount < FREE_TIER.TEMPLATES) {
		return { canCreate: true, needsCredits: false, cost: 0 };
	}

	// Beyond free tier - needs credits
	const cost = CREDIT_COSTS.TEMPLATE_CREATION;
	if (credits.creditsBalance >= cost) {
		return { canCreate: true, needsCredits: true, cost };
	}

	return { canCreate: false, needsCredits: true, cost };
}

/**
 * Check if user can generate a card (has free generations left or has credits)
 */
export async function canGenerateCard(
	userId: string
): Promise<{ canGenerate: boolean; needsCredits: boolean; cost: number }> {
	const credits = await getUserCredits(userId);
	if (!credits) return { canGenerate: false, needsCredits: false, cost: 0 };

	// Check if user has free generations left
	if (credits.cardGenerationCount < FREE_TIER.CARD_GENERATIONS) {
		return { canGenerate: true, needsCredits: false, cost: 0 };
	}

	// Check if user has credits
	const cost = CREDIT_COSTS.CARD_GENERATION;
	if (credits.creditsBalance >= cost) {
		return { canGenerate: true, needsCredits: true, cost };
	}

	return { canGenerate: false, needsCredits: true, cost };
}

/**
 * Deduct credits for template creation (beyond free tier)
 */
export async function deductTemplateCreationCredit(
	userId: string,
	orgId: string,
	templateId?: string
): Promise<{ success: boolean; newBalance: number; usedFreeTier: boolean; error?: string }> {
	try {
		return await db.transaction(async (tx) => {
			const profile = await tx.query.profiles.findFirst({
				where: eq(schema.profiles.id, userId)
			});

			if (!profile) {
				return { success: false, newBalance: 0, usedFreeTier: false, error: 'User not found' };
			}

			// Check if user has unlimited templates
			if (profile.unlimitedTemplates) {
				await tx
					.update(schema.profiles)
					.set({ templateCount: profile.templateCount + 1 })
					.where(eq(schema.profiles.id, userId));

				return { success: true, newBalance: profile.creditsBalance, usedFreeTier: false };
			}

			// Check if within free tier
			if (profile.templateCount < FREE_TIER.TEMPLATES) {
				await tx
					.update(schema.profiles)
					.set({ templateCount: profile.templateCount + 1 })
					.where(eq(schema.profiles.id, userId));

				return { success: true, newBalance: profile.creditsBalance, usedFreeTier: true };
			}

			// Beyond free tier - deduct credits
			const cost = CREDIT_COSTS.TEMPLATE_CREATION;
			if (profile.creditsBalance < cost) {
				return {
					success: false,
					newBalance: profile.creditsBalance,
					usedFreeTier: false,
					error: `Insufficient credits. Need ${cost} credits, have ${profile.creditsBalance}.`
				};
			}

			const newBalance = profile.creditsBalance - cost;

			// Update balance and template count
			await tx
				.update(schema.profiles)
				.set({
					creditsBalance: newBalance,
					templateCount: profile.templateCount + 1,
					updatedAt: new Date()
				})
				.where(eq(schema.profiles.id, userId));

			// Create transaction record
			await tx.insert(schema.creditTransactions).values({
				userId,
				orgId,
				transactionType: TRANSACTION_TYPES.USAGE,
				amount: -cost,
				creditsBefore: profile.creditsBalance,
				creditsAfter: newBalance,
				description: 'Template creation',
				referenceId: templateId || null,
				usageType: USAGE_TYPES.TEMPLATE_CREATION,
				metadata: { type: 'template_creation' }
			});

			return { success: true, newBalance, usedFreeTier: false };
		});
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
	userId: string,
	orgId: string,
	cardId?: string
): Promise<{ success: boolean; newBalance: number; usedFreeTier: boolean; error?: string }> {
	try {
		return await db.transaction(async (tx) => {
			const profile = await tx.query.profiles.findFirst({
				where: eq(schema.profiles.id, userId)
			});

			if (!profile) {
				return { success: false, newBalance: 0, usedFreeTier: false, error: 'User not found' };
			}

			let newCardCount = profile.cardGenerationCount;
			let newBalance = profile.creditsBalance;
			let usedFreeTier = false;

			// If user has free generations left, use those first
			if (profile.cardGenerationCount < FREE_TIER.CARD_GENERATIONS) {
				newCardCount = profile.cardGenerationCount + 1;
				usedFreeTier = true;
			} else if (profile.creditsBalance >= CREDIT_COSTS.CARD_GENERATION) {
				// Use paid credits
				newBalance = profile.creditsBalance - CREDIT_COSTS.CARD_GENERATION;
			} else {
				return {
					success: false,
					newBalance: profile.creditsBalance,
					usedFreeTier: false,
					error: 'Insufficient credits'
				};
			}

			// Update user profile
			await tx
				.update(schema.profiles)
				.set({
					cardGenerationCount: newCardCount,
					creditsBalance: newBalance,
					updatedAt: new Date()
				})
				.where(eq(schema.profiles.id, userId));

			// Create transaction record if credits were used
			if (!usedFreeTier) {
				await tx.insert(schema.creditTransactions).values({
					userId,
					orgId,
					transactionType: TRANSACTION_TYPES.USAGE,
					amount: -CREDIT_COSTS.CARD_GENERATION,
					creditsBefore: profile.creditsBalance,
					creditsAfter: newBalance,
					description: 'Card generation',
					referenceId: cardId || null,
					usageType: USAGE_TYPES.CARD_GENERATION,
					metadata: { type: 'card_generation' }
				});
			}

			return { success: true, newBalance, usedFreeTier };
		});
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
	userId: string,
	orgId: string,
	amount: number,
	invoiceId: string,
	description?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
	try {
		return await db.transaction(async (tx) => {
			const profile = await tx.query.profiles.findFirst({
				where: eq(schema.profiles.id, userId)
			});

			if (!profile) {
				return { success: false, newBalance: 0, error: 'User not found' };
			}

			const newBalance = profile.creditsBalance + amount;

			// Update user balance
			await tx
				.update(schema.profiles)
				.set({
					creditsBalance: newBalance,
					updatedAt: new Date()
				})
				.where(eq(schema.profiles.id, userId));

			// Create transaction record
			await tx.insert(schema.creditTransactions).values({
				userId,
				orgId,
				transactionType: TRANSACTION_TYPES.PURCHASE,
				amount: amount,
				creditsBefore: profile.creditsBalance,
				creditsAfter: newBalance,
				description: description || 'Credit purchase',
				invoiceId,
				metadata: { type: 'credit_purchase' }
			});

			return { success: true, newBalance };
		});
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
	userId: string,
	orgId: string,
	amount: number,
	invoiceId: string,
	description?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
	try {
		return await db.transaction(async (tx) => {
			const profile = await tx.query.profiles.findFirst({
				where: eq(schema.profiles.id, userId)
			});

			if (!profile) {
				return { success: false, newBalance: 0, error: 'User not found' };
			}

			const newBalance = profile.creditsBalance + amount;

			// Update user balance
			await tx
				.update(schema.profiles)
				.set({
					creditsBalance: newBalance,
					updatedAt: new Date()
				})
				.where(eq(schema.profiles.id, userId));

			// Create transaction record
			await tx.insert(schema.creditTransactions).values({
				userId,
				orgId,
				transactionType: TRANSACTION_TYPES.REFUND,
				amount: amount,
				creditsBefore: profile.creditsBalance,
				creditsAfter: newBalance,
				description: description || 'Credit refund',
				invoiceId,
				metadata: { type: 'credit_refund' }
			});

			return { success: true, newBalance };
		});
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
	userId: string,
	orgId: string,
	invoiceId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		await db.transaction(async (tx) => {
			const profile = await tx.query.profiles.findFirst({
				where: eq(schema.profiles.id, userId)
			});

			await tx
				.update(schema.profiles)
				.set({
					unlimitedTemplates: true,
					updatedAt: new Date()
				})
				.where(eq(schema.profiles.id, userId));

			// Create transaction record
			await tx.insert(schema.creditTransactions).values({
				userId,
				orgId,
				transactionType: TRANSACTION_TYPES.PURCHASE,
				amount: 0,
				creditsBefore: profile?.creditsBalance || 0,
				creditsAfter: profile?.creditsBalance || 0,
				description: 'Unlimited templates upgrade',
				invoiceId,
				metadata: { type: 'unlimited_templates_purchase' }
			});
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
	userId: string,
	orgId: string,
	invoiceId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		await db.transaction(async (tx) => {
			const profile = await tx.query.profiles.findFirst({
				where: eq(schema.profiles.id, userId)
			});

			await tx
				.update(schema.profiles)
				.set({
					removeWatermarks: true,
					updatedAt: new Date()
				})
				.where(eq(schema.profiles.id, userId));

			// Create transaction record
			await tx.insert(schema.creditTransactions).values({
				userId,
				orgId,
				transactionType: TRANSACTION_TYPES.PURCHASE,
				amount: 0,
				creditsBefore: profile?.creditsBalance || 0,
				creditsAfter: profile?.creditsBalance || 0,
				description: 'Remove watermarks upgrade',
				invoiceId,
				metadata: { type: 'watermark_removal_purchase' }
			});
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
export async function getCreditHistory(userId: string, limit = 50): Promise<any[]> {
	try {
		const history = await db
			.select()
			.from(schema.creditTransactions)
			.where(eq(schema.creditTransactions.userId, userId))
			.orderBy(desc(schema.creditTransactions.createdAt))
			.limit(limit);

		return history;
	} catch (err) {
		console.error('Error fetching credit history:', err);
		return [];
	}
}
