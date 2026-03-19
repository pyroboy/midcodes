import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export type NeonBillingData = {
	compute: { used: number; limit: number; unit: string };
	storage: { used: number; limit: number; unit: string };
	transfer: { used: number; limit: number; unit: string };
	periodStart: string;
	periodEnd: string;
	fetchedAt: number;
};

/** In-memory cache — billing data doesn't need real-time freshness */
let cache: { data: NeonBillingData; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const apiKey = env.NEON_API_KEY;
	const projectId = env.NEON_PROJECT_ID;

	if (!apiKey || !projectId) {
		return json({ error: 'Neon API credentials not configured' }, { status: 500 });
	}

	// Return cached data if fresh
	if (cache && Date.now() < cache.expiresAt) {
		return json(cache.data);
	}

	try {
		// Use project details endpoint — works with org API keys and includes
		// consumption fields directly in the project object (zero compute cost).
		const res = await fetch(
			`https://console.neon.tech/api/v2/projects/${projectId}`,
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
					Accept: 'application/json'
				}
			}
		);

		if (!res.ok) {
			const text = await res.text();
			console.error(`[Neon API] ${res.status}: ${text}`);
			return json({ error: `Neon API returned ${res.status}` }, { status: 502 });
		}

		const body = await res.json();
		const project = body.project;

		if (!project) {
			return json({ error: 'No project data found' }, { status: 404 });
		}

		// Neon free tier limits
		const COMPUTE_LIMIT_CU_HRS = 100;
		const STORAGE_LIMIT_GB = 0.5;
		const TRANSFER_LIMIT_GB = 5;

		const computeSeconds = project.compute_time_seconds ?? project.active_time_seconds ?? 0;
		const computeCuHrs = computeSeconds / 3600;

		// synthetic_storage_size is current storage in bytes
		const storageBytes = project.synthetic_storage_size ?? 0;
		const storageGB = storageBytes / (1024 ** 3);

		const transferBytes = project.data_transfer_bytes ?? 0;
		const transferGB = transferBytes / (1024 ** 3);

		const periodStart = project.consumption_period_start ?? new Date().toISOString();
		const periodEnd = project.consumption_period_end ?? new Date().toISOString();

		const data: NeonBillingData = {
			compute: { used: Math.round(computeCuHrs * 100) / 100, limit: COMPUTE_LIMIT_CU_HRS, unit: 'CU-hrs' },
			storage: { used: Math.round(storageGB * 100) / 100, limit: STORAGE_LIMIT_GB, unit: 'GB' },
			transfer: { used: Math.round(transferGB * 100) / 100, limit: TRANSFER_LIMIT_GB, unit: 'GB' },
			periodStart,
			periodEnd,
			fetchedAt: Date.now()
		};

		cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
		return json(data);
	} catch (err: any) {
		console.error('[Neon API] Fetch failed:', err?.message || err);
		return json({ error: err?.message || 'Failed to fetch Neon usage' }, { status: 502 });
	}
};
