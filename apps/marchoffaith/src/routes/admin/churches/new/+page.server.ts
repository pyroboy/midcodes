import { db } from '$lib/server/db';
import { churches, churchPastors, pastors } from '$lib/server/schema';
import { asc, eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { slugify, isSlugTaken, parseIntSafe, dbAction } from '$lib/server/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allPastors = await db
		.select()
		.from(pastors)
		.orderBy(asc(pastors.name));

	return { pastors: allPastors };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const name = formData.get('name')?.toString()?.trim();
		const street = formData.get('street')?.toString()?.trim();
		const city = formData.get('city')?.toString()?.trim();
		const province = formData.get('province')?.toString()?.trim();

		if (!name || !street || !city || !province) {
			return fail(400, { error: 'Name, street, city, and province are required.' });
		}

		const slug = formData.get('slug')?.toString()?.trim() || slugify(name);
		const phone = formData.get('phone')?.toString()?.trim() || null;
		const email = formData.get('email')?.toString()?.trim() || null;
		const facebookHandle = formData.get('facebookHandle')?.toString()?.trim() || null;
		const instagramHandle = formData.get('instagramHandle')?.toString()?.trim() || null;
		const youtubeHandle = formData.get('youtubeHandle')?.toString()?.trim() || null;
		const imageUrl = formData.get('imageUrl')?.toString()?.trim() || null;
		const totalMembers = parseIntSafe(formData.get('totalMembers')?.toString());
		const yearFounded = parseIntSafe(formData.get('yearFounded')?.toString());
		const sortOrder = parseIntSafe(formData.get('sortOrder')?.toString()) ?? 0;
		const isActive = formData.get('isActive') === 'on';
		const servicesRaw = formData.get('services')?.toString() || '[]';
		const pastorId = formData.get('pastorId')?.toString()?.trim();

		let services: { day: string; time: string; type: string }[] = [];
		try {
			const parsed = JSON.parse(servicesRaw);
			if (Array.isArray(parsed)) services = parsed;
		} catch (e) {
			console.warn('[Admin] Invalid services JSON:', e);
			services = [];
		}

		// Slug uniqueness check before INSERT
		if (await isSlugTaken(churches, churches.slug, slug)) {
			return fail(400, { error: 'A church with this slug already exists.' });
		}

		const [inserted] = await dbAction(async () => {
			return db
				.insert(churches)
				.values({
					name,
					slug,
					street,
					city,
					province,
					phone,
					email,
					facebookHandle,
					instagramHandle,
					youtubeHandle,
					imageUrl,
					totalMembers,
					yearFounded,
					sortOrder,
					isActive,
					services
				})
				.returning({ id: churches.id });
		}, 'Failed to create church.');

		// Assign pastor if selected
		if (pastorId && inserted) {
			const pastorIdNum = Number(pastorId);

			// Verify pastor exists
			const [pastor] = await db.select({ id: pastors.id }).from(pastors).where(eq(pastors.id, pastorIdNum)).limit(1);
			if (!pastor) return fail(400, { error: 'Selected pastor does not exist.' });

			await dbAction(async () => {
				await db.insert(churchPastors).values({
					churchId: inserted.id,
					pastorId: pastorIdNum,
					role: 'Resident Pastor',
					isPrimary: true
				});
			}, 'Failed to assign pastor. They may already be assigned to this church.');
		}

		throw redirect(303, '/admin/churches?success=created');
	}
};
