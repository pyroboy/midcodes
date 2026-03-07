#!/usr/bin/env node
/**
 * Route health check — no browser needed.
 * GETs every static route and fails if any returns HTTP 5xx.
 *
 * Usage:
 *   node scripts/check-routes.js              # assumes server at localhost:5173
 *   BASE_URL=http://localhost:4173 node ...   # custom URL (e.g. preview build)
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const TIMEOUT_MS = 5_000;

const ROUTES = [
	// Auth
	'/',

	// POS
	'/pos',

	// Kitchen
	'/kitchen',
	'/kitchen/all-orders',
	'/kitchen/orders',
	'/kitchen/weigh-station',

	// Dashboard & Expenses
	'/dashboard',
	'/expenses',

	// Stock
	'/stock',
	'/stock/counts',
	'/stock/deliveries',
	'/stock/inventory',
	'/stock/receive',
	'/stock/transfers',

	// Reports
	'/reports',
	'/reports/best-sellers',
	'/reports/branch-comparison',
	'/reports/eod',
	'/reports/expenses-daily',
	'/reports/expenses-monthly',
	'/reports/meat-report',
	'/reports/peak-hours',
	'/reports/profit-gross',
	'/reports/profit-net',
	'/reports/sales-summary',
	'/reports/staff-performance',
	'/reports/table-sales',
	'/reports/voids-discounts',
	'/reports/x-read',

	// Admin
	'/admin',
	'/admin/floor-editor',
	'/admin/logs',
	'/admin/menu',
	'/admin/users',
];

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

async function checkRoute(route) {
	const url = BASE_URL + route;
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
		return { route, status: res.status, ok: res.status < 500 };
	} catch (err) {
		const message = err.name === 'TimeoutError' ? `timeout after ${TIMEOUT_MS}ms` : err.message;
		return { route, status: null, ok: false, error: message };
	}
}

async function main() {
	console.log(`\n${DIM}Checking ${ROUTES.length} routes against ${BASE_URL}${RESET}\n`);

	// Check server is up first
	try {
		await fetch(BASE_URL, { signal: AbortSignal.timeout(3_000) });
	} catch {
		console.error(`${RED}✗ Server not reachable at ${BASE_URL}${RESET}`);
		console.error(`  Start it first: pnpm dev\n`);
		process.exit(2);
	}

	const results = await Promise.all(ROUTES.map(checkRoute));

	const passed = results.filter((r) => r.ok);
	const failed = results.filter((r) => !r.ok);

	for (const r of results) {
		if (r.ok) {
			console.log(`${GREEN}✓${RESET} ${r.route.padEnd(40)} ${DIM}${r.status}${RESET}`);
		} else if (r.error) {
			console.log(`${RED}✗${RESET} ${r.route.padEnd(40)} ${RED}${r.error}${RESET}`);
		} else {
			console.log(`${RED}✗${RESET} ${r.route.padEnd(40)} ${RED}HTTP ${r.status}${RESET}`);
		}
	}

	console.log(`\n${passed.length}/${ROUTES.length} routes OK`);

	if (failed.length > 0) {
		console.log(`${RED}${failed.length} route(s) failed:${RESET}`);
		for (const r of failed) {
			const detail = r.error ?? `HTTP ${r.status}`;
			console.log(`  ${YELLOW}→ ${r.route}${RESET} (${detail})`);
		}
		console.log('');
		process.exit(1);
	}

	console.log(`${GREEN}All routes healthy.${RESET}\n`);
}

main();
