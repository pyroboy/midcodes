import { error, redirect } from '@sveltejs/kit';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { ProfileData, EmulatedProfile } from '$lib/types/roleEmulation';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, safeGetSession } = locals;
	const { session } = await safeGetSession();
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	// Fetch templates based on role and organization
	let query = supabase.from('templates').select('*').order('created_at', { ascending: false });

	const { data: templates, error: err } = await query;

	if (err) {
		console.error('Error fetching templates:', err);
		throw error(500, 'Error fetching templates');
	}

	return {
		templates
	};
};
