import { error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import { transactionFilterSchema } from './schema';
import { supabase } from '$lib/supabaseClient';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.getSession();
  if (!session) {
    throw error(401, 'Unauthorized');
  }

  const form = await superValidate(zod(transactionFilterSchema));

  // Get user's profile and role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    throw error(400, 'User profile not found');
  }

  // Check if user has permission to view transactions
  const canViewTransactions = ['super_admin', 'property_admin', 'accountant', 'manager', 'frontdesk'].includes(profile.role);
  if (!canViewTransactions) {
    throw error(403, 'Insufficient permissions to view transactions');
  }

  // Get all payments with related data
  const { data: transactions, error: transactionsError } = await supabase
    .from('payments')
    .select(`
      *,
      billing:billings (
        *,
        lease:leases (
          id,
          name,
          room:rooms (
            id,
            name,
            number,
            property:properties (
              id,
              name
            )
          ),
          tenant:lease_tenants (
            tenant:tenants (
              id,
              name,
              email
            )
          )
        )
      )
    `)
    .order('paid_at', { ascending: false });

  if (transactionsError) {
    throw error(500, 'Failed to fetch transactions');
  }

  return {
    form,
    transactions,
    user: {
      role: profile.role
    }
  };
};