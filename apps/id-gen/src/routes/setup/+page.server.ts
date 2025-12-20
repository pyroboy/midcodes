import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { user, profiles, organizations } from '$lib/server/schema';
import { auth } from '$lib/server/auth';
import { sql, eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	// Setup page is always accessible (temporary for initial deployment)
	return {
		setupAvailable: true
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		// Double check security
		const userCount = await db.select({ count: sql<number>`count(*)` }).from(user);
		if (Number(userCount[0]?.count || 0) > 0) {
			return fail(403, { error: 'Setup already completed' });
		}

		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const name = formData.get('name') as string;
		const orgName = formData.get('orgName') as string;

		if (!email || !password || !name || !orgName) {
			return fail(400, { error: 'All fields are required' });
		}

		try {
			// 1. Create user via Better Auth
			const userRes = await auth.api.signUpEmail({
				body: {
					email,
					password,
					name
				}
			});

			if (!userRes) throw new Error('Failed to create user');

			// 2. Fetch created user to get ID
			const newUser = await db.query.user.findFirst({
				where: (users, { eq }) => eq(users.email, email)
			});

			if (!newUser) throw new Error('User created but not found');

			// 3. Promote to superadmin and set org details
			// Create 'Default Organization'
			const [newOrg] = await db
				.insert(organizations)
				.values({
					name: orgName
				})
				.returning();

			// Update profile (created by hook) to be super_admin and link to org
			await db
				.update(profiles)
				.set({
					role: 'super_admin',
					orgId: newOrg.id
				})
				.where(eq(profiles.id, newUser.id));

			return { success: true };
		} catch (err: any) {
			if (isRedirect(err)) throw err;
			console.error('Setup error:', err);
			return fail(500, { error: err.message || 'Setup failed' });
		}
	}
};
