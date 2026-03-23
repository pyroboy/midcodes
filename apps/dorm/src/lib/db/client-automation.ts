/**
 * Client-side automation — detects overdue billings, calculates penalties,
 * and generates reminders using local RxDB data. Writes back via a lightweight
 * server endpoint (no heavy JOINs — client already computed the values).
 *
 * Runs once after sync completes on app open. Idempotent — safe if multiple
 * tabs or admins trigger simultaneously (server writes are guarded by status checks).
 */
import { getDb } from '$lib/db';

// ─── Types ───────────────────────────────────────────────────────────────────

type OverdueItem = { billingId: string; daysOverdue: number; tenantName: string; type: string; amount: string; balance: string };
type PenaltyItem = { billingId: string; newPenaltyAmount: number; penaltyIncrease: number; newBalance: number; daysOverdue: number; tenantName: string; type: string };
type ReminderItem = { billingId?: string; leaseId?: string; kind: 'PAYMENT_REMINDER' | 'LEASE_EXPIRY'; tenantName: string; tenantId: string; body: string; daysUntil: number; type?: string };

export type AutomationResult = {
	overdue: { detected: number; applied: number };
	penalties: { detected: number; applied: number };
	reminders: { detected: number; sent: number };
	errors: string[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
	return new Date().toISOString().split('T')[0];
}

function daysBetween(dateStr: string, ref: Date = new Date()): number {
	const d = new Date(dateStr);
	return Math.floor((ref.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntil(dateStr: string, ref: Date = new Date()): number {
	const d = new Date(dateStr);
	return Math.ceil((d.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
}

/** Build a tenant name lookup from lease_tenants + tenants collections. */
async function buildTenantLookup(): Promise<{ tenantByLease: Map<string, { name: string; id: string }> }> {
	const db = await getDb();

	const lts = await db.lease_tenants.find({ selector: { deleted_at: { $eq: null } } }).exec();
	const tenants = await db.tenants.find({ selector: { deleted_at: { $eq: null } } }).exec();

	const tenantMap = new Map<string, { name: string; id: string }>();
	for (const t of tenants) {
		tenantMap.set(String(t.id), { name: t.name, id: String(t.id) });
	}

	// lease_id → first tenant (for display purposes)
	const tenantByLease = new Map<string, { name: string; id: string }>();
	for (const lt of lts) {
		const tid = String(lt.tenant_id);
		const lid = String(lt.lease_id);
		if (!tenantByLease.has(lid) && tenantMap.has(tid)) {
			tenantByLease.set(lid, tenantMap.get(tid)!);
		}
	}

	return { tenantByLease };
}

// ─── Detection ───────────────────────────────────────────────────────────────

/** Detect billings past due date that are still PENDING or PARTIAL. */
async function detectOverdue(): Promise<OverdueItem[]> {
	const db = await getDb();
	const today = todayStr();
	const { tenantByLease } = await buildTenantLookup();

	const allBillings = await db.billings.find({
		selector: {
			deleted_at: { $eq: null },
			status: { $in: ['PENDING', 'PARTIAL'] },
			due_date: { $lt: today },
			balance: { $gt: '0' }
		}
	}).exec();

	return allBillings.map((b: any) => {
		const tenant = tenantByLease.get(String(b.lease_id));
		return {
			billingId: String(b.id),
			daysOverdue: daysBetween(b.due_date),
			tenantName: tenant?.name ?? 'Unknown',
			type: b.type,
			amount: b.amount,
			balance: b.balance
		};
	});
}

/** Calculate penalties for overdue/penalized billings based on penalty_configs. */
async function detectPenalties(): Promise<PenaltyItem[]> {
	const db = await getDb();
	const today = todayStr();
	const { tenantByLease } = await buildTenantLookup();

	const configs = await db.penalty_configs.find({ selector: { deleted_at: { $eq: null } } }).exec();
	if (configs.length === 0) return [];

	const configByType = new Map<string, any>();
	for (const c of configs) configByType.set(c.type, c);

	const overdueBillings = await db.billings.find({
		selector: {
			deleted_at: { $eq: null },
			status: { $in: ['OVERDUE', 'PENALIZED'] },
			due_date: { $lt: today },
			balance: { $gt: '0' }
		}
	}).exec();

	const items: PenaltyItem[] = [];

	for (const bill of overdueBillings) {
		const config = configByType.get(bill.type);
		if (!config) continue;

		const daysOver = daysBetween(bill.due_date);
		if (daysOver <= (config.grace_period ?? 0)) continue;

		const originalAmount = Number(bill.amount);
		const currentPenalty = Number(bill.penalty_amount ?? 0);
		const penaltyPct = Number(config.penalty_percentage);
		const maxPct = config.max_penalty_percentage ? Number(config.max_penalty_percentage) : null;

		let newPenalty: number;
		if (config.compound_period && config.compound_period > 0) {
			const periods = Math.floor((daysOver - (config.grace_period ?? 0)) / config.compound_period);
			newPenalty = (penaltyPct / 100) * originalAmount * Math.max(1, periods);
		} else {
			newPenalty = (penaltyPct / 100) * originalAmount;
		}

		if (maxPct !== null) {
			newPenalty = Math.min(newPenalty, (maxPct / 100) * originalAmount);
		}
		newPenalty = Math.round(newPenalty * 100) / 100;

		if (newPenalty <= currentPenalty) continue;

		const increase = newPenalty - currentPenalty;
		const tenant = tenantByLease.get(String(bill.lease_id));

		items.push({
			billingId: String(bill.id),
			newPenaltyAmount: newPenalty,
			penaltyIncrease: increase,
			newBalance: Math.round((Number(bill.balance) + increase) * 100) / 100,
			daysOverdue: daysOver,
			tenantName: tenant?.name ?? 'Unknown',
			type: bill.type
		});
	}

	return items;
}

/** Detect billings due within 3 days and leases expiring within 30 days. */
async function detectReminders(): Promise<ReminderItem[]> {
	const db = await getDb();
	const today = new Date();
	const todayS = todayStr();
	const { tenantByLease } = await buildTenantLookup();

	const items: ReminderItem[] = [];

	// Billings due within 3 days
	const threeDays = new Date(today);
	threeDays.setDate(threeDays.getDate() + 3);
	const futureStr = threeDays.toISOString().split('T')[0];

	const upcomingBills = await db.billings.find({
		selector: {
			deleted_at: { $eq: null },
			status: { $in: ['PENDING', 'PARTIAL'] },
			due_date: { $gte: todayS, $lte: futureStr },
			balance: { $gt: '0' }
		}
	}).exec();

	for (const bill of upcomingBills) {
		const tenant = tenantByLease.get(String(bill.lease_id));
		if (!tenant) continue;
		const days = daysUntil(bill.due_date, today);
		items.push({
			billingId: String(bill.id),
			kind: 'PAYMENT_REMINDER',
			tenantName: tenant.name,
			tenantId: tenant.id,
			type: bill.type,
			daysUntil: days,
			body: `${bill.type} billing of ₱${Number(bill.balance).toLocaleString('en-PH', { minimumFractionDigits: 2 })} is due ${days === 0 ? 'today' : `in ${days} day(s)`} (${bill.due_date}).`
		});
	}

	// Leases expiring within 30 days
	const in30 = new Date(today);
	in30.setDate(in30.getDate() + 30);
	const in30Str = in30.toISOString().split('T')[0];

	const expiringLeases = await db.leases.find({
		selector: {
			deleted_at: { $eq: null },
			status: { $eq: 'ACTIVE' },
			end_date: { $gte: todayS, $lte: in30Str }
		}
	}).exec();

	const seenLeases = new Set<string>();
	for (const lease of expiringLeases) {
		const lid = String(lease.id);
		if (seenLeases.has(lid)) continue;
		seenLeases.add(lid);
		const tenant = tenantByLease.get(lid);
		if (!tenant) continue;
		const days = daysUntil(lease.end_date, today);
		items.push({
			leaseId: lid,
			kind: 'LEASE_EXPIRY',
			tenantName: tenant.name,
			tenantId: tenant.id,
			daysUntil: days,
			body: `Lease "${lease.name}" expires ${days === 0 ? 'today' : `in ${days} day(s)`} (${lease.end_date}).`
		});
	}

	return items;
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

/** Guard: only run once per session (survives HMR). */
const RAN_KEY = '__dorm_automation_ran';

/**
 * Run all client-side automation checks after sync completes.
 * Sends detected items to `/api/automation/apply` for server writes.
 * Idempotent — server endpoint checks current status before writing.
 */
export async function runClientAutomation(): Promise<AutomationResult> {
	// Once per session
	if ((globalThis as any)[RAN_KEY]) {
		return { overdue: { detected: 0, applied: 0 }, penalties: { detected: 0, applied: 0 }, reminders: { detected: 0, sent: 0 }, errors: [] };
	}
	(globalThis as any)[RAN_KEY] = true;

	const result: AutomationResult = {
		overdue: { detected: 0, applied: 0 },
		penalties: { detected: 0, applied: 0 },
		reminders: { detected: 0, sent: 0 },
		errors: []
	};

	try {
		// 1. Overdue detection
		const overdueItems = await detectOverdue();
		result.overdue.detected = overdueItems.length;

		if (overdueItems.length > 0) {
			const res = await fetch('/api/automation/apply', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'overdue', items: overdueItems })
			});
			if (res.ok) {
				const data = await res.json();
				result.overdue.applied = data.applied ?? 0;
			} else {
				result.errors.push(`Overdue apply failed: ${res.status}`);
			}
		}

		// 2. Penalties (run after overdue so newly-overdue billings are eligible)
		const penaltyItems = await detectPenalties();
		result.penalties.detected = penaltyItems.length;

		if (penaltyItems.length > 0) {
			const res = await fetch('/api/automation/apply', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'penalties', items: penaltyItems })
			});
			if (res.ok) {
				const data = await res.json();
				result.penalties.applied = data.applied ?? 0;
			} else {
				result.errors.push(`Penalties apply failed: ${res.status}`);
			}
		}

		// 3. Reminders
		const reminderItems = await detectReminders();
		result.reminders.detected = reminderItems.length;

		if (reminderItems.length > 0) {
			const res = await fetch('/api/automation/apply', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'reminders', items: reminderItems })
			});
			if (res.ok) {
				const data = await res.json();
				result.reminders.sent = data.sent ?? 0;
			} else {
				result.errors.push(`Reminders apply failed: ${res.status}`);
			}
		}

		// 4. Resync billings if anything changed
		if (result.overdue.applied > 0 || result.penalties.applied > 0) {
			const { resyncCollection } = await import('$lib/db/replication');
			await resyncCollection('billings').catch(() => {});
		}
	} catch (err: any) {
		result.errors.push(err?.message ?? String(err));
	}

	return result;
}
