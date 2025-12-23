import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { orgSettings } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
	// Cache for 5 minutes (org settings rarely change)
	setHeaders({
		'cache-control': 'private, max-age=300'
	});

	const { org_id, user } = locals;
	let paymentsEnabled = true;

	// Check if payments are enabled for this organization using Drizzle
	if (org_id) {
		const [settings] = await db
			.select({
				paymentsEnabled: orgSettings.paymentsEnabled
			})
			.from(orgSettings)
			.where(eq(orgSettings.orgId, org_id))
			.limit(1);

		paymentsEnabled = settings?.paymentsEnabled ?? true;
	}

	return {
		user,
		paymentsEnabled
	};
};
