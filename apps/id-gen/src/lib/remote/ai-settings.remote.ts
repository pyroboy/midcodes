import { error } from '@sveltejs/kit';
import { query, command, getRequestEvent } from '$app/server';
import { z } from 'zod';
import { checkSuperAdmin } from '$lib/utils/adminPermissions';
import { db } from '$lib/server/db';
import { aiSettings, aiGenerations, profiles } from '$lib/server/schema';
import { eq, and, gte, sql, desc, inArray } from 'drizzle-orm';

// Helper to require super admin permissions (AI settings are super admin only)
// Uses checkSuperAdmin which properly handles role emulation
async function requireSuperAdminPermissions() {
	const { locals } = getRequestEvent();
	if (!checkSuperAdmin(locals)) {
		throw error(403, 'Super admin privileges required.');
	}
	return { user: locals.user, org_id: locals.org_id };
}



// Type definitions
interface AISettings {
	id: string;
	orgId: string;
	apiKeyMasked: string;
	apiKeyLastFour: string;
	provider: string;
	model: string;
	creditsBalance: number;
	creditsUsed: number;
	isEnabled: boolean;
	rateLimitPerMinute: number;
	createdAt: Date | null;
	updatedAt: Date | null;
}

interface AIUsageStats {
	totalGenerations: number;
	generationsThisMonth: number;
	creditsUsedThisMonth: number;
	averageCreditsPerGeneration: number;
	topUsers: { email: string; count: number }[];
}

// ==================== GET AI SETTINGS ====================

export const getAISettings = query(async (): Promise<AISettings | null> => {
	const { org_id } = await requireSuperAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const data = await db.query.aiSettings.findFirst({
		where: eq(aiSettings.orgId, org_id)
	});

	if (!data) return null;

	// Mask the API key for display
	return {
		...data,
		apiKeyMasked: data.apiKey ? `${'•'.repeat(32)}${data.apiKey.slice(-4)}` : '',
		apiKeyLastFour: data.apiKey ? data.apiKey.slice(-4) : ''
	} as any;
});

// ==================== GET AI USAGE STATS ====================

export const getAIUsageStats = query(async (): Promise<AIUsageStats> => {
	const { org_id } = await requireSuperAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const thisMonth = new Date();
	thisMonth.setDate(1);
	thisMonth.setHours(0, 0, 0, 0);

	try {
		// Get total generations count
		const totalGenerationsResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(aiGenerations)
			.where(eq(aiGenerations.orgId, org_id));
		const totalGenerations = Number(totalGenerationsResult[0]?.count || 0);

		// Get generations this month
		const generationsThisMonthResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(aiGenerations)
			.where(
				and(
					eq(aiGenerations.orgId, org_id),
					gte(aiGenerations.createdAt, thisMonth)
				)
			);
		const generationsThisMonth = Number(generationsThisMonthResult[0]?.count || 0);

		// Get detailed usage for this month
		const usage = await db
			.select({ creditsUsed: aiGenerations.creditsUsed, userId: aiGenerations.userId })
			.from(aiGenerations)
			.where(
				and(
					eq(aiGenerations.orgId, org_id),
					gte(aiGenerations.createdAt, thisMonth)
				)
			);

		const creditsUsedThisMonth = usage.reduce((sum, u) => sum + (u.creditsUsed || 0), 0);
		const averageCreditsPerGeneration = usage.length > 0 ? creditsUsedThisMonth / usage.length : 0;

		// Get top users
		const userCounts = new Map<string, number>();
		usage.forEach(u => {
			userCounts.set(u.userId, (userCounts.get(u.userId) || 0) + 1);
		});

		// Fetch user emails
		const userIds = Array.from(userCounts.keys());
		let topUsers: { email: string; count: number }[] = [];
		
		if (userIds.length > 0) {
			const users = await db
				.select({ id: profiles.id, email: profiles.email })
				.from(profiles)
				.where(inArray(profiles.id, userIds));

			const userMap = new Map<string, string>(users.map(u => [u.id, u.email || 'Unknown']));
			topUsers = Array.from(userCounts.entries())
				.sort((a, b) => b[1] - a[1])
				.slice(0, 5)
				.map(([id, count]) => ({
					email: userMap.get(id) || 'Unknown',
					count
				}));
		}

		return {
			totalGenerations,
			generationsThisMonth,
			creditsUsedThisMonth,
			averageCreditsPerGeneration,
			topUsers
		};
	} catch (e) {
		console.error('Error fetching AI stats:', e);
		return {
			totalGenerations: 0,
			generationsThisMonth: 0,
			creditsUsedThisMonth: 0,
			averageCreditsPerGeneration: 0,
			topUsers: []
		};
	}
});

// ==================== UPDATE AI SETTINGS ====================

const updateSettingsSchema = z.object({
	api_key: z.string().optional(),
	provider: z.string().default('nano_banana'),
	model: z.string().default('default'),
	is_enabled: z.boolean().default(true),
	rate_limit_per_minute: z.number().min(1).max(1000).default(60)
});

export const updateAISettings = command('unchecked', async (input: any) => {
	const { org_id } = await requireSuperAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const validated = updateSettingsSchema.parse(input);

	const updateData: any = {
		orgId: org_id,
		provider: validated.provider,
		model: validated.model,
		isEnabled: validated.is_enabled,
		rateLimitPerMinute: validated.rate_limit_per_minute,
		updatedAt: new Date()
	};

	if (validated.api_key) {
		updateData.apiKey = validated.api_key;
	}

	await db
		.insert(aiSettings)
		.values({
			...updateData,
			apiKey: updateData.apiKey || '',
			creditsBalance: 0,
			creditsUsed: 0
		})
		.onConflictDoUpdate({
			target: aiSettings.orgId,
			set: updateData
		});

	return { success: true };
});

// ==================== ADD AI CREDITS ====================

const addCreditsSchema = z.object({
	amount: z.number().min(1),
	reason: z.string().optional()
});

export const addAICredits = command('unchecked', async (input: any) => {
	const { org_id } = await requireSuperAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const validated = addCreditsSchema.parse(input);

	const result = await db
		.update(aiSettings)
		.set({
			creditsBalance: sql`${aiSettings.creditsBalance} + ${validated.amount}`,
			updatedAt: new Date()
		})
		.where(eq(aiSettings.orgId, org_id))
		.returning({ newBalance: aiSettings.creditsBalance });

	if (result.length === 0) {
		throw error(400, 'AI settings not configured for this organization');
	}

	return { success: true, newBalance: result[0].newBalance };
});

// ==================== ROTATE API KEY ====================

export const rotateAPIKey = command('unchecked', async ({ newKey }: any) => {
	const { org_id } = await requireSuperAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	if (!newKey || newKey.length < 10) {
		throw error(400, 'Invalid API key');
	}

	await db
		.update(aiSettings)
		.set({
			apiKey: newKey,
			updatedAt: new Date()
		})
		.where(eq(aiSettings.orgId, org_id));

	return { success: true };
});

// ==================== DELETE API KEY ====================

export const deleteAPIKey = command(async () => {
	const { org_id } = await requireSuperAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	await db
		.update(aiSettings)
		.set({
			apiKey: '',
			isEnabled: false,
			updatedAt: new Date()
		})
		.where(eq(aiSettings.orgId, org_id));

	return { success: true };
});
