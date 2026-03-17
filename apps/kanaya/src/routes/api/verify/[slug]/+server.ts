import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { digitalCards, idcards, profiles } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, setHeaders }) => {
	setHeaders({
		'Cache-Control': 'no-cache, no-store, must-revalidate',
		'Access-Control-Allow-Origin': '*'
	});

	const { slug } = params;

	const cards = await db.select().from(digitalCards).where(eq(digitalCards.slug, slug)).limit(1);
	const card = cards[0];

	if (!card) {
		return json(
			{ verified: false, status: 'not_found', message: 'Card not found' },
			{ status: 404 }
		);
	}

	const status = card.status || 'unclaimed';
	const verified = status === 'active';

	// Get owner info if active
	let ownerName = null;
	let ownerEmail = null;
	if (card.ownerId && verified) {
		const [owner] = await db
			.select({ email: profiles.email })
			.from(profiles)
			.where(eq(profiles.id, card.ownerId))
			.limit(1);
		ownerEmail = owner?.email || null;
	}

	// Get profile content for name
	const profileContent = card.profileContent as any;
	if (profileContent?.name) ownerName = profileContent.name;

	return json({
		verified,
		status,
		slug,
		message: verified
			? 'Card is active and verified'
			: status === 'unclaimed'
				? 'Card has not been claimed yet'
				: status === 'suspended'
					? 'Card is temporarily suspended'
					: status === 'banned'
						? 'Card has been banned'
						: status === 'expired'
							? 'Card has expired'
							: 'Unknown status',
		holder: verified ? { name: ownerName, email: ownerEmail } : null,
		checkedAt: new Date().toISOString()
	});
};
