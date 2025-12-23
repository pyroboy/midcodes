import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { checkSuperAdmin, checkAdmin, hasRole } from '$lib/utils/adminPermissions';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/schema';
import { eq, and, desc, sql, ne, inArray } from 'drizzle-orm';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user, org_id } = locals;

	// Ensure we have parent data (user auth and permissions)
	const parentData = await parent();

	if (!org_id) {
		throw error(500, 'Organization ID not found');
	}

	try {
		// Get all users in the organization with Drizzle
		const users = await db
			.select({
				id: profiles.id,
				email: profiles.email,
				role: profiles.role,
				created_at: profiles.createdAt,
				updated_at: profiles.updatedAt
			})
			.from(profiles)
			.where(eq(profiles.orgId, org_id))
			.orderBy(desc(profiles.createdAt));

		return {
			users: users || [],
			currentUserId: user?.id,
			currentUserRole: (user as any)?.role,
			organization: parentData.organization
		};
	} catch (err) {
		console.error('Error loading user management data:', err);
		throw error(500, 'Failed to load user management data');
	}
};

export const actions: Actions = {
	addUser: async ({ request, locals }) => {
		const { user, org_id } = locals;

		// Use robust permission check that respects role emulation
		if (!hasRole(locals, ['super_admin', 'org_admin'])) {
			return fail(403, { error: 'Insufficient permissions to add users' });
		}

		try {
			const formData = await request.formData();
			const email = formData.get('email') as string;
			const role = formData.get('role') as string;

			if (!email || !role) {
				return fail(400, { error: 'Email and role are required' });
			}

			// Validate email format
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				return fail(400, { error: 'Invalid email format' });
			}

			// Validate role
			const validRoles = ['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user'];
			if (!validRoles.includes(role)) {
				return fail(400, { error: 'Invalid role specified' });
			}

			// Check if user already exists with Drizzle
			const existingUsers = await db
				.select({ id: profiles.id })
				.from(profiles)
				.where(and(eq(profiles.email, email), eq(profiles.orgId, org_id!)))
				.limit(1);

			if (existingUsers.length > 0) {
				return fail(400, { error: 'User with this email already exists in your organization' });
			}

			// Create user via Better Auth - sign up with temporary password
			// Note: In production, you'd want to use an invitation flow
			const tempPassword = `Temp${Date.now()}!${Math.random().toString(36).slice(2, 10)}`;

			try {
				// Use Better Auth signUp endpoint
				const signUpResult = await auth.api.signUpEmail({
					body: {
						email,
						password: tempPassword,
						name: email.split('@')[0]
					}
				});

				if (!signUpResult?.user?.id) {
					return fail(500, { error: 'Failed to create user account' });
				}

				// Create profile with Drizzle
				await db.insert(profiles).values({
					id: signUpResult.user.id,
					email,
					role: role as any,
					orgId: org_id!,
					createdAt: new Date(),
					updatedAt: new Date()
				});

				// Get updated users list
				const updatedUsers = await db
					.select({
						id: profiles.id,
						email: profiles.email,
						role: profiles.role,
						created_at: profiles.createdAt,
						updated_at: profiles.updatedAt
					})
					.from(profiles)
					.where(eq(profiles.orgId, org_id!))
					.orderBy(desc(profiles.createdAt));

				return {
					success: true,
					message: `User ${email} added successfully. Password reset required.`,
					updatedUsers: updatedUsers || []
				};
			} catch (authErr: any) {
				console.error('Better Auth signup error:', authErr);
				return fail(500, { error: `Failed to create user: ${authErr.message || 'Unknown error'}` });
			}
		} catch (err) {
			console.error('Error in addUser action:', err);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	},

	updateUserRole: async ({ request, locals }) => {
		const { user, org_id } = locals;

		// Use robust permission check that respects role emulation
		if (!hasRole(locals, ['super_admin', 'org_admin'])) {
			return fail(403, { error: 'Insufficient permissions to update user roles' });
		}

		try {
			const formData = await request.formData();
			const userId = formData.get('userId') as string;
			const newRole = formData.get('role') as string;

			if (!userId || !newRole) {
				return fail(400, { error: 'User ID and role are required' });
			}

			// Validate the new role
			const validRoles = ['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user'];
			if (!validRoles.includes(newRole)) {
				return fail(400, { error: 'Invalid role specified' });
			}

			// Prevent self role changes to lower privilege (safety check)
			const isSuperAdmin = checkSuperAdmin(locals);
			if (userId === user?.id && isSuperAdmin && !['super_admin'].includes(newRole)) {
				return fail(400, { error: 'Cannot downgrade your own super admin role' });
			}

			// Get current user to check permissions with Drizzle
			const targetUsers = await db
				.select({ role: profiles.role })
				.from(profiles)
				.where(and(eq(profiles.id, userId), eq(profiles.orgId, org_id!)))
				.limit(1);

			if (targetUsers.length === 0) {
				return fail(500, { error: 'Failed to find user' });
			}

			const targetUser = targetUsers[0];

			// Only super_admin can modify super_admin roles
			if (targetUser.role === 'super_admin' && !isSuperAdmin) {
				return fail(403, { error: 'Only super administrators can modify super admin roles' });
			}

			// Only super_admin can create super_admin roles
			if (newRole === 'super_admin' && !isSuperAdmin) {
				return fail(403, { error: 'Only super administrators can assign super admin roles' });
			}

			// Update user role with Drizzle
			await db
				.update(profiles)
				.set({
					role: newRole as any,
					updatedAt: new Date()
				})
				.where(and(eq(profiles.id, userId), eq(profiles.orgId, org_id!)));

			// Get updated users list
			const updatedUsers = await db
				.select({
					id: profiles.id,
					email: profiles.email,
					role: profiles.role,
					created_at: profiles.createdAt,
					updated_at: profiles.updatedAt
				})
				.from(profiles)
				.where(eq(profiles.orgId, org_id!))
				.orderBy(desc(profiles.createdAt));

			return {
				success: true,
				message: 'User role updated successfully',
				updatedUsers: updatedUsers || []
			};
		} catch (err) {
			console.error('Error in updateUserRole action:', err);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	},

	deleteUser: async ({ request, locals }) => {
		const { user, org_id } = locals;

		// Use robust permission check that respects role emulation
		if (!hasRole(locals, ['super_admin', 'org_admin'])) {
			return fail(403, { error: 'Insufficient permissions to delete users' });
		}

		try {
			const formData = await request.formData();
			const userId = formData.get('userId') as string;

			if (!userId) {
				return fail(400, { error: 'User ID is required' });
			}

			// Prevent self-deletion
			if (userId === user?.id) {
				return fail(400, { error: 'Cannot delete your own account' });
			}

			// Get target user details with Drizzle
			const targetUsers = await db
				.select({ role: profiles.role, email: profiles.email })
				.from(profiles)
				.where(and(eq(profiles.id, userId), eq(profiles.orgId, org_id!)))
				.limit(1);

			if (targetUsers.length === 0) {
				return fail(500, { error: 'Failed to find user' });
			}

			const targetUser = targetUsers[0];

			// Check if this is the last admin
			const adminRoles = ['super_admin', 'org_admin'];
			if (adminRoles.includes(targetUser.role || '')) {
				const adminCountResult = await db
					.select({ count: sql<number>`count(*)` })
					.from(profiles)
					.where(
						and(
							eq(profiles.orgId, org_id!),
							inArray(profiles.role, adminRoles as any),
							ne(profiles.id, userId)
						)
					);

				const adminCount = Number(adminCountResult[0]?.count || 0);
				if (adminCount === 0) {
					return fail(400, {
						error: 'Cannot delete the last administrator in the organization'
					});
				}
			}

			// Delete profile with Drizzle
			await db.delete(profiles).where(and(eq(profiles.id, userId), eq(profiles.orgId, org_id!)));

			// Note: Better Auth user table deletion would require auth.api.deleteUser if available
			// For now, we just delete the profile

			// Get updated users list
			const updatedUsers = await db
				.select({
					id: profiles.id,
					email: profiles.email,
					role: profiles.role,
					created_at: profiles.createdAt,
					updated_at: profiles.updatedAt
				})
				.from(profiles)
				.where(eq(profiles.orgId, org_id!))
				.orderBy(desc(profiles.createdAt));

			return {
				success: true,
				message: `User ${targetUser.email} deleted successfully`,
				updatedUsers: updatedUsers || []
			};
		} catch (err) {
			console.error('Error in deleteUser action:', err);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	}
};
