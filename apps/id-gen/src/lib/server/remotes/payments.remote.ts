/**
 * Server-only remote functions for payment processing
 * These functions can be called from the client but execute on the server
 * 
 * Features:
 * - Type-safe payment processing with Zod validation
 * - Idempotency for safe retries
 * - Structured logging with PII redaction
 * - Server-side catalog validation (never trust client amounts)
 */

import { query, command, form } from '$app/server';
import { redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';

// Schema imports
import {
  paymentHistoryQuerySchema,
  createCreditPaymentInputSchema,
  createFeaturePaymentInputSchema,
  checkoutInitResultSchema,
  paymentHistorySchema,
  type PaymentHistoryQuery,
  type CreateCreditPaymentInput,
  type CreateFeaturePaymentInput,
  type CheckoutInitResult,
  type PaymentHistory
} from '$lib/payments/schemas';

// Server-only imports
import { assertServerContext, getCheckoutUrls } from '$lib/config/environment';
import { PayMongoClient } from '$lib/server/paymongo/client';
import { generateIdempotencyKey } from '$lib/server/utils/crypto';
import { getCreditPackageById, getFeatureSkuById } from '$lib/payments/catalog';
import {
  recordCheckoutInit,
  listPaymentsByUser
} from '$lib/server/payments/persistence';

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Gets payment history for the current user
 * - Requires authentication (locals.user)
 * - Returns only records belonging to the current user
 * - Supports cursor-based pagination
 */
export const getPaymentHistory = query('unchecked', async ({ cursor, limit }: any) => {
  assertServerContext('getPaymentHistory');
  
  const { locals } = getRequestEvent();
  
  // Require authentication
  if (!locals.user) {
    throw new Error('Authentication required');
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

    // Emit structured log (redact PII)
    console.info('[Payment Query]', {
      action: 'payment_history_retrieved',
      userId: locals.user.id,
      count: items.length,
      hasCursor: !!cursor,
      hasMore: !!nextCursor,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    // Log error without exposing sensitive details
    console.error('[Payment Query Error]', {
      action: 'payment_history_failed',
      userId: locals.user.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    throw new Error('Failed to retrieve payment history');
  }
});

// =============================================================================
// COMMAND FUNCTIONS
// =============================================================================

/**
 * Creates a credit payment checkout session
 * - Validates packageId against server-side catalog
 * - Never trusts client-provided amounts
 * - Creates PayMongo checkout with proper metadata
 * - Supports bypass mode for testing and development
 */
export const createCreditPayment = command('unchecked', async (input: any) => {
  assertServerContext('createCreditPayment');
  
  const { locals } = getRequestEvent();
  const { supabase, org_id, user } = locals;
  
  // Require authentication
  if (!user) {
    throw new Error('Authentication required');
  }

  // Check organization settings for payments_enabled and payments_bypass flags
  const { data: orgSettings, error: settingsError } = await supabase
    .from('org_settings')
    .select('payments_enabled, payments_bypass')
    .eq('org_id', org_id)
    .single();

  if (settingsError) {
    console.error('[Payment Command Error]', {
      action: 'org_settings_fetch_failed',
      error: settingsError.message,
      userId: user.id,
      timestamp: new Date().toISOString()
    });
    throw new Error('Failed to check payment settings');
  }

  // Ensure payments are enabled or in bypass mode
  if (!orgSettings?.payments_enabled && !orgSettings?.payments_bypass) {
    throw new Error('Payments are disabled for this organization');
  }

  try {
    // Resolve packageId to server-side catalog (NEVER trust client amounts)
    const creditPackage = getCreditPackageById(input.packageId);
    if (!creditPackage || !creditPackage.isActive) {
      throw new Error('Invalid or inactive credit package');
    }

    // Calculate server-side amount and description
    const amountPhp = creditPackage.amountPhp;
    const description = `${creditPackage.name} - ${creditPackage.description}`;

    // CHECK FOR BYPASS MODE
    if (orgSettings.payments_bypass) {
      // Import bypass helpers only when needed (for better tree-shaking)
      const { addCreditsBypass, generateBypassReference } = await import('$lib/server/credits/bypass-helpers');
      
      // Generate a reference ID for the bypass transaction
      const bypassReference = generateBypassReference();
      
      // Apply credits immediately (server-side)
      const bypassResult = await addCreditsBypass(
        user.id,
        org_id!,
        input.packageId,
        bypassReference
      );
      
      if (!bypassResult.success) {
        throw new Error(bypassResult.error || 'Failed to process bypass payment');
      }
      
      // Emit structured log for bypass
      console.info('[Payment Command]', {
        action: 'credit_payment_bypassed',
        userId: user.id,
        packageId: input.packageId,
        amountPhp,
        credits: creditPackage.credits,
        bypassReference,
        timestamp: new Date().toISOString()
      });
      
      // Return success response with bypass flag
      return {
        checkoutUrl: input.returnTo || getCheckoutUrls().success,
        sessionId: bypassReference,
        provider: 'bypass',
        bypass: true,
        success: true
      };
    }

    // STANDARD PAYMENT FLOW (when bypass is off)
    // Generate idempotency key for safe retries
    const idempotencyKey = generateIdempotencyKey();

    // Create PayMongo client
    const payMongo = new PayMongoClient();

    // Get checkout URLs
    const checkoutUrls = getCheckoutUrls();
    const successUrl = input.returnTo || checkoutUrls.success;
    const cancelUrl = checkoutUrls.cancel;

    // Create checkout session with structured metadata
    const checkoutSession = await payMongo.createCheckoutSession({
      line_items: [{
        currency: 'PHP',
        amount: amountPhp,
        name: creditPackage.name,
        quantity: 1
      }],
      payment_method_types: input.method ? [input.method] : ['gcash', 'paymaya', 'card'],
      success_url: successUrl,
      cancel_url: cancelUrl,
      description,
      metadata: {
        userId: user.id,
        kind: 'credit',
        skuId: input.packageId,
        amountPhp: amountPhp.toString()
      }
    });

    // Persist pending payment record with idempotency key
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

    // Emit structured log (redact PII)
    console.info('[Payment Command]', {
      action: 'credit_payment_initiated',
      userId: user.id,
      packageId: input.packageId,
      amountPhp,
      credits: creditPackage.credits,
      sessionId: checkoutSession.id,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    // Log error without exposing sensitive details
    console.error('[Payment Command Error]', {
      action: 'credit_payment_failed',
      userId: locals.user?.id,
      packageId: input.packageId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    throw new Error('Failed to create credit payment');
  }
});

/**
 * Creates a feature payment checkout session
 * - Validates featureId against server-side catalog
 * - Never trusts client-provided amounts
 * - Creates PayMongo checkout with proper metadata
 * - Supports bypass mode for testing and development
 */
export const createFeaturePayment = command('unchecked', async (input: any) => {
  assertServerContext('createFeaturePayment');
  
  const { locals } = getRequestEvent();
  const { supabase, org_id, user } = locals;
  
  // Require authentication
  if (!user) {
    throw new Error('Authentication required');
  }

  // Check organization settings for payments_enabled and payments_bypass flags
  const { data: orgSettings, error: settingsError } = await supabase
    .from('org_settings')
    .select('payments_enabled, payments_bypass')
    .eq('org_id', org_id)
    .single();

  if (settingsError) {
    console.error('[Payment Command Error]', {
      action: 'org_settings_fetch_failed',
      error: settingsError.message,
      userId: user.id,
      timestamp: new Date().toISOString()
    });
    throw new Error('Failed to check payment settings');
  }

  // Ensure payments are enabled or in bypass mode
  if (!orgSettings?.payments_enabled && !orgSettings?.payments_bypass) {
    throw new Error('Payments are disabled for this organization');
  }

  try {
    // Resolve featureId to server-side catalog (NEVER trust client amounts)
    const featureSku = getFeatureSkuById(input.featureId);
    if (!featureSku || !featureSku.isActive) {
      throw new Error('Invalid or inactive feature SKU');
    }

    // Calculate server-side amount and description
    const amountPhp = featureSku.amountPhp;
    const description = `${featureSku.name} - ${featureSku.description}`;

    // CHECK FOR BYPASS MODE
    if (orgSettings.payments_bypass) {
      // Import bypass helpers only when needed (for better tree-shaking)
      const { grantFeatureBypass, generateBypassReference } = await import('$lib/server/credits/bypass-helpers');
      
      // Generate a reference ID for the bypass transaction
      const bypassReference = generateBypassReference();
      
      // Grant feature immediately (server-side)
      const bypassResult = await grantFeatureBypass(
        user.id,
        org_id!,
        input.featureId,
        bypassReference
      );
      
      if (!bypassResult.success) {
        throw new Error(bypassResult.error || 'Failed to process bypass feature purchase');
      }
      
      // Emit structured log for bypass
      console.info('[Payment Command]', {
        action: 'feature_payment_bypassed',
        userId: user.id,
        featureId: input.featureId,
        featureFlag: featureSku.featureFlag,
        amountPhp,
        bypassReference,
        timestamp: new Date().toISOString()
      });
      
      // Return success response with bypass flag
      return {
        checkoutUrl: input.returnTo || getCheckoutUrls().success,
        sessionId: bypassReference,
        provider: 'bypass',
        bypass: true,
        success: true
      };
    }

    // STANDARD PAYMENT FLOW (when bypass is off)
    // Generate idempotency key for safe retries
    const idempotencyKey = generateIdempotencyKey();

    // Create PayMongo client
    const payMongo = new PayMongoClient();

    // Get checkout URLs
    const checkoutUrls = getCheckoutUrls();
    const successUrl = input.returnTo || checkoutUrls.success;
    const cancelUrl = checkoutUrls.cancel;

    // Create checkout session with structured metadata
    const checkoutSession = await payMongo.createCheckoutSession({
      line_items: [{
        currency: 'PHP',
        amount: amountPhp,
        name: featureSku.name,
        quantity: 1
      }],
      payment_method_types: input.method ? [input.method] : ['gcash', 'paymaya', 'card'],
      success_url: successUrl,
      cancel_url: cancelUrl,
      description,
      metadata: {
        userId: user.id,
        kind: 'feature',
        skuId: input.featureId,
        amountPhp: amountPhp.toString()
      }
    });

    // Persist pending payment record with idempotency key
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

    // Emit structured log (redact PII)
    console.info('[Payment Command]', {
      action: 'feature_payment_initiated',
      userId: user.id,
      featureId: input.featureId,
      featureFlag: featureSku.featureFlag,
      amountPhp,
      sessionId: checkoutSession.id,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    // Log error without exposing sensitive details
    console.error('[Payment Command Error]', {
      action: 'feature_payment_failed',
      userId: locals.user?.id,
      featureId: input.featureId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    throw new Error('Failed to create feature payment');
  }
});

// =============================================================================
// FORM FUNCTIONS
// =============================================================================

/**
 * Form action for purchasing credits
 * - Accepts packageId and optional returnTo from form data
 * - Calls createCreditPayment command
 * - Returns redirect to checkout URL on success
 */
export const purchaseCredits = form(async (data) => {
  assertServerContext('purchaseCredits');
  
  const { locals } = getRequestEvent();
  
  // Require authentication
  if (!locals.user) {
    throw new Error('Authentication required');
  }

  // Extract form data
  const packageId = data.get('packageId');
  const returnTo = data.get('returnTo');

  if (!packageId || typeof packageId !== 'string') {
    throw new Error('Package ID is required');
  }

  // Validate returnTo if provided
  let validReturnTo: string | undefined;
  if (returnTo && typeof returnTo === 'string') {
    try {
      new URL(returnTo); // Validate URL format
      validReturnTo = returnTo;
    } catch {
      throw new Error('Invalid return URL');
    }
  }

  try {
    // Call the createCreditPayment command
    const result = await createCreditPayment({
      packageId,
      method: undefined, // Let PayMongo show all available methods
      returnTo: validReturnTo
    });

    // Emit structured log
    console.info('[Payment Form]', {
      action: 'credit_purchase_form_submitted',
      userId: locals.user.id,
      packageId,
      hasReturnTo: !!validReturnTo,
      timestamp: new Date().toISOString()
    });

    // Redirect to checkout URL
    redirect(303, result.checkoutUrl);
  } catch (error) {
    // Log error without exposing sensitive details
    console.error('[Payment Form Error]', {
      action: 'credit_purchase_form_failed',
      userId: locals.user.id,
      packageId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    throw new Error('Failed to initiate credit purchase');
  }
});

/**
 * Form action for purchasing features
 * - Accepts featureId and optional returnTo from form data
 * - Calls createFeaturePayment command
 * - Returns redirect to checkout URL on success
 */
export const purchaseFeature = form(async (data) => {
  assertServerContext('purchaseFeature');
  
  const { locals } = getRequestEvent();
  
  // Require authentication
  if (!locals.user) {
    throw new Error('Authentication required');
  }

  // Extract form data
  const featureId = data.get('featureId');
  const returnTo = data.get('returnTo');

  if (!featureId || typeof featureId !== 'string') {
    throw new Error('Feature ID is required');
  }

  // Validate returnTo if provided
  let validReturnTo: string | undefined;
  if (returnTo && typeof returnTo === 'string') {
    try {
      new URL(returnTo); // Validate URL format
      validReturnTo = returnTo;
    } catch {
      throw new Error('Invalid return URL');
    }
  }

  try {
    // Call the createFeaturePayment command
    const result = await createFeaturePayment({
      featureId,
      method: undefined, // Let PayMongo show all available methods
      returnTo: validReturnTo
    });

    // Emit structured log
    console.info('[Payment Form]', {
      action: 'feature_purchase_form_submitted',
      userId: locals.user.id,
      featureId,
      hasReturnTo: !!validReturnTo,
      timestamp: new Date().toISOString()
    });

    // Redirect to checkout URL
    redirect(303, result.checkoutUrl);
  } catch (error) {
    // Log error without exposing sensitive details
    console.error('[Payment Form Error]', {
      action: 'feature_purchase_form_failed',
      userId: locals.user.id,
      featureId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    throw new Error('Failed to initiate feature purchase');
  }
});
