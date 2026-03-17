import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { templateAssets, templateSizePresets } from '$lib/server/schema';
import { desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	// Require auth
	if (!locals.session) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Fetch assets with template stats
		// Using execute() with SQL for complex join aggregation
		// or simpler: fetch assets, fetch templates separately and join in JS if small dataset
		// Given we have templates table, let's fetch all assets and their related templates info

		// 1. Get Assets
		const assets = await db.select().from(templateAssets).orderBy(desc(templateAssets.createdAt));

		// 2. Get Templates Information (filtered to those used by assets if possible, or all)
		const templateIds = assets.map((a) => a.templateId).filter((id): id is string => !!id);

		// Map to store template details: id -> { hasElements, variantFlags }
		const templateStatsMap = new Map<
			string,
			{
				hasElements: boolean;
				elementCount: number;
				variants: {
					front: boolean;
					back: boolean;
					preview: boolean;
					blank: boolean;
					sample: boolean;
				};
				urls?: { front: string | null; back: string | null };
			}
		>();

		if (templateIds.length > 0) {
			// Needed to avoid "too many parameters" if list is huge, but fine for now
			// We need: templates (for URLs checks) and template_elements (for count)
			const { templates } = await import('$lib/server/schema');
			const relatedTemplates = await db.query.templates.findMany({
				where: (t, { inArray }) => inArray(t.id, templateIds),
				columns: {
					id: true,
					templateElements: true,
					frontBackground: true,
					backBackground: true,
					previewFrontUrl: true,
					thumbFrontUrl: true, // Add these for potential fallbacks or preferred thumbs
					thumbBackUrl: true
				}
			});

			for (const tmpl of relatedTemplates) {
				// templateElements is JSONB, cast as array
				const elements = (tmpl.templateElements as any[]) || [];
				templateStatsMap.set(tmpl.id, {
					hasElements: elements.length > 0,
					elementCount: elements.length,
					variants: {
						front: !!tmpl.frontBackground,
						back: !!tmpl.backBackground,
						preview: !!tmpl.previewFrontUrl, // Assuming preview URL is proxy for preview existing
						blank: false, // Wizard doesn't gen blank yet
						sample: false // Wizard doesn't explicitly mark sample vs blank variant yet
					},
					// Store dynamic URLs to override static asset URLs
					urls: {
						front: tmpl.frontBackground,
						back: tmpl.backBackground
					}
				});
			}
		}

		// 3. Get Presets
		const presets = await db.select().from(templateSizePresets);
		const presetMap = new Map(presets.map((p) => [p.id, p]));

		const assetsWithPresets = assets.map((asset) => {
			const preset = asset.sizePresetId ? presetMap.get(asset.sizePresetId) : null;
			const stats = asset.templateId ? templateStatsMap.get(asset.templateId) : null;

			return {
				id: asset.id,
				created_at: asset.createdAt?.toISOString(),
				updated_at: asset.updatedAt?.toISOString(),
				name: asset.name,
				description: asset.description,
				category: asset.category,
				tags: asset.tags,
				size_preset_id: asset.sizePresetId,
				template_id: asset.templateId,
				sample_type: asset.sampleType,
				orientation: asset.orientation,
				// Prefer live template URL if available, otherwise use stored asset URL
				image_path: asset.imagePath,
				image_url: stats?.urls?.front || asset.imageUrl,
				back_image_path: asset.backImagePath,
				back_image_url: stats?.urls?.back || asset.backImageUrl,
				width_pixels: asset.widthPixels,
				height_pixels: asset.heightPixels,
				is_published: asset.isPublished,
				published_at: asset.publishedAt?.toISOString(),
				uploaded_by: asset.uploadedBy,
				size_preset: preset
					? {
							id: preset.id,
							name: preset.name,
							slug: preset.slug,
							width_inches: parseFloat(preset.widthInches),
							height_inches: parseFloat(preset.heightInches),
							width_mm: parseFloat(preset.widthMm),
							height_mm: parseFloat(preset.heightMm),
							width_pixels: preset.widthPixels,
							height_pixels: preset.heightPixels,
							dpi: preset.dpi,
							aspect_ratio: preset.aspectRatio ? parseFloat(preset.aspectRatio) : undefined,
							description: preset.description,
							sort_order: preset.sortOrder,
							is_active: preset.isActive,
							created_at: preset.createdAt?.toISOString(),
							updated_at: preset.updatedAt?.toISOString()
						}
					: null,
				stats: stats || {
					hasElements: false,
					elementCount: 0,
					variants: {
						front: true,
						back: !!asset.backImageUrl,
						preview: true,
						blank: false,
						sample: false
					}
				}
			};
		});

		return {
			assets: assetsWithPresets || []
		};
	} catch (err) {
		console.error('Error loading assets:', err);
		throw error(500, 'Failed to load assets');
	}
};

export const actions: Actions = {
	regenerateAsset: async ({ request, locals }) => {
		const { session } = locals;
		if (!session) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const assetId = formData.get('assetId') as string;

		if (!assetId) {
			return fail(400, { message: 'Asset ID is required' });
		}

		try {
			// 1. Get the asset to find the linked template
			const [asset] = await db
				.select()
				.from(templateAssets)
				.where(eq(templateAssets.id, assetId))
				.limit(1);

			if (!asset || !asset.templateId) {
				return fail(400, { message: 'Asset not found or not linked to a template' });
			}

			// 2. Get the up-to-date template data
			const { templates } = await import('$lib/server/schema');
			const [template] = await db
				.select()
				.from(templates)
				.where(eq(templates.id, asset.templateId))
				.limit(1);

			if (!template) {
				return fail(404, { message: 'Linked template not found' });
			}

			if (
				!template.frontBackground ||
				!template.widthPixels ||
				!template.heightPixels ||
				!template.orientation
			) {
				return fail(400, { message: 'Template data is incomplete (missing image or dimensions)' });
			}

			// 3. Update the asset with template's current images and dimensions
			await db
				.update(templateAssets)
				.set({
					imageUrl: template.frontBackground,
					backImageUrl: template.backBackground,
					widthPixels: template.widthPixels,
					heightPixels: template.heightPixels,
					// Update orientation too if it changed
					orientation: template.orientation as 'landscape' | 'portrait',
					updatedAt: new Date()
				})
				.where(eq(templateAssets.id, assetId));

			return { success: true, message: 'Asset images regenerated from template' };
		} catch (err) {
			console.error('Error regenerating asset:', err);
			return fail(500, { message: 'Failed to regenerate asset' });
		}
	}
};
