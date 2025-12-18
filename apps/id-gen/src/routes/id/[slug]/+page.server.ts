import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { digitalCards, idcards } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { getSupabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { slug } = params;

	// 1. Fetch Digital Card using Drizzle
    // Drizzle doesn't automatically join nested relations like Supabase unless using db.query and relations are defined
    // We'll fetch explicitly
	const cards = await db.select()
		.from(digitalCards)
		.where(eq(digitalCards.slug, slug))
        .limit(1);

	const card = cards[0];

	if (!card) {
		throw error(404, 'Card not found');
	}
	
    // Fetch associated ID card
    const associatedIdCards = await db.select()
        .from(idcards)
        .where(eq(idcards.id, card.linkedIdCardId!))
        .limit(1);
    
    const idCard = associatedIdCards[0];
    const cardData = {
        ...card,
        idcards: idCard
    };

	// 2. Check Status & Privacy
    // If status is unclaimed, hide it
	if (cardData.status === 'unclaimed') {
		throw error(404, 'Profile not active');
	}

	// 3. Generate Signed URLs for images using Supabase Admin
	let frontUrl = null;
	let backUrl = null;
    const supabaseAdmin = getSupabaseAdmin();

	if (idCard) {
		if (idCard.frontImage) {
			const { data: frontData } = await supabaseAdmin.storage
				.from('rendered-id-cards')
				.createSignedUrl(idCard.frontImage, 3600); // 1 hour
			frontUrl = frontData?.signedUrl || null;
		}
		if (idCard.backImage) {
			const { data: backData } = await supabaseAdmin.storage
				.from('rendered-id-cards')
				.createSignedUrl(idCard.backImage, 3600);
			backUrl = backData?.signedUrl || null;
		}
	}

	return {
		profile: {
			...(cardData.profileContent as any),
			status: cardData.status
		},
		cardImages: {
			front: frontUrl,
			back: backUrl
		},
		theme: cardData.themeConfig,
		isOwner: locals.session?.user?.id === cardData.ownerId
	};
};
