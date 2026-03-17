import { db } from '$lib/server/db';
import { prayerRequests } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { dbAction } from '$lib/server/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const requests = await db
		.select()
		.from(prayerRequests)
		.orderBy(desc(prayerRequests.createdAt));

	return { requests };
};

export const actions: Actions = {
	approve: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id || isNaN(id)) {
			return fail(400, { error: 'Invalid prayer request ID' });
		}

		await dbAction(async () => {
			await db
				.update(prayerRequests)
				.set({ isApproved: true })
				.where(eq(prayerRequests.id, id));
		}, 'Failed to approve prayer request.');

		return { success: true };
	},

	reject: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id || isNaN(id)) {
			return fail(400, { error: 'Invalid prayer request ID' });
		}

		await dbAction(async () => {
			await db
				.update(prayerRequests)
				.set({ isApproved: false })
				.where(eq(prayerRequests.id, id));
		}, 'Failed to reject prayer request.');

		return { success: true };
	},

	togglePublic: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const currentIsPublic = formData.get('isPublic') === 'true';

		if (!id || isNaN(id)) {
			return fail(400, { error: 'Invalid prayer request ID' });
		}

		await dbAction(async () => {
			await db
				.update(prayerRequests)
				.set({ isPublic: !currentIsPublic })
				.where(eq(prayerRequests.id, id));
		}, 'Failed to update prayer request visibility.');

		return { success: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id || isNaN(id)) {
			return fail(400, { error: 'Invalid prayer request ID' });
		}

		await dbAction(async () => {
			const result = await db.delete(prayerRequests).where(eq(prayerRequests.id, id)).returning({ id: prayerRequests.id });
			if (result.length === 0) throw new Error('Prayer request not found');
		}, 'Failed to delete prayer request.');

		return { success: true };
	}
};
