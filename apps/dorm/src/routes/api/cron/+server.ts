import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$lib/server/env';
import { runOverdueCheck } from '$lib/server/automation/overdue';
import { runPenaltyCalculation } from '$lib/server/automation/penalties';
import { runPaymentReminders } from '$lib/server/automation/reminders';

/**
 * POST /api/cron — Runs all automation jobs sequentially.
 * Secured by CRON_SECRET bearer token.
 */
export const POST: RequestHandler = async ({ request }) => {
	// Auth: check bearer token
	const authHeader = request.headers.get('Authorization');
	const token = authHeader?.replace('Bearer ', '');

	const cronSecret = env.CRON_SECRET;
	if (!cronSecret) {
		return json({ error: 'CRON_SECRET not configured' }, { status: 500 });
	}

	if (token !== cronSecret) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const results: Record<string, any> = {};
	const jobErrors: string[] = [];

	// 1. Overdue detection
	try {
		results.overdue = await runOverdueCheck();
	} catch (e) {
		results.overdue = { error: e instanceof Error ? e.message : String(e) };
		jobErrors.push(`overdue: ${e instanceof Error ? e.message : String(e)}`);
	}

	// 2. Penalty calculation
	try {
		results.penalties = await runPenaltyCalculation();
	} catch (e) {
		results.penalties = { error: e instanceof Error ? e.message : String(e) };
		jobErrors.push(`penalties: ${e instanceof Error ? e.message : String(e)}`);
	}

	// 3. Payment reminders
	try {
		results.reminders = await runPaymentReminders();
	} catch (e) {
		results.reminders = { error: e instanceof Error ? e.message : String(e) };
		jobErrors.push(`reminders: ${e instanceof Error ? e.message : String(e)}`);
	}

	return json({
		ok: jobErrors.length === 0,
		timestamp: new Date().toISOString(),
		results,
		...(jobErrors.length > 0 ? { errors: jobErrors } : {})
	});
};
