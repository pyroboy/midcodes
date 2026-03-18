import { db } from '$lib/server/db';
import { billings, leases, leaseTenants, tenants, notifications, automationLogs } from '$lib/server/schema';
import { eq, and, lt, inArray, gt } from 'drizzle-orm';

export interface OverdueResult {
	updated: number;
	notified: number;
	errors: string[];
}

/**
 * Detect overdue billings and update their status.
 * Creates admin notifications for newly-overdue items.
 */
export async function runOverdueCheck(): Promise<OverdueResult> {
	const startedAt = new Date();
	const today = new Date().toISOString().split('T')[0];
	const errors: string[] = [];
	let updated = 0;
	let notified = 0;

	try {
		// Find billings that are past due but still PENDING or PARTIAL
		const overdueBills = await db
			.select({
				billingId: billings.id,
				type: billings.type,
				amount: billings.amount,
				balance: billings.balance,
				dueDate: billings.dueDate,
				status: billings.status,
				leaseId: billings.leaseId,
				tenantName: tenants.name,
				tenantId: tenants.id
			})
			.from(billings)
			.innerJoin(leases, eq(billings.leaseId, leases.id))
			.innerJoin(leaseTenants, eq(leases.id, leaseTenants.leaseId))
			.innerJoin(tenants, eq(leaseTenants.tenantId, tenants.id))
			.where(
				and(
					lt(billings.dueDate, today),
					inArray(billings.status, ['PENDING', 'PARTIAL']),
					gt(billings.balance, '0')
				)
			);

		// Deduplicate by billingId
		const seen = new Set<number>();
		const uniqueBills = overdueBills.filter((b) => {
			if (seen.has(b.billingId)) return false;
			seen.add(b.billingId);
			return true;
		});

		for (const bill of uniqueBills) {
			try {
				// Update status to OVERDUE
				await db
					.update(billings)
					.set({ status: 'OVERDUE', updatedAt: new Date() })
					.where(eq(billings.id, bill.billingId));
				updated++;

				// Create notification for admin
				const dueDate = new Date(bill.dueDate);
				const daysOverdue = Math.floor(
					(new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
				);

				await db.insert(notifications).values({
					type: 'OVERDUE_NOTICE',
					title: `Overdue: ${bill.tenantName}`,
					body: `${bill.type} billing of ₱${Number(bill.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })} is ${daysOverdue} day(s) overdue. Balance: ₱${Number(bill.balance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
					relatedId: bill.billingId,
					relatedType: 'billing',
					metadata: { tenantId: bill.tenantId, daysOverdue, type: bill.type }
				});
				notified++;
			} catch (e) {
				errors.push(`Billing #${bill.billingId}: ${e instanceof Error ? e.message : String(e)}`);
			}
		}

		// Log the run
		await db.insert(automationLogs).values({
			jobType: 'OVERDUE_CHECK',
			status: errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
			itemsProcessed: updated,
			itemsFailed: errors.length,
			details: { updated, notified, errors },
			startedAt,
			completedAt: new Date()
		});
	} catch (e) {
		await db.insert(automationLogs).values({
			jobType: 'OVERDUE_CHECK',
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

	return { updated, notified, errors };
}
