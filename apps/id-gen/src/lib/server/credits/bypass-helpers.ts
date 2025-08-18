/**
 * Server-side credit utility functions for payment bypass
 * These functions should only be used when payments_bypass is enabled in org_settings
 * and provide a safe way to simulate successful purchases without external API calls
 */

import { supabaseAdmin } from '$lib/server/supabase';
import { getCreditPackageById, getFeatureSkuById } from '$lib/payments/catalog';
import type { CreditTransaction } from '$lib/utils/credits';

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
 * Safely add credits to user account for payment bypass scenarios
 * This mimics the behavior of addCredits from $lib/utils/credits.ts but uses supabaseAdmin
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

		// Get current user balance using supabaseAdmin (server-only access)
		const { data: currentProfile, error: fetchError } = await supabaseAdmin
			.from('profiles')
			.select('credits_balance')
			.eq('id', userId)
			.eq('org_id', orgId)
			.single();

		if (fetchError) {
			console.error('Error fetching current credits for bypass:', fetchError);
			return { success: false, error: 'User not found or access denied' };
		}

		const currentBalance = currentProfile.credits_balance || 0;
		const newBalance = currentBalance + creditsToAdd;

		// Update user balance
		const { error: updateError } = await supabaseAdmin
			.from('profiles')
			.update({
				credits_balance: newBalance,
				updated_at: new Date().toISOString()
			})
			.eq('id', userId)
			.eq('org_id', orgId);

		if (updateError) {
			console.error('Error updating credits for bypass:', updateError);
			return { success: false, error: 'Failed to update user balance' };
		}

		// Create transaction record to maintain audit trail
		const { error: txError } = await supabaseAdmin.from('credit_transactions').insert({
			user_id: userId,
			org_id: orgId,
			transaction_type: 'purchase',
			amount: creditsToAdd,
			credits_before: currentBalance,
			credits_after: newBalance,
			description: `${creditPackage.name} - Bypass Purchase`,
			reference_id: bypassReference,
			metadata: {
				type: 'credit_purchase_bypass',
				package_id: packageId,
				package_name: creditPackage.name,
				bypass: true,
				amount_php: creditPackage.amountPhp
			}
		});

		if (txError) {
			console.error('Error creating bypass transaction record:', txError);
			// Don't fail the whole operation, just log the issue
		}

		return { success: true, newBalance };
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
		let updateData: Record<string, any> = {
			updated_at: new Date().toISOString()
		};

		switch (featureSku.featureFlag) {
			case 'premium':
				updateData.unlimited_templates = true;
				updateData.remove_watermarks = true;
				break;
			case 'api_access':
				// Assuming you have an api_access column in profiles
				updateData.api_access = true;
				break;
			case 'bulk_processing':
				// Assuming you have a bulk_processing column in profiles
				updateData.bulk_processing = true;
				break;
			default:
				return { success: false, error: 'Unknown feature flag' };
		}

		// Update user profile with feature flag
		const { error: updateError } = await supabaseAdmin
			.from('profiles')
			.update(updateData)
			.eq('id', userId)
			.eq('org_id', orgId);

		if (updateError) {
			console.error('Error updating feature for bypass:', updateError);
			return { success: false, error: 'Failed to update user features' };
		}

		// Create transaction record for audit trail
		const { error: txError } = await supabaseAdmin.from('credit_transactions').insert({
			user_id: userId,
			org_id: orgId,
			transaction_type: 'purchase',
			amount: 0, // No credits added, just feature unlock
			credits_before: 0,
			credits_after: 0,
			description: `${featureSku.name} - Bypass Purchase`,
			reference_id: bypassReference,
			metadata: {
				type: 'feature_purchase_bypass',
				feature_id: featureId,
				feature_flag: featureSku.featureFlag,
				feature_name: featureSku.name,
				bypass: true,
				amount_php: featureSku.amountPhp
			}
		});

		if (txError) {
			console.error('Error creating bypass feature transaction record:', txError);
			// Don't fail the whole operation, just log the issue
		}

		return { success: true };
	} catch (error) {
		console.error('Error in grantFeatureBypass:', error);
		return { success: false, error: 'Internal server error' };
	}
}

/**
 * Generate a bypass reference ID for tracking bypass purchases
 */
export function generateBypassReference(): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	return `bypass_${timestamp}_${random}`;
}
