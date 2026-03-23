import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, RequestEvent } from './$types';
import { rental_unitSchema } from '../../rental-unit/formSchema';
import { db } from '$lib/server/db';
import { rentalUnit } from '$lib/server/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { cache } from '$lib/services/cache';

export const actions: Actions = {
	unitCreate: async ({ request }: RequestEvent) => {
		const form = await superValidate(request, zod(rental_unitSchema));
		if (!form.valid) return fail(400, { form });

		const existingUnit = await db
			.select({ id: rentalUnit.id })
			.from(rentalUnit)
			.where(
				and(
					eq(rentalUnit.propertyId, form.data.property_id!),
					eq(rentalUnit.floorId, form.data.floor_id!),
					eq(rentalUnit.number, form.data.number),
					isNull(rentalUnit.deletedAt)
				)
			)
			.limit(1);

		if (existingUnit.length > 0) {
			form.errors.number = ['This unit number already exists on this floor'];
			return fail(400, { form });
		}

		try {
			const [inserted] = await db.insert(rentalUnit).values({
				name: form.data.name,
				number: form.data.number,
				type: form.data.type,
				capacity: form.data.capacity,
				baseRate: String(form.data.base_rate),
				rentalUnitStatus: form.data.rental_unit_status,
				propertyId: form.data.property_id!,
				floorId: form.data.floor_id || 0,
				amenities: form.data.amenities || [],
				updatedAt: new Date()
			}).returning({ id: rentalUnit.id });
			form.data.id = inserted.id;
		} catch (err: any) {
			console.error('Error creating rental unit:', err);
			return fail(500, { form });
		}

		cache.deletePattern(/^rental_units:/);
		return { form };
	},

	unitUpdate: async ({ request }: RequestEvent) => {
		const formData = await request.formData();
		const rawForm = await superValidate(formData, zod(rental_unitSchema));
		const { property, floor, ...updateData } = rawForm.data;
		const form = await superValidate(updateData, zod(rental_unitSchema));

		if (!form.valid) return fail(400, { form });

		try {
			await db
				.update(rentalUnit)
				.set({
					name: updateData.name,
					number: updateData.number,
					type: updateData.type,
					capacity: updateData.capacity,
					baseRate: String(updateData.base_rate),
					rentalUnitStatus: updateData.rental_unit_status,
					propertyId: updateData.property_id,
					floorId: updateData.floor_id || 0,
					amenities: updateData.amenities || [],
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

		cache.deletePattern(/^rental_units:/);
		return { form };
	},

	unitDelete: async ({ request }: RequestEvent) => {
		const formData = await request.formData();
		const id = formData.get('id');
		if (!id || typeof id !== 'string') return fail(400, { message: 'Invalid rental unit ID' });

		const rentalUnitId = parseInt(id, 10);
		if (isNaN(rentalUnitId)) return fail(400, { message: 'Invalid rental unit ID format' });

		try {
			await db.update(rentalUnit).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(rentalUnit.id, rentalUnitId));
		} catch (err: any) {
			console.error('Error deleting rental unit:', err);
			if (err.message?.includes('Policy check failed')) {
				return fail(403, { message: 'You do not have permission to delete rental units' });
			}
			if (err.code === '23503') {
				return fail(400, {
					message:
						'Cannot delete rental unit because it is referenced by other records'
				});
			}
			return fail(500, { message: 'Failed to delete rental unit' });
		}

		cache.deletePattern(/^rental_units:/);
		return { success: true };
	}
};
