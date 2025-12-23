import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { digitalCards, idcards } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

// On-demand rendering - pages render on first visit, then cached at edge
// Much better for 10k+ pages than prerender=true (which rebuilds ALL on deploy)
export const prerender = 'auto';

// Status type for clarity
type CardStatus = 'unclaimed' | 'active' | 'banned' | 'suspended' | 'expired';

export const load: PageServerLoad = async ({ params, locals, setHeaders }) => {
	// Set cache headers for Cloudflare edge caching
	// - public: cacheable by CDN
	// - max-age=3600: fresh for 1 hour
	// - stale-while-revalidate=86400: serve stale for 1 day while refreshing in background
	setHeaders({
		'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
	});
	const { slug } = params;

	// 1. Fetch Digital Card using Drizzle
	const cards = await db.select().from(digitalCards).where(eq(digitalCards.slug, slug)).limit(1);

	const card = cards[0];

	if (!card) {
		throw error(404, 'Card not found');
	}

	const status = (card.status as CardStatus) || 'unclaimed';

	// 2. Handle banned/suspended - return minimal data with status message
	if (status === 'banned' || status === 'suspended') {
		return {
			status,
			statusMessage:
				status === 'banned'
					? 'This profile has been banned and is no longer accessible.'
					: 'This profile has been temporarily suspended.',
			profile: null,
			cardImages: { front: null, back: null },
			theme: null,
			isOwner: false,
			canClaim: false,
			claimTokenValid: false
		};
	}

	// 3. Fetch associated ID card (needed for unclaimed, active, expired)
	let idCard = null;
	let frontUrl = null;
	let backUrl = null;
	let frontLowRes = null;
	let backLowRes = null;

	if (card.linkedIdCardId) {
		const associatedIdCards = await db
			.select()
			.from(idcards)
			.where(eq(idcards.id, card.linkedIdCardId))
			.limit(1);
		idCard = associatedIdCards[0];

		if (idCard) {
			const { getPublicUrl } = await import('$lib/server/s3');
			if (idCard.frontImage) frontUrl = getPublicUrl(idCard.frontImage);
			if (idCard.backImage) backUrl = getPublicUrl(idCard.backImage);
			if (idCard.frontImageLowRes) frontLowRes = getPublicUrl(idCard.frontImageLowRes);
			if (idCard.backImageLowRes) backLowRes = getPublicUrl(idCard.backImageLowRes);
		}
	}

	// 4. For unclaimed - show card with claim CTA
	if (status === 'unclaimed') {
		return {
			status,
			statusMessage: null,
			profile: null,
			cardImages: {
				front: frontUrl,
				back: backUrl,
				frontLowRes,
				backLowRes
			},
			theme: card.themeConfig,
			isOwner: false,
			canClaim: true,
			claimTokenValid:
				card.claimToken && card.claimTokenExpiresAt
					? new Date(card.claimTokenExpiresAt) > new Date()
					: false,
			claimToken: card.claimToken
		};
	}

	// 5. For expired - show card with re-claim option
	if (status === 'expired') {
		return {
			status,
			statusMessage: 'This profile has expired. It can be re-claimed by the owner.',
			profile: card.profileContent,
			cardImages: {
				front: frontUrl,
				back: backUrl,
				frontLowRes,
				backLowRes
			},
			theme: card.themeConfig,
			isOwner: locals.session?.user?.id === card.ownerId,
			canClaim: locals.session?.user?.id === card.ownerId,
			claimTokenValid: false
		};
	}

	// 6. For active - full profile display (existing behavior)
	return {
		status,
		statusMessage: null,
		profile: {
			...(card.profileContent as any)
		},
		cardImages: {
			front: frontUrl,
			back: backUrl,
			frontLowRes,
			backLowRes
		},
		theme: card.themeConfig,
		isOwner: locals.session?.user?.id === card.ownerId,
		canClaim: false,
		claimTokenValid: false
	};
};
