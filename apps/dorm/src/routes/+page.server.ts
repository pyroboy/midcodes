import type { PageServerLoad } from './$types';
import { cache, cacheKeys, CACHE_TTL } from '$lib/services/cache';
import { db } from '$lib/server/db';
import { properties, tenants, leases, leaseTenants, payments, rentalUnit } from '$lib/server/schema';
import { eq, desc, asc, isNull } from 'drizzle-orm';

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
			properties: preloadProperties(),
			tenants: preloadTenants(),
			leases: preloadLeases(),
			transactions: preloadTransactions(),
			rentalUnits: preloadRentalUnits()
		}
	};
};

// Preload functions that cache data
async function preloadProperties() {
	try {
		const cached = cache.get(cacheKeys.activeProperties());
		if (cached) return cached;

		const data = await db
			.select()
			.from(properties)
			.where(eq(properties.status, 'ACTIVE'))
			.orderBy(asc(properties.name));

		cache.set(cacheKeys.activeProperties(), data, CACHE_TTL.LONG);
		return data;
	} catch (error) {
		console.error('Error preloading properties:', error);
		return [];
	}
}

async function preloadTenants() {
	try {
		const cached = cache.get(cacheKeys.tenants());
		if (cached) return cached;

		const data = await db
			.select()
			.from(tenants)
			.orderBy(asc(tenants.name));

		cache.set(cacheKeys.tenants(), data, CACHE_TTL.MEDIUM);
		return data;
	} catch (error) {
		console.error('Error preloading tenants:', error);
		return [];
	}
}

async function preloadLeases() {
	try {
		const cached = cache.get(cacheKeys.leasesCore());
		if (cached) return cached;

		const data = await db
			.select({
				id: leases.id,
				rentalUnitId: leases.rentalUnitId,
				status: leases.status,
				startDate: leases.startDate,
				endDate: leases.endDate,
				rentAmount: leases.rentAmount,
				securityDeposit: leases.securityDeposit
			})
			.from(leases)
			.orderBy(desc(leases.startDate));

		cache.set(cacheKeys.leasesCore(), data, CACHE_TTL.SHORT);
		return data;
	} catch (error) {
		console.error('Error preloading leases:', error);
		return [];
	}
}

async function preloadTransactions() {
	try {
		const cached = cache.get(cacheKeys.transactions());
		if (cached) return cached;

		const data = await db
			.select()
			.from(payments)
			.orderBy(desc(payments.paidAt))
			.limit(100);

		cache.set(cacheKeys.transactions(), data, CACHE_TTL.SHORT);
		return data;
	} catch (error) {
		console.error('Error preloading transactions:', error);
		return [];
	}
}

async function preloadRentalUnits() {
	try {
		const cached = cache.get(cacheKeys.rentalUnits());
		if (cached) return cached;

		const data = await db
			.select()
			.from(rentalUnit)
			.orderBy(asc(rentalUnit.name));

		cache.set(cacheKeys.rentalUnits(), data, CACHE_TTL.MEDIUM);
		return data;
	} catch (error) {
		console.error('Error preloading rental units:', error);
		return [];
	}
}
