import { db } from '$lib/server/db';
import { announcements } from '$lib/server/schema';
import { eq, asc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { dbAction, deleteById } from '$lib/server/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allAnnouncements = await db
		.select()
		.from(announcements)
		.orderBy(asc(announcements.sortOrder));

	return { announcements: allAnnouncements };
};

export const actions: Actions = {
	delete: async ({ request }) => deleteById(announcements, announcements.id, request, 'announcement'),

	toggleActive: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const currentState = formData.get('isActive') === 'true';

		if (!id || isNaN(id)) {
			return fail(400, { error: 'Invalid announcement ID' });
		}

		await dbAction(async () => {
			await db
				.update(announcements)
				.set({
					isActive: !currentState,
					updatedAt: new Date()
				})
				.where(eq(announcements.id, id));
		}, 'Failed to update announcement status.');

		return { success: true };
	}
};
