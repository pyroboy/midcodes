import type { PageServerLoad } from './$types';
import { cache, cacheKeys, CACHE_TTL } from '$lib/services/cache';
import { db } from '$lib/server/db';
import { properties, tenants, leases, leaseTenants, payments, rentalUnit } from '$lib/server/schema';
import { eq, desc, asc, isNull, count, sql } from 'drizzle-orm';

export const config = { runtime: 'nodejs20.x' };

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		return { user: null };
	}

	// Return promises for progressive cache preloading
	return {
		user,
		// Dashboard metric counts
		dashboardCounts: loadDashboardCounts(),
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

async function loadDashboardCounts() {
	const cacheKey = 'dashboard:counts';
	const cached = cache.get<{
		properties: number;
		tenants: number;
		activeLeases: number;
		payments: number;
	}>(cacheKey);
	if (cached) return cached;

	try {
		const [propertiesCount, tenantsCount, activeLeasesCount, paymentsCount] = await Promise.all([
			db.select({ value: count() }).from(properties),
			db
				.select({ value: count() })
				.from(tenants)
				.where(isNull(tenants.deletedAt)),
			db
				.select({ value: count() })
				.from(leases)
				.where(sql`${leases.status} = 'ACTIVE' AND ${leases.deletedAt} IS NULL`),
			db.select({ value: count() }).from(payments)
		]);

		const counts = {
			properties: propertiesCount[0]?.value ?? 0,
			tenants: tenantsCount[0]?.value ?? 0,
			activeLeases: activeLeasesCount[0]?.value ?? 0,
			payments: paymentsCount[0]?.value ?? 0
		};

		cache.set(cacheKey, counts, CACHE_TTL.SHORT);
		return counts;
	} catch (error) {
		console.error('Error loading dashboard counts:', error);
		return { properties: 0, tenants: 0, activeLeases: 0, payments: 0 };
	}
}

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
