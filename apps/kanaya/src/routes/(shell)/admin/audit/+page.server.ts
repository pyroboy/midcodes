import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { hasRole } from '$lib/utils/adminPermissions';
import { db } from '$lib/server/db';
import { adminAudit, profiles } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/auth');

	if (!hasRole(locals, ['super_admin', 'org_admin', 'id_gen_admin'])) {
		throw error(403, 'Admin access required');
	}

	const org_id = locals.org_id;

	if (!org_id) {
		throw error(500, 'Organization ID not found');
	}

	// Get audit logs with admin email via left join
	const logs = await db
		.select({
			id: adminAudit.id,
			orgId: adminAudit.orgId,
			adminId: adminAudit.adminId,
			action: adminAudit.action,
			targetType: adminAudit.targetType,
			targetId: adminAudit.targetId,
			ipAddress: adminAudit.ipAddress,
			userAgent: adminAudit.userAgent,
			metadata: adminAudit.metadata,
			createdAt: adminAudit.createdAt,
			adminEmail: profiles.email
		})
		.from(adminAudit)
		.leftJoin(profiles, eq(adminAudit.adminId, profiles.id))
		.where(eq(adminAudit.orgId, org_id))
		.orderBy(desc(adminAudit.createdAt))
		.limit(200);

	return {
		logs
	};
};
