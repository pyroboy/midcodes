import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { transactionSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';
import { cache, cacheKeys, CACHE_TTL } from '$lib/services/cache';

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
		// Invalidate transactions cache
		cache.deletePattern(/^transactions:/);
		console.log('🗑️ Invalidated transactions cache');

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

// Async function to load transactions data with server-side caching
async function loadTransactionsData(supabase: any, url: URL) {
	// Get query parameters for filtering
	const method = url.searchParams.get('method') || null;
	const dateFrom = url.searchParams.get('dateFrom') || null;
	const dateTo = url.searchParams.get('dateTo') || null;
	const searchTerm = url.searchParams.get('searchTerm') || null;
	const includeReverted = url.searchParams.get('includeReverted') === 'true';

	console.log('Query parameters:', { method, dateFrom, dateTo, searchTerm, includeReverted });

	// Create cache key based on filters (use 'default' for unfiltered view)
	const hasFilters = method || dateFrom || dateTo || searchTerm || includeReverted;
	const filterKey = hasFilters
		? `filtered:${method || 'none'}_${dateFrom || 'none'}_${dateTo || 'none'}_${searchTerm ? 'search' : 'none'}_${includeReverted ? 'reverted' : 'active'}`
		: 'default';
	const cacheKey = cacheKeys.transactions(filterKey);

		// Check cache first
		const cachedData = cache.get<any>(cacheKey);

		if (cachedData) {
			console.log('🎯 CACHE HIT: Returning cached transactions data');
			return {
				transactions: cachedData.transactions,
				billingsById: cachedData.billingsById || {}
			};
		}

		console.log('💾 CACHE MISS: Fetching transactions from database');

    // First, get the payments; exclude reverted by default
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

    // OPTIMIZATION: Batch fetch all billing data upfront (eliminates N+1 query)
    const allBillingIdsInTransactions = Array.from(
      new Set(
        formattedTransactions.flatMap((t: any) =>
          (Array.isArray(t.billing_ids) ? t.billing_ids : [])
        ).filter(Boolean)
      )
    );

    let billingDataMap = new Map<number, any>();
    if (allBillingIdsInTransactions.length > 0) {
      const { data: allBillingData, error: batchError } = await supabase
        .from('billings')
        .select(`
          id,
          type,
          utility_type,
          amount,
          due_date,
          lease:leases(
            id,
            name,
            start_date,
            end_date,
            rent_amount,
            security_deposit,
            status,
            rental_unit(
              id,
              number,
              floors(
                floor_number,
                wing
              )
            ),
            lease_tenants(
              tenant:tenants(
                id,
                name,
                email,
                contact_number
              )
            )
          )
        `)
        .in('id', allBillingIdsInTransactions);

      if (!batchError && allBillingData) {
        for (const billing of allBillingData) {
          billingDataMap.set(billing.id, billing);
        }
      }
    }

    // Now process transactions synchronously using pre-fetched data
    const transactions = formattedTransactions.map((transaction: any) => {
      let leaseName: string | null = null;
      let leaseDetails: any[] = [];
      let uniqueLeases: any[] = [];

      if (transaction.billing_ids && transaction.billing_ids.length > 0) {
        // Use pre-fetched billing data instead of querying
        const billingLeaseData = transaction.billing_ids
          .map((id: number) => billingDataMap.get(id))
          .filter(Boolean);

        if (billingLeaseData.length > 0) {
          // Set lease name from first lease for backward compatibility
          const firstLease = billingLeaseData[0]?.lease;
          if (firstLease) {
            leaseName = (firstLease as any).name;
          }

          // Build comprehensive lease details with allocation information
          const allocations = allocationsByPayment.get(transaction.id) || [];

          leaseDetails = billingLeaseData.map((billing: any) => {
            const lease = Array.isArray(billing.lease) ? billing.lease[0] : billing.lease;
            const allocation = allocations.find(a => a.billing_id === billing.id);

            const processedLease = {
              id: lease?.id,
              name: lease?.name,
              start_date: lease?.start_date,
              end_date: lease?.end_date,
              rent_amount: lease?.rent_amount,
              security_deposit: lease?.security_deposit,
              status: lease?.status,
              rental_unit: lease?.rental_unit ? {
                id: lease.rental_unit.id,
                rental_unit_number: lease.rental_unit.number,
                floor: lease.rental_unit.floors ? {
                  floor_number: lease.rental_unit.floors.floor_number,
                  wing: lease.rental_unit.floors.wing
                } : undefined
              } : undefined,
              tenants: lease?.lease_tenants?.map((lt: any) => ({
                id: lt.tenant?.id,
                name: lt.tenant?.name,
                email: lt.tenant?.email,
                phone: lt.tenant?.contact_number
              })).filter((t: any) => t.id) || []
            };

            return {
              billing_id: billing.id,
              billing_type: billing.type,
              utility_type: billing.utility_type,
              billing_amount: billing.amount,
              allocated_amount: allocation?.amount || 0,
              due_date: billing.due_date,
              lease: processedLease
            };
          });

          // Extract unique leases for summary display
          const leaseMap = new Map();
          leaseDetails.forEach(detail => {
            if (detail.lease?.id && !leaseMap.has(detail.lease.id)) {
              leaseMap.set(detail.lease.id, detail.lease);
            }
          });
          uniqueLeases = Array.from(leaseMap.values());
        }
      }

      return {
        ...transaction,
        lease_name: leaseName,
        allocations: allocationsByPayment.get(transaction.id) || [],
        lease_details: leaseDetails,
        unique_leases: uniqueLeases
      } as any;
    });

    // OPTIMIZATION: Reuse the billingDataMap we already fetched above (no duplicate query)
    let billingsById: Record<number, any> = {};
    for (const [id, billing] of billingDataMap.entries()) {
      billingsById[id] = billing;
    }

		console.log('Transactions loaded:', transactions.length);

		// Cache transactions data with billingsById (2 minutes for filtered data)
		const dataToCache = {
			transactions,
			billingsById
		};
		cache.set(cacheKey, dataToCache, CACHE_TTL.SHORT);
		console.log('✅ Cached transactions data');

		return {
			transactions,
			billingsById
		};
}

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession }, url, depends }) => {
	const session = await safeGetSession();
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	// Set up dependency for cache invalidation
	depends('app:transactions');

	try {
		// Create form for superForm
		const form = await superValidate(zod(transactionSchema));

		// Return minimal data for instant navigation
		return {
			// Start with empty arrays for instant rendering
			transactions: [],
			billingsById: {},
			form,
			user: session.user,
			// Flag to indicate lazy loading
			lazy: true,
			// Return promise that resolves with the actual data (server-side cached)
			transactionsPromise: loadTransactionsData(supabase, url)
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

          // Prevent any financial field changes during edit - amount and allocations are now immutable
          const financialFieldsChanged =
            (transactionData.amount != null && Number(transactionData.amount) !== Number(existing.amount)) ||
            (transactionData.billing_ids && JSON.stringify(transactionData.billing_ids) !== JSON.stringify(existing.billing_ids));

          if (financialFieldsChanged) {
            console.error('Attempted to modify financial fields during edit - this is not allowed');
            return fail(400, { form, message: 'Amount and billing allocations cannot be modified during edit. Only administrative fields like payment method, reference number, and notes can be updated.' });
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

					// Invalidate transactions cache
					cache.deletePattern(/^transactions:/);
					console.log('🗑️ Invalidated transactions cache');

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
