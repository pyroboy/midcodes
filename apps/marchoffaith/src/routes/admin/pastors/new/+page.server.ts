import { db } from '$lib/server/db';
import { pastors } from '$lib/server/schema';
import { fail, redirect } from '@sveltejs/kit';
import { slugify, isSlugTaken, parseIntSafe, dbAction } from '$lib/server/utils';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const name = formData.get('name')?.toString()?.trim();
		const title = formData.get('title')?.toString()?.trim();

		const slug = formData.get('slug')?.toString()?.trim() || (name ? slugify(name) : '');
		const role = formData.get('role')?.toString()?.trim() || null;
		const bio = formData.get('bio')?.toString()?.trim() || null;
		const photoUrl = formData.get('photoUrl')?.toString()?.trim() || null;
		const phone = formData.get('phone')?.toString()?.trim() || null;
		const email = formData.get('email')?.toString()?.trim() || null;
		const ministryFocus = formData.get('ministryFocus')?.toString()?.trim() || null;
		const isActive = formData.get('isActive') === 'on';
		const sortOrder = parseIntSafe(formData.get('sortOrder')?.toString()) ?? 0;

		if (!name || !title) {
			return fail(400, { error: 'Name and title are required.', name, slug, title, role, bio, photoUrl, phone, email, ministryFocus, sortOrder: sortOrder?.toString(), isActive: !!isActive });
		}

		if (!slug) {
			return fail(400, {
				error: 'Name, slug, and title are required.',
				name,
				slug,
				title,
				role,
				bio,
				photoUrl,
				phone,
				email,
				ministryFocus,
				isActive,
				sortOrder
			});
		}

		// Slug uniqueness check before INSERT
		if (await isSlugTaken(pastors, pastors.slug, slug)) {
			return fail(400, { error: 'A pastor with this slug already exists.', name, slug, title, role, bio, photoUrl, phone, email, ministryFocus, sortOrder: sortOrder?.toString(), isActive: !!isActive });
		}

		await dbAction(async () => {
			return db.insert(pastors).values({
				name,
				slug,
				title,
				role,
				bio,
				photoUrl,
				phone,
				email,
				ministryFocus,
				isActive,
				sortOrder
			}).returning({ id: pastors.id });
		}, 'Failed to create pastor.');

		throw redirect(303, '/admin/pastors?success=created');
	}
};
