import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { batchReadingsSchema, meterReadingSchema } from './meterReadingSchema';
import type { z } from 'zod';
import { getUserPermissions } from '$lib/services/permissions';
import { cache, cacheKeys, CACHE_TTL } from '$lib/services/cache';
import { db } from '$lib/server/db';
import {
	properties, meters, readings, billings, leases, leaseTenants, tenants, rentalUnit, profiles
} from '$lib/server/schema';
import {
	eq, and, asc, desc, inArray, gte, isNotNull, sql, ne
} from 'drizzle-orm';

// Use Node runtime
export const config = { runtime: 'nodejs20.x' };

export const load: PageServerLoad = async ({ locals, depends }) => {
	const { user } = locals;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	depends('app:utility-billings');

	const form = await superValidate(zod(batchReadingsSchema));

	return {
		form,
		properties: [],
		meters: [],
		readings: [],
		allReadings: [],
		availableReadingDates: [],
		rental_unitTenantCounts: {},
		leases: [],
		meterLastBilledDates: {},
		leaseMeterBilledDates: {},
		actualBilledDates: {},
		previousReadingGroups: [],
		lazy: true,
		propertiesPromise: loadPropertiesData(),
		metersPromise: loadMetersData(),
		readingsPromise: loadReadingsData(),
		billingsPromise: loadBillingsData(),
		availableReadingDatesPromise: loadAvailableReadingDatesData(),
		tenantCountsPromise: loadTenantCountsData(),
		leasesPromise: loadLeasesData(),
		allReadingsPromise: loadAllReadingsData()
	};
};

async function loadPropertiesData() {
	const result = await db
		.select({ id: properties.id, name: properties.name })
		.from(properties)
		.where(eq(properties.status, 'ACTIVE'))
		.orderBy(asc(properties.name));
	return result || [];
}

async function loadMetersData() {
	const cacheKey = cacheKeys.meters();
	const cached = cache.get<any[]>(cacheKey);
	if (cached) {
		console.log('CACHE HIT: Returning cached meters data');
		return cached;
	}

	console.log('CACHE MISS: Loading meters data...');
	const result = await db
		.select({
			id: meters.id,
			name: meters.name,
			type: meters.type,
			propertyId: meters.propertyId,
			initialReading: meters.initialReading,
			rentalUnitId: rentalUnit.id,
			rentalUnitName: rentalUnit.name,
			rentalUnitNumber: rentalUnit.number
		})
		.from(meters)
		.leftJoin(rentalUnit, eq(meters.rentalUnitId, rentalUnit.id));

	const data = result.map((m) => ({
		...m,
		rental_unit: m.rentalUnitId
			? { id: m.rentalUnitId, name: m.rentalUnitName, number: m.rentalUnitNumber }
			: null
	}));

	cache.set(cacheKey, data, CACHE_TTL.MEDIUM);
	return data;
}

async function loadReadingsData() {
	const cacheKey = cacheKeys.readings();
	const cached = cache.get<any[]>(cacheKey);
	if (cached) {
		console.log('CACHE HIT: Returning cached readings data');
		return cached;
	}

	console.log('CACHE MISS: Loading readings data...');
	const result = await db
		.select({
			id: readings.id,
			meterId: readings.meterId,
			reading: readings.reading,
			readingDate: readings.readingDate,
			rateAtReading: readings.rateAtReading,
			reviewStatus: readings.reviewStatus
		})
		.from(readings)
		.orderBy(asc(readings.readingDate));

	const data = result.map((r) => ({
		id: r.id,
		meter_id: r.meterId,
		reading: r.reading,
		reading_date: r.readingDate,
		rate_at_reading: r.rateAtReading,
		review_status: r.reviewStatus
	}));

	cache.set(cacheKey, data, CACHE_TTL.SHORT);
	return data;
}

async function loadBillingsData() {
	const result = await db
		.select({
			meterId: billings.meterId,
			leaseId: billings.leaseId,
			billingDate: billings.billingDate,
			amount: billings.amount
		})
		.from(billings)
		.where(and(eq(billings.type, 'UTILITY'), isNotNull(billings.meterId)));

	return result.map((b) => ({
		meter_id: b.meterId,
		lease_id: b.leaseId,
		billing_date: b.billingDate,
		amount: b.amount
	}));
}

async function loadAvailableReadingDatesData() {
	const result = await db
		.select({ readingDate: readings.readingDate })
		.from(readings)
		.orderBy(asc(readings.readingDate));

	return result.map((r) => ({ reading_date: r.readingDate }));
}

async function loadTenantCountsData() {
	const result = await db
		.select({
			rentalUnitId: leases.rentalUnitId,
			tenantId: leaseTenants.id
		})
		.from(leases)
		.innerJoin(leaseTenants, eq(leases.id, leaseTenants.leaseId))
		.where(eq(leases.status, 'ACTIVE'));

	return result.map((r) => ({
		rental_unit_id: r.rentalUnitId,
		tenants: [{ id: r.tenantId }]
	}));
}

async function loadLeasesData() {
	const leasesResult = await db
		.select({
			id: leases.id,
			name: leases.name,
			rentalUnitId: leases.rentalUnitId,
			status: leases.status
		})
		.from(leases);

	// Fetch rental unit data for leases
	const rentalUnitIds = [...new Set(leasesResult.map((l) => l.rentalUnitId).filter(Boolean))];
	const unitsData = rentalUnitIds.length > 0
		? await db
				.select({
					id: rentalUnit.id,
					name: rentalUnit.name,
					number: rentalUnit.number,
					type: rentalUnit.type,
					floorId: rentalUnit.floorId,
					propertyId: rentalUnit.propertyId
				})
				.from(rentalUnit)
				.where(inArray(rentalUnit.id, rentalUnitIds))
		: [];

	const unitsMap = new Map(unitsData.map((u) => [u.id, u]));

	// Fetch lease tenants
	const leaseIds = leasesResult.map((l) => l.id);
	const ltData = leaseIds.length > 0
		? await db
				.select({
					leaseId: leaseTenants.leaseId,
					tenantId: tenants.id,
					tenantName: tenants.name,
					tenantStatus: tenants.tenantStatus
				})
				.from(leaseTenants)
				.innerJoin(tenants, eq(leaseTenants.tenantId, tenants.id))
				.where(inArray(leaseTenants.leaseId, leaseIds))
		: [];

	const ltMap = new Map<number, any[]>();
	for (const lt of ltData) {
		if (!ltMap.has(lt.leaseId)) ltMap.set(lt.leaseId, []);
		ltMap.get(lt.leaseId)!.push({
			tenants: { id: lt.tenantId, full_name: lt.tenantName, tenant_status: lt.tenantStatus }
		});
	}

	return leasesResult.map((l) => {
		const unit = unitsMap.get(l.rentalUnitId);
		return {
			...l,
			rental_unit: unit
				? {
						id: unit.id,
						name: unit.name,
						number: unit.number,
						type: unit.type,
						floor_id: unit.floorId,
						property_id: unit.propertyId
					}
				: null,
			lease_tenants: ltMap.get(l.id) || []
		};
	});
}

async function loadAllReadingsData() {
	const twoYearsAgo = new Date();
	twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

	const result = await db
		.select({
			id: readings.id,
			meterId: readings.meterId,
			reading: readings.reading,
			readingDate: readings.readingDate,
			rateAtReading: readings.rateAtReading,
			reviewStatus: readings.reviewStatus,
			meterDbId: meters.id,
			meterName: meters.name,
			meterType: meters.type,
			meterPropertyId: meters.propertyId
		})
		.from(readings)
		.innerJoin(meters, eq(readings.meterId, meters.id))
		.where(gte(readings.readingDate, twoYearsAgo.toISOString().split('T')[0]))
		.orderBy(desc(readings.readingDate));

	return result.map((r) => ({
		id: r.id,
		meter_id: r.meterId,
		reading: r.reading,
		reading_date: r.readingDate,
		rate_at_reading: r.rateAtReading,
		review_status: r.reviewStatus,
		meters: { id: r.meterDbId, name: r.meterName, type: r.meterType, property_id: r.meterPropertyId }
	}));
}

export const actions: Actions = {
	approvePendingReadings: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const idsJson = formData.get('reading_ids') as string;
		if (!idsJson) return fail(400, { error: 'Missing reading_ids' });
		let ids: number[] = [];
		try {
			ids = JSON.parse(idsJson);
			if (!Array.isArray(ids)) throw new Error('reading_ids must be an array');
		} catch (e: any) {
			return fail(400, { error: 'Invalid reading_ids payload' });
		}

		try {
			await db
				.update(readings)
				.set({ reviewStatus: 'APPROVED' })
				.where(inArray(readings.id, ids));
		} catch (err: any) {
			return fail(500, { error: `Failed to approve readings: ${err.message}` });
		}
		return { success: true };
	},

	rejectPendingReadings: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const idsJson = formData.get('reading_ids') as string;
		if (!idsJson) return fail(400, { error: 'Missing reading_ids' });
		let ids: number[] = [];
		try {
			ids = JSON.parse(idsJson);
			if (!Array.isArray(ids)) throw new Error('reading_ids must be an array');
		} catch (e: any) {
			return fail(400, { error: 'Invalid reading_ids payload' });
		}

		try {
			await db
				.update(readings)
				.set({ reviewStatus: 'REJECTED' })
				.where(inArray(readings.id, ids));
		} catch (err: any) {
			return fail(500, { error: `Failed to reject readings: ${err.message}` });
		}
		return { success: true };
	},

	createUtilityBillings: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const billingDataString = formData.get('billingData') as string;

		if (!billingDataString) {
			return fail(400, { error: 'Missing billingData' });
		}

		try {
			const billingsToCreate: Array<{
				lease_id: number;
				utility_type: string;
				billing_date: string;
				amount: number;
				notes: string;
				meter_id: number;
			}> = JSON.parse(billingDataString);

			const insertData = billingsToCreate.map((item) => {
				const dueDate = new Date(item.billing_date);
				dueDate.setDate(dueDate.getDate() + 15);
				return {
					leaseId: item.lease_id,
					type: 'UTILITY',
					utilityType: item.utility_type,
					amount: item.amount,
					balance: item.amount,
					status: 'PENDING',
					dueDate: dueDate.toISOString().split('T')[0],
					billingDate: item.billing_date,
					notes: item.notes,
					meterId: item.meter_id
				};
			});

			await db.insert(billings).values(insertData);

			return { created: insertData.length, duplicates: [] };
		} catch (e: any) {
			if (e?.code === '23505') {
				return fail(409, { error: 'A billing for this period and lease already exists.' });
			}
			return fail(400, { error: 'Invalid JSON format for billingData' });
		}
	},

	addBatchReadings: async ({ request, locals }) => {
		console.log('=== Starting addBatchReadings ===');

		const formData = await request.formData();
		const rawReadingsJson = formData.get('readings_json') as string;
		const rawReadingDate = formData.get('reading_date') as string;
		const rawRateAtReading = formData.get('rate_at_reading') as string;
		const rawType = formData.get('type') as string;
		const rawBackdatingEnabled = formData.get('backdating_enabled') as string;

		const reconstructedFormData = new FormData();
		reconstructedFormData.append('readings_json', rawReadingsJson || '');
		reconstructedFormData.append('reading_date', rawReadingDate || '');
		reconstructedFormData.append('rate_at_reading', rawRateAtReading || '');
		reconstructedFormData.append('type', rawType || '');
		if (rawBackdatingEnabled !== null) {
			reconstructedFormData.append('backdating_enabled', rawBackdatingEnabled);
		}

		const form = await superValidate(reconstructedFormData, zod(batchReadingsSchema));

		if (!form.valid) {
			console.error('Validation failed', { errors: form.errors });
			return fail(400, { form });
		}

		try {
			const { user } = locals;
			if (!user) throw error(401, 'Unauthorized');

			// Check user permissions
			const profileResult = await db
				.select({ role: profiles.role })
				.from(profiles)
				.where(eq(profiles.id, user.id))
				.limit(1);
			const profile = profileResult[0];

			const isSuperAdmin = profile?.role === 'super_admin';
			const isPropertyAdmin = profile?.role === 'property_admin';
			const isPropertyUser = profile?.role === 'property_user';

			if (!isSuperAdmin && !isPropertyAdmin && !isPropertyUser) {
				return fail(403, {
					form,
					error: 'Insufficient permissions to add meter readings.'
				});
			}

			const readingsInput: z.infer<typeof meterReadingSchema>[] = JSON.parse(
				form.data.readings_json
			);
			const { rate_at_reading, backdating_enabled } = form.data;

			const meterIds = readingsInput.map((r) => r.meter_id);

			const meterData = await db
				.select({ id: meters.id, name: meters.name, rentalUnitId: meters.rentalUnitId, type: meters.type })
				.from(meters)
				.where(inArray(meters.id, meterIds));

			const meterNameMap = Object.fromEntries(meterData.map((m) => [m.id, m.name]));

			const previousReadings = await db
				.select({ meterId: readings.meterId, reading: readings.reading, readingDate: readings.readingDate })
				.from(readings)
				.where(inArray(readings.meterId, meterIds))
				.orderBy(desc(readings.readingDate));

			const previousReadingMap: Record<number, number> = {};
			for (const r of previousReadings) {
				if (previousReadingMap[r.meterId] === undefined) previousReadingMap[r.meterId] = r.reading;
			}

			const readingsToInsert = readingsInput
				.filter((r) => r.reading !== null)
				.map((r) => {
					const current = Number(r.reading);
					const previous = previousReadingMap[r.meter_id] ?? null;

					if (previous !== null && current < previous) {
						throw new Error(
							`Invalid reading for meter ${meterNameMap[r.meter_id] || `ID ${r.meter_id}`}: ${current} is less than previous reading ${previous}`
						);
					}

					const consumption = previous !== null ? current - previous : null;

					if (consumption !== null && consumption > 50000) {
						throw new Error(
							`Unusually high consumption detected for meter ${meterNameMap[r.meter_id] || `ID ${r.meter_id}`}: ${consumption} units.`
						);
					}

					if (consumption !== null && consumption < 0) {
						throw new Error(
							`Negative consumption detected for meter ${meterNameMap[r.meter_id] || `ID ${r.meter_id}`}.`
						);
					}

					return {
						meterId: r.meter_id,
						reading: current,
						readingDate: r.reading_date,
						meterName: meterNameMap[r.meter_id] || null,
						rateAtReading: rate_at_reading,
						backdatingEnabled: backdating_enabled || false
					};
				});

			if (readingsToInsert.length === 0)
				return fail(400, { form, error: 'No valid readings to insert' });

			const newReadings = await db.insert(readings).values(readingsToInsert).returning();

			cache.deletePattern(/^readings:/);
			cache.deletePattern(/^meters:/);
			console.log('Invalidated readings and meters cache');

			return {
				form,
				success: true,
				message: `Successfully added ${newReadings?.length ?? 0} meter readings`,
				readings: newReadings ?? []
			};
		} catch (err: any) {
			console.error('Error in addBatchReadings:', err);

			let userMessage = 'An unexpected error occurred while saving readings';
			if (err.message.includes('Invalid reading for meter')) {
				userMessage = err.message;
			} else if (err.message.includes('Unusually high consumption')) {
				userMessage = err.message;
			} else if (err.message.includes('Insufficient permissions')) {
				userMessage = 'You do not have permission to add meter readings';
			} else if (err.code === '23505') {
				userMessage = 'A reading for this date already exists for one or more meters';
			}

			return fail(500, {
				form,
				error: userMessage,
				details: process.env.NODE_ENV === 'development' ? err.message : undefined
			});
		}
	}
};
