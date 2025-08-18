// Server-only PayMongo API client wrapper
// This module handles direct communication with PayMongo API using checkout sessions

import { serverEnv, assertServerContext } from '../../config/environment';
import { generateIdempotencyKey } from '../utils/crypto';

// PayMongo API Types
export interface PayMongoLineItem {
  currency: 'PHP';
  amount: number; // Amount in centavos
  name: string;
  quantity: number;
}

export interface PayMongoCheckoutSessionRequest {
  line_items: PayMongoLineItem[];
  payment_method_types: PayMongoPaymentMethodType[];
  success_url: string;
  cancel_url: string;
  metadata?: Record<string, any>;
  description?: string;
  send_email_receipt?: boolean;
}

export interface PayMongoCheckoutSessionResponse {
  id: string;
  checkout_url: string;
  status: string;
  payment_method_types: PayMongoPaymentMethodType[];
  line_items: PayMongoLineItem[];
  success_url: string;
  cancel_url: string;
  metadata?: Record<string, any>;
  description?: string;
  created_at: number;
  updated_at: number;
}

// Supported PayMongo payment method types
export type PayMongoPaymentMethodType = 'gcash' | 'paymaya' | 'card' | 'online_banking';

// PayMongo error types
export interface PayMongoError {
  code: string;
  detail: string;
  source?: {
    pointer?: string;
    parameter?: string;
  };
}

export interface PayMongoErrorResponse {
  errors: PayMongoError[];
}

// Custom error classes for typed error handling
export class PayMongoAPIError extends Error {
  public readonly code: string;
  public readonly details: PayMongoError[];
  public readonly statusCode: number;

  constructor(message: string, code: string, details: PayMongoError[], statusCode: number) {
    super(message);
    this.name = 'PayMongoAPIError';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }
}

export class PayMongoConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PayMongoConfigurationError';
  }
}

export class PayMongoClient {
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.paymongo.com/v1';

  constructor() {
    // Ensure this is only used on the server
    assertServerContext('PayMongoClient');
    
    if (!serverEnv.paymongo.secretKey) {
      throw new PayMongoConfigurationError(
        'PAYMONGO_SECRET_KEY environment variable is not configured'
      );
    }
    this.secretKey = serverEnv.paymongo.secretKey;
  }

  private get authHeaders() {
    return {
      'Authorization': `Basic ${btoa(`${this.secretKey}:`)}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private getIdempotencyHeaders() {
    return {
      ...this.authHeaders,
      'Idempotency-Key': generateIdempotencyKey()
    };
  }

  /**
   * Convert PHP amount to centavos (PayMongo requires amounts in centavos)
   */
  private phpToCentavos(phpAmount: number): number {
    return Math.round(phpAmount * 100);
  }

  /**
   * Convert centavos to PHP amount
   */
  private centavosToPhp(centavos: number): number {
    return centavos / 100;
  }

  /**
   * Handle PayMongo API response and map errors to typed errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: PayMongoErrorResponse;
      try {
        errorData = await response.json();
      } catch {
        throw new PayMongoAPIError(
          `PayMongo API error: ${response.status} ${response.statusText}`,
          'UNKNOWN_ERROR',
          [],
          response.status
        );
      }

      const errors = errorData.errors || [];
      const primaryError = errors[0];
      const safeMessage = this.getSafeErrorMessage(primaryError?.code || 'UNKNOWN_ERROR');

      throw new PayMongoAPIError(
        safeMessage,
        primaryError?.code || 'UNKNOWN_ERROR',
        errors,
        response.status
      );
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Map PayMongo error codes to safe user-friendly messages
   */
  private getSafeErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'payment_method_not_configured': 'This payment method is not available for your account',
      'invalid_request_error': 'Invalid payment request. Please try again',
      'authentication_error': 'Payment service authentication failed',
      'api_connection_error': 'Unable to connect to payment service',
      'api_error': 'Payment service temporarily unavailable',
      'rate_limit_error': 'Too many requests. Please wait and try again',
      'validation_error': 'Invalid payment information provided',
      'resource_missing': 'Payment session not found',
      'idempotency_error': 'Duplicate payment request detected',
      'UNKNOWN_ERROR': 'Payment processing failed. Please try again'
    };

    return errorMessages[errorCode] || errorMessages['UNKNOWN_ERROR'];
  }

  /**
   * Create a checkout session
   * Returns session ID and checkout URL for redirect
   */
  async createCheckoutSession(params: PayMongoCheckoutSessionRequest): Promise<{
    id: string;
    checkout_url: string;
  }> {
    // Convert line item amounts from PHP to centavos
    const lineItemsInCentavos = params.line_items.map(item => ({
      ...item,
      amount: this.phpToCentavos(item.amount)
    }));

    const requestBody = {
      data: {
        attributes: {
          line_items: lineItemsInCentavos,
          payment_method_types: params.payment_method_types,
          success_url: params.success_url,
          cancel_url: params.cancel_url,
          description: params.description,
          send_email_receipt: params.send_email_receipt || false,
          metadata: params.metadata || {}
        }
      }
    };

    const response = await fetch(`${this.baseUrl}/checkout_sessions`, {
      method: 'POST',
      headers: this.getIdempotencyHeaders(),
      body: JSON.stringify(requestBody)
    });

    const session = await this.handleResponse<PayMongoCheckoutSessionResponse>(response);
    
    return {
      id: session.id,
      checkout_url: session.checkout_url
    };
  }

  /**
   * Retrieve a checkout session by ID
   */
  async retrieveCheckoutSession(sessionId: string): Promise<PayMongoCheckoutSessionResponse> {
    const response = await fetch(`${this.baseUrl}/checkout_sessions/${sessionId}`, {
      method: 'GET',
      headers: this.authHeaders
    });

    return this.handleResponse<PayMongoCheckoutSessionResponse>(response);
  }

  /**
   * Optional: Create a Payment Intent (alternative flow)
   * Kept behind interface for flexibility
   */
  async createPaymentIntent(params: {
    amount: number; // Amount in PHP
    currency: 'PHP';
    payment_method_allowed: PayMongoPaymentMethodType[];
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<{
    id: string;
    client_key: string;
    status: string;
  }> {
    const requestBody = {
      data: {
        attributes: {
          amount: this.phpToCentavos(params.amount),
          currency: params.currency,
          payment_method_allowed: params.payment_method_allowed,
          description: params.description,
          metadata: params.metadata || {},
          capture_type: 'automatic'
        }
      }
    };

    const response = await fetch(`${this.baseUrl}/payment_intents`, {
      method: 'POST',
      headers: this.getIdempotencyHeaders(),
      body: JSON.stringify(requestBody)
    });

    const paymentIntent = await this.handleResponse<any>(response);
    
    return {
      id: paymentIntent.id,
      client_key: paymentIntent.attributes.client_key,
      status: paymentIntent.attributes.status
    };
  }

  /**
   * Optional: Create a Source (alternative flow)
   * Kept behind interface for flexibility
   */
  async createSource(params: {
    amount: number; // Amount in PHP
    currency: 'PHP';
    type: PayMongoPaymentMethodType;
    redirect: {
      success: string;
      failed: string;
    };
    metadata?: Record<string, any>;
  }): Promise<{
    id: string;
    redirect_url?: string;
    status: string;
  }> {
    const requestBody = {
      data: {
        attributes: {
          amount: this.phpToCentavos(params.amount),
          currency: params.currency,
          type: params.type,
          redirect: params.redirect,
          metadata: params.metadata || {}
        }
      }
    };

    const response = await fetch(`${this.baseUrl}/sources`, {
      method: 'POST',
      headers: this.getIdempotencyHeaders(),
      body: JSON.stringify(requestBody)
    });

    const source = await this.handleResponse<any>(response);
    
    return {
      id: source.id,
      redirect_url: source.attributes.redirect?.checkout_url,
      status: source.attributes.status
    };
  }
}
