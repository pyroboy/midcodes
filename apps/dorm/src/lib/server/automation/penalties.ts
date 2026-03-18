import { db } from '$lib/server/db';
import { billings, leases, leaseTenants, tenants, penaltyConfigs, notifications, automationLogs } from '$lib/server/schema';
import { eq, and, lt, inArray, gt } from 'drizzle-orm';

export interface PenaltyResult {
	applied: number;
	totalPenaltyAmount: number;
	errors: string[];
}

/**
 * Calculate and apply penalties to overdue billings based on penaltyConfigs.
 * - Checks grace period before applying
 * - Supports percentage-based penalties
 * - Respects max penalty cap
 * - Compound penalties add to existing penaltyAmount
 */
export async function runPenaltyCalculation(): Promise<PenaltyResult> {
	const startedAt = new Date();
	const today = new Date();
	const todayStr = today.toISOString().split('T')[0];
	const errors: string[] = [];
	let applied = 0;
	let totalPenaltyAmount = 0;

	try {
		// Load penalty configs
		const configs = await db.select().from(penaltyConfigs);
		if (configs.length === 0) {
			await db.insert(automationLogs).values({
				jobType: 'PENALTY_CALC',
				status: 'SUCCESS',
				itemsProcessed: 0,
				itemsFailed: 0,
				details: { message: 'No penalty configs defined' },
				startedAt,
				completedAt: new Date()
			});
			return { applied: 0, totalPenaltyAmount: 0, errors: [] };
		}

		// Get overdue billings with outstanding balance
		const overdueBills = await db
			.select({
				billingId: billings.id,
				type: billings.type,
				amount: billings.amount,
				balance: billings.balance,
				penaltyAmount: billings.penaltyAmount,
				dueDate: billings.dueDate,
				status: billings.status,
				tenantName: tenants.name,
				tenantId: tenants.id
			})
			.from(billings)
			.innerJoin(leases, eq(billings.leaseId, leases.id))
			.innerJoin(leaseTenants, eq(leases.id, leaseTenants.leaseId))
			.innerJoin(tenants, eq(leaseTenants.tenantId, tenants.id))
			.where(
				and(
					lt(billings.dueDate, todayStr),
					inArray(billings.status, ['OVERDUE', 'PENALIZED']),
					gt(billings.balance, '0')
				)
			);

		// Deduplicate
		const seen = new Set<number>();
		const uniqueBills = overdueBills.filter((b) => {
			if (seen.has(b.billingId)) return false;
			seen.add(b.billingId);
			return true;
		});

		for (const bill of uniqueBills) {
			const config = configs.find((c) => c.type === bill.type);
			if (!config) continue;

			const dueDate = new Date(bill.dueDate);
			const daysOverdue = Math.floor(
				(today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
			);

			// Check if past grace period
			if (daysOverdue <= config.gracePeriod) continue;

			const originalAmount = Number(bill.amount);
			const currentPenalty = Number(bill.penaltyAmount ?? 0);
			const penaltyPercentage = Number(config.penaltyPercentage);
			const maxPenaltyPct = config.maxPenaltyPercentage
				? Number(config.maxPenaltyPercentage)
				: null;

			// Calculate the expected penalty
			let newPenalty: number;

			if (config.compoundPeriod && config.compoundPeriod > 0) {
				// Compound: penalty applies per period
				const periodsOverdue = Math.floor(
					(daysOverdue - config.gracePeriod) / config.compoundPeriod
				);
				// Total compound penalty = percentage × original × periods
				newPenalty = (penaltyPercentage / 100) * originalAmount * Math.max(1, periodsOverdue);
			} else {
				// Simple: one-time penalty
				newPenalty = (penaltyPercentage / 100) * originalAmount;
			}

			// Apply max cap
			if (maxPenaltyPct !== null) {
				const maxAmount = (maxPenaltyPct / 100) * originalAmount;
				newPenalty = Math.min(newPenalty, maxAmount);
			}

			// Round to 2 decimal places
			newPenalty = Math.round(newPenalty * 100) / 100;

			// Skip if penalty hasn't changed
			if (newPenalty <= currentPenalty) continue;

			const penaltyIncrease = newPenalty - currentPenalty;

			try {
				// Update billing with new penalty
				const newBalance = Number(bill.balance) + penaltyIncrease;
				await db
					.update(billings)
					.set({
						penaltyAmount: String(newPenalty),
						balance: String(Math.round(newBalance * 100) / 100),
						status: 'PENALIZED',
						updatedAt: new Date()
					})
					.where(eq(billings.id, bill.billingId));

				applied++;
				totalPenaltyAmount += penaltyIncrease;

				// Notification
				await db.insert(notifications).values({
					type: 'PENALTY_APPLIED',
					title: `Penalty applied: ${bill.tenantName}`,
					body: `₱${penaltyIncrease.toLocaleString('en-PH', { minimumFractionDigits: 2 })} penalty added to ${bill.type} billing. Total penalty: ₱${newPenalty.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
					relatedId: bill.billingId,
					relatedType: 'billing',
					metadata: {
						tenantId: bill.tenantId,
						penaltyIncrease,
						totalPenalty: newPenalty,
						daysOverdue,
						type: bill.type
					}
				});
			} catch (e) {
				errors.push(
					`Billing #${bill.billingId}: ${e instanceof Error ? e.message : String(e)}`
				);
			}
		}

		await db.insert(automationLogs).values({
			jobType: 'PENALTY_CALC',
			status: errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
			itemsProcessed: applied,
			itemsFailed: errors.length,
			details: { applied, totalPenaltyAmount, errors },
			startedAt,
			completedAt: new Date()
		});
	} catch (e) {
		await db.insert(automationLogs).values({
			jobType: 'PENALTY_CALC',
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

	return { applied, totalPenaltyAmount, errors };
}
