/**
 * Remote Sync Check API.
 *
 * POST: Client submits its collection test results (counts + read/write probes).
 * GET:  Server reads all client reports + server store counts.
 * PUT:  Server broadcasts SYNC_CHECK signal to all SSE clients.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addSyncCheckReport, getSyncCheckReports } from '$lib/server/sync-check-store';
import { getServerStoreSummary } from '$lib/server/replication-store';
import { emitBroadcast } from '$lib/server/replication-store';
import { trackClient, displayIP, isLoopbackIP } from '$lib/server/client-tracker';
import { log } from '$lib/server/logger';

/** POST — client submits test results */
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const ip = getClientAddress();
	const dip = displayIP(ip);
	const userAgent = request.headers.get('user-agent') || '';
	const client = trackClient(ip, userAgent, 'sync-check/report');
	const isServer = isLoopbackIP(ip);

	const body = await request.json();

	const report = {
		id: `${dip}-${Date.now()}`,
		clientIp: dip,
		deviceHint: isServer ? 'Server' : client.deviceHint,
		isServer,
		collections: body.collections ?? {},
		checkedAt: new Date().toISOString(),
	};

	addSyncCheckReport(report);

	const colCount = Object.keys(report.collections).length;
	const readOk = Object.values(report.collections).filter((c: any) => c.readOk).length;
	const writeOk = Object.values(report.collections).filter((c: any) => c.writeOk).length;
	log.info('SyncCheck', `📋 Report from ${isServer ? '💻 Server' : `📱 ${client.deviceHint}`} (${dip}) — ${colCount} collections, read:${readOk}/${colCount}, write:${writeOk}/${colCount}`);

	return json({ ok: true });
};

/** GET — server reads all reports + server store counts */
export const GET: RequestHandler = async ({ getClientAddress }) => {
	const ip = getClientAddress();
	trackClient(ip, '', 'sync-check/read');

	const reports = getSyncCheckReports();
	const { collections: serverCounts, total } = getServerStoreSummary();

	return json({
		serverCounts,
		serverTotal: total,
		clientReports: reports,
	});
};

/** PUT — trigger all clients to run sync check */
export const PUT: RequestHandler = async ({ getClientAddress }) => {
	const ip = getClientAddress();
	trackClient(ip, '', 'sync-check/trigger');
	const isServer = isLoopbackIP(ip);

	log.info('SyncCheck', `🔔 Sync check triggered by ${isServer ? '💻 Server' : `📱 ${displayIP(ip)}`}`);
	emitBroadcast('SYNC_CHECK');

	return json({ ok: true, signal: 'SYNC_CHECK' });
};
