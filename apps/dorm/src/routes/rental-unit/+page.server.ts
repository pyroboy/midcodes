import { fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { RequestEvent } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { rental_unitSchema } from './formSchema';
import { cache, cacheKeys, CACHE_TTL } from '$lib/services/cache';
import { db } from '$lib/server/db';
import { rentalUnit, properties, floors } from '$lib/server/schema';
import { eq, and, asc } from 'drizzle-orm';

// Separate async function for loading rental units data with caching
async function loadRentalUnitsData(locals: any) {
	const { permissions } = locals;
	const hasAccess = permissions.includes('properties.create');

	if (!hasAccess) {
		return { rentalUnits: [], properties: [], floors: [] };
	}

	const cacheKey = cacheKeys.rentalUnits();
	const cached = cache.get<any>(cacheKey);
	if (cached) {
		console.log('CACHE HIT: Returning cached rental units data');
		return cached;
	}

	console.log('CACHE MISS: Fetching rental units from database');

	try {
		const [rentalUnitsData, propertiesData, floorsData] = await Promise.all([
			db
				.select({
					id: rentalUnit.id,
					name: rentalUnit.name,
					number: rentalUnit.number,
					type: rentalUnit.type,
					baseRate: rentalUnit.baseRate,
					capacity: rentalUnit.capacity,
					rentalUnitStatus: rentalUnit.rentalUnitStatus,
					propertyId: rentalUnit.propertyId,
					floorId: rentalUnit.floorId,
					createdAt: rentalUnit.createdAt,
					updatedAt: rentalUnit.updatedAt,
					propertyName: properties.name,
					propertyDbId: properties.id,
					floorDbId: floors.id,
					floorPropertyId: floors.propertyId,
					floorNumber: floors.floorNumber,
					floorWing: floors.wing
				})
				.from(rentalUnit)
				.leftJoin(properties, eq(rentalUnit.propertyId, properties.id))
				.leftJoin(floors, eq(rentalUnit.floorId, floors.id))
				.orderBy(asc(rentalUnit.propertyId), asc(rentalUnit.floorId), asc(rentalUnit.number)),

			db
				.select({ id: properties.id, name: properties.name })
				.from(properties)
				.where(eq(properties.status, 'ACTIVE'))
				.orderBy(asc(properties.name)),

			db
				.select({
					id: floors.id,
					propertyId: floors.propertyId,
					floorNumber: floors.floorNumber,
					wing: floors.wing,
					status: floors.status
				})
				.from(floors)
				.where(eq(floors.status, 'ACTIVE'))
				.orderBy(asc(floors.propertyId), asc(floors.floorNumber))
		]);

		// Map rental units to match original structure
		const mappedUnits = rentalUnitsData.map((unit) => ({
			...unit,
			property: unit.propertyDbId ? { id: unit.propertyDbId, name: unit.propertyName } : null,
			floor: unit.floorDbId
				? {
						id: unit.floorDbId,
						property_id: unit.floorPropertyId,
						floor_number: unit.floorNumber,
						wing: unit.floorWing
					}
				: null
		}));

		const result = {
			rentalUnits: mappedUnits,
			properties: propertiesData || [],
			floors: floorsData || []
		};

		cache.set(cacheKey, result, CACHE_TTL.MEDIUM);
		console.log('Cached rental units data');

		return result;
	} catch (err) {
		console.error('Error in database queries:', err);
		return {
			rentalUnits: [],
			properties: [],
			floors: []
		};
	}
}

export const load: PageServerLoad = async ({ locals, depends }) => {
	depends('app:rental-units');

	const { permissions } = locals;
	const hasAccess = permissions.includes('properties.create');

	if (!hasAccess) {
		throw error(401, 'Unauthorized');
	}

	const form = await superValidate(zod(rental_unitSchema));

	return {
		form,
		rental_unit: [],
		rentalUnits: [],
		properties: [],
		floors: [],
		lazy: true,
		rentalUnitsPromise: loadRentalUnitsData(locals)
	};
};

export const actions: Actions = {
	create: async ({ request }: RequestEvent) => {
		const form = await superValidate(request, zod(rental_unitSchema));

		if (!form.valid) {
			console.error('Form validation failed:', form.errors);
			return fail(400, { form });
		}

		// Check for duplicate rental unit number
		const existingUnit = await db
			.select({ id: rentalUnit.id })
			.from(rentalUnit)
			.where(
				and(
					eq(rentalUnit.propertyId, form.data.property_id),
					eq(rentalUnit.floorId, form.data.floor_id || null),
					eq(rentalUnit.number, form.data.number)
				)
			)
			.limit(1);

		if (existingUnit.length > 0) {
			form.errors.number = ['This unit number already exists on this floor'];
			return fail(400, { form });
		}

		try {
			await db.insert(rentalUnit).values({
				...form.data,
				floorId: form.data.floor_id || null
			});
		} catch (err: any) {
			console.error('Error creating rental unit:', err);
			return fail(500, { form });
		}

		cache.delete(cacheKeys.rentalUnits());
		console.log('Invalidated rental units cache');

		return { form };
	},

	update: async ({ request }: RequestEvent) => {
		const formData = await request.formData();
		const rawForm = await superValidate(formData, zod(rental_unitSchema));

		// Remove embedded objects before validation
		const { property, floor, ...updateData } = rawForm.data;

		const form = await superValidate(updateData, zod(rental_unitSchema));

		if (!form.valid) {
			console.error('Form validation failed:', form.errors);
			return fail(400, { form });
		}

		try {
			await db
				.update(rentalUnit)
				.set({
					...updateData,
					updatedAt: new Date()
				})
				.where(eq(rentalUnit.id, form.data.id));
		} catch (err: any) {
			console.error('Error updating rental unit:', err);
			if (err.message?.includes('Policy check failed')) {
				form.errors._errors = ['You do not have permission to update rental units'];
				return fail(403, { form });
			}
			return fail(500, { form, message: 'Failed to update rental unit' });
		}

		cache.delete(cacheKeys.rentalUnits());
		console.log('Invalidated rental units cache');

		return { form };
	},

	delete: async ({ request }: RequestEvent) => {
		const formData = await request.formData();
		const id = formData.get('id');

		if (!id || typeof id !== 'string') {
			return fail(400, { message: 'Invalid rental unit ID' });
		}

		const rentalUnitId = parseInt(id, 10);
		if (isNaN(rentalUnitId)) {
			return fail(400, { message: 'Invalid rental unit ID format' });
		}

		try {
			await db.delete(rentalUnit).where(eq(rentalUnit.id, rentalUnitId));
		} catch (err: any) {
			console.error('Error deleting rental unit:', err);
			if (err.message?.includes('Policy check failed')) {
				return fail(403, { message: 'You do not have permission to delete rental units' });
			}
			if (err.code === '23503') {
				return fail(400, {
					message: 'Cannot delete rental unit because it is referenced by other records'
				});
			}
			return fail(500, { message: 'Failed to delete rental unit' });
		}

		cache.delete(cacheKeys.rentalUnits());
		console.log('Invalidated rental units cache');

		return { success: true };
	}
};
