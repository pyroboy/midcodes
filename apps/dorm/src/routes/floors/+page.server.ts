import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { floorSchema } from './formSchema';
import type { Actions, RequestEvent } from './$types';
import { db } from '$lib/server/db';
import { floors } from '$lib/server/schema';
import { eq, and, ne, isNull } from 'drizzle-orm';
import { extractLockTimestamp, optimisticLockUpdate } from '$lib/server/optimistic-lock';

// Declare - Actions

export const actions: Actions = {
	create: async ({ request }: RequestEvent) => {
		const form = await superValidate(request, zod(floorSchema));

		if (!form.valid) {
			console.error('Form validation failed:', form.errors);
			return fail(400, { form });
		}

		// Check for duplicate floor number in the same property (exclude soft-deleted)
		const existingFloor = await db
			.select({ id: floors.id })
			.from(floors)
			.where(
				and(
					eq(floors.propertyId, form.data.property_id),
					eq(floors.floorNumber, form.data.floor_number),
					isNull(floors.deletedAt)
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
			const [inserted] = await db.insert(floors).values({
				propertyId: form.data.property_id,
				floorNumber: form.data.floor_number,
				wing: form.data.wing || null,
				status: form.data.status || 'ACTIVE',
				updatedAt: new Date()
			}).returning({ id: floors.id });
			// Attach new ID so client can do an optimistic write immediately
			form.data.id = inserted.id;
		} catch (err: any) {
			console.error('Error creating floor:', err);
			return fail(500, { form });
		}

		return { form };
	},

	update: async ({ request }: RequestEvent) => {
		const rawFormData = await request.formData();
		const lockTs = extractLockTimestamp(rawFormData);
		const form = await superValidate(rawFormData, zod(floorSchema));

		if (!form.valid) {
			console.error('Form validation failed:', form.errors);
			return fail(400, { form });
		}

		// Check for duplicate floor number in the same property (excluding current floor + soft-deleted)
		const existingFloor = await db
			.select({ id: floors.id })
			.from(floors)
			.where(
				and(
					eq(floors.propertyId, form.data.property_id),
					eq(floors.floorNumber, form.data.floor_number),
					ne(floors.id, form.data.id!),
					isNull(floors.deletedAt)
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
			const result = await optimisticLockUpdate(
				db, floors, floors.id, form.data.id!, floors.updatedAt, lockTs,
				{
					propertyId: form.data.property_id,
					floorNumber: form.data.floor_number,
					wing: form.data.wing || null,
					status: form.data.status || 'ACTIVE',
					updatedAt: new Date()
				}
			);
			if (result.conflict) {
				return fail(409, { form, conflict: true, message: result.message });
			}
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

		const numericId = Number(id);
		if (Number.isNaN(numericId)) {
			return fail(400, { message: 'Invalid ID' });
		}

		try {
			await db.update(floors).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(floors.id, numericId));
		} catch (err: any) {
			console.error('Error deleting floor:', err.message);
			return fail(500, { message: 'Failed to delete floor' });
		}

		console.log('Floor deleted successfully:', id);
		return { success: true };
	}
};
