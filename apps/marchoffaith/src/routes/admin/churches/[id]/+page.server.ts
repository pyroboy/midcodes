import { db } from '$lib/server/db';
import { churches, churchPastors, pastors } from '$lib/server/schema';
import { eq, asc } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { slugify, isSlugTaken, parseIntSafe, dbAction } from '$lib/server/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!id || isNaN(id)) throw error(404, 'Church not found');

	const [church] = await db
		.select()
		.from(churches)
		.where(eq(churches.id, id));

	if (!church) throw error(404, 'Church not found');

	const assignments = await db
		.select({
			id: churchPastors.id,
			pastorId: churchPastors.pastorId,
			role: churchPastors.role,
			since: churchPastors.since,
			isPrimary: churchPastors.isPrimary,
			pastorName: pastors.name
		})
		.from(churchPastors)
		.innerJoin(pastors, eq(churchPastors.pastorId, pastors.id))
		.where(eq(churchPastors.churchId, id));

	const allPastors = await db
		.select()
		.from(pastors)
		.orderBy(asc(pastors.name));

	return { church, assignments, pastors: allPastors };
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const id = Number(params.id);
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

		let services: { day: string; time: string; type: string }[] = [];
		try {
			const parsed = JSON.parse(servicesRaw);
			if (Array.isArray(parsed)) services = parsed;
		} catch (e) {
			console.warn('[Admin] Invalid services JSON:', e);
			services = [];
		}

		// Slug uniqueness check on UPDATE (exclude current record)
		if (await isSlugTaken(churches, churches.slug, slug, id, churches.id)) {
			return fail(400, { error: 'A church with this slug already exists.' });
		}

		await dbAction(async () => {
			const result = await db
				.update(churches)
				.set({
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
					services,
					updatedAt: new Date()
				})
				.where(eq(churches.id, id))
				.returning({ id: churches.id });
			if (result.length === 0) throw new Error('Record not found');
		}, 'Failed to update church.');

		throw redirect(303, '/admin/churches?success=updated');
	},

	assignPastor: async ({ request, params }) => {
		const id = Number(params.id);
		const formData = await request.formData();

		const pastorId = Number(formData.get('pastorId'));
		if (!pastorId || isNaN(pastorId)) {
			return fail(400, { error: 'Please select a pastor.' });
		}

		const role = formData.get('role')?.toString()?.trim() || 'Resident Pastor';
		const since = formData.get('since')?.toString()?.trim() || null;
		const isPrimary = formData.get('isPrimary') === 'on';

		// Verify pastor exists
		const [pastor] = await db.select({ id: pastors.id }).from(pastors).where(eq(pastors.id, pastorId)).limit(1);
		if (!pastor) return fail(400, { error: 'Selected pastor does not exist.' });

		await dbAction(async () => {
			await db.insert(churchPastors).values({
				churchId: id,
				pastorId,
				role,
				since,
				isPrimary
			});
		}, 'Failed to assign pastor. They may already be assigned to this church.');

		return { assignSuccess: true };
	},

	removePastor: async ({ request }) => {
		const formData = await request.formData();
		const assignmentId = Number(formData.get('assignmentId'));

		if (!assignmentId || isNaN(assignmentId)) {
			return fail(400, { error: 'Invalid assignment ID.' });
		}

		await dbAction(async () => {
			const result = await db.delete(churchPastors).where(eq(churchPastors.id, assignmentId)).returning({ id: churchPastors.id });
			if (result.length === 0) throw new Error('Record not found');
		}, 'Failed to remove pastor assignment.');

		return { removeSuccess: true };
	}
};
