import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { scans, people } from '$lib/server/schema';
import { publishScanEvent } from '$lib/server/ably';
import { eq, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

/** POST /api/scans — Record a new scan (from scanner hardware or manual entry) */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');

	const body = await request.json();
	const { idNumber, anomalyData } = body;

	if (!idNumber) throw error(400, 'idNumber is required');

	// Look up person
	const person = await db.query.people.findFirst({
		where: eq(people.idNumber, idNumber)
	});

	if (!person) throw error(404, `No person found with ID: ${idNumber}`);

	// Insert scan
	const [scan] = await db.insert(scans).values({
		personId: person.id,
		anomalyData: anomalyData ?? null
	}).returning();

	// Publish real-time event
	await publishScanEvent({
		type: 'scan:new',
		data: {
			id: scan.id,
			personId: person.id,
			fullName: person.fullName,
			idNumber: person.idNumber,
			anomalyData: scan.anomalyData,
			scannedAt: scan.scannedAt.toISOString()
		}
	});

	return json({ success: true, scan });
};

/** GET /api/scans — Fetch recent scans */
export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');

	const limit = parseInt(url.searchParams.get('limit') ?? '20');

	const results = await db.query.scans.findMany({
		limit,
		orderBy: [desc(scans.scannedAt)],
		with: { person: true }
	});

	return json(results);
};
