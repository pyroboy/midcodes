/**
 * CSRF Protection Utilities
 * SECURITY: Implements double-submit cookie pattern for CSRF protection
 * 
 * This protects state-changing API endpoints from cross-site request forgery attacks
 */

import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
import { env } from './env';

// Secret key for HMAC signing (should be from environment in production)
// Use lazy initialization to avoid calling randomBytes() at module load time
// (Cloudflare Workers disallow random value generation in global scope)
let _csrfSecret: string | null = null;

function getCSRFSecret(): string {
	if (_csrfSecret === null) {
		_csrfSecret = env.CSRF_SECRET || randomBytes(32).toString('hex');
	}
	return _csrfSecret;
}

// Token expiration time (1 hour)
const TOKEN_EXPIRATION_MS = 60 * 60 * 1000;

export interface CSRFTokenPair {
	cookieToken: string;  // Stored in httpOnly cookie
	headerToken: string;  // Sent in request header by client
}

/**
 * Generate a CSRF token pair
 * @returns Object with cookieToken and headerToken
 */
export function generateCSRFTokens(): CSRFTokenPair {
	const timestamp = Date.now().toString(36);
	const random = randomBytes(16).toString('hex');
	const cookieToken = `${timestamp}.${random}`;
	
	// Create HMAC signature of the cookie token
	const signature = createHmac('sha256', getCSRFSecret())
		.update(cookieToken)
		.digest('hex');
	
	const headerToken = `${cookieToken}.${signature}`;
	
	return {
		cookieToken,
		headerToken
	};
}

/**
 * Verify CSRF tokens match and are valid
 * @param headerToken - Token from X-CSRF-Token header
 * @param cookieToken - Token from csrf-token cookie
 * @returns true if tokens are valid and match
 */
export function verifyCSRFToken(headerToken: string | null, cookieToken: string | null): boolean {
	if (!headerToken || !cookieToken) {
		return false;
	}
	
	try {
		// Parse header token
		const parts = headerToken.split('.');
		if (parts.length !== 3) {
			return false;
		}
		
		const [timestamp, random, signature] = parts;
		const tokenPart = `${timestamp}.${random}`;
		
		// Verify the token matches the cookie
		if (tokenPart !== cookieToken) {
			return false;
		}
		
		// Verify the signature
		const expectedSignature = createHmac('sha256', getCSRFSecret())
			.update(tokenPart)
			.digest('hex');
		
		// Use timing-safe comparison to prevent timing attacks
		const signatureBuffer = Buffer.from(signature, 'hex');
		const expectedBuffer = Buffer.from(expectedSignature, 'hex');
		
		if (signatureBuffer.length !== expectedBuffer.length) {
			return false;
		}
		
		if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
			return false;
		}
		
		// Verify token hasn't expired
		const tokenTimestamp = parseInt(timestamp, 36);
		if (Date.now() - tokenTimestamp > TOKEN_EXPIRATION_MS) {
			return false;
		}
		
		return true;
	} catch (e) {
		console.error('CSRF token verification error:', e);
		return false;
	}
}

/**
 * Middleware helper to validate CSRF token from request
 * @param request - The incoming request
 * @param cookies - Cookie accessor
 * @returns Object with valid boolean and optional error message
 */
export function validateCSRFFromRequest(
	request: Request,
	getCookie: (name: string) => string | undefined
): { valid: boolean; error?: string } {
	// Skip CSRF validation for safe methods (GET, HEAD, OPTIONS)
	const method = request.method.toUpperCase();
	if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
		return { valid: true };
	}
	
	const headerToken = request.headers.get('x-csrf-token');
	const cookieToken = getCookie('csrf-token');
	
	if (!headerToken) {
		return { valid: false, error: 'Missing CSRF token header' };
	}
	
	if (!cookieToken) {
		return { valid: false, error: 'Missing CSRF cookie' };
	}
	
	if (!verifyCSRFToken(headerToken, cookieToken)) {
		return { valid: false, error: 'Invalid CSRF token' };
	}
	
	return { valid: true };
}

/**
 * Create error response for CSRF failures
 */
export function csrfErrorResponse(error: string): Response {
	return new Response(
		JSON.stringify({ error, code: 'CSRF_VALIDATION_FAILED' }),
		{ 
			status: 403,
			headers: { 'Content-Type': 'application/json' }
		}
	);
}
