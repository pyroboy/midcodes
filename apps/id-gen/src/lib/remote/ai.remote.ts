import { query, command } from '$app/server';
import { detectElementsWithVision, type VisionDetectionResult } from '$lib/server/vision';
import { removeBackgroundWithRunware, type BackgroundRemovalResult } from '$lib/server/runware';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { TemplateElementInput } from '$lib/schemas/template-element.schema';

import { checkAdmin } from '$lib/utils/adminPermissions';

// Helper to check for admin access
async function requireAdmin() {
	const { locals } = getRequestEvent();
	if (!checkAdmin(locals)) {
		throw error(403, 'Admin access required');
	}
}

/**
 * Analyze an ID card image to detect elements.
 */
export const analyzeIDCard = command(
	'unchecked',
	async ({ imageBase64 }: { imageBase64: string }): Promise<VisionDetectionResult> => {
		await requireAdmin();
		return await detectElementsWithVision(imageBase64);
	}
);

/**
 * Remove background from an image to separate layers.
 */
export const extractBackground = command(
	'unchecked',
	async ({ imageBase64 }: { imageBase64: string }): Promise<BackgroundRemovalResult> => {
		await requireAdmin();
		return await removeBackgroundWithRunware(imageBase64);
	}
);

/**
 * Synthesize a new template from detected elements and background.
 */
export const synthesizeTemplate = command(
	'unchecked',
	async ({
		name,
		elements,
		backgroundUrl,
		width,
		height
	}: {
		name: string;
		elements: TemplateElementInput[];
		backgroundUrl: string;
		width: number;
		height: number;
	}) => {
		const { user, org_id } = getRequestEvent().locals;
		await requireAdmin();

		if (!org_id) throw error(500, 'Organization context missing');

		const [newTemplate] = await db
			.insert(schema.templates)
			.values({
				name,
				userId: user?.id,
				orgId: org_id,
				frontBackground: backgroundUrl,
				templateElements: elements,
				widthPixels: width,
				heightPixels: height,
				orientation: width > height ? 'landscape' : 'portrait'
			})
			.returning();

		return {
			success: true,
			templateId: newTemplate.id,
			message: 'Template synthesized successfully'
		};
	}
);
