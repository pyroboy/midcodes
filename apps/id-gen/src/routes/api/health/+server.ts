import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dbQuery } from '$lib/server/db';
import { dbCircuitBreaker } from '$lib/server/db-retry';
import { dev } from '$app/environment';

export const GET: RequestHandler = async () => {
	const healthCheck = {
		status: 'healthy',
		timestamp: new Date().toISOString(),
		checks: {
			database: 'unknown',
			circuitBreaker: 'unknown'
		}
	};

	// Check database connectivity
	try {
		await dbQuery(
			async () => {
				// Simple query to test connection
				const result = await dbQuery(() => 
					// Import db here to avoid circular dependency
					import('$lib/server/db').then(m => m.db.select({ count: 1 }).limit(0))
				);
				return result;
			},
			3000 // 3 second timeout
		);
		healthCheck.checks.database = 'healthy';
	} catch (error) {
		healthCheck.checks.database = 'unhealthy';
		healthCheck.status = 'degraded';
		console.error('[Health Check] Database check failed:', error);
	}

	// Check circuit breaker state
	const circuitState = dbCircuitBreaker.getState();
	healthCheck.checks.circuitBreaker = circuitState.isOpen ? 'open' : 'closed';

	if (circuitState.isOpen) {
		healthCheck.status = 'degraded';
	}

	// Return appropriate HTTP status code
	const statusCode = healthCheck.status === 'healthy' ? 200 : 503;

	return json(healthCheck, { status: statusCode });
};
