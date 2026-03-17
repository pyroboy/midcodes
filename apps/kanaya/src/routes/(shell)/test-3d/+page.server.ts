import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { idcards } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';

interface CardData {
	id: string;
	template_id: string | null;
	front_image: string | null;
	back_image: string | null;
	created_at: Date | null;
}

export const load: PageServerLoad = async ({ locals }) => {
	const { org_id } = locals;

	if (!org_id) {
		return {
			cards: [] as CardData[]
		};
	}

	try {
		// Fetch recent ID cards for textures using Drizzle
		const cardsData = await db
			.select({
				id: idcards.id,
				template_id: idcards.templateId,
				front_image: idcards.frontImage,
				back_image: idcards.backImage,
				created_at: idcards.createdAt
			})
			.from(idcards)
			.where(eq(idcards.orgId, org_id))
			.orderBy(desc(idcards.createdAt))
			.limit(12);

		return {
			cards: cardsData || []
		};
	} catch (error) {
		console.error('❌ [test-3d] Error fetching cards:', error);
		return {
			cards: []
		};
	}
};
