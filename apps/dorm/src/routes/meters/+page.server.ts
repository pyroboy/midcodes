import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { meterSchema } from './formSchema';
import { db } from '$lib/server/db';
import { meters, floors, rentalUnit, readings, profiles } from '$lib/server/schema';
import { eq, and, ne } from 'drizzle-orm';

export const actions = {
	create: async ({ request, locals }) => {
		console.log('Starting create action');

		try {
			const { user } = locals;
			if (!user) {
				return fail(401, { message: 'Unauthorized' });
			}

			const form = await superValidate(request, zod(meterSchema));

			if (!form.valid) {
				return fail(400, { form });
			}

			// Check user permissions
			const profileResult = await db
				.select({ role: profiles.role })
				.from(profiles)
				.where(eq(profiles.id, user.id))
				.limit(1);
			const profile = profileResult[0];

			const isAdminLevel =
				profile?.role === 'super_admin' || profile?.role === 'property_admin';
			const isUtility = profile?.role === 'property_utility';

			if (!isAdminLevel && !isUtility) {
				return fail(403, { form, message: 'Forbidden - Insufficient permissions' });
			}

			const { location_type, property_id, floor_id, rental_unit_id } = form.data;

			let insertData: any = {
				name: form.data.name,
				locationType: form.data.location_type,
				propertyId: form.data.property_id,
				floorId: null as number | null,
				rentalUnitId: null as number | null,
				type: form.data.type,
				initialReading: form.data.initial_reading,
				status: form.data.status,
				isActive: form.data.status === 'ACTIVE',
				notes: form.data.notes
			};

			// Set location IDs based on location_type
			switch (location_type) {
				case 'PROPERTY':
					if (!property_id) {
						return fail(400, { form, message: 'Property ID is required for PROPERTY location type' });
					}
					break;
				case 'FLOOR':
					if (!floor_id) {
						return fail(400, { form, message: 'Floor ID is required for FLOOR location type' });
					}
					insertData.floorId = floor_id;
					if (!property_id) {
						const floorData = await db
							.select({ propertyId: floors.propertyId })
							.from(floors)
							.where(eq(floors.id, floor_id))
							.limit(1);
						if (floorData[0]?.propertyId) {
							insertData.propertyId = floorData[0].propertyId;
						} else {
							return fail(400, { form, message: 'Floor not found or has no associated property' });
						}
					}
					break;
				case 'RENTAL_UNIT':
					if (!rental_unit_id) {
						return fail(400, { form, message: 'Rental unit ID is required for RENTAL_UNIT location type' });
					}
					insertData.rentalUnitId = rental_unit_id;
					const unitData = await db
						.select({ floorId: rentalUnit.floorId })
						.from(rentalUnit)
						.where(eq(rentalUnit.id, rental_unit_id))
						.limit(1);
					if (!unitData[0]?.floorId) {
						return fail(400, { form, message: 'Rental unit not found or has no associated floor' });
					}
					insertData.floorId = unitData[0].floorId;
					if (!property_id) {
						const floorForUnit = await db
							.select({ propertyId: floors.propertyId })
							.from(floors)
							.where(eq(floors.id, unitData[0].floorId))
							.limit(1);
						if (floorForUnit[0]?.propertyId) {
							insertData.propertyId = floorForUnit[0].propertyId;
						} else {
							return fail(400, { form, message: 'Floor not found or has no associated property' });
						}
					}
					break;
				default:
					return fail(400, { form, message: 'Invalid location type' });
			}

			if (!insertData.propertyId) {
				return fail(400, { form, message: 'Property ID is required' });
			}

			// Check for duplicate meter names
			const duplicateConditions = [
				eq(meters.name, form.data.name),
				eq(meters.propertyId, insertData.propertyId)
			];
			if (location_type === 'FLOOR' && insertData.floorId) {
				duplicateConditions.push(eq(meters.floorId, insertData.floorId));
			}
			if (location_type === 'RENTAL_UNIT' && insertData.rentalUnitId) {
				duplicateConditions.push(eq(meters.rentalUnitId, insertData.rentalUnitId));
			}

			const existingMeter = await db
				.select({ id: meters.id })
				.from(meters)
				.where(and(...duplicateConditions))
				.limit(1);

			if (existingMeter.length > 0) {
				return fail(400, {
					form,
					message: 'A meter with this name already exists in this location.'
				});
			}

			await db.insert(meters).values(insertData);

			return { form, success: true };
		} catch (err) {
			console.error('Unexpected error in create action:', err);
			return fail(500, { message: 'An unexpected error occurred' });
		}
	},

	update: async ({ request, locals }) => {
		console.log('Starting update action');

		try {
			const { user } = locals;
			if (!user) {
				return fail(401, { message: 'Unauthorized' });
			}

			const form = await superValidate(request, zod(meterSchema));

			if (!form.valid) {
				return fail(400, { form });
			}

			const profileResult = await db
				.select({ role: profiles.role })
				.from(profiles)
				.where(eq(profiles.id, user.id))
				.limit(1);
			const profile = profileResult[0];

			const isAdminLevel =
				profile?.role === 'super_admin' || profile?.role === 'property_admin';
			const isUtility = profile?.role === 'property_utility';

			if (!isAdminLevel && !isUtility) {
				return fail(403, { form, message: 'Forbidden - Insufficient permissions' });
			}

			const { id } = form.data;
			if (!id) {
				return fail(400, { form, message: 'Meter ID is required for updates.' });
			}

			// Check if meter exists
			const meterResult = await db
				.select({ id: meters.id })
				.from(meters)
				.where(eq(meters.id, id))
				.limit(1);

			if (meterResult.length === 0) {
				return fail(404, { form, message: 'Meter not found.' });
			}

			const { location_type, property_id, floor_id, rental_unit_id } = form.data;

			let cleanUpdateData: any = {
				name: form.data.name,
				locationType: form.data.location_type,
				propertyId: form.data.property_id,
				floorId: null as number | null,
				rentalUnitId: null as number | null,
				initialReading: form.data.initial_reading,
				type: form.data.type,
				status: form.data.status,
				isActive: form.data.status === 'ACTIVE',
				notes: form.data.notes
			};

			// Set location IDs (same logic as create)
			switch (location_type) {
				case 'PROPERTY':
					if (!property_id) {
						return fail(400, { form, message: 'Property ID is required for PROPERTY location type' });
					}
					break;
				case 'FLOOR':
					if (!floor_id) {
						return fail(400, { form, message: 'Floor ID is required for FLOOR location type' });
					}
					cleanUpdateData.floorId = floor_id;
					if (!property_id) {
						const floorData = await db
							.select({ propertyId: floors.propertyId })
							.from(floors)
							.where(eq(floors.id, floor_id))
							.limit(1);
						if (floorData[0]?.propertyId) {
							cleanUpdateData.propertyId = floorData[0].propertyId;
						} else {
							return fail(400, { form, message: 'Floor not found or has no associated property' });
						}
					}
					break;
				case 'RENTAL_UNIT':
					if (!rental_unit_id) {
						return fail(400, { form, message: 'Rental unit ID is required for RENTAL_UNIT location type' });
					}
					cleanUpdateData.rentalUnitId = rental_unit_id;
					const unitData = await db
						.select({ floorId: rentalUnit.floorId })
						.from(rentalUnit)
						.where(eq(rentalUnit.id, rental_unit_id))
						.limit(1);
					if (!unitData[0]?.floorId) {
						return fail(400, { form, message: 'Rental unit not found or has no associated floor' });
					}
					cleanUpdateData.floorId = unitData[0].floorId;
					if (!property_id) {
						const floorForUnit = await db
							.select({ propertyId: floors.propertyId })
							.from(floors)
							.where(eq(floors.id, unitData[0].floorId))
							.limit(1);
						if (floorForUnit[0]?.propertyId) {
							cleanUpdateData.propertyId = floorForUnit[0].propertyId;
						} else {
							return fail(400, { form, message: 'Floor not found or has no associated property' });
						}
					}
					break;
				default:
					return fail(400, { form, message: 'Invalid location type' });
			}

			if (!cleanUpdateData.propertyId) {
				return fail(400, { form, message: 'Property ID is required' });
			}

			// Check for duplicate meter names (excluding current)
			const duplicateConditions = [
				eq(meters.name, form.data.name),
				eq(meters.propertyId, cleanUpdateData.propertyId),
				ne(meters.id, id)
			];
			if (location_type === 'FLOOR' && cleanUpdateData.floorId) {
				duplicateConditions.push(eq(meters.floorId, cleanUpdateData.floorId));
			}
			if (location_type === 'RENTAL_UNIT' && cleanUpdateData.rentalUnitId) {
				duplicateConditions.push(eq(meters.rentalUnitId, cleanUpdateData.rentalUnitId));
			}

			const existingMeter = await db
				.select({ id: meters.id })
				.from(meters)
				.where(and(...duplicateConditions))
				.limit(1);

			if (existingMeter.length > 0) {
				return fail(400, {
					form,
					message: 'A meter with this name already exists in this location.'
				});
			}

			await db.update(meters).set(cleanUpdateData).where(eq(meters.id, id));

			return { form, success: true };
		} catch (err) {
			console.error('Unexpected error in update action:', err);
			return fail(500, { message: 'An unexpected error occurred' });
		}
	},

	delete: async ({ request, locals }) => {
		try {
			const { user } = locals;
			if (!user) {
				return fail(401, { message: 'Unauthorized' });
			}

			const profileResult = await db
				.select({ role: profiles.role })
				.from(profiles)
				.where(eq(profiles.id, user.id))
				.limit(1);
			const profile = profileResult[0];

			const isAdminLevel =
				profile?.role === 'super_admin' || profile?.role === 'property_admin';
			if (!isAdminLevel) {
				return fail(403, { message: 'Only administrators can delete meters.' });
			}

			const formData = await request.formData();
			const id = formData.get('id');

			if (!id || isNaN(Number(id))) {
				return fail(400, { message: 'Invalid meter ID' });
			}

			const meterId = Number(id);

			// Verify meter exists
			const meterResult = await db
				.select({ id: meters.id })
				.from(meters)
				.where(eq(meters.id, meterId))
				.limit(1);

			if (meterResult.length === 0) {
				return fail(404, { message: 'Meter not found' });
			}

			// Check for existing readings
			const readingsResult = await db
				.select({ id: readings.id })
				.from(readings)
				.where(eq(readings.meterId, meterId))
				.limit(1);

			if (readingsResult.length > 0) {
				// Archive the meter
				await db
					.update(meters)
					.set({ status: 'INACTIVE' })
					.where(eq(meters.id, meterId));
				return { success: true, action: 'archived' };
			} else {
				// Delete the meter
				await db.delete(meters).where(eq(meters.id, meterId));
				return { success: true, action: 'deleted' };
			}
		} catch (err) {
			console.error('Unexpected error:', err);
			return fail(500, { message: 'An unexpected error occurred' });
		}
	}
};
