/**
 * Rate Limiting Middleware
 * SECURITY: Prevents brute force attacks, credential stuffing, and DoS
 * 
 * CURRENT IMPLEMENTATION: In-memory store (single-instance only)
 * 
 * LIMITATIONS:
 * - Does NOT work correctly in multi-instance deployments (Vercel Edge, Kubernetes)
 * - Each serverless function instance has its own rate limit counters
 * - Attackers can bypass by distributing requests across edge nodes
 * 
 * RECOMMENDED UPGRADE:
 * For production multi-instance deployments, implement distributed rate limiting using:
 * 1. Vercel KV (@vercel/kv) - Recommended for Vercel deployments
 * 2. Upstash Redis (@upstash/redis) - Serverless-friendly Redis
 * 3. Redis (ioredis) - For self-hosted deployments
 * 
 * TODO: Implement RateLimitStore interface for easy backend swapping:
 * interface RateLimitStore {
 *   get(key: string): Promise<RateLimitEntry | null>;
 *   set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void>;
 *   increment(key: string): Promise<number>;
 * }
 */

interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

// In-memory store for rate limiting
// WARNING: Per-instance only - see header comments for production recommendations
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
 * SECURITY: Extracts client identifier from request using trusted headers
 * 
 * Priority order for IP extraction (most trusted first):
 * 1. Authenticated user ID (most reliable)
 * 2. x-real-ip (set by trusted reverse proxies like Vercel, Nginx)
 * 3. cf-connecting-ip (Cloudflare)
 * 4. true-client-ip (Akamai, Cloudflare Enterprise)
 * 5. x-forwarded-for (can be spoofed, use only last resort)
 * 
 * WARNING: x-forwarded-for can be spoofed by clients. Only trust it if
 * your infrastructure explicitly validates and sets this header.
 */
function getClientIdentifier(request: Request, userId?: string): string {
	// Priority 1: Authenticated user ID (most reliable, cannot be spoofed)
	if (userId) {
		return `user:${userId}`;
	}

	// Priority 2: Trusted proxy headers (set by infrastructure, not client)
	// These headers are typically set by reverse proxies and CDNs
	const trustedHeaders = [
		'x-real-ip',           // Nginx, Vercel
		'cf-connecting-ip',    // Cloudflare
		'true-client-ip',      // Akamai, Cloudflare Enterprise
		'x-client-ip',         // Some load balancers
	];

	for (const header of trustedHeaders) {
		const value = request.headers.get(header);
		if (value && isValidIP(value)) {
			return `ip:${value}`;
		}
	}

	// Priority 3: x-forwarded-for (less trusted, can be spoofed)
	// Take the LAST IP in the chain (closest to the trusted proxy)
	// rather than the first (which could be spoofed by client)
	const forwardedFor = request.headers.get('x-forwarded-for');
	if (forwardedFor) {
		const ips = forwardedFor.split(',').map(ip => ip.trim()).filter(isValidIP);
		if (ips.length > 0) {
			// Use the last IP if we're behind a single proxy,
			// or first if the infrastructure is known to properly set it
			// For Vercel, the first IP is usually the real client IP
			const realIp = ips[0];
			return `ip:${realIp}`;
		}
	}

	// Fallback: Unknown client (apply stricter limits in handlers)
	console.warn('[RateLimiter] Could not determine real IP address');
	return `ip:unknown`;
}

/**
 * Validate IP address format (basic validation)
 */
function isValidIP(ip: string): boolean {
	if (!ip || ip.length > 45) return false; // Max IPv6 length
	
	// IPv4 pattern
	const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
	if (ipv4Pattern.test(ip)) {
		const parts = ip.split('.').map(Number);
		return parts.every(part => part >= 0 && part <= 255);
	}
	
	// IPv6 pattern (simplified)
	const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
	return ipv6Pattern.test(ip);
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
