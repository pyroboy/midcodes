import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase } = locals;

	const { data: assets, error: err } = await supabase
		.from('template_assets')
		.select(`
			*,
			size_preset:template_size_presets(*)
		`)
		.order('created_at', { ascending: false });

	if (err) {
		console.error('Error loading assets:', err);
		throw error(500, 'Failed to load assets');
	}

	return {
		assets: assets ?? []
	};
};
