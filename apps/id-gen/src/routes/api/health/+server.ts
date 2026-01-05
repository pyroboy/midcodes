import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dbQuery } from '$lib/server/db';
import { dbCircuitBreaker } from '$lib/server/db-retry';
import { dev } from '$app/environment';
import { user } from '$lib/server/schema';

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
				const { db } = await import('$lib/server/db');
				// Use a simple select from any table to test connection
				await db.select().from(user).limit(1);
				return true;
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
