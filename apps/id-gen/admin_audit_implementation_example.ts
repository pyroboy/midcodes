// Example updates to billing.remote.ts to use the new admin_audit table
// This shows how to add audit entries for payment toggles and credit adjustments

import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { query, command, getRequestEvent } from '$app/server';
import { getUsersData } from './admin.remote'; // for refreshing users after credit changes

// Reuse or import from admin.remote.ts
async function requireSuperAdminPermissions() {
	const { locals } = getRequestEvent();
	const { user } = locals;
	if (user?.role !== 'super_admin') throw error(403, 'Super admin privileges required.');
	return { user, supabase: locals.supabase, org_id: locals.org_id };
}

export const togglePayments = command(
	v.object({
		enabled: v.boolean(),
		keyword: v.pipe(v.string(), v.trim(), v.minLength(1))
	}),
	async ({ enabled, keyword }) => {
		const { user, supabase, org_id } = await requireSuperAdminPermissions();

		if (keyword !== 'TOGGLE_PAYMENTS') {
			throw error(400, 'Keyword confirmation failed. Type TOGGLE_PAYMENTS to proceed.');
		}

		// Get current setting for audit trail
		const { data: currentSettings } = await supabase
			.from('org_settings')
			.select('payments_enabled')
			.eq('org_id', org_id)
			.single();

		const previousEnabled = currentSettings?.payments_enabled;

		// Update org_settings
		const { error: updateError } = await supabase
			.from('org_settings')
			.update({
				payments_enabled: enabled,
				updated_by: user.id,
				updated_at: new Date().toISOString()
			})
			.eq('org_id', org_id);

		if (updateError) throw error(500, 'Failed to update payments flag');

		// Create audit entry
		const { error: auditError } = await supabase.rpc('insert_admin_audit', {
			p_org_id: org_id,
			p_admin_id: user.id,
			p_action: 'payment_toggle',
			p_target_type: 'org_settings',
			p_target_id: null, // org-level setting
			p_metadata: {
				previous: previousEnabled,
				new: enabled,
				timestamp: new Date().toISOString()
			}
		});

		if (auditError) {
			// Log but don't fail the operation if audit fails
			console.warn('Failed to create audit entry:', auditError);
		}

		// Log to console as well (existing implementation)
		console.info('[Payment Command]', {
			action: 'payment_toggle_changed',
			userId: user.id,
			enabled,
			updated_by: user.id,
			timestamp: new Date().toISOString()
		});

		await getBillingSettings().refresh();
		return { success: true };
	}
);

export const setPaymentsBypass = command(v.object({ bypass: v.boolean() }), async ({ bypass }) => {
	const { user, supabase, org_id } = await requireSuperAdminPermissions();

	// Get current setting for audit trail
	const { data: currentSettings } = await supabase
		.from('org_settings')
		.select('payments_bypass')
		.eq('org_id', org_id)
		.single();

	const previousBypass = currentSettings?.payments_bypass;

	// Update org_settings
	const { error: updateError } = await supabase
		.from('org_settings')
		.update({
			payments_bypass: bypass,
			updated_by: user.id,
			updated_at: new Date().toISOString()
		})
		.eq('org_id', org_id);

	if (updateError) throw error(500, 'Failed to update bypass flag');

	// Create audit entry
	const { error: auditError } = await supabase.rpc('insert_admin_audit', {
		p_org_id: org_id,
		p_admin_id: user.id,
		p_action: 'bypass_toggle',
		p_target_type: 'org_settings',
		p_target_id: null, // org-level setting
		p_metadata: {
			previous: previousBypass,
			new: bypass,
			timestamp: new Date().toISOString()
		}
	});

	if (auditError) {
		// Log but don't fail the operation if audit fails
		console.warn('Failed to create audit entry:', auditError);
	}

	// Log to console as well (existing implementation)
	console.info('[Payment Command]', {
		action: 'payment_bypass_changed',
		userId: user.id,
		bypass,
		updated_by: user.id,
		timestamp: new Date().toISOString()
	});

	await getBillingSettings().refresh();
	return { success: true };
});

export const adjustUserCredits = command(
	v.object({
		userId: v.string(),
		delta: v.number(), // positive to add, negative to deduct
		reason: v.optional(v.string())
	}),
	async ({ userId, delta, reason }) => {
		const { user, supabase, org_id } = await requireSuperAdminPermissions();

		// Fetch current
		const { data: profile, error: fetchError } = await supabase
			.from('profiles')
			.select('id, credits_balance')
			.eq('id', userId)
			.eq('org_id', org_id)
			.single();

		if (fetchError) throw error(404, 'User not found');

		const before = profile.credits_balance || 0;
		const after = Math.max(0, before + delta);

		// Update user balance
		const { error: updateError } = await supabase
			.from('profiles')
			.update({ credits_balance: after, updated_at: new Date().toISOString() })
			.eq('id', userId)
			.eq('org_id', org_id);

		if (updateError) throw error(500, 'Failed to update user balance');

		// Record transaction
		const description =
			reason || (delta >= 0 ? 'Manual credit addition' : 'Manual credit deduction');

		// Create credit transaction
		const { error: txError } = await supabase.from('credit_transactions').insert({
			user_id: userId,
			org_id,
			transaction_type: delta >= 0 ? 'bonus' : 'refund',
			amount: delta,
			credits_before: before,
			credits_after: after,
			description,
			reference_id: null,
			metadata: { adjusted_by: 'super_admin' }
		});

		if (txError) {
			// Not fatal to user balance, but log for audit
			console.warn('Failed to write credit transaction', txError);
		}

		// Create admin audit entry
		const { error: auditError } = await supabase.rpc('insert_admin_audit', {
			p_org_id: org_id,
			p_admin_id: user.id,
			p_action: 'credit_adjustment',
			p_target_type: 'user_credits',
			p_target_id: userId,
			p_metadata: {
				delta,
				before,
				after,
				reason: description,
				timestamp: new Date().toISOString()
			}
		});

		if (auditError) {
			// Log but don't fail the operation if audit fails
			console.warn('Failed to create audit entry:', auditError);
		}

		await getUsersWithCredits().refresh();
		await getUsersData().refresh();
		return { success: true, newBalance: after };
	}
);
