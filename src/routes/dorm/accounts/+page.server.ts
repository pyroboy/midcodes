// src/routes/dorm/accounts/+page.server.ts
import { supabase } from '$lib/supabaseClient';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from "sveltekit-superforms/adapters";
import { accountSchema } from './formSchema';
import type { Database } from '$lib/types/database';

export const load = async () => {
  // RLS will automatically filter based on user's role:
  // - Admin/Accountant: Full access
  // - Manager: View and update
  // - Frontdesk: View and create
  // - Tenant: View own accounts
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select(`
      *,
      lease:leases (
        *,
        room:rooms (*),
        lease_tenants (
          tenant:tenants (*)
        )
      )
    `);

  if (accountsError) {
    console.error('Error fetching accounts:', accountsError);
    throw new Error('Failed to load accounts');
  }

  // Only admin, accountant, manager, and frontdesk can see all leases
  const { data: leases, error: leasesError } = await supabase
    .from('leases')
    .select(`
      *,
      room:rooms (*),
      lease_tenants (
        tenant:tenants (*)
      )
    `);

  if (leasesError) {
    console.error('Error fetching leases:', leasesError);
    throw new Error('Failed to load leases');
  }

  const form = await superValidate(zod(accountSchema));

  return {
    accounts,
    leases,
    form
  };
};

export const actions = {
  create: async ({ request }) => {
    const form = await superValidate(request, zod(accountSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      // RLS will enforce that only admin, accountant, and frontdesk can create
      const { error } = await supabase
        .from('accounts')
        .insert({
          ...form.data,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return { form };
    } catch (error) {
      console.error('Error creating account:', error);
      return fail(500, { form, error: 'Failed to create account' });
    }
  },

  update: async ({ request }) => {
    const form = await superValidate(request, zod(accountSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    if (!form.data.id) {
      return fail(400, { form, error: 'Account ID is required for update' });
    }

    try {
      // RLS will enforce that only admin, accountant, and manager can update
      const { error } = await supabase
        .from('accounts')
        .update({
          ...form.data,
          updated_at: new Date().toISOString()
        })
        .eq('id', form.data.id);

      if (error) throw error;
      return { form };
    } catch (error) {
      console.error('Error updating account:', error);
      return fail(500, { form, error: 'Failed to update account' });
    }
  }
};