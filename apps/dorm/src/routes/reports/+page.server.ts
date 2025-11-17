import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Database } from '$lib/database.types';

// Configure ISR for report caching
export const config = {
	isr: {
		expiration: 300, // Cache for 5 minutes (300 seconds)
		allowQuery: ['year', 'month', 'propertyId']
	}
};

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession }, url }) => {
	const session = await safeGetSession();
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	// Get query parameters or use defaults
	const year = url.searchParams.get('year') || new Date().getFullYear().toString();
	const month =
		url.searchParams.get('month') ||
		new Date().toLocaleString('en-US', { month: 'long' }).toLowerCase();
	
	// Property will be handled by global state, but still accept URL override for deep linking
	const propertyIdOverride = url.searchParams.get('propertyId') || null;

	console.log('URL Parameters:', { year, month, propertyIdOverride });

	try {
		// Return basic data - property selection will be handled by global state
		return {
			year,
			month,
			propertyIdOverride
		};
	} catch (err) {
		console.error('Error in reports load function:', err);
		throw error(
			500,
			`Failed to load report data: ${err instanceof Error ? err.message : 'Unknown error'}`
		);
	}
};
