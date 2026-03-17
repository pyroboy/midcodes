// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { checkSuperAdmin } from '$lib/utils/adminPermissions';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

interface ProfileData {
	credits_balance: number;
	role: string | null;
	email: string | null;
}

// Available roles for emulation (only shown to super admins)
const EMULATION_ROLES = [
	{ value: 'org_admin', label: 'Org Admin' },
	{ value: 'id_gen_admin', label: 'ID Gen Admin' },
	{ value: 'id_gen_encoder', label: 'Encoder' },
	{ value: 'id_gen_printer', label: 'Printer' },
	{ value: 'id_gen_viewer', label: 'Viewer' },
	{ value: 'id_gen_template_designer', label: 'Template Designer' },
	{ value: 'id_gen_auditor', label: 'Auditor' },
	{ value: 'id_gen_accountant', label: 'Accountant' },
	{ value: 'id_gen_user', label: 'User' }
];

export const load: LayoutServerLoad = async ({ locals, depends, setHeaders }) => {
	// Register dependencies for selective invalidation
	depends('app:user-profile');
	depends('app:credits');

	// Cache-control removed to prevent 500 errors and ensuring fresh credit data
	// setHeaders({ 'cache-control': 'private, max-age=60' });

	// Destructure all the auth-related data from locals
	const { session, user, org_id, permissions } = locals;

	// If user is authenticated, fetch their profile with credits
	let userWithProfile: any = user ? { ...user } : null;
	if (user) {
		const [profile] = await db
			.select({
				creditsBalance: profiles.creditsBalance,
				role: profiles.role,
				email: profiles.email
			})
			.from(profiles)
			.where(eq(profiles.id, user.id))
			.limit(1);

		if (profile) {
			userWithProfile = {
				...user,
				credits_balance: profile.creditsBalance,
				role: profile.role,
				email: profile.email || user.email
			};
		}
	}

	// Check if user is super admin for emulation feature
	const isSuperAdmin = checkSuperAdmin(locals);

	return {
		session,
		user: userWithProfile,
		org_id,
		permissions,
		roleEmulation: locals.roleEmulation,
		isSuperAdmin,
		availableRolesForEmulation: isSuperAdmin ? EMULATION_ROLES : []
	};
};
