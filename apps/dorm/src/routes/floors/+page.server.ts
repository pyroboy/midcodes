import { fail, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { floorSchema } from './formSchema';
import type { Actions, PageServerLoad, RequestEvent } from './$types';
import { db } from '$lib/server/db';
import { floors, properties } from '$lib/server/schema';
import { eq, and, ne } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const { permissions } = locals;
	const hasAccess = permissions?.includes('properties.create');

	if (!hasAccess) {
		throw error(401, 'Unauthorized');
	}

	const form = await superValidate(zod(floorSchema));
	return { form };
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
					ne(floors.id, form.data.id!)
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
				.where(eq(floors.id, form.data.id!));
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
