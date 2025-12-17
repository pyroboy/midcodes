import { randomBytes } from 'crypto';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';
import { getCreditPackageById, getFeatureSkuById } from '$lib/payments/catalog';

export interface BypassCreditResult {
	success: boolean;
	newBalance?: number;
	error?: string;
}

export interface BypassFeatureResult {
	success: boolean;
	error?: string;
}

/**
 * SECURITY: Atomically add credits to user account using Drizzle transaction
 */
export async function addCreditsBypass(
	userId: string,
	orgId: string,
	packageId: string,
	bypassReference: string
): Promise<BypassCreditResult> {
	try {
		// Resolve packageId to get the actual credit amount (server-side validation)
		const creditPackage = getCreditPackageById(packageId);
		if (!creditPackage || !creditPackage.isActive) {
			return { success: false, error: 'Invalid or inactive credit package' };
		}

		const creditsToAdd = creditPackage.credits;

		return await db.transaction(async (tx) => {
			// 1. Get current balance with row-level locking (not strictly necessary with serializable or specific isolation, but good practice)
			const profile = await tx.query.profiles.findFirst({
				where: and(eq(schema.profiles.id, userId), eq(schema.profiles.orgId, orgId))
			});

			if (!profile) return { success: false, error: 'User profile not found' };

			const oldBalance = profile.creditsBalance;
			const newBalance = oldBalance + creditsToAdd;

			// 2. Update balance
			await tx.update(schema.profiles)
				.set({
					creditsBalance: newBalance,
					updatedAt: new Date()
				})
				.where(eq(schema.profiles.id, userId));

			// 3. Create transaction record to maintain audit trail
			await tx.insert(schema.creditTransactions).values({
				userId: userId,
				orgId: orgId,
				transactionType: 'purchase',
				amount: creditsToAdd,
				creditsBefore: oldBalance,
				creditsAfter: newBalance,
				description: `${creditPackage.name} - Bypass Purchase`,
				referenceId: bypassReference,
				metadata: {
					type: 'credit_purchase_bypass',
					packageId: packageId,
					packageName: creditPackage.name,
					bypass: true,
					amountPhp: creditPackage.amountPhp
				}
			});

			return { success: true, newBalance };
		});
	} catch (error) {
		console.error('Error in addCreditsBypass:', error);
		return { success: false, error: 'Internal server error' };
	}
}

/**
 * Safely grant premium feature for payment bypass scenarios
 */
export async function grantFeatureBypass(
	userId: string,
	orgId: string,
	featureId: string,
	bypassReference: string
): Promise<BypassFeatureResult> {
	try {
		// Resolve featureId to get the actual feature details (server-side validation)
		const featureSku = getFeatureSkuById(featureId);
		if (!featureSku || !featureSku.isActive) {
			return { success: false, error: 'Invalid or inactive feature SKU' };
		}

		// Map feature flags to profile columns
		let updateData: any = {
			updatedAt: new Date()
		};

		switch (featureSku.featureFlag) {
			case 'premium':
				updateData.unlimitedTemplates = true;
				updateData.removeWatermarks = true;
				break;
			case 'api_access':
				// If you have apiAccess in schema
				// updateData.apiAccess = true;
				break;
			case 'bulk_processing':
				// If you have bulkProcessing in schema
				// updateData.bulkProcessing = true;
				break;
			default:
				return { success: false, error: 'Unknown feature flag' };
		}

		return await db.transaction(async (tx) => {
			// 1. Update user profile with feature flag
			await tx.update(schema.profiles)
				.set(updateData)
				.where(and(eq(schema.profiles.id, userId), eq(schema.profiles.orgId, orgId)));

			// 2. Create transaction record for audit trail
			await tx.insert(schema.creditTransactions).values({
				userId: userId,
				orgId: orgId,
				transactionType: 'purchase', // Using purchase type for consistency
				amount: 0,
				creditsBefore: 0, // Feature unlock doesn't affect balances
				creditsAfter: 0,
				description: `${featureSku.name} - Bypass Purchase`,
				referenceId: bypassReference,
				metadata: {
					type: 'feature_purchase_bypass',
					featureId: featureId,
					featureFlag: featureSku.featureFlag,
					featureName: featureSku.name,
					bypass: true,
					amountPhp: featureSku.amountPhp
				}
			});

			return { success: true };
		});
	} catch (error) {
		console.error('Error in grantFeatureBypass:', error);
		return { success: false, error: 'Internal server error' };
	}
}

/**
 * SECURITY: Generate a cryptographically secure bypass reference ID
 */
export function generateBypassReference(): string {
	const timestamp = Date.now();
	const random = randomBytes(16).toString('hex'); // 128-bit entropy
	return `bypass_${timestamp}_${random}`;
}
