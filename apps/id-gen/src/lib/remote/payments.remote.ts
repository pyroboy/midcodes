/**
 * Server-only remote functions for payment processing
 * These functions can be called from the client but execute on the server
 */

import { query, command, form, getRequestEvent } from '$app/server';
import { redirect, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

// Schema imports
import {
	type CheckoutInitResult,
	type PaymentHistory
} from '$lib/payments/schemas';

// Server-only imports
import { assertServerContext, getCheckoutUrls } from '$lib/config/environment';
import { PayMongoClient } from '$lib/server/paymongo/client';
import { generateIdempotencyKey } from '$lib/server/utils/crypto';
import { getCreditPackageById, getFeatureSkuById } from '$lib/payments/catalog';
import { recordCheckoutInit, listPaymentsByUser } from '$lib/server/payments/persistence';

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Gets payment history for the current user
 * - Requires authentication (locals.user)
 */
export const getPaymentHistory = query('unchecked', async ({ cursor, limit }: any) => {
	assertServerContext('getPaymentHistory');

	const { locals } = getRequestEvent();

	// Require authentication
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	try {
		// Get payments for the current user only
		const { data: items, nextCursor } = await listPaymentsByUser({
			userId: locals.user.id,
			limit,
			cursor
		});

		// Structure the response according to schema
		const result: PaymentHistory = {
			items,
			nextCursor: nextCursor || null
		};

		return result;
	} catch (err) {
		console.error('[Payment Query Error]', err);
		throw error(500, 'Failed to retrieve payment history');
	}
}) as any;

// =============================================================================
// COMMAND FUNCTIONS
// =============================================================================

/**
 * Creates a credit payment checkout session
 */
export const createCreditPayment = command('unchecked', async (input: any) => {
	assertServerContext('createCreditPayment');

	const { locals } = getRequestEvent();
	const { org_id, user } = locals;

	if (!org_id) throw error(400, 'Organization ID is required');
	if (!user) throw error(401, 'Authentication required');

	// Check organization settings
	const orgSettings = await db.query.orgSettings.findFirst({
		where: eq(schema.orgSettings.orgId, org_id)
	});

	if (!orgSettings) throw error(404, 'Organization settings not found');

	// Ensure payments are enabled or in bypass mode
	if (!orgSettings.paymentsEnabled && !orgSettings.paymentsBypass) {
		throw error(403, 'Payments are disabled for this organization');
	}

	try {
		const creditPackage = getCreditPackageById(input.packageId);
		if (!creditPackage || !creditPackage.isActive) {
			throw error(400, 'Invalid or inactive credit package');
		}

		const amountPhp = creditPackage.amountPhp;
		const description = `${creditPackage.name} - ${creditPackage.description}`;

		// CHECK FOR BYPASS MODE
		if (orgSettings.paymentsBypass) {
			const { addCreditsBypass, generateBypassReference } = await import(
				'$lib/server/credits/bypass-helpers'
			);

			const bypassReference = generateBypassReference();

			const bypassResult = await addCreditsBypass(
				user.id,
				org_id,
				input.packageId,
				bypassReference
			);

			if (!bypassResult.success) {
				throw error(500, bypassResult.error || 'Failed to process bypass payment');
			}

			return {
				checkoutUrl: input.returnTo || getCheckoutUrls().success,
				sessionId: bypassReference,
				provider: 'bypass',
				bypass: true,
				success: true
			};
		}

		// STANDARD PAYMENT FLOW
		const idempotencyKey = generateIdempotencyKey();
		const payMongo = new PayMongoClient();
		const checkoutUrls = getCheckoutUrls();
		const successUrl = input.returnTo || checkoutUrls.success;

		const checkoutSession = await payMongo.createCheckoutSession({
			line_items: [
				{
					currency: 'PHP',
					amount: amountPhp,
					name: creditPackage.name,
					quantity: 1
				}
			],
			payment_method_types: input.method ? [input.method] : ['gcash', 'paymaya', 'card'],
			success_url: successUrl,
			cancel_url: checkoutUrls.cancel,
			description,
			metadata: {
				userId: user.id,
				kind: 'credit',
				skuId: input.packageId,
				amountPhp: amountPhp.toString()
			}
		});

		// Persist pending payment record
		await recordCheckoutInit({
			userId: user.id,
			sessionId: checkoutSession.id,
			kind: 'credit',
			skuId: input.packageId,
			amountPhp,
			methodAllowed: input.method ? [input.method] : ['gcash', 'paymaya', 'card'],
			idempotencyKey,
			metadata: {
				packageId: input.packageId,
				credits: creditPackage.credits,
				description: creditPackage.description
			}
		});

		const result: CheckoutInitResult = {
			checkoutUrl: checkoutSession.checkout_url,
			sessionId: checkoutSession.id,
			provider: 'paymongo'
		};

		return result;
	} catch (err) {
		console.error('[Payment Command Error]', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'Failed to create credit payment');
	}
});

/**
 * Creates a feature payment checkout session
 */
export const createFeaturePayment = command('unchecked', async (input: any) => {
	assertServerContext('createFeaturePayment');

	const { locals } = getRequestEvent();
	const { org_id, user } = locals;

	if (!org_id) throw error(400, 'Organization ID is required');
	if (!user) throw error(401, 'Authentication required');

	const orgSettings = await db.query.orgSettings.findFirst({
		where: eq(schema.orgSettings.orgId, org_id)
	});

	if (!orgSettings) throw error(404, 'Organization settings not found');

	if (!orgSettings.paymentsEnabled && !orgSettings.paymentsBypass) {
		throw error(403, 'Payments are disabled for this organization');
	}

	try {
		const featureSku = getFeatureSkuById(input.featureId);
		if (!featureSku || !featureSku.isActive) {
			throw error(400, 'Invalid or inactive feature SKU');
		}

		const amountPhp = featureSku.amountPhp;
		const description = `${featureSku.name} - ${featureSku.description}`;

		// CHECK FOR BYPASS MODE
		if (orgSettings.paymentsBypass) {
			const { grantFeatureBypass, generateBypassReference } = await import(
				'$lib/server/credits/bypass-helpers'
			);

			const bypassReference = generateBypassReference();

			const bypassResult = await grantFeatureBypass(
				user.id,
				org_id,
				input.featureId,
				bypassReference
			);

			if (!bypassResult.success) {
				throw error(500, bypassResult.error || 'Failed to process bypass feature purchase');
			}

			return {
				checkoutUrl: input.returnTo || getCheckoutUrls().success,
				sessionId: bypassReference,
				provider: 'bypass',
				bypass: true,
				success: true
			};
		}

		// STANDARD PAYMENT FLOW
		const idempotencyKey = generateIdempotencyKey();
		const payMongo = new PayMongoClient();
		const checkoutUrls = getCheckoutUrls();
		const successUrl = input.returnTo || checkoutUrls.success;

		const checkoutSession = await payMongo.createCheckoutSession({
			line_items: [
				{
					currency: 'PHP',
					amount: amountPhp,
					name: featureSku.name,
					quantity: 1
				}
			],
			payment_method_types: input.method ? [input.method] : ['gcash', 'paymaya', 'card'],
			success_url: successUrl,
			cancel_url: checkoutUrls.cancel,
			description,
			metadata: {
				userId: user.id,
				kind: 'feature',
				skuId: input.featureId,
				amountPhp: amountPhp.toString()
			}
		});

		await recordCheckoutInit({
			userId: user.id,
			sessionId: checkoutSession.id,
			kind: 'feature',
			skuId: input.featureId,
			amountPhp,
			methodAllowed: input.method ? [input.method] : ['gcash', 'paymaya', 'card'],
			idempotencyKey,
			metadata: {
				featureId: input.featureId,
				featureFlag: featureSku.featureFlag,
				description: featureSku.description
			}
		});

		const result: CheckoutInitResult = {
			checkoutUrl: checkoutSession.checkout_url,
			sessionId: checkoutSession.id,
			provider: 'paymongo'
		};

		return result;
	} catch (err) {
		console.error('[Payment Command Error]', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'Failed to create feature payment');
	}
});

// =============================================================================
// FORM FUNCTIONS
// =============================================================================

/**
 * Form action for purchasing credits
 */
export const purchaseCredits = form(async () => {
	assertServerContext('purchaseCredits');
	const { locals, request } = getRequestEvent();
	const formData = await request.formData();

	if (!locals.user) throw error(401, 'Authentication required');

	const packageId = formData.get('packageId');
	const returnTo = formData.get('returnTo');

	if (!packageId || typeof packageId !== 'string') {
		throw error(400, 'Package ID is required');
	}

	let validReturnTo: string | undefined;
	if (returnTo && typeof returnTo === 'string') {
		try {
			new URL(returnTo);
			validReturnTo = returnTo;
		} catch {
			throw error(400, 'Invalid return URL');
		}
	}

	try {
		const result = await createCreditPayment({
			packageId,
			method: undefined,
			returnTo: validReturnTo
		});

		redirect(303, result.checkoutUrl);
	} catch (err) {
		console.error('[Payment Form Error]', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'Failed to initiate credit purchase');
	}
});

/**
 * Form action for purchasing features
 */
export const purchaseFeature = form(async () => {
	assertServerContext('purchaseFeature');
	const { locals, request } = getRequestEvent();
	const formData = await request.formData();

	if (!locals.user) throw error(401, 'Authentication required');

	const featureId = formData.get('featureId');
	const returnTo = formData.get('returnTo');

	if (!featureId || typeof featureId !== 'string') {
		throw error(400, 'Feature ID is required');
	}

	let validReturnTo: string | undefined;
	if (returnTo && typeof returnTo === 'string') {
		try {
			new URL(returnTo);
			validReturnTo = returnTo;
		} catch {
			throw error(400, 'Invalid return URL');
		}
	}

	try {
		const result = await createFeaturePayment({
			featureId,
			method: undefined,
			returnTo: validReturnTo
		});

		redirect(303, result.checkoutUrl);
	} catch (err) {
		console.error('[Payment Form Error]', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'Failed to initiate feature purchase');
	}
});
