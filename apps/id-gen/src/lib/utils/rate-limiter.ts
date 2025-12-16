/**
 * Rate Limiting Middleware
 * SECURITY: Prevents brute force attacks, credential stuffing, and DoS
 */

interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

// In-memory store for rate limiting (consider Redis for production multi-instance setups)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 10 minutes
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of rateLimitStore.entries()) {
		if (now > entry.resetTime) {
			rateLimitStore.delete(key);
		}
	}
}, 10 * 60 * 1000);

/**
 * Rate limit configurations for different endpoint types
 */
export const RateLimitConfigs = {
	// Authentication endpoints (login, signup, password reset)
	AUTH: {
		windowMs: 15 * 60 * 1000, // 15 minutes
		maxRequests: 5 // 5 attempts per 15 minutes
	},
	// API endpoints (general)
	API: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 60 // 60 requests per minute
	},
	// Admin endpoints
	ADMIN: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 30 // 30 requests per minute
	},
	// Webhook endpoints
	WEBHOOK: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 100 // 100 requests per minute
	},
	// File upload endpoints
	UPLOAD: {
		windowMs: 60 * 1000, // 1 minute
		maxRequests: 20 // 20 uploads per minute
	}
};

/**
 * Extracts client identifier from request (IP address or user ID)
 */
function getClientIdentifier(request: Request, userId?: string): string {
	// Prefer user ID if available
	if (userId) {
		return `user:${userId}`;
	}

	// Try to get real IP from headers (for proxied requests)
	const forwardedFor = request.headers.get('x-forwarded-for');
	if (forwardedFor) {
		return `ip:${forwardedFor.split(',')[0].trim()}`;
	}

	const realIp = request.headers.get('x-real-ip');
	if (realIp) {
		return `ip:${realIp}`;
	}

	// Fallback to connection remote address
	return `ip:unknown`;
}

/**
 * Checks if a request should be rate limited
 */
export function checkRateLimit(
	request: Request,
	config: RateLimitConfig,
	endpoint: string,
	userId?: string
): { limited: boolean; remaining: number; resetTime: number } {
	const clientId = getClientIdentifier(request, userId);
	const key = `${endpoint}:${clientId}`;
	const now = Date.now();

	let entry = rateLimitStore.get(key);

	// Create new entry if doesn't exist or expired
	if (!entry || now > entry.resetTime) {
		entry = {
			count: 1,
			resetTime: now + config.windowMs
		};
		rateLimitStore.set(key, entry);

		return {
			limited: false,
			remaining: config.maxRequests - 1,
			resetTime: entry.resetTime
		};
	}

	// Increment count
	entry.count++;

	// Check if limit exceeded
	if (entry.count > config.maxRequests) {
		return {
			limited: true,
			remaining: 0,
			resetTime: entry.resetTime
		};
	}

	return {
		limited: false,
		remaining: config.maxRequests - entry.count,
		resetTime: entry.resetTime
	};
}

/**
 * Creates a rate limit error response
 */
export function createRateLimitResponse(resetTime: number): Response {
	const resetDate = new Date(resetTime);
	return new Response(
		JSON.stringify({
			error: 'Too many requests',
			message: 'Rate limit exceeded. Please try again later.',
			retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
		}),
		{
			status: 429,
			headers: {
				'Content-Type': 'application/json',
				'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
				'X-RateLimit-Reset': resetDate.toISOString()
			}
		}
	);
}

/**
 * Middleware helper to apply rate limiting to an endpoint
 */
export function withRateLimit(
	handler: (request: Request, ...args: any[]) => Promise<Response>,
	config: RateLimitConfig,
	endpoint: string
) {
	return async (request: Request, ...args: any[]): Promise<Response> => {
		const result = checkRateLimit(request, config, endpoint);

		if (result.limited) {
			return createRateLimitResponse(result.resetTime);
		}

		// Add rate limit headers to response
		const response = await handler(request, ...args);

		// Clone response to add headers
		const newResponse = new Response(response.body, response);
		newResponse.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
		newResponse.headers.set('X-RateLimit-Remaining', result.remaining.toString());
		newResponse.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

		return newResponse;
	};
}
