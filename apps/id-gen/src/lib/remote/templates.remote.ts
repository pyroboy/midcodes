import { error } from '@sveltejs/kit';
import { query, command, getRequestEvent } from '$app/server';
import { PRIVATE_SERVICE_ROLE } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import type { TemplateAsset, SizePreset } from '$lib/schemas/template-assets.schema';
import {
	customDesignRequestInputSchema,
	type CustomDesignRequestInput,
	type CustomDesignRequest
} from '$lib/schemas/custom-design.schema';

// Helper to get admin client with service role
function getAdminClient() {
	return createClient(PUBLIC_SUPABASE_URL, PRIVATE_SERVICE_ROLE);
}

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
 * Get template assets filtered by size preset ID
 * Returns published template assets matching the given size
 */
export const getTemplateAssetsBySize = command(
	'unchecked',
	async ({ sizePresetId }: { sizePresetId: string | null }): Promise<TemplateAsset[]> => {
		const { user } = await getAuthenticatedUser();
		const supabase = getAdminClient();

		try {
			let queryBuilder = supabase
				.from('template_assets')
				.select('*')
				.eq('is_published', true)
				.order('created_at', { ascending: false });

			// Filter by size preset if provided
			if (sizePresetId) {
				queryBuilder = queryBuilder.eq('size_preset_id', sizePresetId);
			}

			const { data, error: fetchError } = await queryBuilder.limit(50);

			if (fetchError) {
				console.error('Error fetching template assets by size:', fetchError);
				throw error(500, 'Failed to fetch template assets');
			}

			return (data as TemplateAsset[]) || [];
		} catch (err) {
			console.error('Error in getTemplateAssetsBySize:', err);
			throw error(500, 'Failed to fetch template assets');
		}
	}
);

/**
 * Get count of published template assets per size preset
 * Returns a map of sizePresetId -> count
 */
export const getTemplateAssetCounts = query(async (): Promise<Record<string, number>> => {
	const { user } = await getAuthenticatedUser();
	const supabase = getAdminClient();

	try {
		// Get all published assets with their size_preset_id
		const { data, error: fetchError } = await supabase
			.from('template_assets')
			.select('size_preset_id')
			.eq('is_published', true);

		if (fetchError) {
			console.error('Error fetching template asset counts:', fetchError);
			throw error(500, 'Failed to fetch template asset counts');
		}

		// Count assets per size preset
		const counts: Record<string, number> = {};
		for (const asset of data || []) {
			if (asset.size_preset_id) {
				counts[asset.size_preset_id] = (counts[asset.size_preset_id] || 0) + 1;
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
	const { user } = await getAuthenticatedUser();
	const supabase = getAdminClient();

	try {
		const { data, error: fetchError } = await supabase
			.from('template_size_presets')
			.select('*')
			.eq('is_active', true)
			.order('sort_order', { ascending: true });

		if (fetchError) {
			console.error('Error fetching size presets:', fetchError);
			throw error(500, 'Failed to fetch size presets');
		}

		return (data as SizePreset[]) || [];
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
		const supabase = getAdminClient();

		// Validate input
		const validationResult = customDesignRequestInputSchema.safeParse(input);
		if (!validationResult.success) {
			throw error(400, validationResult.error.issues[0].message);
		}

		const validatedInput = validationResult.data;

		try {
			const { data, error: insertError } = await supabase
				.from('custom_design_requests')
				.insert({
					user_id: user.id,
					org_id: org_id || null,
					size_preset_id: validatedInput.size_preset_id,
					width_pixels: validatedInput.width_pixels,
					height_pixels: validatedInput.height_pixels,
					size_name: validatedInput.size_name,
					design_instructions: validatedInput.design_instructions,
					reference_assets: validatedInput.reference_assets,
					status: 'pending'
				})
				.select('id')
				.single();

			if (insertError) {
				console.error('Error creating custom design request:', insertError);
				throw error(500, 'Failed to create custom design request');
			}

			return { id: data.id };
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
		const supabase = getAdminClient();

		try {
			const timestamp = Date.now();
			const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
			const path = `${user.id}/${timestamp}-${sanitizedName}`;

			const { data, error: uploadError } = await supabase.storage
				.from('custom-design-assets')
				.upload(path, file, {
					contentType: 'image/png',
					upsert: false
				});

			if (uploadError) {
				console.error('Error uploading custom design asset:', uploadError);
				throw error(500, 'Failed to upload file');
			}

			return { path: data.path };
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
	const supabase = getAdminClient();

	try {
		const { data, error: fetchError } = await supabase
			.from('custom_design_requests')
			.select('*')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false });

		if (fetchError) {
			console.error('Error fetching user custom design requests:', fetchError);
			throw error(500, 'Failed to fetch custom design requests');
		}

		return (data as CustomDesignRequest[]) || [];
	} catch (err) {
		console.error('Error in getUserCustomDesignRequests:', err);
		throw error(500, 'Failed to fetch custom design requests');
	}
});
