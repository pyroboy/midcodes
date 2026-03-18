import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import type { Actions, RequestEvent } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { propertySchema, preparePropertyData } from './formSchema';
import { cache } from '$lib/services/cache';
import { db } from '$lib/server/db';
import { properties } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

// --- ACTIONS ---

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await superValidate(request, zod(propertySchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		// remove id, created_at, updated_at
		const { id, created_at, updated_at, ...propertyData } = form.data;

		try {
			const [inserted] = await db.insert(properties).values({
				...propertyData,
				updatedAt: new Date()
			}).returning({ id: properties.id });
			form.data.id = inserted.id;
		} catch (err: any) {
			if (err.message?.includes('Policy check failed')) {
				return fail(403, { form, message: 'You do not have permission to create properties' });
			}
			return fail(500, { form, message: 'Failed to create property' });
		}

		// Invalidate properties cache after create
		cache.deletePattern(/^properties:/);

		return { form };
	},
	update: async ({ request }: RequestEvent) => {
		const form = await superValidate(request, zod(propertySchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const propertyData = preparePropertyData(form.data);

		try {
			await db
				.update(properties)
				.set({ ...propertyData, updatedAt: new Date() })
				.where(eq(properties.id, form.data.id!));
		} catch (err: any) {
			console.error('Error updating property:', err);
			return fail(500, {
				form,
				error: 'Failed to update property'
			});
		}

		// Invalidate properties cache after update
		cache.deletePattern(/^properties:/);

		return { form };
	},

	delete: async ({ request }: RequestEvent) => {
		const data = await request.formData();
		const id = data.get('id');
		const numId = Number(id);

		if (!id || Number.isNaN(numId)) {
			return fail(400, {
				form: null,
				error: 'Valid property ID is required'
			});
		}

		try {
			await db.delete(properties).where(eq(properties.id, numId));

			// Invalidate properties cache after delete
			cache.deletePattern(/^properties:/);

			return { success: true };
		} catch (err: any) {
			console.error('Delete error full details:', err);

			// Handle specific PostgreSQL error codes
			switch (err?.code) {
				case '23503': // foreign key violation
					return fail(400, {
						error: 'Cannot delete property because it has units or leases attached to it'
					});
				case '42501': // permission denied
					return fail(403, {
						error: 'You do not have permission to delete this property'
					});
				default:
					return fail(500, {
						error: err.message || 'Failed to delete property'
					});
			}
		}
	}
};
