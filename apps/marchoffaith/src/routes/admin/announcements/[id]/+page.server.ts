import { db } from '$lib/server/db';
import { announcements } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { parseDate, parseIntSafe, dbAction } from '$lib/server/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);

	if (!id || isNaN(id)) {
		throw error(404, 'Announcement not found');
	}

	const [announcement] = await db
		.select()
		.from(announcements)
		.where(eq(announcements.id, id));

	if (!announcement) {
		throw error(404, 'Announcement not found');
	}

	return { announcement };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const id = Number(params.id);
		const formData = await request.formData();

		const message = formData.get('message')?.toString()?.trim();
		const linkUrl = formData.get('linkUrl')?.toString()?.trim() || null;
		const linkText = formData.get('linkText')?.toString()?.trim() || null;
		const isActive = formData.get('isActive') === 'on';
		const expiresAt = parseDate(formData.get('expiresAt')?.toString()?.trim());
		const sortOrder = parseIntSafe(formData.get('sortOrder')?.toString()) ?? 0;

		if (!message) {
			return fail(400, {
				error: 'Message is required.',
				message,
				linkUrl,
				linkText,
				isActive,
				expiresAt: formData.get('expiresAt')?.toString()?.trim() ?? null,
				sortOrder
			});
		}

		await dbAction(async () => {
			const result = await db
				.update(announcements)
				.set({
					message,
					linkUrl,
					linkText,
					isActive,
					expiresAt,
					sortOrder,
					updatedAt: new Date()
				})
				.where(eq(announcements.id, id))
				.returning({ id: announcements.id });
			if (result.length === 0) throw new Error('Record not found');
		}, 'Failed to update.');

		throw redirect(303, '/admin/announcements?success=updated');
	}
};
