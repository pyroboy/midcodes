// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

interface ProfileData {
	credits_balance: number;
	role: string | null;
	email: string | null;
}

export const load: LayoutServerLoad = async ({ locals }) => {
	// Destructure all the auth-related data from locals
	const { session, user, org_id, permissions, supabase } = locals;

	// If user is authenticated, fetch their profile with credits
	let userWithProfile: Record<string, unknown> | null = user ? { ...user } : null;
	if (user && supabase) {
		const { data } = await supabase
			.from('profiles')
			.select('credits_balance, role, email')
			.eq('id', user.id)
			.single();

		const profile = data as ProfileData | null;
		if (profile) {
			userWithProfile = {
				...user,
				credits_balance: profile.credits_balance,
				role: profile.role,
				email: profile.email || user.email
			};
		}
	}

	return {
		session,
		user: userWithProfile,
		org_id,
		permissions
	};
};
