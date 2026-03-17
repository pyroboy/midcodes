import { fail, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { floorSchema } from './formSchema';
import type { Actions, PageServerLoad, RequestEvent } from './$types';
import type { FloorWithProperty, Property } from './formSchema';
import { db } from '$lib/server/db';
import { floors, properties, rentalUnit, leases, leaseTenants } from '$lib/server/schema';
import { eq, and, asc, ne } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const { user, permissions } = locals;
	const hasAccess = permissions.includes('properties.create');

	if (!hasAccess) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Fetch floors with property relationships
		const floorsData = await db
			.select({
				id: floors.id,
				propertyId: floors.propertyId,
				floorNumber: floors.floorNumber,
				wing: floors.wing,
				status: floors.status,
				propertyName: properties.name,
				propertyDbId: properties.id
			})
			.from(floors)
			.leftJoin(properties, eq(floors.propertyId, properties.id))
			.orderBy(asc(floors.floorNumber));

		// Fetch rental units with lease info for each floor
		const unitsData = await db
			.select({
				id: rentalUnit.id,
				number: rentalUnit.number,
				floorId: rentalUnit.floorId
			})
			.from(rentalUnit);

		const leasesData = await db
			.select({
				id: leases.id,
				status: leases.status,
				rentalUnitId: leases.rentalUnitId
			})
			.from(leases);

		const leaseTenantsData = await db
			.select({
				leaseId: leaseTenants.leaseId,
				tenantId: leaseTenants.tenantId
			})
			.from(leaseTenants);

		// Build nested structure to match expected response format
		const floorsResult = floorsData.map((floor) => {
			const floorUnits = unitsData
				.filter((u) => u.floorId === floor.id)
				.map((unit) => {
					const unitLeases = leasesData
						.filter((l) => l.rentalUnitId === unit.id)
						.map((lease) => ({
							id: lease.id,
							status: lease.status,
							lease_tenants: leaseTenantsData
								.filter((lt) => lt.leaseId === lease.id)
								.map((lt) => ({ tenant_id: lt.tenantId }))
						}));
					return {
						id: unit.id,
						number: unit.number,
						leases: unitLeases
					};
				});

			return {
				id: floor.id,
				property_id: floor.propertyId,
				floor_number: floor.floorNumber,
				wing: floor.wing,
				status: floor.status,
				property: floor.propertyDbId
					? { id: floor.propertyDbId, name: floor.propertyName }
					: null,
				rental_unit: floorUnits
			};
		});

		const form = await superValidate(zod(floorSchema));

		return {
			form,
			floors: floorsResult as unknown as FloorWithProperty[]
		};
	} catch (err) {
		console.error('Unexpected error in load function:', err);
		throw error(500, 'An unexpected error occurred while loading data');
	}
};

// Declare - Actions

export const actions: Actions = {
	create: async ({ request }: RequestEvent) => {
		const form = await superValidate(request, zod(floorSchema));

		if (!form.valid) {
			console.error('Form validation failed:', form.errors);
			return fail(400, { form });
		}

		// Check for duplicate floor number in the same property
		const existingFloor = await db
			.select({ id: floors.id })
			.from(floors)
			.where(
				and(
					eq(floors.propertyId, form.data.property_id),
					eq(floors.floorNumber, form.data.floor_number)
				)
			)
			.limit(1);

		if (existingFloor.length > 0) {
			console.log('Duplicate floor number detected');
			form.errors.floor_number = ['This floor number already exists for this property'];
			return fail(400, { form });
		}

		console.log('Creating floor with data:', form.data);

		try {
			await db.insert(floors).values({
				propertyId: form.data.property_id,
				floorNumber: form.data.floor_number,
				wing: form.data.wing || null,
				status: form.data.status || 'ACTIVE'
			});
		} catch (err: any) {
			console.error('Error creating floor:', err);
			return fail(500, { form });
		}

		return { form };
	},

	update: async ({ request }: RequestEvent) => {
		const form = await superValidate(request, zod(floorSchema));

		if (!form.valid) {
			console.error('Form validation failed:', form.errors);
			return fail(400, { form });
		}

		// Check for duplicate floor number in the same property (excluding current floor)
		const existingFloor = await db
			.select({ id: floors.id })
			.from(floors)
			.where(
				and(
					eq(floors.propertyId, form.data.property_id),
					eq(floors.floorNumber, form.data.floor_number),
					ne(floors.id, form.data.id)
				)
			)
			.limit(1);

		if (existingFloor.length > 0) {
			console.log('Duplicate floor number detected');
			form.errors.floor_number = ['This floor number already exists for this property'];
			return fail(400, { form });
		}

		console.log('Updating floor with data:', form.data);

		try {
			await db
				.update(floors)
				.set({
					propertyId: form.data.property_id,
					floorNumber: form.data.floor_number,
					wing: form.data.wing || null,
					status: form.data.status || 'ACTIVE'
				})
				.where(eq(floors.id, form.data.id));
		} catch (err: any) {
			console.error('Error updating floor:', err);
			return fail(500, { form });
		}

		return { form };
	},

	delete: async ({ request }: RequestEvent) => {
		const data = await request.formData();
		const id = data.get('id');

		console.log('Attempting to delete floor with ID:', id);

		if (!id) {
			console.error('No floor ID provided for deletion.');
			return fail(400, { message: 'No floor ID provided' });
		}

		try {
			await db.delete(floors).where(eq(floors.id, Number(id)));
		} catch (err: any) {
			console.error('Error deleting floor:', err.message);
			return fail(500, { message: 'Failed to delete floor' });
		}

		console.log('Floor deleted successfully:', id);
		return { success: true };
	}
};
