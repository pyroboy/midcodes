import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { slug } = params;
	const { supabase } = locals;

	// 1. Fetch Digital Card
	const { data: card, error: cardError } = await supabase
		.from('digital_cards')
		.select(`
			*,
			idcards (
				front_image,
				back_image,
				data
			)
		`)
		.eq('slug', slug)
		.single();

	if (cardError || !card) {
		console.error('Digital card not found:', cardError);
		throw error(404, 'Card not found');
	}

	// 2. Check Status & Privacy
	// Note: RLS policies might already handle this if we were using a client with limited permissions,
	// but the server client usually has full access or acts as the user.
	// We want to fetch it even if it's private (to check ownership), then decide what to show.
	// But standard `locals.supabase` is usually scoped to the user if logged in, or anon if not.
	// The RLS policy I added: "Public profiles are viewable by everyone... OR owner".
	// So if RLS is strict, `select().single()` might fail for a private card viewed by anon.
	
	// If the card is private and I'm not the owner, Supabase returns null/error due to RLS.
	// So if we got data, it means we are allowed to see it (Public OR Owner).
	
	// However, we should double check status logic for 'unclaimed'.
	if (card.status === 'unclaimed') {
		// If it's unclaimed, we don't show the profile.
		// We might show a "Not Activated" page or redirect.
		// For now, let's just show a generic message or allow the user to claim if they have the code?
		// But they need to go to /id/claim.
		throw error(404, 'Profile not active');
	}

	// 3. Generate Signed URLs for images
	// Only if we have images.
	const idCard = card.idcards;
	let frontUrl = null;
	let backUrl = null;

	if (idCard) {
		if (idCard.front_image) {
			const { data: frontData } = await supabase.storage
				.from('rendered-id-cards')
				.createSignedUrl(idCard.front_image, 3600); // 1 hour
			frontUrl = frontData?.signedUrl;
		}
		if (idCard.back_image) {
			const { data: backData } = await supabase.storage
				.from('rendered-id-cards')
				.createSignedUrl(idCard.back_image, 3600);
			backUrl = backData?.signedUrl;
		}
	}

	return {
		profile: {
			...card.profile_content,
			status: card.status
		},
		cardImages: {
			front: frontUrl,
			back: backUrl
		},
		theme: card.theme_config,
		isOwner: locals.session?.user?.id === card.owner_id
	};
};
