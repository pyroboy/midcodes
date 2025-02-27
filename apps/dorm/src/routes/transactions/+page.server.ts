import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { transactionSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession }, url }) => {
  const session = await safeGetSession();
  if (!session) {
    throw error(401, 'Unauthorized');
  }

  try {
    // Get query parameters for filtering
    const method = url.searchParams.get('method') || null;
    const dateFrom = url.searchParams.get('dateFrom') || null;
    const dateTo = url.searchParams.get('dateTo') || null;
    const searchTerm = url.searchParams.get('searchTerm') || null;
    
    console.log('Query parameters:', { method, dateFrom, dateTo, searchTerm });

    // First, get the payments
    let query = supabase
      .from('payments')
      .select(`
        *
      `);

    // Apply filters if provided
    if (method) {
      query = query.eq('method', method);
    }

    if (dateFrom) {
      query = query.gte('paid_at', dateFrom);
    }

    if (dateTo) {
      // Add one day to include the end date fully
      const nextDay = new Date(dateTo);
      nextDay.setDate(nextDay.getDate() + 1);
      query = query.lt('paid_at', nextDay.toISOString());
    }

    if (searchTerm) {
      query = query.or(`paid_by.ilike.%${searchTerm}%,reference_number.ilike.%${searchTerm}%`);
    }

    // Execute the query
    const { data: transactionsData, error: transactionsError } = await query
      .order('paid_at', { ascending: false });

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      throw error(500, 'Failed to load transactions');
    }

    // Format transactions with date formatting
    const formattedTransactions = transactionsData.map(transaction => ({
      ...transaction,
      paid_at: transaction.paid_at ? new Date(transaction.paid_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }) : null,
      created_at: transaction.created_at ? new Date(transaction.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }) : null,
      updated_at: transaction.updated_at ? new Date(transaction.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }) : null
    }));

    // Now fetch lease names for each transaction
    const transactions = await Promise.all(
      formattedTransactions.map(async (transaction) => {
        // Only proceed if there are billing_ids
        if (transaction.billing_ids && transaction.billing_ids.length > 0) {
          // Get the first billing ID to fetch its lease
          const firstBillingId = transaction.billing_ids[0];
          
          const { data: billingData, error: billingError } = await supabase
            .from('billings')
            .select(`
              lease:leases(id, name)
            `)
            .eq('id', firstBillingId)
            .single();
            
          if (!billingError && billingData && billingData.lease) {
            // The lease property is an array, we need to extract the first item
            const leaseData = Array.isArray(billingData.lease) ? billingData.lease[0] : billingData.lease;
            return {
              ...transaction,
              lease_name: leaseData?.name || null
            };
          }
        }
        
        return transaction;
      })
    );

    console.log('Transactions loaded:', transactions.length);

    // Create form for superForm
    const form = await superValidate(zod(transactionSchema));

    return {
      transactions,
      form,
      user: session.user
    };
  } catch (err) {
    console.error('Error in load function:', err);
    throw error(500, 'An error occurred while loading transactions');
  }
};

export const actions: Actions = {
  upsert: async ({ request, locals: { supabase, safeGetSession } }) => {
    const session = await safeGetSession();
    if (!session) {
      throw error(401, 'Unauthorized');
    }

    const form = await superValidate(request, zod(transactionSchema));

    if (!form.valid) {
      console.error('Form validation error:', form.errors);
      return fail(400, { form });
    }

    try {
      const { id, ...transactionData } = form.data;
      
      // Determine if we're creating or updating
      if (id) {
        // This is an update
        const { data, error: updateError } = await supabase
          .from('payments')
          .update({
            amount: transactionData.amount,
            method: transactionData.method,
            reference_number: transactionData.reference_number,
            paid_by: transactionData.paid_by,
            paid_at: transactionData.paid_at,
            notes: transactionData.notes,
            receipt_url: transactionData.receipt_url,
            updated_by: session.user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select();

        if (updateError) {
          console.error('Error updating transaction:', updateError);
          return fail(500, { form, message: 'Failed to update transaction' });
        }

        return { form, success: true, operation: 'update', transaction: data?.[0] };
      } else {
        // This is a creation
        const { data, error: insertError } = await supabase
          .from('payments')
          .insert({
            amount: transactionData.amount,
            method: transactionData.method,
            reference_number: transactionData.reference_number,
            paid_by: transactionData.paid_by,
            paid_at: transactionData.paid_at || new Date().toISOString(),
            notes: transactionData.notes,
            receipt_url: transactionData.receipt_url,
            created_by: session.user.id,
            billing_ids: transactionData.billing_ids || []
          })
          .select();

        if (insertError) {
          console.error('Error creating transaction:', insertError);
          return fail(500, { form, message: 'Failed to create transaction' });
        }

        return { form, success: true, operation: 'create', transaction: data?.[0] };
      }
    } catch (err) {
      console.error('Error in upsert operation:', err);
      return fail(500, { form, message: 'An unexpected error occurred' });
    }
  },

  delete: async ({ request, locals: { supabase, safeGetSession } }) => {
    const session = await safeGetSession();
    if (!session) {
      throw error(401, 'Unauthorized');
    }

    let id;
    
    try {
      // Parse the request body as form data
      const formData = await request.formData();
      id = formData.get('id');
      
      console.log('Received delete request with ID:', id);

      if (!id) {
        console.error('Error: Transaction ID is required but was not provided');
        return fail(400, { message: 'Transaction ID is required' });
      }

      console.log('Attempting to delete transaction with ID:', id);
      const { data, error: deleteError } = await supabase
        .from('payments')
        .delete()
        .eq('id', id)
        .select();

      console.log('Delete result:', { data, error: deleteError });

      if (deleteError) {
        console.error('Error deleting transaction:', deleteError);
        return fail(500, { message: 'Failed to delete transaction' });
      }

      return { success: true };
    } catch (err) {
      console.error('Error processing delete request:', err);
      return fail(500, { message: 'An error occurred while processing the delete request' });
    }
  }
};
