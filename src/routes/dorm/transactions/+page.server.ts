import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import type { Database } from '$lib/database.types';
import { transactionSchema, accountSchema, formSchema } from '$lib/schemas/transactions';
import { supabase } from '$lib/supabaseClient';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.getSession();
  if (!session) {
    throw error(401, 'Unauthorized');
  }

  const form = await superValidate(zod(formSchema));

  // Get user's organization and role
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('id', session.user.id)
    .single();

  if (!profile?.org_id) {
    throw error(400, 'User not associated with an organization');
  }

  // Check if user has permission to access transactions
  const canAccessTransactions = ['super_admin', 'property_admin', 'accountant', 'manager', 'frontdesk'].includes(profile.role);
  if (!canAccessTransactions) {
    throw error(403, 'Insufficient permissions to access transactions');
  }

  // Get all accounts for the organization
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select(`
      id,
      amount,
      balance,
      type,
      date_issued,
      due_date,
      lease:leases (
        id,
        lease_name,
        room:rooms (
          id,
          name,
          number
        ),
        tenant:lease_tenants (
          tenant:profiles (
            id,
            email
          )
        )
      )
    `)
    .eq('org_id', profile.org_id)
    .eq('status', 'PENDING');

  if (accountsError) {
    throw error(500, 'Error fetching accounts');
  }

  // Get transactions for the organization
  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select(`
      id,
      transaction_date,
      transaction_type,
      total_charges,
      amount_paid,
      change_amount,
      paid_by,
      notes,
      status,
      accounts:transaction_accounts (
        account:accounts (
          id,
          type,
          amount,
          balance
        )
      )
    `)
    .eq('org_id', profile.org_id)
    .order('transaction_date', { ascending: false });

  if (transactionsError) {
    throw error(500, 'Error fetching transactions');
  }

  return {
    form,
    accounts,
    transactions,
    org_id: profile.org_id,
    role: profile.role
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      throw error(401, 'Unauthorized');
    }

    const form = await superValidate(request, zod(formSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    // Get user's organization and role
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('id', session.user.id)
      .single();

    if (!profile?.org_id) {
      throw error(400, 'User not associated with an organization');
    }

    // Check if user has permission to create transactions
    const canCreateTransactions = ['super_admin', 'property_admin', 'accountant', 'frontdesk'].includes(profile.role);
    if (!canCreateTransactions) {
      throw error(403, 'Insufficient permissions to create transactions');
    }

    try {
      const { selected_accounts, ...transactionData } = form.data;

      // Start transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          ...transactionData,
          created_by: session.user.id,
          received_by: session.user.id,
          transaction_date: new Date(transactionData.transaction_date).toISOString()
        })
        .select()
        .single();

      if (transactionError) {
        throw transactionError;
      }

      // Insert transaction accounts
      const { error: accountsError } = await supabase
        .from('transaction_accounts')
        .insert(
          selected_accounts.map(account => ({
            transaction_id: transaction.id,
            account_id: account.id,
            amount: account.amount
          }))
        );

      if (accountsError) {
        throw accountsError;
      }

      // Update account balances
      for (const account of selected_accounts) {
        if (account.balance !== null) {
          const { error: updateError } = await supabase
            .from('accounts')
            .update({ balance: account.balance - account.amount })
            .eq('id', account.id);

          if (updateError) {
            throw updateError;
          }
        }
      }

      return { form };
    } catch (error) {
      console.error('Error creating transaction:', error);
      return fail(500, { form, message: 'Failed to create transaction' });
    }
  }
};