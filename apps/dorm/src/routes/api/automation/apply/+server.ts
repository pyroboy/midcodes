import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { billings, notifications } from '$lib/server/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * POST /api/automation/apply — Lightweight write endpoint for client-detected automation.
 * No JOINs, no scans — client already computed what needs changing.
 * Each operation is a simple UPDATE/INSERT, well within CF Workers 10ms CPU.
 *
 * Idempotent: checks current status before writing (safe for concurrent tabs).
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const { type, items } = body as { type: string; items: any[] };

	if (!items || items.length === 0) {
		return json({ applied: 0, sent: 0 });
	}

	try {
		if (type === 'overdue') {
			return json(await applyOverdue(items));
		} else if (type === 'penalties') {
			return json(await applyPenalties(items));
		} else if (type === 'reminders') {
			return json(await applyReminders(items));
		}
		return json({ error: 'Unknown type' }, { status: 400 });
	} catch (err: any) {
		console.error(`[Automation] ${type} failed:`, err);
		return json({ error: err?.message ?? 'Internal error' }, { status: 500 });
	}
};

async function applyOverdue(items: any[]): Promise<{ applied: number }> {
	let applied = 0;
	const ids = items.map((i) => Number(i.billingId));

	// Fetch current status — only update if still PENDING/PARTIAL (idempotent guard)
	const current = await db
		.select({ id: billings.id, status: billings.status })
		.from(billings)
		.where(inArray(billings.id, ids));

	const eligible = new Set(
		current.filter((b) => b.status === 'PENDING' || b.status === 'PARTIAL').map((b) => b.id)
	);

	for (const item of items) {
		const bid = Number(item.billingId);
		if (!eligible.has(bid)) continue;

		await db
			.update(billings)
			.set({ status: 'OVERDUE', updatedAt: new Date() })
			.where(eq(billings.id, bid));

		await db.insert(notifications).values({
			type: 'OVERDUE_NOTICE',
			title: `Overdue: ${item.tenantName}`,
			body: `${item.type} billing of ₱${Number(item.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })} is ${item.daysOverdue} day(s) overdue. Balance: ₱${Number(item.balance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
			relatedId: bid,
			relatedType: 'billing',
			metadata: { daysOverdue: item.daysOverdue, type: item.type }
		});

		applied++;
	}

	return { applied };
}

async function applyPenalties(items: any[]): Promise<{ applied: number }> {
	let applied = 0;
	const ids = items.map((i) => Number(i.billingId));

	// Idempotent guard: only update if still OVERDUE/PENALIZED with lower penalty
	const current = await db
		.select({ id: billings.id, status: billings.status, penaltyAmount: billings.penaltyAmount })
		.from(billings)
		.where(inArray(billings.id, ids));

	const currentMap = new Map(current.map((b) => [b.id, b]));

	for (const item of items) {
		const bid = Number(item.billingId);
		const cur = currentMap.get(bid);
		if (!cur) continue;
		if (cur.status !== 'OVERDUE' && cur.status !== 'PENALIZED') continue;
		if (Number(cur.penaltyAmount ?? 0) >= item.newPenaltyAmount) continue;

		await db
			.update(billings)
			.set({
				penaltyAmount: String(item.newPenaltyAmount),
				balance: String(item.newBalance),
				status: 'PENALIZED',
				updatedAt: new Date()
			})
			.where(eq(billings.id, bid));

		await db.insert(notifications).values({
			type: 'PENALTY_APPLIED',
			title: `Penalty applied: ${item.tenantName}`,
			body: `₱${item.penaltyIncrease.toLocaleString('en-PH', { minimumFractionDigits: 2 })} penalty added to ${item.type} billing. Total penalty: ₱${item.newPenaltyAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
			relatedId: bid,
			relatedType: 'billing',
			metadata: { penaltyIncrease: item.penaltyIncrease, totalPenalty: item.newPenaltyAmount, daysOverdue: item.daysOverdue, type: item.type }
		});

		applied++;
	}

	return { applied };
}

async function applyReminders(items: any[]): Promise<{ sent: number; skipped: number }> {
	let sent = 0;
	let skipped = 0;

	// Check existing reminders to deduplicate
	const existingPayment = await db
		.select({ relatedId: notifications.relatedId })
		.from(notifications)
		.where(
			and(
				eq(notifications.type, 'PAYMENT_REMINDER'),
				eq(notifications.relatedType, 'billing')
			)
		);
	const paymentNotified = new Set(existingPayment.map((r) => r.relatedId));

	const existingLease = await db
		.select({ relatedId: notifications.relatedId })
		.from(notifications)
		.where(
			and(
				eq(notifications.type, 'LEASE_EXPIRY'),
				eq(notifications.relatedType, 'lease')
			)
		);
	const leaseNotified = new Set(existingLease.map((r) => r.relatedId));

	for (const item of items) {
		if (item.kind === 'PAYMENT_REMINDER') {
			const bid = Number(item.billingId);
			if (paymentNotified.has(bid)) { skipped++; continue; }

			await db.insert(notifications).values({
				type: 'PAYMENT_REMINDER',
				title: `Payment due: ${item.tenantName}`,
				body: item.body,
				relatedId: bid,
				relatedType: 'billing',
				tenantId: Number(item.tenantId),
				metadata: { daysUntilDue: item.daysUntil, type: item.type }
			});
			sent++;
		} else if (item.kind === 'LEASE_EXPIRY') {
			const lid = Number(item.leaseId);
			if (leaseNotified.has(lid)) { skipped++; continue; }

			await db.insert(notifications).values({
				type: 'LEASE_EXPIRY',
				title: `Lease expiring: ${item.tenantName}`,
				body: item.body,
				relatedId: lid,
				relatedType: 'lease',
				tenantId: Number(item.tenantId),
				metadata: { daysUntilExpiry: item.daysUntil }
			});
			sent++;
		}
	}

	return { sent, skipped };
}
