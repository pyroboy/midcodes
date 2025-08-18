// Enumerations for payment system
export type PurchaseKind = 'credit' | 'feature';
export type PaymentProvider = 'paymongo';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
export type PaymentMethod = 'gcash' | 'paymaya' | 'card' | 'online_banking';

// Credit package type
export interface CreditPackage {
	id: string;
	name: string;
	credits: number;
	amountPhp: number;
	description: string;
	isActive: boolean;
}

// Feature SKU type
export interface FeatureSKU {
	id: string;
	name: string;
	featureFlag: string;
	amountPhp: number;
	description: string;
	isActive: boolean;
}

// Payment record type
export interface PaymentRecord {
	id: string;
	userId: string;
	providerPaymentId: string;
	kind: PurchaseKind;
	skuId: string;
	amountPhp: number;
	currency: string;
	status: PaymentStatus;
	method: PaymentMethod;
	metadata: Record<string, any>;
	createdAt: Date;
	updatedAt: Date;
	idempotencyKey: string;
	provider: PaymentProvider;
}

// Legacy types for compatibility (can be removed later)
export interface PaymentIntent {
	id: string;
	amount: number;
	currency: string;
	status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
	metadata?: Record<string, any>;
}

export interface WebhookEvent {
	id: string;
	type: string;
	data: any;
	timestamp: number;
}
