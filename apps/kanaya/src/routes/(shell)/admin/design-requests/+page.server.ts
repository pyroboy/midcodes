import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { customDesignRequests, profiles } from '$lib/server/schema';
import { desc, eq } from 'drizzle-orm';
import { checkAdmin } from '$lib/utils/adminPermissions';

export const load: PageServerLoad = async ({ locals, parent }) => {
	await parent();

	if (!checkAdmin(locals)) {
		throw error(403, 'Admin access required');
	}

	const requests = await db
		.select({
			id: customDesignRequests.id,
			userId: customDesignRequests.userId,
			orgId: customDesignRequests.orgId,
			sizePresetId: customDesignRequests.sizePresetId,
			widthPixels: customDesignRequests.widthPixels,
			heightPixels: customDesignRequests.heightPixels,
			sizeName: customDesignRequests.sizeName,
			designInstructions: customDesignRequests.designInstructions,
			referenceAssets: customDesignRequests.referenceAssets,
			status: customDesignRequests.status,
			adminNotes: customDesignRequests.adminNotes,
			rejectedReason: customDesignRequests.rejectedReason,
			approvedBy: customDesignRequests.approvedBy,
			approvedAt: customDesignRequests.approvedAt,
			resultingTemplateId: customDesignRequests.resultingTemplateId,
			createdAt: customDesignRequests.createdAt,
			updatedAt: customDesignRequests.updatedAt,
			requesterEmail: profiles.email
		})
		.from(customDesignRequests)
		.leftJoin(profiles, eq(customDesignRequests.userId, profiles.id))
		.orderBy(desc(customDesignRequests.createdAt))
		.limit(100);

	return {
		requests
	};
};
