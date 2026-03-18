import { db } from '$lib/server/db';
import { billings, leases, leaseTenants, tenants, notifications, automationLogs } from '$lib/server/schema';
import { eq, and, gte, lte, inArray, gt } from 'drizzle-orm';

export interface ReminderResult {
	sent: number;
	skipped: number;
	errors: string[];
}

/**
 * Generate payment reminders for billings due within the next 3 days.
 * Deduplicates: won't re-notify if a PAYMENT_REMINDER already exists for the same billing.
 */
export async function runPaymentReminders(): Promise<ReminderResult> {
	const startedAt = new Date();
	const today = new Date();
	const todayStr = today.toISOString().split('T')[0];

	const threeDaysLater = new Date(today);
	threeDaysLater.setDate(threeDaysLater.getDate() + 3);
	const futureStr = threeDaysLater.toISOString().split('T')[0];

	const errors: string[] = [];
	let sent = 0;
	let skipped = 0;

	try {
		// Find billings due within 3 days that are still unpaid
		const upcomingBills = await db
			.select({
				billingId: billings.id,
				type: billings.type,
				amount: billings.amount,
				balance: billings.balance,
				dueDate: billings.dueDate,
				tenantName: tenants.name,
				tenantId: tenants.id
			})
			.from(billings)
			.innerJoin(leases, eq(billings.leaseId, leases.id))
			.innerJoin(leaseTenants, eq(leases.id, leaseTenants.leaseId))
			.innerJoin(tenants, eq(leaseTenants.tenantId, tenants.id))
			.where(
				and(
					gte(billings.dueDate, todayStr),
					lte(billings.dueDate, futureStr),
					inArray(billings.status, ['PENDING', 'PARTIAL']),
					gt(billings.balance, '0')
				)
			);

		// Deduplicate by billingId
		const seen = new Set<number>();
		const uniqueBills = upcomingBills.filter((b) => {
			if (seen.has(b.billingId)) return false;
			seen.add(b.billingId);
			return true;
		});

		// Check for existing reminders to avoid duplicates
		const existingReminders = await db
			.select({ relatedId: notifications.relatedId })
			.from(notifications)
			.where(
				and(
					eq(notifications.type, 'PAYMENT_REMINDER'),
					eq(notifications.relatedType, 'billing')
				)
			);

		const alreadyNotified = new Set(existingReminders.map((r) => r.relatedId));

		for (const bill of uniqueBills) {
			if (alreadyNotified.has(bill.billingId)) {
				skipped++;
				continue;
			}

			try {
				const dueDate = new Date(bill.dueDate);
				const daysUntilDue = Math.ceil(
					(dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
				);

				await db.insert(notifications).values({
					type: 'PAYMENT_REMINDER',
					title: `Payment due: ${bill.tenantName}`,
					body: `${bill.type} billing of ₱${Number(bill.balance).toLocaleString('en-PH', { minimumFractionDigits: 2 })} is due ${daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day(s)`} (${bill.dueDate}).`,
					relatedId: bill.billingId,
					relatedType: 'billing',
					tenantId: bill.tenantId,
					metadata: { daysUntilDue, type: bill.type }
				});
				sent++;
			} catch (e) {
				errors.push(
					`Billing #${bill.billingId}: ${e instanceof Error ? e.message : String(e)}`
				);
			}
		}

		// Also check for leases expiring within 30 days
		const in30 = new Date(today);
		in30.setDate(in30.getDate() + 30);
		const in30Str = in30.toISOString().split('T')[0];

		const expiringLeases = await db
			.select({
				leaseId: leases.id,
				endDate: leases.endDate,
				tenantName: tenants.name,
				tenantId: tenants.id,
				leaseName: leases.name
			})
			.from(leases)
			.innerJoin(leaseTenants, eq(leases.id, leaseTenants.leaseId))
			.innerJoin(tenants, eq(leaseTenants.tenantId, tenants.id))
			.where(
				and(
					eq(leases.status, 'ACTIVE'),
					gte(leases.endDate, todayStr),
					lte(leases.endDate, in30Str)
				)
			);

		// Deduplicate by leaseId
		const seenLeases = new Set<number>();
		const uniqueLeases = expiringLeases.filter((l) => {
			if (seenLeases.has(l.leaseId)) return false;
			seenLeases.add(l.leaseId);
			return true;
		});

		// Check existing lease expiry notifications
		const existingLeaseNotifs = await db
			.select({ relatedId: notifications.relatedId })
			.from(notifications)
			.where(
				and(
					eq(notifications.type, 'LEASE_EXPIRY'),
					eq(notifications.relatedType, 'lease')
				)
			);
		const leaseAlreadyNotified = new Set(existingLeaseNotifs.map((r) => r.relatedId));

		for (const lease of uniqueLeases) {
			if (leaseAlreadyNotified.has(lease.leaseId)) {
				skipped++;
				continue;
			}

			try {
				const endDate = new Date(lease.endDate);
				const daysUntilExpiry = Math.ceil(
					(endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
				);

				await db.insert(notifications).values({
					type: 'LEASE_EXPIRY',
					title: `Lease expiring: ${lease.tenantName}`,
					body: `Lease "${lease.leaseName}" expires ${daysUntilExpiry === 0 ? 'today' : `in ${daysUntilExpiry} day(s)`} (${lease.endDate}).`,
					relatedId: lease.leaseId,
					relatedType: 'lease',
					tenantId: lease.tenantId,
					metadata: { daysUntilExpiry }
				});
				sent++;
			} catch (e) {
				errors.push(
					`Lease #${lease.leaseId}: ${e instanceof Error ? e.message : String(e)}`
				);
			}
		}

		await db.insert(automationLogs).values({
			jobType: 'REMINDER',
			status: errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
			itemsProcessed: sent,
			itemsFailed: errors.length,
			details: { sent, skipped, errors },
			startedAt,
			completedAt: new Date()
		});
	} catch (e) {
		await db.insert(automationLogs).values({
			jobType: 'REMINDER',
			status: 'FAILED',
			itemsProcessed: 0,
			itemsFailed: 1,
			details: { error: e instanceof Error ? e.message : String(e) },
			startedAt,
			completedAt: new Date(),
			error: e instanceof Error ? e.message : String(e)
		});
		throw e;
	}

	return { sent, skipped, errors };
}
