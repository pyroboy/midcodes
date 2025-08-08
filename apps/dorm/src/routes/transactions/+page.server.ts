import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { transactionSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';

// Manual payment creation function
async function createPaymentManually(supabase: any, transactionData: any, userId: string, form: any) {
	// Start a transaction
	const { data: payment, error: paymentError } = await supabase
		.from('payments')
		.insert({
			amount: transactionData.amount,
			method: transactionData.method,
			reference_number: transactionData.reference_number,
			paid_by: transactionData.paid_by,
			paid_at: transactionData.paid_at || new Date().toISOString(),
			notes: transactionData.notes,
			receipt_url: transactionData.receipt_url,
			created_by: userId,
			billing_ids: transactionData.billing_ids || []
		})
		.select()
		.single();

	if (paymentError) {
		console.error('Error creating payment:', paymentError);
		return fail(500, { form, message: 'Failed to create payment' });
	}

	// If no billing IDs, just return the standalone payment
	if (!transactionData.billing_ids || transactionData.billing_ids.length === 0) {
		return { form, success: true, operation: 'create', transaction: payment };
	}

	// Process billing allocations manually
	let remainingAmount = transactionData.amount;
	const paymentAllocations = [];

	for (const billingId of transactionData.billing_ids) {
		if (remainingAmount <= 0) break;

		// Get current billing details
		const { data: billing, error: billingError } = await supabase
			.from('billings')
			.select('*')
			.eq('id', billingId)
			.single();

		if (billingError || !billing) {
			console.error('Error fetching billing:', billingError);
			continue;
		}

		// Calculate amount to apply to this billing
		const currentBalance = billing.balance || 0;
		const amountToApply = Math.min(remainingAmount, currentBalance);

		if (amountToApply > 0) {
			// Create payment allocation record
			const { error: allocationError } = await supabase
				.from('payment_allocations')
				.insert({
					payment_id: payment.id,
					billing_id: billingId,
					amount: amountToApply
				});

			if (allocationError) {
				console.error('Error creating payment allocation:', allocationError);
				continue;
			}

			// Update billing record
			const newPaidAmount = (billing.paid_amount || 0) + amountToApply;
			const newBalance = billing.amount + (billing.penalty_amount || 0) - newPaidAmount;
			const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';

			const { error: updateError } = await supabase
				.from('billings')
				.update({
					paid_amount: newPaidAmount,
					balance: newBalance,
					status: newStatus,
					updated_at: new Date().toISOString()
				})
				.eq('id', billingId);

			if (updateError) {
				console.error('Error updating billing:', updateError);
				continue;
			}

			paymentAllocations.push({ billing_id: billingId, amount: amountToApply });
			remainingAmount -= amountToApply;
		}
	}

	return { 
		form,
		success: true, 
		operation: 'create', 
		transaction: { ...payment, allocations: paymentAllocations } 
	};
}

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

    // First, get the payments; exclude reverted by default
    const includeReverted = url.searchParams.get('includeReverted') === 'true';
    let query = supabase
      .from('payments')
      .select(`
        *
      `)
      .order('paid_at', { ascending: false });

    if (!includeReverted) {
      query = query.is('reverted_at', null);
    }

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
    const { data: transactionsData, error: transactionsError } = await query;

		if (transactionsError) {
			console.error('Error fetching transactions:', transactionsError);
			throw error(500, 'Failed to load transactions');
		}

    // Keep raw ISO timestamps; formatting is a view concern
    const formattedTransactions = transactionsData;

		// Now fetch lease names for each transaction
    // Preload allocations for all transactions
    const paymentIds = formattedTransactions.map((t: any) => t.id).filter(Boolean);
    let allocationsByPayment = new Map<number, { billing_id: number; amount: number }[]>();
    if (paymentIds.length > 0) {
      const { data: allocs } = await supabase
        .from('payment_allocations')
        .select('payment_id, billing_id, amount')
        .in('payment_id', paymentIds);
      if (allocs) {
        for (const a of allocs) {
          if (!allocationsByPayment.has(a.payment_id)) allocationsByPayment.set(a.payment_id, []);
          allocationsByPayment.get(a.payment_id)!.push({ billing_id: a.billing_id, amount: a.amount });
        }
      }
    }

    const transactions = await Promise.all(
      formattedTransactions.map(async (transaction) => {
        let leaseName: string | null = null;
        if (transaction.billing_ids && transaction.billing_ids.length > 0) {
          const firstBillingId = transaction.billing_ids[0];
          const { data: billingData } = await supabase
            .from('billings')
            .select('lease:leases(id, name)')
            .eq('id', firstBillingId)
            .single();
          if (billingData && billingData.lease) {
            const leaseData = Array.isArray(billingData.lease) ? billingData.lease[0] : billingData.lease;
            leaseName = leaseData?.name || null;
          }
        }
        return {
          ...transaction,
          lease_name: leaseName,
          allocations: allocationsByPayment.get(transaction.id) || []
        } as any;
      })
    );

    // Fetch detailed billing records for all referenced billing_ids
    const allBillingIds = Array.from(
      new Set(
        transactions.flatMap((t: any) => (Array.isArray(t.billing_ids) ? t.billing_ids : [])).filter(Boolean)
      )
    );

    let billingsById: Record<number, any> = {};
    if (allBillingIds.length > 0) {
      const { data: billingsData, error: billingsError } = await supabase
        .from('billings')
        .select(`
          id,
          type,
          utility_type,
          amount,
          paid_amount,
          balance,
          status,
          due_date,
          lease:leases(id, name,
            rental_unit:rental_unit(
              rental_unit_number,
              floor:floors(floor_number, wing)
            )
          )
        `)
        .in('id', allBillingIds);
      if (!billingsError && billingsData) {
        for (const b of billingsData) {
          billingsById[b.id] = b;
        }
      }
    }

		console.log('Transactions loaded:', transactions.length);

		// Create form for superForm
		const form = await superValidate(zod(transactionSchema));

    return {
      transactions,
      form,
      user: session.user,
      billingsById
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
          // Full-edit support: if financial fields change, revert old payment then recreate via RPC
          const { data: existing, error: existingErr } = await supabase
            .from('payments')
            .select('*')
            .eq('id', id)
            .single();
          if (existingErr || !existing) {
            return fail(404, { form, message: 'Transaction not found' });
          }

          if (existing.reverted_at) {
            return fail(400, { form, message: 'Cannot update a reverted transaction' });
          }

          const financialFieldsChanged =
            (transactionData.amount != null && Number(transactionData.amount) !== Number(existing.amount)) ||
            (transactionData.method && transactionData.method !== existing.method) ||
            (transactionData.billing_ids && JSON.stringify(transactionData.billing_ids) !== JSON.stringify(existing.billing_ids));

          if (financialFieldsChanged) {
            // Soft-delete the old payment
            const { error: revertError } = await supabase.rpc('revert_payment', {
              p_payment_id: id,
              p_reason: 'Replaced via edit',
              p_performed_by: session.user.id
            });
            if (revertError) {
              console.error('Failed to revert payment on edit:', revertError);
              return fail(500, { form, message: 'Failed to replace transaction' });
            }

            // Create replacement manually
            return await createPaymentManually(supabase, transactionData, session.user.id, form);
          }

          const { data, error: updateError } = await supabase
            .from('payments')
            .update({
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
          // Manual payment creation without RPC functions
          return await createPaymentManually(supabase, transactionData, session.user.id, form);
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

      console.log('Attempting to revert transaction (soft delete) with ID:', id);
      const reason = formData.get('reason') as string | null;
      const paymentId = Number(id);
      if (!Number.isFinite(paymentId)) {
        return fail(400, { message: 'Invalid transaction ID' });
      }

      const { data: result, error: revertError } = await supabase.rpc('revert_payment', {
        p_payment_id: paymentId,
        p_reason: reason,
        p_performed_by: session.user.id
      });

      console.log('Revert result:', { result, error: revertError });

      if (revertError) {
        console.error('Error reverting transaction:', revertError);
        return fail(500, { message: 'Failed to revert transaction' });
      }

      return { success: true, result };
		} catch (err) {
			console.error('Error processing delete request:', err);
			return fail(500, { message: 'An error occurred while processing the delete request' });
		}
	}
};
