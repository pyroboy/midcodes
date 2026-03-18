import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, RequestEvent } from './$types';
import { floorSchema } from '../../floors/formSchema';
import { db } from '$lib/server/db';
import { floors } from '$lib/server/schema';
import { eq, and, ne } from 'drizzle-orm';

export const actions: Actions = {
	floorCreate: async ({ request }: RequestEvent) => {
		const form = await superValidate(request, zod(floorSchema));
		if (!form.valid) return fail(400, { form });

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
			form.errors.floor_number = ['This floor number already exists for this property'];
			return fail(400, { form });
		}

		try {
			await db.insert(floors).values({
				propertyId: form.data.property_id,
				floorNumber: form.data.floor_number,
				wing: form.data.wing || null,
				status: form.data.status || 'ACTIVE',
				updatedAt: new Date()
			});
		} catch (err: any) {
			console.error('Error creating floor:', err);
			return fail(500, { form });
		}

		return { form };
	},

	floorUpdate: async ({ request }: RequestEvent) => {
		const form = await superValidate(request, zod(floorSchema));
		if (!form.valid) return fail(400, { form });

		const existingFloor = await db
			.select({ id: floors.id })
			.from(floors)
			.where(
				and(
					eq(floors.propertyId, form.data.property_id),
					eq(floors.floorNumber, form.data.floor_number),
					ne(floors.id, form.data.id!)
				)
			)
			.limit(1);

		if (existingFloor.length > 0) {
			form.errors.floor_number = ['This floor number already exists for this property'];
			return fail(400, { form });
		}

		try {
			await db
				.update(floors)
				.set({
					propertyId: form.data.property_id,
					floorNumber: form.data.floor_number,
					wing: form.data.wing || null,
					status: form.data.status || 'ACTIVE',
					updatedAt: new Date()
				})
				.where(eq(floors.id, form.data.id!));
		} catch (err: any) {
			console.error('Error updating floor:', err);
			return fail(500, { form });
		}

		return { form };
	},

	floorDelete: async ({ request }: RequestEvent) => {
		const data = await request.formData();
		const id = data.get('id');
		if (!id) return fail(400, { message: 'No floor ID provided' });

		const numericId = Number(id);
		if (Number.isNaN(numericId)) {
			return fail(400, { message: 'Invalid ID' });
		}

		try {
			await db.delete(floors).where(eq(floors.id, numericId));
		} catch (err: any) {
			console.error('Error deleting floor:', err.message);
			return fail(500, { message: 'Failed to delete floor' });
		}

		return { success: true };
	}
};
