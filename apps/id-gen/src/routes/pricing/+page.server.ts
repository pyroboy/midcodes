import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, org_id, user } = locals;
	let paymentsEnabled = true;

	// Check if payments are enabled for this organization
	if (org_id) {
		const { data: settings } = await supabase
			.from('org_settings')
			.select('payments_enabled')
			.eq('org_id', org_id)
			.single();

		paymentsEnabled = settings?.payments_enabled ?? true;
	}

	return {
		user,
		paymentsEnabled
	};
};
