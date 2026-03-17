import { db } from '$lib/server/db';
import { contactSubmissions } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { dbAction } from '$lib/server/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const submissions = await db
		.select()
		.from(contactSubmissions)
		.orderBy(desc(contactSubmissions.createdAt));

	return { submissions };
};

export const actions: Actions = {
	markRead: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const isRead = formData.get('isRead') === 'true';

		if (!id || isNaN(id)) {
			return fail(400, { error: 'Invalid submission ID' });
		}

		await dbAction(async () => {
			await db
				.update(contactSubmissions)
				.set({ isRead })
				.where(eq(contactSubmissions.id, id));
		}, 'Failed to update message status.');

		return { success: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id || isNaN(id)) {
			return fail(400, { error: 'Invalid submission ID' });
		}

		await dbAction(async () => {
			const result = await db.delete(contactSubmissions).where(eq(contactSubmissions.id, id)).returning({ id: contactSubmissions.id });
			if (result.length === 0) throw new Error('Message not found');
		}, 'Failed to delete message.');

		return { success: true };
	}
};
