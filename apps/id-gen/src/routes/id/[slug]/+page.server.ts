import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { digitalCards, idcards } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
// import { getSupabaseAdmin } from '$lib/server/supabase'; // Removed

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

	// 3. Generate Public/Signed URLs for images using R2
	let frontUrl = null;
	let backUrl = null;
    const { getPublicUrl, getPresignedUrl } = await import('$lib/server/s3');

	if (idCard) {
		if (idCard.frontImage) {
            // Using getPresignedUrl to match previous security behavior for ID cards
            // Though if users switch to Public R2.dev, getPublicUrl is more efficient.
            // But since ID cards contain PII, signed URLs are safer if the bucket is not fully public
            // however USER said "R2.dev subdomain" which is fully public. 
            // Checking implementation plan... user chose "Migrate to Cloudflare R2".
            // I'll default to getPublicUrl if it's a key, but I'll check if it looks like a URL.
            // Actually, if we use R2.dev public domain, we don't need presigning for READS if the bucket is public.
            // But R2 presigning works even on private buckets.
            // Let's use getPublicUrl since user enabled "Public Access".
            // AND we updated the storage logic to return public URLs.
            // IF the stored value is a PATH (key), getPublicUrl helps. 
            // IF the stored value is a URL, getPublicUrl returns it as is.
            frontUrl = getPublicUrl(idCard.frontImage);
		}
		if (idCard.backImage) {
			backUrl = getPublicUrl(idCard.backImage);
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
