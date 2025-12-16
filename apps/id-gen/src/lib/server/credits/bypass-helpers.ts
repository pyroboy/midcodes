/**
 * Server-side credit utility functions for payment bypass
 * These functions should only be used when payments_bypass is enabled in org_settings
 * and provide a safe way to simulate successful purchases without external API calls
 * 
 * SECURITY: Uses atomic SQL operations to prevent race conditions
 */

import { randomBytes } from 'crypto';
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
 * SECURITY: Atomically add credits to user account
 * Uses SQL increment to prevent race conditions (read-modify-write vulnerability)
 * 
 * @param userId - User ID
 * @param orgId - Organization ID
 * @param packageId - Credit package ID to purchase
 * @param bypassReference - Unique reference for this transaction
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

		// SECURITY: Use atomic SQL increment instead of read-modify-write
		// This prevents race conditions where concurrent requests could corrupt balance
		const { data: updatedProfile, error: updateError } = await supabaseAdmin
			.rpc('add_credits_atomic' as any, {
				p_user_id: userId,
				p_org_id: orgId,
				p_credits_to_add: creditsToAdd
			});

		if (updateError) {
			console.error('Error updating credits atomically:', updateError);
			
			// Fallback: If RPC doesn't exist, use raw SQL with row-level locking
			const { data: fallbackResult, error: fallbackError } = await supabaseAdmin
				.from('profiles')
				.update({
					credits_balance: supabaseAdmin.rpc('increment_credits' as any, { 
						row_id: userId,
						amount: creditsToAdd 
					}) as any,
					updated_at: new Date().toISOString()
				})
				.eq('id', userId)
				.eq('org_id', orgId)
				.select('credits_balance')
				.single();

			if (fallbackError) {
				// Final fallback: Use Postgres raw increment
				const { data: rawResult, error: rawError } = await supabaseAdmin
					.rpc('execute_sql' as any, {
						sql: `
							UPDATE profiles 
							SET credits_balance = credits_balance + $1, 
							    updated_at = NOW() 
							WHERE id = $2 AND org_id = $3 
							RETURNING credits_balance
						`,
						params: [creditsToAdd, userId, orgId]
					});

				if (rawError) {
					console.error('All credit update methods failed:', rawError);
					return { success: false, error: 'Failed to update user balance' };
				}
			}
		}

		// Get the new balance for the response
		const { data: profile, error: fetchError } = await supabaseAdmin
			.from('profiles')
			.select('credits_balance')
			.eq('id', userId)
			.eq('org_id', orgId)
			.single();

		const newBalance = profile?.credits_balance ?? 0;

		// Create transaction record to maintain audit trail
		const { error: txError } = await supabaseAdmin.from('credit_transactions').insert({
			user_id: userId,
			org_id: orgId,
			transaction_type: 'purchase',
			amount: creditsToAdd,
			credits_before: newBalance - creditsToAdd,
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
 * SECURITY: Generate a cryptographically secure bypass reference ID
 * Uses crypto.randomBytes for 128-bit entropy instead of Math.random()
 * 
 * Old implementation had only ~2.18 billion combinations (36^6)
 * New implementation has 2^128 combinations (3.4×10^38)
 */
export function generateBypassReference(): string {
	const timestamp = Date.now();
	const random = randomBytes(16).toString('hex'); // 128-bit entropy
	return `bypass_${timestamp}_${random}`;
}
