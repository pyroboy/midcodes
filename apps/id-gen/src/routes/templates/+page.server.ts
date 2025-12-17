import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { templates as templatesSchema, idcards } from '$lib/server/schema';
import { eq, and, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url, depends, setHeaders }) => {
	// Register dependency for selective invalidation
	depends('app:templates');

	const { session, org_id, user } = locals;
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	let templateId = url.searchParams.get('id');
	let selectedTemplate = null;

	// Check for new template creation params from home page
	const isNewTemplate = url.searchParams.get('new') === 'true';
	const newTemplateParams = isNewTemplate
		? {
				name: url.searchParams.get('name') || 'New Template',
				width: parseFloat(url.searchParams.get('width') || '3.375'),
				height: parseFloat(url.searchParams.get('height') || '2.125'),
				unit: url.searchParams.get('unit') || 'inches',
				orientation: (url.searchParams.get('orientation') || 'landscape') as 'landscape' | 'portrait',
				front_background: url.searchParams.get('front_background') || ''
			}
		: null;

	if (templateId) {
		const [template] = await db
			.select()
			.from(templatesSchema)
			.where(eq(templatesSchema.id, templateId))
			.limit(1);

		if (!template) {
			console.error(`Template not found: ${templateId}`);
		} else {
			selectedTemplate = {
				...template,
				user_id: template.userId,
				org_id: template.orgId,
				width_pixels: template.widthPixels,
				height_pixels: template.heightPixels,
				front_background: template.frontBackground,
				back_background: template.backBackground,
				front_background_low_res: template.frontBackgroundLowRes,
				back_background_low_res: template.backBackgroundLowRes,
				template_elements: template.templateElements
			};
		}
	}

	// Fetch all templates for the list
	const templatesList = await db
		.select()
		.from(templatesSchema)
		.where(eq(templatesSchema.orgId, org_id!))
		.orderBy(desc(templatesSchema.createdAt));

	const transformedTemplates = templatesList.map(t => ({
		...t,
		user_id: t.userId,
		org_id: t.orgId,
		width_pixels: t.widthPixels,
		height_pixels: t.heightPixels,
		front_background: t.frontBackground,
		back_background: t.backBackground,
		front_background_low_res: t.frontBackgroundLowRes,
		back_background_low_res: t.backBackgroundLowRes,
		template_elements: t.templateElements
	}));

	return {
		templates: transformedTemplates,
		selectedTemplate,
		user,
		org_id,
		newTemplateParams
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { session, org_id } = locals;

		try {
			const formData = await request.formData();
			const templateDataStr = formData.get('templateData') as string;

			if (!templateDataStr) {
				throw error(400, 'Template data is required');
			}

			const templateData = JSON.parse(templateDataStr);

			// Build a strict payload for Drizzle
			const payload = {
				id: templateData.id, // Better Auth IDs are text/uuid
				userId: session?.user?.id as string,
				orgId: org_id as string,
				name: templateData.name,
				widthPixels: templateData.width_pixels,
				heightPixels: templateData.height_pixels,
				dpi: templateData.dpi,
				frontBackground: templateData.front_background,
				backBackground: templateData.back_background,
				frontBackgroundLowRes: templateData.front_background_low_res,
				backBackgroundLowRes: templateData.back_background_low_res,
				orientation: templateData.orientation,
				templateElements: templateData.template_elements,
				updatedAt: new Date()
			};

			console.log('🎨 Server: Processing template save:', {
				id: payload.id,
				name: payload.name,
				org_id: payload.orgId
			});

			const [data] = await db
				.insert(templatesSchema)
				.values({
					...payload,
					createdAt: templateData.created_at ? new Date(templateData.created_at) : new Date()
				})
				.onConflictDoUpdate({
					target: templatesSchema.id,
					set: payload
				})
				.returning();

			if (!data) {
				throw error(500, 'No data returned from database');
			}

			console.log('✅ Server: Template saved successfully:', {
				id: data.id,
				name: data.name,
				org_id: data.orgId
			});

			const transformedData = {
				...data,
				user_id: data.userId,
				org_id: data.orgId,
				width_pixels: data.widthPixels,
				height_pixels: data.heightPixels,
				front_background: data.frontBackground,
				back_background: data.backBackground,
				front_background_low_res: data.frontBackgroundLowRes,
				back_background_low_res: data.backBackgroundLowRes,
				template_elements: data.templateElements
			};

			return {
				success: true,
				data: transformedData,
				message: `Template ${payload.id ? 'updated' : 'created'} successfully`
			};
		} catch (err) {
			console.error('❌ Server: Error in create action:', err);
			throw error(500, err instanceof Error ? err.message : 'Error processing template save');
		}
	},

	delete: async ({ request, locals }) => {
		const { session } = locals;
		if (!session) {
			throw error(401, 'Unauthorized');
		}

		try {
			const formData = await request.formData();
			const templateId = formData.get('templateId') as string;

			if (!templateId) {
				throw error(400, 'Template ID is required');
			}

			const deleteIds = formData.get('deleteIds') === 'true';

			console.log('🗑️ Server: Processing template delete:', { templateId, deleteIds });

			const supabaseAdmin = (await import('$lib/server/supabase')).getSupabaseAdmin();

			if (deleteIds) {
				// 1. Fetch associated IDs to get image paths
				const cards = await db
					.select({
						id: idcards.id,
						frontImage: idcards.frontImage,
						backImage: idcards.backImage
					})
					.from(idcards)
					.where(eq(idcards.templateId, templateId));

				if (cards && cards.length > 0) {
					// 2. Delete images from storage
					const imagesToDelete: string[] = [];
					for (const card of cards) {
						if (card.frontImage) imagesToDelete.push(card.frontImage);
						if (card.backImage) imagesToDelete.push(card.backImage);
					}

					if (imagesToDelete.length > 0) {
						const { error: storageError } = await supabaseAdmin.storage
							.from('rendered-id-cards')
							.remove(imagesToDelete);

						if (storageError) {
							console.warn('⚠️ Server: Error deleting card images (non-fatal):', storageError);
						}
					}

					// 3. Delete ID records
					await db.delete(idcards).where(eq(idcards.templateId, templateId));
					console.log(`✅ Server: Deleted ${cards.length} associated ID cards`);
				}
			} else {
				// Default behavior: Unlink IDs
				await db.update(idcards).set({ templateId: null }).where(eq(idcards.templateId, templateId));
				console.log('✅ Server: Unlinked associated ID cards');
			}

			// Then delete the template
			await db.delete(templatesSchema).where(
				and(
					eq(templatesSchema.id, templateId),
					eq(templatesSchema.userId, session.user.id)
				)
			);

			console.log('✅ Server: Template deleted successfully:', { templateId });

			return {
				success: true,
				message: 'Template deleted successfully'
			};
		} catch (err) {
			console.error('❌ Server: Error in delete action:', err);
			throw error(500, err instanceof Error ? err.message : 'Error deleting template');
		}
	},
	select: async ({ request, locals }) => {
		const { session } = locals;
		if (!session) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const templateId = formData.get('id') as string;

		if (!templateId) {
			return fail(400, { message: 'Template ID is required' });
		}

		try {
			const [template] = await db
				.select()
				.from(templatesSchema)
				.where(eq(templatesSchema.id, templateId))
				.limit(1);

			if (!template) {
				return fail(404, { message: 'Template not found' });
			}

			// Return properly mapped data
			return {
				type: 'success',
				data: {
					...template,
					id: template.id,
					user_id: template.userId,
					org_id: template.orgId,
					width_pixels: template.widthPixels,
					height_pixels: template.heightPixels,
					dpi: template.dpi,
					front_background: template.frontBackground,
					back_background: template.backBackground,
					front_background_low_res: template.frontBackgroundLowRes,
					back_background_low_res: template.backBackgroundLowRes,
					orientation: template.orientation,
					created_at: template.createdAt,
					updated_at: template.updatedAt,
					template_elements: template.templateElements
				}
			};
		} catch (err) {
			console.error('Server error:', err);
			return fail(500, { message: 'Internal server error' });
		}
	}
};

// Function to determine orientation from image dimensions
async function getImageOrientation(imageUrl: string): Promise<'landscape' | 'portrait'> {
	try {
		const response = await fetch(imageUrl);
		const buffer = await response.arrayBuffer();
		const blob = new Blob([buffer]);
		const url = URL.createObjectURL(blob);
		const img = new Image();
		img.src = url;
		await new Promise((resolve) => (img.onload = resolve));
		const width = img.width;
		const height = img.height;
		URL.revokeObjectURL(url);
		return width >= height ? 'landscape' : 'portrait';
	} catch (err) {
		console.error('Error determining image orientation:', err);
		return 'landscape'; // default fallback
	}
}
