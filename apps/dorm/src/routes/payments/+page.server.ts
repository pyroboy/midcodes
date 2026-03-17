import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { paymentSchema, type UserRole } from './formSchema';
import { transactionSchema } from '../transactions/schema';
import { cache, CACHE_TTL, cacheKeys } from '$lib/services/cache';
import {
	calculatePenalty,
	getPenaltyConfig,
	createPenaltyBilling,
	updateBillingStatus,
	determinePaymentStatus,
	getUTCTimestamp,
	logAuditEvent
} from './utils';
import { db } from '$lib/server/db';
import { payments, billings, profiles, leases, rentalUnit, floors, properties } from '$lib/server/schema';
import { eq, desc, asc, inArray, isNull } from 'drizzle-orm';

// Separate async function for loading payments data with caching
async function loadPaymentsData(locals: any) {
	const { user } = locals;
	if (!user) {
		return {
			payments: [],
			billings: [],
			userRole: 'user',
			isAdminLevel: false,
			isAccountant: false,
			isUtility: false,
			isFrontdesk: false,
			isResident: false
		};
	}

	// Check cache first
	const cacheKey = cacheKeys.payments();
	const cached = cache.get<any>(cacheKey);
	if (cached) {
		console.log('CACHE HIT: Returning cached payments data');
		return cached;
	}

	console.log('CACHE MISS: Fetching payments from database');

	// Fetch user role
	const userRoleResult = await db
		.select({ role: profiles.role })
		.from(profiles)
		.where(eq(profiles.id, user.id))
		.limit(1);
	const userRole = userRoleResult[0];

	// Fetch all payments
	const paymentsData = await db
		.select()
		.from(payments)
		.orderBy(desc(payments.paidAt));

	// Fetch unpaid billings with lease info
	const unpaidBillings = await db
		.select({
			id: billings.id,
			type: billings.type,
			utilityType: billings.utilityType,
			amount: billings.amount,
			paidAmount: billings.paidAmount,
			balance: billings.balance,
			status: billings.status,
			dueDate: billings.dueDate,
			leaseId: leases.id,
			leaseName: leases.name,
			unitId: rentalUnit.id,
			unitNumber: rentalUnit.number,
			floorNumber: floors.floorNumber,
			floorWing: floors.wing,
			propertyName: properties.name
		})
		.from(billings)
		.leftJoin(leases, eq(billings.leaseId, leases.id))
		.leftJoin(rentalUnit, eq(leases.rentalUnitId, rentalUnit.id))
		.leftJoin(floors, eq(rentalUnit.floorId, floors.id))
		.leftJoin(properties, eq(floors.propertyId, properties.id))
		.where(inArray(billings.status, ['PENDING', 'PARTIAL', 'OVERDUE']))
		.orderBy(asc(billings.dueDate));

	// Fetch all billings for payment display
	const allBillings = await db
		.select({
			id: billings.id,
			type: billings.type,
			utilityType: billings.utilityType,
			amount: billings.amount,
			paidAmount: billings.paidAmount,
			balance: billings.balance,
			status: billings.status,
			dueDate: billings.dueDate,
			leaseId: leases.id,
			leaseName: leases.name,
			unitId: rentalUnit.id,
			unitNumber: rentalUnit.number,
			floorNumber: floors.floorNumber,
			floorWing: floors.wing,
			propertyName: properties.name
		})
		.from(billings)
		.leftJoin(leases, eq(billings.leaseId, leases.id))
		.leftJoin(rentalUnit, eq(leases.rentalUnitId, rentalUnit.id))
		.leftJoin(floors, eq(rentalUnit.floorId, floors.id))
		.leftJoin(properties, eq(floors.propertyId, properties.id))
		.orderBy(asc(billings.dueDate));

	// Create billing lookup map
	const billingsMap = new Map<number, any>();
	for (const billing of allBillings) {
		billingsMap.set(billing.id, {
			...billing,
			lease: billing.leaseId
				? {
						id: billing.leaseId,
						name: billing.leaseName,
						rental_unit: {
							id: billing.unitId,
							rental_unit_number: billing.unitNumber,
							floor: {
								floor_number: billing.floorNumber,
								wing: billing.floorWing,
								property: { name: billing.propertyName }
							}
						}
					}
				: null
		});
	}

	// Enrich payments with billing info
	const enrichedPayments =
		paymentsData?.map((payment: any) => {
			const primaryBilling =
				payment.billingIds && payment.billingIds.length > 0
					? billingsMap.get(payment.billingIds[0])
					: null;

			return {
				...payment,
				billing: primaryBilling
			};
		}) || [];

	// Format unpaid billings to match original structure
	const formattedUnpaidBillings = unpaidBillings.map((b) => ({
		...b,
		lease: b.leaseId
			? {
					id: b.leaseId,
					name: b.leaseName,
					rental_unit: {
						id: b.unitId,
						rental_unit_number: b.unitNumber,
						floor: {
							floor_number: b.floorNumber,
							wing: b.floorWing,
							property: { name: b.propertyName }
						}
					}
				}
			: null
	}));

	const isAdminLevel = ['super_admin', 'property_admin'].includes(userRole?.role || '');
	const isAccountant = userRole?.role === 'property_accountant';
	const isUtility = userRole?.role === 'property_utility';
	const isFrontdesk = userRole?.role === 'property_frontdesk';
	const isResident = userRole?.role === 'property_resident';

	const result = {
		payments: enrichedPayments,
		billings: formattedUnpaidBillings,
		userRole: userRole?.role || 'user',
		isAdminLevel,
		isAccountant,
		isUtility,
		isFrontdesk,
		isResident
	};

	cache.set(cacheKey, result, CACHE_TTL.SHORT);
	console.log('Cached payments data');

	return result;
}

export const load = async ({ locals, depends }) => {
	depends('app:payments');

	const { user } = locals;
	if (!user) {
		return fail(401, { message: 'Unauthorized' });
	}

	const form = await superValidate(zod(paymentSchema));
	const transactionForm = await superValidate(zod(transactionSchema));

	return {
		form,
		transactionForm,
		payments: [],
		billings: [],
		userRole: 'user',
		isAdminLevel: false,
		isAccountant: false,
		isUtility: false,
		isFrontdesk: false,
		isResident: false,
		lazy: true,
		paymentsPromise: loadPaymentsData(locals)
	};
};

export const actions = {
	create: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) {
			return fail(401, {
				form: null,
				error: 'You must be logged in to create payments'
			});
		}

		const form = await superValidate(request, zod(paymentSchema));
		if (!form.valid) {
			return fail(400, {
				form,
				error: 'Invalid form data. Please check your input.'
			});
		}

		// Get billing details
		const billingResult = await db
			.select()
			.from(billings)
			.where(eq(billings.id, form.data.billing_id))
			.limit(1);

		const billing = billingResult[0];
		if (!billing) {
			return fail(404, {
				form,
				error: `Billing #${form.data.billing_id} not found or has been deleted`
			});
		}

		// Get user role
		const userRoleResult = await db
			.select({ role: profiles.role, name: profiles.name })
			.from(profiles)
			.where(eq(profiles.id, user.id))
			.limit(1);
		const userRole = userRoleResult[0];

		const canCreate = [
			'super_admin',
			'property_admin',
			'property_accountant',
			'property_frontdesk'
		] as UserRole[];
		if (!canCreate.includes(userRole?.role as UserRole)) {
			return fail(403, {
				form,
				error: 'You do not have permission to create payments'
			});
		}

		if (!['PENDING', 'PARTIAL', 'OVERDUE'].includes(billing.status)) {
			return fail(400, {
				form,
				error: `Cannot process payment for billing in ${billing.status} status. Only PENDING, PARTIAL, or OVERDUE billings can receive payments.`
			});
		}

		if (form.data.amount > billing.balance) {
			return fail(400, {
				form,
				error: `Payment amount (${form.data.amount}) exceeds billing balance (${billing.balance}). Please enter an amount less than or equal to the balance.`
			});
		}

		// Check for late payment and calculate penalty
		const penaltyConfig = await getPenaltyConfig(db, billing.type);
		let penaltyAmount = 0;

		if (penaltyConfig && new Date(form.data.paid_at) > new Date(billing.dueDate)) {
			penaltyAmount = await calculatePenalty(billing, penaltyConfig, new Date(form.data.paid_at));
		}

		let createdPayment;
		try {
			const timestamp = getUTCTimestamp();
			const result = await db
				.insert(payments)
				.values({
					...form.data,
					createdBy: user.id,
					updatedBy: user.id,
					createdAt: timestamp,
					updatedAt: timestamp
				})
				.returning();

			createdPayment = result[0];

			// Update billing status
			await updateBillingStatus(db, billing, billing.paidAmount + form.data.amount);

			// Create penalty billing if needed
			if (penaltyAmount > 0) {
				await createPenaltyBilling(db, billing, penaltyAmount);
			}

			cache.delete(cacheKeys.payments());
			console.log('Invalidated payments cache');

			return {
				form,
				success: true,
				message: `Payment of ${form.data.amount} successfully processed`
			};
		} catch (err) {
			console.error('Transaction failed:', err);

			// Attempt to rollback payment if it was created
			try {
				if (createdPayment?.id) {
					await db.delete(payments).where(eq(payments.id, createdPayment.id));
				}
			} catch (rollbackError) {
				console.error('Failed to rollback payment:', rollbackError);
			}

			return fail(500, {
				form,
				error:
					'Failed to process payment. Please try again or contact support if the issue persists.'
			});
		}
	},

	update: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) {
			return fail(401, {
				form: null,
				error: 'You must be logged in to update payments'
			});
		}

		const form = await superValidate(request, zod(paymentSchema));
		if (!form.valid) {
			return fail(400, {
				form,
				error: 'Invalid form data. Please check your input.'
			});
		}

		const userRoleResult = await db
			.select({ role: profiles.role })
			.from(profiles)
			.where(eq(profiles.id, user.id))
			.limit(1);
		const userRole = userRoleResult[0];

		const canUpdate = ['super_admin', 'property_admin', 'property_accountant'] as UserRole[];
		if (!canUpdate.includes(userRole?.role as UserRole)) {
			return fail(403, {
				form,
				error: 'You do not have permission to update payments'
			});
		}

		// Get existing payment
		const existingResult = await db
			.select()
			.from(payments)
			.where(eq(payments.id, form.data.id))
			.limit(1);

		if (existingResult.length === 0) {
			return fail(404, {
				form,
				error: 'Payment not found or has been deleted'
			});
		}

		try {
			await db
				.update(payments)
				.set({
					...form.data,
					updatedBy: user.id,
					updatedAt: getUTCTimestamp()
				})
				.where(eq(payments.id, form.data.id));
		} catch (err) {
			console.error('Failed to update payment:', err);
			return fail(500, {
				form,
				error: 'Failed to update payment record'
			});
		}

		cache.delete(cacheKeys.payments());
		console.log('Invalidated payments cache');

		return { form };
	},

	revert: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) {
			return fail(401, {
				form: null,
				error: 'You must be logged in to revert payments'
			});
		}

		const formData = await request.formData();
		const paymentIdRaw = formData.get('payment_id');
		const reason = (formData.get('reason') as string) || null;

		if (!paymentIdRaw) {
			return fail(400, { error: 'payment_id is required' });
		}

		const paymentId = Number(paymentIdRaw);
		if (!Number.isFinite(paymentId) || paymentId <= 0) {
			return fail(400, { error: 'Invalid payment_id' });
		}

		// Authorization
		const userRoleResult = await db
			.select({ role: profiles.role })
			.from(profiles)
			.where(eq(profiles.id, user.id))
			.limit(1);
		const userRole = userRoleResult[0];

		const canRevert = ['super_admin', 'property_admin', 'property_accountant'] as UserRole[];
		if (!canRevert.includes(userRole?.role as UserRole)) {
			return fail(403, { error: 'You do not have permission to revert payments' });
		}

		// Ensure payment exists and not already reverted
		const paymentResult = await db
			.select({ id: payments.id, revertedAt: payments.revertedAt })
			.from(payments)
			.where(eq(payments.id, paymentId))
			.limit(1);

		const payment = paymentResult[0];
		if (!payment) {
			return fail(404, { error: 'Payment not found' });
		}

		if (payment.revertedAt) {
			return fail(400, { error: 'Payment is already reverted' });
		}

		// Call DB function to revert via raw SQL
		try {
			const revertResult = await db.execute(
				sql`SELECT revert_payment(${paymentId}, ${reason}, ${user.id})`
			);

			cache.delete(cacheKeys.payments());
			console.log('Invalidated payments cache');

			return { success: true, result: revertResult };
		} catch (err) {
			console.error('Failed to revert payment:', err);
			return fail(500, { error: 'Failed to revert payment' });
		}
	},

	upsert: async ({ request, locals }) => {
		console.log('SERVER ACTION: Upsert action called');

		const { user } = locals;
		if (!user) {
			return fail(401, {
				form: null,
				error: 'You must be logged in to update payments'
			});
		}

		const form = await superValidate(request, zod(transactionSchema));

		if (!form.valid) {
			return fail(400, {
				form,
				error: 'Invalid form data. Please check your input.'
			});
		}

		const userRoleResult = await db
			.select({ role: profiles.role })
			.from(profiles)
			.where(eq(profiles.id, user.id))
			.limit(1);
		const userRole = userRoleResult[0];

		const canUpdate = ['super_admin', 'property_admin', 'property_accountant'] as UserRole[];
		if (!canUpdate.includes(userRole?.role as UserRole)) {
			return fail(403, {
				form,
				error: 'You do not have permission to update payments'
			});
		}

		// Convert transaction data back to payment format
		const paymentData = {
			id: form.data.id,
			billingIds: form.data.billing_ids || [],
			amount: form.data.amount,
			method: mapTransactionMethodToPayment(form.data.method),
			referenceNumber: form.data.reference_number,
			paidBy: form.data.paid_by,
			paidAt: form.data.paid_at,
			notes: form.data.notes,
			receiptUrl: form.data.receipt_url
		};

		try {
			await db
				.update(payments)
				.set({
					...paymentData,
					updatedBy: user.id,
					updatedAt: getUTCTimestamp()
				})
				.where(eq(payments.id, form.data.id));
		} catch (err) {
			console.error('Failed to update payment:', err);
			return fail(500, {
				form,
				error: 'Failed to update payment record'
			});
		}

		cache.delete(cacheKeys.payments());
		console.log('Invalidated payments cache');

		return { form };
	}
};

// Helper function to map transaction methods back to payment methods
function mapTransactionMethodToPayment(transactionMethod: string): string {
	const methodMap: Record<string, string> = {
		BANK: 'BANK',
		GCASH: 'GCASH',
		CASH: 'CASH',
		SECURITY_DEPOSIT: 'SECURITY_DEPOSIT',
		OTHER: 'OTHER'
	};
	return methodMap[transactionMethod] || 'OTHER';
}

// Need to import sql for the revert RPC call
import { sql } from 'drizzle-orm';
