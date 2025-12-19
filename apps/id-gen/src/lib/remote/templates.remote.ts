import { error } from '@sveltejs/kit';
import { query, command, getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import type { TemplateAsset, SizePreset } from '$lib/schemas/template-assets.schema';
import {
	customDesignRequestInputSchema,
	type CustomDesignRequestInput,
	type CustomDesignRequest
} from '$lib/schemas/custom-design.schema';

// Helper to get admin client (Keep for Storage only)
import { uploadToR2 } from '$lib/server/s3';

// Helper to get authenticated user from request event
async function getAuthenticatedUser() {
	const event = getRequestEvent();
	const user = event?.locals?.user;
	const org_id = event?.locals?.org_id;

	if (!user) {
		throw error(401, 'Authentication required');
	}

	return { user, org_id };
}

/**
 * Get template assets filtered by size preset slug and orientation
 * Returns published template assets matching the given size and orientation
 */
export const getTemplateAssetsBySize = command(
	'unchecked',
	async ({
		sizePresetSlug,
		orientation
	}: {
		sizePresetSlug: string | null;
		orientation: 'landscape' | 'portrait';
	}): Promise<TemplateAsset[]> => {
		await getAuthenticatedUser();

		try {
			// First, get the size preset ID from the slug if provided
			let sizePresetId: string | null = null;
			if (sizePresetSlug) {
				const [sizePreset] = await db
					.select({ id: schema.templateSizePresets.id })
					.from(schema.templateSizePresets)
					.where(
						and(
							eq(schema.templateSizePresets.slug, sizePresetSlug),
							eq(schema.templateSizePresets.isActive, true)
						)
					)
					.limit(1);

				sizePresetId = sizePreset?.id || null;
			}

			// Build query
			let conditions = [
                eq(schema.templateAssets.isPublished, true),
                eq(schema.templateAssets.orientation, orientation as any)
            ];

			if (sizePresetId) {
				conditions.push(eq(schema.templateAssets.sizePresetId, sizePresetId));
			}

			const data = await db
				.select()
				.from(schema.templateAssets)
				.where(and(...conditions))
				.orderBy(desc(schema.templateAssets.createdAt))
				.limit(50);

			return (data as unknown as TemplateAsset[]) || [];
		} catch (err) {
			console.error('Error in getTemplateAssetsBySize:', err);
			throw error(500, 'Failed to fetch template assets');
		}
	}
);

/**
 * Get count of published template assets per size preset and orientation
 * Returns a map of "slug:orientation" -> count (e.g., { "cr80:portrait": 10, "cr80:landscape": 10 })
 */
export const getTemplateAssetCounts = query(async (): Promise<Record<string, number>> => {
	await getAuthenticatedUser();

	try {
		// Get all published assets with their sizePresetId and orientation
		const assets = await db
			.select({
				sizePresetId: schema.templateAssets.sizePresetId,
				orientation: schema.templateAssets.orientation
			})
			.from(schema.templateAssets)
			.where(eq(schema.templateAssets.isPublished, true));

		// Get all size presets to map IDs to slugs
		const presets = await db
			.select({
				id: schema.templateSizePresets.id,
				slug: schema.templateSizePresets.slug
			})
			.from(schema.templateSizePresets)
			.where(eq(schema.templateSizePresets.isActive, true));

		// Create a map of preset ID to slug
		const idToSlug: Record<string, string> = {};
		for (const preset of presets) {
			idToSlug[preset.id] = preset.slug;
		}

		// Count assets per size preset slug and orientation
		const counts: Record<string, number> = {};
		for (const asset of assets) {
			if (asset.sizePresetId && asset.orientation) {
				const slug = idToSlug[asset.sizePresetId];
				if (slug) {
					const key = `${slug}:${asset.orientation}`;
					counts[key] = (counts[key] || 0) + 1;
				}
			}
		}

		return counts;
	} catch (err) {
		console.error('Error in getTemplateAssetCounts:', err);
		throw error(500, 'Failed to fetch template asset counts');
	}
});

/**
 * Get all active size presets
 * Returns the list of available size options for template creation
 */
export const getSizePresets = query(async (): Promise<SizePreset[]> => {
	await getAuthenticatedUser();

	try {
		const data = await db
			.select()
			.from(schema.templateSizePresets)
			.where(eq(schema.templateSizePresets.isActive, true))
			.orderBy(schema.templateSizePresets.sortOrder);

		return (data as unknown as SizePreset[]) || [];
	} catch (err) {
		console.error('Error in getSizePresets:', err);
		throw error(500, 'Failed to fetch size presets');
	}
});

/**
 * Create a new custom design request
 * Stores the request in the database for admin review
 */
export const createCustomDesignRequest = command(
	'unchecked',
	async (input: CustomDesignRequestInput): Promise<{ id: string }> => {
		const { user, org_id } = await getAuthenticatedUser();

		// Validate input
		const validationResult = customDesignRequestInputSchema.safeParse(input);
		if (!validationResult.success) {
			throw error(400, validationResult.error.issues[0].message);
		}

		const validatedInput = validationResult.data;

		try {
			const [inserted] = await db.insert(schema.customDesignRequests)
				.values({
					userId: user.id,
					orgId: org_id || null,
					sizePresetId: validatedInput.size_preset_id,
					widthPixels: validatedInput.width_pixels,
					heightPixels: validatedInput.height_pixels,
					sizeName: validatedInput.size_name,
					designInstructions: validatedInput.design_instructions,
					referenceAssets: validatedInput.reference_assets,
					status: 'pending'
				})
				.returning({ id: schema.customDesignRequests.id });

			if (!inserted) {
				throw error(500, 'Failed to create custom design request');
			}

			return { id: inserted.id };
		} catch (err) {
			console.error('Error in createCustomDesignRequest:', err);
			throw error(500, 'Failed to create custom design request');
		}
	}
);

/**
 * Upload reference asset for custom design request
 * Returns the storage path of the uploaded file
 */
export const uploadCustomDesignAsset = command(
	'unchecked',
	async ({ file, fileName }: { file: Buffer; fileName: string }): Promise<{ path: string }> => {
		const { user } = await getAuthenticatedUser();
        // Storage still uses Supabase
		try {
			const timestamp = Date.now();
			const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
			// Use a subfolder in the bucket
			const key = `custom-design-assets/${user.id}/${timestamp}-${sanitizedName}`;

			// Upload to R2
			await uploadToR2(key, file, 'image/png');

			// Return the key (path)
			return { path: key };
		} catch (err) {
			console.error('Error in uploadCustomDesignAsset:', err);
			throw error(500, 'Failed to upload file');
		}
	}
);

/**
 * Get user's custom design requests
 * Returns list of requests made by the current user
 */
export const getUserCustomDesignRequests = query(async (): Promise<CustomDesignRequest[]> => {
	const { user } = await getAuthenticatedUser();

	try {
		const data = await db
			.select()
			.from(schema.customDesignRequests)
			.where(eq(schema.customDesignRequests.userId, user.id))
			.orderBy(desc(schema.customDesignRequests.createdAt));

		return (data as unknown as CustomDesignRequest[]) || [];
	} catch (err) {
		console.error('Error in getUserCustomDesignRequests:', err);
		throw error(500, 'Failed to fetch custom design requests');
	}
});
