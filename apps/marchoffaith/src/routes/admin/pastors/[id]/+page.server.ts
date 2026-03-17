import { db } from '$lib/server/db';
import { pastors, churchPastors, churches } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { slugify, isSlugTaken, parseIntSafe, dbAction } from '$lib/server/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);

	if (!id || isNaN(id)) {
		throw error(404, 'Pastor not found');
	}

	const [pastor] = await db
		.select()
		.from(pastors)
		.where(eq(pastors.id, id));

	if (!pastor) {
		throw error(404, 'Pastor not found');
	}

	const assignments = await db
		.select({
			churchId: churches.id,
			churchName: churches.name,
			churchSlug: churches.slug,
			role: churchPastors.role,
			since: churchPastors.since,
			isPrimary: churchPastors.isPrimary
		})
		.from(churchPastors)
		.innerJoin(churches, eq(churchPastors.churchId, churches.id))
		.where(eq(churchPastors.pastorId, pastor.id));

	return { pastor, churchAssignments: assignments };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const id = Number(params.id);
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

		// Slug uniqueness check on UPDATE (exclude current record)
		if (await isSlugTaken(pastors, pastors.slug, slug, id, pastors.id)) {
			return fail(400, { error: 'A pastor with this slug already exists.', name, slug, title, role, bio, photoUrl, phone, email, ministryFocus, sortOrder: sortOrder?.toString(), isActive: !!isActive });
		}

		await dbAction(async () => {
			const result = await db
				.update(pastors)
				.set({
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
					sortOrder,
					updatedAt: new Date()
				})
				.where(eq(pastors.id, id))
				.returning({ id: pastors.id });
			if (result.length === 0) throw new Error('Record not found');
		}, 'Failed to update pastor.');

		throw redirect(303, '/admin/pastors?success=updated');
	}
};
