import { db } from '$lib/server/db';
import { scans } from '$lib/server/schema';
import { desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const recentScans = await db.query.scans.findMany({
		limit: 50,
		orderBy: [desc(scans.scannedAt)],
		with: { person: true }
	});

	return {
		scans: recentScans.map((s) => ({
			id: s.id,
			personId: s.personId,
			fullName: s.person.fullName,
			idNumber: s.person.idNumber,
			anomalyData: s.anomalyData,
			scannedAt: s.scannedAt.toISOString()
		}))
	};
};
