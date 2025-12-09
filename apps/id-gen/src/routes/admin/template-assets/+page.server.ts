import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase } = locals;

	// Fetch size presets from database
	const { data: sizePresets, error: presetsError } = await supabase
		.from('template_size_presets')
		.select('*')
		.eq('is_active', true)
		.order('sort_order');

	if (presetsError) {
		console.error('Error fetching size presets:', presetsError);
	}

	return {
		sizePresets: sizePresets ?? []
	};
};
