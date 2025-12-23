import { error } from '@sveltejs/kit';
import { command, query, getRequestEvent } from '$app/server';
import { uploadToR2, deleteFromR2, listFromR2, getPublicUrl } from '$lib/server/s3';
import { z } from 'zod';

// Helper to get authenticated user and org from request event
async function getAuthenticatedUserWithOrg() {
	const event = getRequestEvent();
	const user = event?.locals?.user;
	const org_id = event?.locals?.org_id;

	if (!user) {
		throw error(401, 'Authentication required');
	}

	if (!org_id) {
		throw error(400, 'Organization context required');
	}

	return { user, org_id };
}

// Storage path for org graphics
function getOrgGraphicsPrefix(orgId: string): string {
	return `orgs/${orgId}/graphics/`;
}

function getOrgGraphicPath(orgId: string, filename: string): string {
	return `orgs/${orgId}/graphics/${filename}`;
}

// Validation schemas
const uploadGraphicSchema = z.object({
	filename: z.string().min(1),
	contentType: z.enum(['image/png', 'image/webp', 'image/svg+xml']),
	base64Data: z.string().min(1)
});

const deleteGraphicSchema = z.object({
	url: z.string().url()
});

export interface OrgGraphic {
	url: string;
	name: string;
	size: number;
	uploadedAt: Date;
}

/**
 * Upload a graphic to the organization's graphics library.
 * Stores in R2 at: orgs/{orgId}/graphics/{uuid}_{originalName}
 */
export const uploadOrgGraphic = command(
	'unchecked',
	async (
		input: z.input<typeof uploadGraphicSchema>
	): Promise<{ success: boolean; url?: string; error?: string }> => {
		const parseResult = uploadGraphicSchema.safeParse(input);
		if (!parseResult.success) {
			return {
				success: false,
				error: `Validation error: ${parseResult.error.issues.map((e) => e.message).join(', ')}`
			};
		}

		const { filename, contentType, base64Data } = parseResult.data;

		try {
			const { org_id } = await getAuthenticatedUserWithOrg();

			// Generate unique filename to avoid collisions
			const ext = filename.split('.').pop() || 'png';
			const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50);
			const uniqueFilename = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}_${safeName}`;
			const key = getOrgGraphicPath(org_id, uniqueFilename);

			// Decode base64 and upload
			const buffer = Buffer.from(base64Data, 'base64');

			// Validate file size (5MB max)
			if (buffer.length > 5 * 1024 * 1024) {
				return { success: false, error: 'File size must be under 5MB' };
			}

			const url = await uploadToR2(key, buffer, contentType);

			console.log(`[graphic.remote] Uploaded org graphic: ${url}`);
			return { success: true, url };
		} catch (err) {
			console.error('[graphic.remote] uploadOrgGraphic error:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Failed to upload graphic'
			};
		}
	}
);

/**
 * List all graphics in the organization's library.
 */
export const listOrgGraphics = query(async (): Promise<OrgGraphic[]> => {
	const { org_id } = await getAuthenticatedUserWithOrg();

	try {
		const prefix = getOrgGraphicsPrefix(org_id);
		const objects = await listFromR2(prefix, 100);

		return objects.map((obj) => ({
			url: obj.url,
			name: obj.key.split('/').pop() || obj.key,
			size: obj.size,
			uploadedAt: obj.lastModified
		}));
	} catch (err) {
		console.error('[graphic.remote] listOrgGraphics error:', err);
		throw error(500, 'Failed to list graphics');
	}
});

/**
 * Delete a graphic from the organization's library.
 * Only allows deleting graphics owned by the current org.
 */
export const deleteOrgGraphic = command(
	'unchecked',
	async (
		input: z.input<typeof deleteGraphicSchema>
	): Promise<{ success: boolean; error?: string }> => {
		const parseResult = deleteGraphicSchema.safeParse(input);
		if (!parseResult.success) {
			return {
				success: false,
				error: `Validation error: ${parseResult.error.issues.map((e) => e.message).join(', ')}`
			};
		}

		const { url } = parseResult.data;

		try {
			const { org_id } = await getAuthenticatedUserWithOrg();

			// Extract key from URL and verify it belongs to this org
			const expectedPrefix = getOrgGraphicsPrefix(org_id);

			// Parse the URL to get the key
			const urlObj = new URL(url);
			const key = urlObj.pathname.slice(1); // Remove leading slash

			if (!key.startsWith(expectedPrefix)) {
				return { success: false, error: 'Cannot delete graphics from other organizations' };
			}

			await deleteFromR2(key);

			console.log(`[graphic.remote] Deleted org graphic: ${key}`);
			return { success: true };
		} catch (err) {
			console.error('[graphic.remote] deleteOrgGraphic error:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Failed to delete graphic'
			};
		}
	}
);
