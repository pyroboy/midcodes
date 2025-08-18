import type { CREDIT_PACKAGES, PREMIUM_FEATURES } from '$lib/utils/credits';

// PayMongo types
export interface PayMongoPaymentIntent {
  id: string;
  type: string;
  attributes: {
    amount: number;
    currency: string;
    description?: string;
    statement_descriptor?: string;
    status: 'awaiting_payment_method' | 'awaiting_next_action' | 'processing' | 'succeeded' | 'cancelled';
    client_key: string;
    next_action?: any;
    payment_method?: any;
    payments?: any[];
    setup_future_usage?: string;
    metadata?: Record<string, any>;
  };
}

export interface PayMongoWebhookEvent {
  id: string;
  type: 'payment_intent.succeeded' | 'payment_intent.payment_failed' | string;
  attributes: {
    type: string;
    livemode: boolean;
    data: PayMongoPaymentIntent;
    previous_data?: PayMongoPaymentIntent;
    created_at: number;
    updated_at: number;
  };
}

// Payment service configuration
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || '';
const PAYMONGO_PUBLIC_KEY = process.env.PAYMONGO_PUBLIC_KEY || '';
const BASE_URL = 'https://api.paymongo.com/v1';

// Helper function to encode credentials for PayMongo API
function getAuthHeaders() {
  const encoded = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');
  return {
    'Authorization': `Basic ${encoded}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Create a PayMongo payment intent for credit purchase
 */
export async function createPaymentIntent(
  amount: number, // Amount in centavos (PHP)
  currency: string = 'PHP',
  metadata: Record<string, any> = {}
): Promise<PayMongoPaymentIntent> {
  const response = await fetch(`${BASE_URL}/payment_intents`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      data: {
        attributes: {
          amount,
          currency,
          payment_method_allowed: [
            'card',
            'paymaya',
            'gcash',
            'grab_pay',
            'billease',
            'dob',
            'dob_ubp'
          ],
          payment_method_options: {
            card: {
              request_three_d_secure: 'automatic'
            }
          },
          description: metadata.description || 'ID Generator Credit Purchase',
          statement_descriptor: 'ID-GEN CREDITS',
          metadata
        }
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`PayMongo API Error: ${error.errors?.[0]?.detail || 'Unknown error'}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Retrieve payment intent status
 */
export async function retrievePaymentIntent(paymentIntentId: string): Promise<PayMongoPaymentIntent> {
  const response = await fetch(`${BASE_URL}/payment_intents/${paymentIntentId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`PayMongo API Error: ${error.errors?.[0]?.detail || 'Unknown error'}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Create payment intent for credit package
 */
export async function createCreditPackagePayment(
  packageId: string,
  userId: string,
  orgId: string
): Promise<PayMongoPaymentIntent> {
  const creditPackage = (await import('$lib/utils/credits')).CREDIT_PACKAGES.find(p => p.id === packageId);
  if (!creditPackage) {
    throw new Error('Invalid credit package');
  }

  const amount = creditPackage.price * 100; // Convert to centavos
  const metadata = {
    type: 'credit_purchase',
    package_id: packageId,
    credits: creditPackage.credits,
    user_id: userId,
    org_id: orgId,
    description: `${creditPackage.credits} credits - ${creditPackage.name}`
  };

  return await createPaymentIntent(amount, 'PHP', metadata);
}

/**
 * Create payment intent for premium feature
 */
export async function createPremiumFeaturePayment(
  featureId: string,
  userId: string,
  orgId: string
): Promise<PayMongoPaymentIntent> {
  const premiumFeature = (await import('$lib/utils/credits')).PREMIUM_FEATURES.find(f => f.id === featureId);
  if (!premiumFeature) {
    throw new Error('Invalid premium feature');
  }

  const amount = premiumFeature.price * 100; // Convert to centavos
  const metadata = {
    type: 'premium_feature_purchase',
    feature_id: featureId,
    user_id: userId,
    org_id: orgId,
    description: `${premiumFeature.name} - ${premiumFeature.description}`
  };

  return await createPaymentIntent(amount, 'PHP', metadata);
}

/**
 * Process successful payment (called from webhook)
 */
export async function processSuccessfulPayment(paymentIntent: PayMongoPaymentIntent): Promise<void> {
  const metadata = paymentIntent.attributes.metadata;
  if (!metadata) {
    throw new Error('No metadata found in payment intent');
  }

  const { addCredits, grantUnlimitedTemplates, grantWatermarkRemoval } = await import('$lib/utils/credits');

  switch (metadata.type) {
    case 'credit_purchase':
      const creditResult = await addCredits(
        metadata.user_id,
        metadata.org_id,
        parseInt(metadata.credits),
        paymentIntent.id,
        metadata.description
      );
      
      if (!creditResult.success) {
        throw new Error('Failed to add credits to user account');
      }
      break;

    case 'premium_feature_purchase':
      if (metadata.feature_id === 'unlimited_templates') {
        const templatesResult = await grantUnlimitedTemplates(
          metadata.user_id,
          metadata.org_id,
          paymentIntent.id
        );
        
        if (!templatesResult.success) {
          throw new Error('Failed to grant unlimited templates');
        }
      } else if (metadata.feature_id === 'remove_watermarks') {
        const watermarkResult = await grantWatermarkRemoval(
          metadata.user_id,
          metadata.org_id,
          paymentIntent.id
        );
        
        if (!watermarkResult.success) {
          throw new Error('Failed to grant watermark removal');
        }
      }
      break;

    default:
      throw new Error(`Unknown payment type: ${metadata.type}`);
  }
}

/**
 * Verify PayMongo webhook signature (for security)
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string = process.env.PAYMONGO_WEBHOOK_SECRET || ''
): boolean {
  // PayMongo uses HMAC-SHA256 for webhook signatures
  const crypto = require('crypto');
  const computedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
}

/**
 * Get PayMongo public key for client-side integration
 */
export function getPublicKey(): string {
  return PAYMONGO_PUBLIC_KEY;
}
