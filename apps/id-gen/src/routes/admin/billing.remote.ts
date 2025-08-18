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

export const getBillingSettings = query(async () => {
  const { supabase, org_id } = await requireSuperAdminPermissions();

  // Ensure a row exists (idempotent)
  const { data: settings, error: fetchError } = await supabase
    .from('org_settings')
    .select('payments_enabled, payments_bypass, updated_at, updated_by')
    .eq('org_id', org_id)
    .single();

  if (fetchError?.code === 'PGRST116') {
    const { data: inserted, error: insertError } = await supabase
      .from('org_settings')
      .insert({ org_id, payments_enabled: true, payments_bypass: false })
      .select('payments_enabled, payments_bypass, updated_at, updated_by')
      .single();
    if (insertError) throw error(500, 'Failed to initialize org settings');
    return inserted;
  }

  if (fetchError) throw error(500, 'Failed to load billing settings');
  return settings;
});

const ToggleSchema = v.object({
  enabled: v.boolean(),
  keyword: v.pipe(v.string(), v.trim(), v.minLength(1))
});

export const togglePayments = command(ToggleSchema, async ({ enabled, keyword }) => {
  const { user, supabase, org_id } = await requireSuperAdminPermissions();

  if (keyword !== 'TOGGLE_PAYMENTS') {
    throw error(400, 'Keyword confirmation failed. Type TOGGLE_PAYMENTS to proceed.');
  }

  const { error: updateError } = await supabase
    .from('org_settings')
    .update({ payments_enabled: enabled, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq('org_id', org_id);

  if (updateError) throw error(500, 'Failed to update payments flag');

  await getBillingSettings().refresh();
  return { success: true };
});

const BypassSchema = v.object({ bypass: v.boolean() });

export const setPaymentsBypass = command(BypassSchema, async ({ bypass }) => {
  const { user, supabase, org_id } = await requireSuperAdminPermissions();

  const { error: updateError } = await supabase
    .from('org_settings')
    .update({ payments_bypass: bypass, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq('org_id', org_id);

  if (updateError) throw error(500, 'Failed to update bypass flag');

  await getBillingSettings().refresh();
  return { success: true };
});

export const getUsersWithCredits = query(async () => {
  const { supabase, org_id } = await requireSuperAdminPermissions();

  const { data, error: usersError } = await supabase
    .from('profiles')
    .select('id, email, role, credits_balance, card_generation_count, template_count, unlimited_templates, remove_watermarks, updated_at')
    .eq('org_id', org_id)
    .order('created_at', { ascending: false });

  if (usersError) throw error(500, 'Failed to load users/credits');
  return data || [];
});

const AdjustCreditsSchema = v.object({
  userId: v.string(),
  delta: v.number(), // positive to add, negative to deduct
  reason: v.optional(v.string())
});

export const adjustUserCredits = command(AdjustCreditsSchema, async ({ userId, delta, reason }) => {
  const { supabase, org_id } = await requireSuperAdminPermissions();

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

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ credits_balance: after, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .eq('org_id', org_id);

  if (updateError) throw error(500, 'Failed to update user balance');

  // Record transaction
  const description = reason || (delta >= 0 ? 'Manual credit addition' : 'Manual credit deduction');

  const { error: txError } = await supabase
    .from('credit_transactions')
    .insert({
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

  await getUsersWithCredits().refresh();
  await getUsersData().refresh();
  return { success: true, newBalance: after };
});
