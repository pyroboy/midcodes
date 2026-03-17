import { db } from '$lib/server/db';
import { announcements } from '$lib/server/schema';
import { fail, redirect } from '@sveltejs/kit';
import { parseDate, parseIntSafe, dbAction } from '$lib/server/utils';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
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
			await db.insert(announcements).values({
				message,
				linkUrl,
				linkText,
				isActive,
				expiresAt,
				sortOrder
			});
		}, 'Failed to create. Please try again.');

		throw redirect(303, '/admin/announcements?success=created');
	}
};
