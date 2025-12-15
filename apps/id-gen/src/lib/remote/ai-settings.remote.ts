import { error } from '@sveltejs/kit';
import { query, command, getRequestEvent } from '$app/server';
import { z } from 'zod';
import { checkSuperAdmin } from '$lib/utils/adminPermissions';

// Helper to require super admin permissions (AI settings are super admin only)
// Uses checkSuperAdmin which properly handles role emulation
async function requireSuperAdminPermissions() {
	const { locals } = getRequestEvent();
	const { user } = locals;
	if (!checkSuperAdmin(locals)) {
		throw error(403, 'Super admin privileges required.');
	}
	return { user, supabase: locals.supabase as any, org_id: locals.org_id };
}

// Type definitions
interface AISettings {
	id: string;
	org_id: string;
	api_key_masked: string;
	api_key_last_four: string;
	provider: string;
	model: string;
	credits_balance: number;
	credits_used: number;
	is_enabled: boolean;
	rate_limit_per_minute: number;
	created_at: string;
	updated_at: string;
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
	const { supabase, org_id } = await requireSuperAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	// First check if the ai_settings table exists
	const { data, error: fetchError } = await supabase
		.from('ai_settings')
		.select('*')
		.eq('org_id', org_id)
		.single();

	if (fetchError && fetchError.code !== 'PGRST116') {
		// PGRST116 = no rows returned, which is fine for new orgs
		// If it's a different error (like table doesn't exist), return null gracefully
		console.error('Error fetching AI settings:', fetchError);
		return null;
	}

	if (!data) return null;

	// Mask the API key for display
	return {
		...data,
		api_key_masked: data.api_key ? `${'•'.repeat(32)}${data.api_key.slice(-4)}` : '',
		api_key_last_four: data.api_key ? data.api_key.slice(-4) : ''
	};
});

// ==================== GET AI USAGE STATS ====================

export const getAIUsageStats = query(async (): Promise<AIUsageStats> => {
	const { supabase, org_id } = await requireSuperAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const thisMonth = new Date();
	thisMonth.setDate(1);
	thisMonth.setHours(0, 0, 0, 0);

	// Try to get AI generation data if the table exists
	try {
		const [
			{ count: totalGenerations },
			{ count: generationsThisMonth },
			{ data: usageData }
		] = await Promise.all([
			supabase.from('ai_generations').select('*', { count: 'exact', head: true }).eq('org_id', org_id),
			supabase.from('ai_generations').select('*', { count: 'exact', head: true })
				.eq('org_id', org_id)
				.gte('created_at', thisMonth.toISOString()),
			supabase.from('ai_generations')
				.select('credits_used, user_id')
				.eq('org_id', org_id)
				.gte('created_at', thisMonth.toISOString())
		]);

		const usage = usageData as { credits_used: number; user_id: string }[] || [];
		const creditsUsedThisMonth = usage.reduce((sum, u) => sum + (u.credits_used || 0), 0);
		const averageCreditsPerGeneration = usage.length > 0 ? creditsUsedThisMonth / usage.length : 0;

		// Get top users
		const userCounts = new Map<string, number>();
		usage.forEach(u => {
			userCounts.set(u.user_id, (userCounts.get(u.user_id) || 0) + 1);
		});

		// Fetch user emails
		const userIds = Array.from(userCounts.keys());
		const { data: users } = await supabase
			.from('profiles')
			.select('id, email')
			.in('id', userIds);

		const userMap = new Map<string, string>((users || []).map((u: any) => [u.id, u.email as string]));
		const topUsers = Array.from(userCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([id, count]) => ({
				email: (userMap.get(id) || 'Unknown') as string,
				count
			}));

		return {
			totalGenerations: totalGenerations || 0,
			generationsThisMonth: generationsThisMonth || 0,
			creditsUsedThisMonth,
			averageCreditsPerGeneration,
			topUsers
		};
	} catch {
		// Table doesn't exist yet, return empty stats
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
	const { supabase, org_id } = await requireSuperAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const validated = updateSettingsSchema.parse(input);

	// Check if settings exist
	const { data: existing } = await supabase
		.from('ai_settings')
		.select('id')
		.eq('org_id', org_id)
		.single();

	if (existing) {
		// Update existing
		const updateData: Record<string, any> = {
			provider: validated.provider,
			model: validated.model,
			is_enabled: validated.is_enabled,
			rate_limit_per_minute: validated.rate_limit_per_minute,
			updated_at: new Date().toISOString()
		};

		// Only update API key if provided
		if (validated.api_key) {
			updateData.api_key = validated.api_key;
		}

		const { error: updateError } = await supabase
			.from('ai_settings')
			.update(updateData)
			.eq('org_id', org_id);

		if (updateError) throw error(500, 'Failed to update AI settings');
	} else {
		// Create new
		const { error: insertError } = await supabase
			.from('ai_settings')
			.insert({
				org_id,
				api_key: validated.api_key || '',
				provider: validated.provider,
				model: validated.model,
				is_enabled: validated.is_enabled,
				rate_limit_per_minute: validated.rate_limit_per_minute,
				credits_balance: 0,
				credits_used: 0
			});

		if (insertError) throw error(500, 'Failed to create AI settings');
	}

	return { success: true };
});

// ==================== ADD AI CREDITS ====================

const addCreditsSchema = z.object({
	amount: z.number().min(1),
	reason: z.string().optional()
});

export const addAICredits = command('unchecked', async (input: any) => {
	const { supabase, org_id } = await requireSuperAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const validated = addCreditsSchema.parse(input);

	const { data: settings } = await supabase
		.from('ai_settings')
		.select('credits_balance')
		.eq('org_id', org_id)
		.single();

	if (!settings) throw error(400, 'AI settings not configured');

	const newBalance = (settings.credits_balance || 0) + validated.amount;

	const { error: updateError } = await supabase
		.from('ai_settings')
		.update({ 
			credits_balance: newBalance,
			updated_at: new Date().toISOString()
		})
		.eq('org_id', org_id);

	if (updateError) throw error(500, 'Failed to add credits');

	return { success: true, newBalance };
});

// ==================== ROTATE API KEY ====================

export const rotateAPIKey = command('unchecked', async ({ newKey }: any) => {
	const { supabase, org_id } = await requireSuperAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	if (!newKey || newKey.length < 10) {
		throw error(400, 'Invalid API key');
	}

	const { error: updateError } = await supabase
		.from('ai_settings')
		.update({ 
			api_key: newKey,
			updated_at: new Date().toISOString()
		})
		.eq('org_id', org_id);

	if (updateError) throw error(500, 'Failed to rotate API key');

	return { success: true };
});

// ==================== DELETE API KEY ====================

export const deleteAPIKey = command(async () => {
	const { supabase, org_id } = await requireSuperAdminPermissions();
	if (!org_id) throw error(500, 'Org ID missing');

	const { error: updateError } = await supabase
		.from('ai_settings')
		.update({ 
			api_key: '',
			is_enabled: false,
			updated_at: new Date().toISOString()
		})
		.eq('org_id', org_id);

	if (updateError) throw error(500, 'Failed to delete API key');

	return { success: true };
});
