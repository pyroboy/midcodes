import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, RequestEvent } from './$types';
import { propertySchema, preparePropertyData } from '../../properties/formSchema';
import { db } from '$lib/server/db';
import { properties } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { cache } from '$lib/services/cache';
import { extractLockTimestamp, optimisticLockUpdate } from '$lib/server/optimistic-lock';

export const actions: Actions = {
	propertyCreate: async ({ request }) => {
		const form = await superValidate(request, zod(propertySchema));
		if (!form.valid) return fail(400, { form });

		const { id, created_at, updated_at, ...propertyData } = form.data;

		try {
			const [inserted] = await db.insert(properties).values({
				...propertyData,
				updatedAt: new Date()
			}).returning({ id: properties.id });
			// Set the ID back on the form so the client can use it for optimistic writes
			form.data.id = inserted.id;
		} catch (err: any) {
			if (err.message?.includes('Policy check failed')) {
				return fail(403, { form, message: 'You do not have permission to create properties' });
			}
			return fail(500, { form, message: 'Failed to create property' });
		}

		cache.deletePattern(/^properties:/);
		return { form };
	},

	propertyUpdate: async ({ request }: RequestEvent) => {
		const rawFormData = await request.formData();
		const lockTs = extractLockTimestamp(rawFormData);
		const form = await superValidate(rawFormData, zod(propertySchema));
		if (!form.valid) return fail(400, { form });

		const propertyData = preparePropertyData(form.data);

		try {
			const result = await optimisticLockUpdate(
				db, properties, properties.id, form.data.id!, properties.updatedAt, lockTs,
				{ ...propertyData, updatedAt: new Date() }
			);
			if (result.conflict) {
				return fail(409, { form, conflict: true, message: result.message });
			}
		} catch (err: any) {
			console.error('Error updating property:', err);
			return fail(500, { form, error: 'Failed to update property' });
		}

		cache.deletePattern(/^properties:/);
		return { form };
	},

	propertyDelete: async ({ request }: RequestEvent) => {
		const data = await request.formData();
		const id = data.get('id');
		const numId = Number(id);
		if (!id || Number.isNaN(numId)) return fail(400, { error: 'Valid property ID is required' });

		try {
			await db.update(properties).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(properties.id, numId));
			cache.deletePattern(/^properties:/);
			return { success: true };
		} catch (err: any) {
			console.error('Delete error full details:', err);
			switch (err?.code) {
				case '23503':
					return fail(400, {
						error:
							'Cannot delete property because it has units or leases attached to it'
					});
				case '42501':
					return fail(403, {
						error: 'You do not have permission to delete this property'
					});
				default:
					return fail(500, { error: err.message || 'Failed to delete property' });
			}
		}
	}
};
