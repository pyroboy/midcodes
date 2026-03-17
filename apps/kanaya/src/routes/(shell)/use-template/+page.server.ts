import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { templates } from '$lib/server/schema';
import { desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, depends }) => {
	// Register dependency for selective invalidation when templates are updated
	depends('app:templates');

	const { session } = locals;
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	try {
		const templatesData = await db.select().from(templates).orderBy(desc(templates.createdAt));

		return {
			templates: templatesData.map((t) => ({
				...t,
				user_id: t.userId,
				org_id: t.orgId,
				width_pixels: t.widthPixels,
				height_pixels: t.heightPixels,
				front_background: t.frontBackground,
				back_background: t.backBackground,
				template_elements: t.templateElements
			}))
		};
	} catch (err) {
		console.error('Error fetching templates:', err);
		throw error(500, 'Error fetching templates');
	}
};
