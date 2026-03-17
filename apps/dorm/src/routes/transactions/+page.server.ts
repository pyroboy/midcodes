import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { transactionSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';
import { cache, cacheKeys, CACHE_TTL } from '$lib/services/cache';
import { db } from '$lib/server/db';
import {
	payments, billings, leases, rentalUnit, floors, leaseTenants, tenants,
	paymentAllocations
} from '$lib/server/schema';
import { eq, desc, asc, isNull, inArray, gte, lt, or, ilike, sql } from 'drizzle-orm';

// Manual payment creation function
async function createPaymentManually(transactionData: any, userId: string, form: any) {
	const result = await db
		.insert(payments)
		.values({
			amount: transactionData.amount,
			method: transactionData.method,
			referenceNumber: transactionData.reference_number,
			paidBy: transactionData.paid_by,
			paidAt: transactionData.paid_at || new Date().toISOString(),
			notes: transactionData.notes,
			receiptUrl: transactionData.receipt_url,
			createdBy: userId,
			billingIds: transactionData.billing_ids || []
		})
		.returning();

	const payment = result[0];

	if (!payment) {
		return fail(500, { form, message: 'Failed to create payment' });
	}

	if (!transactionData.billing_ids || transactionData.billing_ids.length === 0) {
		cache.deletePattern(/^transactions:/);
		return { form, success: true, operation: 'create', transaction: payment };
	}

	// Process billing allocations
	let remainingAmount = transactionData.amount;
	const paymentAllocationsToInsert = [];

	for (const billingId of transactionData.billing_ids) {
		if (remainingAmount <= 0) break;

		const billingResult = await db
			.select()
			.from(billings)
			.where(eq(billings.id, billingId))
			.limit(1);

		const billing = billingResult[0];
		if (!billing) continue;

		const currentBalance = billing.balance || 0;
		const amountToApply = Math.min(remainingAmount, currentBalance);

		if (amountToApply > 0) {
			await db.insert(paymentAllocations).values({
				paymentId: payment.id,
				billingId: billingId,
				amount: amountToApply
			});

			const newPaidAmount = (billing.paidAmount || 0) + amountToApply;
			const newBalance = billing.amount + (billing.penaltyAmount || 0) - newPaidAmount;
			const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';

			await db
				.update(billings)
				.set({
					paidAmount: newPaidAmount,
					balance: newBalance,
					status: newStatus,
					updatedAt: new Date()
				})
				.where(eq(billings.id, billingId));

			paymentAllocationsToInsert.push({ billing_id: billingId, amount: amountToApply });
			remainingAmount -= amountToApply;
		}
	}

	return {
		form,
		success: true,
		operation: 'create',
		transaction: { ...payment, allocations: paymentAllocationsToInsert }
	};
}

// Async function to load transactions data with caching
async function loadTransactionsData(url: URL) {
	const method = url.searchParams.get('method') || null;
	const dateFrom = url.searchParams.get('dateFrom') || null;
	const dateTo = url.searchParams.get('dateTo') || null;
	const searchTerm = url.searchParams.get('searchTerm') || null;
	const includeReverted = url.searchParams.get('includeReverted') === 'true';

	const hasFilters = method || dateFrom || dateTo || searchTerm || includeReverted;
	const filterKey = hasFilters
		? `filtered:${method || 'none'}_${dateFrom || 'none'}_${dateTo || 'none'}_${searchTerm ? 'search' : 'none'}_${includeReverted ? 'reverted' : 'active'}`
		: 'default';
	const cacheKey = cacheKeys.transactions(filterKey);

	const cachedData = cache.get<any>(cacheKey);
	if (cachedData) {
		console.log('CACHE HIT: Returning cached transactions data');
		return { transactions: cachedData.transactions, billingsById: cachedData.billingsById || {} };
	}

	console.log('CACHE MISS: Fetching transactions from database');

	// Build dynamic query conditions
	const conditions = [];
	if (!includeReverted) {
		conditions.push(isNull(payments.revertedAt));
	}
	if (method) {
		conditions.push(eq(payments.method, method));
	}
	if (dateFrom) {
		conditions.push(gte(payments.paidAt, dateFrom));
	}
	if (dateTo) {
		const nextDay = new Date(dateTo);
		nextDay.setDate(nextDay.getDate() + 1);
		conditions.push(lt(payments.paidAt, nextDay.toISOString()));
	}
	if (searchTerm) {
		conditions.push(
			or(
				ilike(payments.paidBy, `%${searchTerm}%`),
				ilike(payments.referenceNumber, `%${searchTerm}%`)
			)
		);
	}

	const whereClause = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

	// Fetch payments
	let transactionsData;
	if (whereClause) {
		transactionsData = await db
			.select()
			.from(payments)
			.where(whereClause)
			.orderBy(desc(payments.paidAt));
	} else {
		transactionsData = await db
			.select()
			.from(payments)
			.orderBy(desc(payments.paidAt));
	}

	// Preload allocations
	const paymentIds = transactionsData.map((t: any) => t.id).filter(Boolean);
	const allocationsByPayment = new Map<number, { billing_id: number; amount: number }[]>();

	if (paymentIds.length > 0) {
		const allocs = await db
			.select({
				paymentId: paymentAllocations.paymentId,
				billingId: paymentAllocations.billingId,
				amount: paymentAllocations.amount
			})
			.from(paymentAllocations)
			.where(inArray(paymentAllocations.paymentId, paymentIds));

		for (const a of allocs) {
			if (!allocationsByPayment.has(a.paymentId)) allocationsByPayment.set(a.paymentId, []);
			allocationsByPayment.get(a.paymentId)!.push({ billing_id: a.billingId, amount: a.amount });
		}
	}

	// Batch fetch billing data
	const allBillingIdsInTransactions = Array.from(
		new Set(
			transactionsData
				.flatMap((t: any) => (Array.isArray(t.billingIds) ? t.billingIds : []))
				.filter(Boolean)
		)
	);

	const billingDataMap = new Map<number, any>();
	if (allBillingIdsInTransactions.length > 0) {
		const allBillingData = await db
			.select({
				id: billings.id,
				type: billings.type,
				utilityType: billings.utilityType,
				amount: billings.amount,
				dueDate: billings.dueDate,
				leaseId: leases.id,
				leaseName: leases.name,
				leaseStartDate: leases.startDate,
				leaseEndDate: leases.endDate,
				leaseRentAmount: leases.rentAmount,
				leaseSecurityDeposit: leases.securityDeposit,
				leaseStatus: leases.status,
				unitId: rentalUnit.id,
				unitNumber: rentalUnit.number,
				floorNumber: floors.floorNumber,
				floorWing: floors.wing
			})
			.from(billings)
			.leftJoin(leases, eq(billings.leaseId, leases.id))
			.leftJoin(rentalUnit, eq(leases.rentalUnitId, rentalUnit.id))
			.leftJoin(floors, eq(rentalUnit.floorId, floors.id))
			.where(inArray(billings.id, allBillingIdsInTransactions));

		// Fetch lease tenants for these leases
		const leaseIdsForBillings = [...new Set(allBillingData.map((b) => b.leaseId).filter(Boolean))];
		const leaseTenantsForBillings = leaseIdsForBillings.length > 0
			? await db
					.select({
						leaseId: leaseTenants.leaseId,
						tenantId: tenants.id,
						tenantName: tenants.name,
						tenantEmail: tenants.email,
						tenantContactNumber: tenants.contactNumber
					})
					.from(leaseTenants)
					.innerJoin(tenants, eq(leaseTenants.tenantId, tenants.id))
					.where(inArray(leaseTenants.leaseId, leaseIdsForBillings))
			: [];

		const ltMap = new Map<number, any[]>();
		for (const lt of leaseTenantsForBillings) {
			if (!ltMap.has(lt.leaseId)) ltMap.set(lt.leaseId, []);
			ltMap.get(lt.leaseId)!.push({
				id: lt.tenantId,
				name: lt.tenantName,
				email: lt.tenantEmail,
				phone: lt.tenantContactNumber
			});
		}

		for (const billing of allBillingData) {
			billingDataMap.set(billing.id, {
				...billing,
				lease: billing.leaseId
					? {
							id: billing.leaseId,
							name: billing.leaseName,
							start_date: billing.leaseStartDate,
							end_date: billing.leaseEndDate,
							rent_amount: billing.leaseRentAmount,
							security_deposit: billing.leaseSecurityDeposit,
							status: billing.leaseStatus,
							rental_unit: billing.unitId
								? {
										id: billing.unitId,
										number: billing.unitNumber,
										floors: billing.floorNumber !== null
											? { floor_number: billing.floorNumber, wing: billing.floorWing }
											: undefined
									}
								: undefined,
							lease_tenants: (ltMap.get(billing.leaseId) || []).map((t: any) => ({
								tenant: t
							}))
						}
					: null
			});
		}
	}

	// Process transactions
	const transactions = transactionsData.map((transaction: any) => {
		let leaseName: string | null = null;
		let leaseDetails: any[] = [];
		let uniqueLeases: any[] = [];

		if (transaction.billingIds && transaction.billingIds.length > 0) {
			const billingLeaseData = transaction.billingIds
				.map((id: number) => billingDataMap.get(id))
				.filter(Boolean);

			if (billingLeaseData.length > 0) {
				const firstLease = billingLeaseData[0]?.lease;
				if (firstLease) leaseName = firstLease.name;

				const allocations = allocationsByPayment.get(transaction.id) || [];
				leaseDetails = billingLeaseData.map((billing: any) => {
					const lease = billing.lease;
					const allocation = allocations.find((a) => a.billing_id === billing.id);
					return {
						billing_id: billing.id,
						billing_type: billing.type,
						utility_type: billing.utilityType,
						billing_amount: billing.amount,
						allocated_amount: allocation?.amount || 0,
						due_date: billing.dueDate,
						lease
					};
				});

				const leaseMap = new Map();
				leaseDetails.forEach((detail) => {
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
		};
	});

	let billingsById: Record<number, any> = {};
	for (const [id, billing] of billingDataMap.entries()) {
		billingsById[id] = billing;
	}

	const dataToCache = { transactions, billingsById };
	cache.set(cacheKey, dataToCache, CACHE_TTL.SHORT);
	console.log('Cached transactions data');

	return { transactions, billingsById };
}

export const load: PageServerLoad = async ({ locals, url, depends }) => {
	const { user } = locals;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	depends('app:transactions');

	try {
		const form = await superValidate(zod(transactionSchema));

		return {
			transactions: [],
			billingsById: {},
			form,
			user,
			lazy: true,
			transactionsPromise: loadTransactionsData(url)
		};
	} catch (err) {
		console.error('Error in load function:', err);
		throw error(500, 'An error occurred while loading transactions');
	}
};

export const actions: Actions = {
	upsert: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) {
			throw error(401, 'Unauthorized');
		}

		const form = await superValidate(request, zod(transactionSchema));

		if (!form.valid) {
			console.error('Form validation error:', form.errors);
			return fail(400, { form });
		}

		try {
			const { id, ...transactionData } = form.data;

			if (id) {
				// Update existing
				const existingResult = await db
					.select()
					.from(payments)
					.where(eq(payments.id, id))
					.limit(1);

				const existing = existingResult[0];
				if (!existing) {
					return fail(404, { form, message: 'Transaction not found' });
				}

				if (existing.revertedAt) {
					return fail(400, { form, message: 'Cannot update a reverted transaction' });
				}

				// Prevent financial field changes
				const financialFieldsChanged =
					(transactionData.amount != null &&
						Number(transactionData.amount) !== Number(existing.amount)) ||
					(transactionData.billing_ids &&
						JSON.stringify(transactionData.billing_ids) !==
							JSON.stringify(existing.billingIds));

				if (financialFieldsChanged) {
					return fail(400, {
						form,
						message:
							'Amount and billing allocations cannot be modified during edit. Only administrative fields can be updated.'
					});
				}

				const result = await db
					.update(payments)
					.set({
						referenceNumber: transactionData.reference_number,
						paidBy: transactionData.paid_by,
						paidAt: transactionData.paid_at,
						notes: transactionData.notes,
						receiptUrl: transactionData.receipt_url,
						updatedBy: user.id,
						updatedAt: new Date()
					})
					.where(eq(payments.id, id))
					.returning();

				cache.deletePattern(/^transactions:/);
				return { form, success: true, operation: 'update', transaction: result?.[0] };
			} else {
				// Create new payment
				return await createPaymentManually(transactionData, user.id, form);
			}
		} catch (err) {
			console.error('Error in upsert operation:', err);
			return fail(500, { form, message: 'An unexpected error occurred' });
		}
	},

	delete: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) {
			throw error(401, 'Unauthorized');
		}

		try {
			const formData = await request.formData();
			const id = formData.get('id');

			if (!id) {
				return fail(400, { message: 'Transaction ID is required' });
			}

			const reason = formData.get('reason') as string | null;
			const paymentId = Number(id);
			if (!Number.isFinite(paymentId)) {
				return fail(400, { message: 'Invalid transaction ID' });
			}

			// Call DB function to revert
			const result = await db.execute(
				sql`SELECT revert_payment(${paymentId}::int, ${reason}::text, ${user.id}::text)`
			);

			return { success: true, result };
		} catch (err) {
			console.error('Error processing delete request:', err);
			return fail(500, { message: 'An error occurred while processing the delete request' });
		}
	}
};
