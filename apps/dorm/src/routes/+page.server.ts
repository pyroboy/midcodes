import type { PageServerLoad } from './$types';
import { cache, cacheKeys, CACHE_TTL } from '$lib/services/cache';

export const config = { runtime: 'nodejs20.x' };

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		return { user: null };
	}

	// Return promises for progressive cache preloading
	return {
		user,
		// Preload promises for key data
		preloadPromises: {
			properties: preloadProperties(locals),
			tenants: preloadTenants(locals),
			leases: preloadLeases(locals),
			transactions: preloadTransactions(locals),
			rentalUnits: preloadRentalUnits(locals)
		}
	};
};

// Preload functions that cache data
async function preloadProperties(locals: any) {
	try {
		const cached = cache.get(cacheKeys.activeProperties());
		if (cached) return cached;

		const { data, error } = await locals.supabase
			.from('properties')
			.select('*')
			.eq('is_active', true)
			.order('name');

		if (error) throw error;

		cache.set(cacheKeys.activeProperties(), data, CACHE_TTL.LONG);
		return data;
	} catch (error) {
		console.error('Error preloading properties:', error);
		return [];
	}
}

async function preloadTenants(locals: any) {
	try {
		const cached = cache.get(cacheKeys.tenants());
		if (cached) return cached;

		const { data, error } = await locals.supabase
			.from('tenants')
			.select('*')
			.order('name');

		if (error) throw error;

		cache.set(cacheKeys.tenants(), data, CACHE_TTL.MEDIUM);
		return data;
	} catch (error) {
		console.error('Error preloading tenants:', error);
		return [];
	}
}

async function preloadLeases(locals: any) {
	try {
		const cached = cache.get(cacheKeys.leasesCore());
		if (cached) return cached;

		const { data, error } = await locals.supabase
			.from('leases')
			.select(`
				id,
				property_id,
				rental_unit_id,
				status,
				start_date,
				end_date,
				monthly_rent,
				security_deposit,
				lease_tenants!inner(tenant_id)
			`)
			.order('start_date', { ascending: false });

		if (error) throw error;

		cache.set(cacheKeys.leasesCore(), data, CACHE_TTL.SHORT);
		return data;
	} catch (error) {
		console.error('Error preloading leases:', error);
		return [];
	}
}

async function preloadTransactions(locals: any) {
	try {
		const cached = cache.get(cacheKeys.transactions());
		if (cached) return cached;

		const { data, error } = await locals.supabase
			.from('payments')
			.select('*')
			.order('paid_at', { ascending: false })
			.limit(100);

		if (error) throw error;

		cache.set(cacheKeys.transactions(), data, CACHE_TTL.SHORT);
		return data;
	} catch (error) {
		console.error('Error preloading transactions:', error);
		return [];
	}
}

async function preloadRentalUnits(locals: any) {
	try {
		const cached = cache.get(cacheKeys.rentalUnits());
		if (cached) return cached;

		const { data, error } = await locals.supabase
			.from('rental_unit')
			.select('*')
			.order('name');

		if (error) throw error;

		cache.set(cacheKeys.rentalUnits(), data, CACHE_TTL.MEDIUM);
		return data;
	} catch (error) {
		console.error('Error preloading rental units:', error);
		return [];
	}
}