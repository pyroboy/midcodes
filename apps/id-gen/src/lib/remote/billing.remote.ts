import { error } from '@sveltejs/kit';
import { query, command, getRequestEvent } from '$app/server';
import { getUsersData } from '$lib/remote/admin.remote';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { checkSuperAdmin } from '$lib/utils/adminPermissions';

// Use a shared permission utility
async function requireSuperAdminPermissions() {
	const { locals } = getRequestEvent();
	
	if (!checkSuperAdmin(locals)) {
		throw error(403, 'Super admin privileges required.');
	}

	return { user: locals.user, org_id: locals.org_id };
}

export const getBillingSettings = query(async (): Promise<any> => {
	const { org_id } = await requireSuperAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	try {
		// Find settings using Drizzle
		const settings = await db.query.orgSettings.findFirst({
			where: eq(schema.orgSettings.orgId, org_id)
		});

		if (!settings) {
			// Initialize default settings if missing
			const [newSettings] = await db
				.insert(schema.orgSettings)
				.values({
					orgId: org_id,
					paymentsEnabled: true,
					paymentsBypass: false
				})
				.returning();

			return {
				...newSettings,
				updated_at: newSettings.updatedAt?.toISOString() || null
			};
		}

		return {
			...settings,
			updated_at: settings.updatedAt?.toISOString() || null
		};
	} catch (err) {
		console.error('Error loading billing settings:', err);
		throw error(500, 'Failed to load billing settings');
	}
});

import { z } from 'zod';

export const togglePayments = command('unchecked', async ({ enabled, keyword }: any) => {
	const { user, org_id } = await requireSuperAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	if (keyword !== 'TOGGLE_PAYMENTS') {
		throw error(400, 'Keyword confirmation failed. Type TOGGLE_PAYMENTS to proceed.');
	}

	try {
		await db
			.update(schema.orgSettings)
			.set({
				paymentsEnabled: enabled,
				updatedBy: user?.id ?? null,
				updatedAt: new Date()
			})
			.where(eq(schema.orgSettings.orgId, org_id));

		await getBillingSettings().refresh();
		return { success: true };
	} catch (err) {
		console.error('Error toggling payments:', err);
		throw error(500, 'Failed to update payments flag');
	}
});

export const setPaymentsBypass = command('unchecked', async ({ bypass }: any) => {
	const { user, org_id } = await requireSuperAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	try {
		await db
			.update(schema.orgSettings)
			.set({
				paymentsBypass: bypass,
				updatedBy: user!.id,
				updatedAt: new Date()
			})
			.where(eq(schema.orgSettings.orgId, org_id));

		await getBillingSettings().refresh();
		return { success: true };
	} catch (err) {
		console.error('Error setting payments bypass:', err);
		throw error(500, 'Failed to update bypass flag');
	}
});

export const getUsersWithCredits = query(async (): Promise<any[]> => {
	const { org_id } = await requireSuperAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	try {
		const users = await db
			.select({
				id: schema.profiles.id,
				email: schema.profiles.email,
				role: schema.profiles.role,
				credits_balance: schema.profiles.creditsBalance,
				card_generation_count: schema.profiles.cardGenerationCount,
				template_count: schema.profiles.templateCount,
				unlimited_templates: schema.profiles.unlimitedTemplates,
				remove_watermarks: schema.profiles.removeWatermarks,
				updated_at: schema.profiles.updatedAt,
				created_at: schema.profiles.createdAt
			})
			.from(schema.profiles)
			.where(eq(schema.profiles.orgId, org_id))
			.orderBy(desc(schema.profiles.createdAt));

		return users.map((u) => ({
			...u,
			updated_at: u.updated_at?.toISOString() || null,
			created_at: u.created_at?.toISOString() || null
		}));
	} catch (err) {
		console.error('Error loading users with credits:', err);
		throw error(500, 'Failed to load users/credits');
	}
});

export const adjustUserCredits = command('unchecked', async ({ userId, delta, reason }: any) => {
	const { org_id } = await requireSuperAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	try {
		// Fetch current profile within org
		const profile = await db.query.profiles.findFirst({
			where: and(eq(schema.profiles.id, userId), eq(schema.profiles.orgId, org_id)),
			columns: { id: true, creditsBalance: true }
		});

		if (!profile) throw error(404, 'User not found in this organization');

		const before = profile.creditsBalance || 0;
		const after = Math.max(0, before + delta);

		// Update profile
		await db
			.update(schema.profiles)
			.set({
				creditsBalance: after,
				updatedAt: new Date()
			})
			.where(eq(schema.profiles.id, userId));

		// Record transaction
		const description =
			reason || (delta >= 0 ? 'Manual credit addition' : 'Manual credit deduction');

		try {
			await db.insert(schema.creditTransactions).values({
				userId: userId,
				orgId: org_id,
				transactionType: delta >= 0 ? 'bonus' : 'refund',
				amount: delta,
				creditsBefore: before,
				creditsAfter: after,
				description,
				metadata: { adjusted_by: 'super_admin' }
			});
		} catch (txError) {
			// Not fatal to user balance, but log for audit
			console.warn('Failed to write credit transaction', txError);
		}

		await getUsersWithCredits().refresh();
		await getUsersData().refresh();
		return { success: true, newBalance: after };
	} catch (err) {
		console.error('Error adjusting user credits:', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'Failed to update user balance');
	}
});
