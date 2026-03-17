import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// This is a public page, no authentication required
	// We can add analytics tracking or feature flags here if needed

	return {
		meta: {
			title: 'Features - ID-Gen | Professional ID Card Generation Platform',
			description:
				"Discover ID-Gen's powerful features: drag-and-drop template designer, batch processing, enterprise security, and more. Perfect for organizations of all sizes.",
			keywords:
				'ID card generator, template designer, batch processing, enterprise security, organization management',
			ogImage: '/images/features-og.png' // We can add this image later
		},
		stats: {
			organizations: 1000,
			cardsGenerated: 500000,
			uptime: 99.9,
			userRating: 4.9
		}
	};
};
