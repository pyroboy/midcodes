import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { templates, idcards } from '$lib/server/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { getSupabaseAdmin } from '$lib/server/supabase';

interface TemplateListItem {
	id: string;
	name: string;
	width_pixels: number | null;
	height_pixels: number | null;
	dpi: number | null;
	orientation: string | null;
	front_background: string | null;
	back_background: string | null;
}

export const load: PageServerLoad = async ({ locals }) => {
	const { org_id } = locals;

	if (!org_id) {
		return {
			templates: [] as TemplateListItem[],
			templateCardCounts: {} as Record<string, number>
		};
	}

	// Fetch all templates for this org with Drizzle
	const templatesData = await db.select({
		id: templates.id,
		name: templates.name,
		width_pixels: templates.widthPixels,
		height_pixels: templates.heightPixels,
		dpi: templates.dpi,
		orientation: templates.orientation,
		front_background: templates.frontBackground,
		back_background: templates.backBackground
	})
		.from(templates)
		.where(eq(templates.orgId, org_id))
		.orderBy(templates.name);

	const typedTemplates = (templatesData || []) as TemplateListItem[];

	// Get card counts for each template
	const templateIds = typedTemplates.map((t) => t.id);
	const cardCounts: Record<string, number> = {};

	if (templateIds.length > 0) {
		const cardCountsResult = await db.select({
			templateId: idcards.templateId,
			count: sql<number>`count(*)`
		})
			.from(idcards)
			.where(inArray(idcards.templateId, templateIds))
			.groupBy(idcards.templateId);

		for (const row of cardCountsResult) {
			if (row.templateId) {
				cardCounts[row.templateId] = Number(row.count);
			}
		}
	}

	return {
		templates: typedTemplates,
		templateCardCounts: cardCounts
	};
};

export const actions: Actions = {
	createTemplate: async ({ request, locals }) => {
		const { org_id, user } = locals;

		if (!org_id) {
			return fail(400, { error: 'Organization not found' });
		}

		const formData = await request.formData();
		const sourceTemplateId = formData.get('sourceTemplateId') as string;
		const newTemplateName = formData.get('newTemplateName') as string;

		if (!sourceTemplateId || !newTemplateName) {
			return fail(400, { error: 'Missing required fields' });
		}

		// Fetch source template with Drizzle
		const sourceTemplates = await db.select()
			.from(templates)
			.where(eq(templates.id, sourceTemplateId));

		if (sourceTemplates.length === 0) {
			return fail(404, { error: 'Source template not found' });
		}

		const sourceTemplate = sourceTemplates[0];

		const templateFront = formData.get('templateFront') as Blob;
		const templateBack = formData.get('templateBack') as Blob;

		let frontPath = null;
		let backPath = null;

		// Use supabaseAdmin for storage operations
		const supabaseAdmin = getSupabaseAdmin();

		// Upload new template backgrounds if provided
		if (templateFront) {
			const timestamp = Date.now();
			const frontFilename = `${org_id}/${timestamp}_front.png`;

			const { error: frontUploadError } = await supabaseAdmin.storage
				.from('templates')
				.upload(frontFilename, templateFront, {
					cacheControl: '3600',
					contentType: 'image/png',
					upsert: true
				});

			if (frontUploadError) {
				console.error('Template front upload error:', frontUploadError);
				return fail(500, {
					error: `Failed to upload template front background: ${frontUploadError.message}`
				});
			}
			frontPath = frontFilename;
		}

		if (templateBack) {
			const timestamp = Date.now();
			const backFilename = `${org_id}/${timestamp}_back.png`;

			const { error: backUploadError } = await supabaseAdmin.storage
				.from('templates')
				.upload(backFilename, templateBack, {
					cacheControl: '3600',
					contentType: 'image/png',
					upsert: true
				});

			if (backUploadError) {
				console.error('Template back upload error:', backUploadError);
				// Try to cleanup front image if it was uploaded
				if (frontPath) {
					await supabaseAdmin.storage.from('templates').remove([frontPath]);
				}
				return fail(500, {
					error: `Failed to upload template back background: ${backUploadError.message}`
				});
			}
			backPath = backFilename;
		}

		try {
			// Create new template with Drizzle
			const [newTemplate] = await db.insert(templates).values({
				name: newTemplateName,
				orgId: org_id,
				userId: user?.id,
				widthPixels: sourceTemplate.widthPixels,
				heightPixels: sourceTemplate.heightPixels,
				dpi: sourceTemplate.dpi,
				orientation: sourceTemplate.orientation,
				templateElements: sourceTemplate.templateElements,
				frontBackground: frontPath,
				backBackground: backPath
			}).returning();

			return { success: true, newTemplateId: newTemplate.id, newTemplate };
		} catch (e: any) {
			console.error('Unexpected error in createTemplate:', e);
			return fail(500, {
				error: 'Unexpected server error during template creation: ' + e.message
			});
		}
	},

	getSourceCards: async ({ request, locals }) => {
		const { org_id } = locals;

		if (!org_id) {
			return fail(400, { error: 'Organization not found' });
		}

		const formData = await request.formData();
		const sourceTemplateId = formData.get('sourceTemplateId') as string;

		if (!sourceTemplateId) {
			return fail(400, { error: 'Missing source template ID' });
		}

		// Fetch all ID cards for the source template with Drizzle
		const cards = await db.select({
				id: idcards.id,
				front_image: idcards.frontImage,
				back_image: idcards.backImage,
				data: idcards.data
			})
			.from(idcards)
			.where(eq(idcards.templateId, sourceTemplateId));

		return { success: true, cards: cards || [] };
	},

	saveCard: async ({ request, locals }) => {
		const { org_id } = locals;

		if (!org_id) {
			return fail(400, { error: 'Organization not found' });
		}

		const formData = await request.formData();
		const newTemplateId = formData.get('newTemplateId') as string;
		const cardData = formData.get('cardData') as string;
		const frontImage = formData.get('frontImage') as Blob;
		const backImage = formData.get('backImage') as Blob;
		const bulkKey = formData.get('bulkKey') as string;
		const bulkValue = formData.get('bulkValue') as string;

		if (!newTemplateId || !frontImage || !backImage) {
			console.error('[saveCard] Missing required fields');
			return fail(400, { error: 'Missing required fields' });
		}

		// Use supabaseAdmin for storage operations
		const supabaseAdmin = getSupabaseAdmin();

		// Upload images
		const timestamp = Date.now();
		const frontPath = `${org_id}/${newTemplateId}/${timestamp}_front.png`;
		const backPath = `${org_id}/${newTemplateId}/${timestamp}_back.png`;

		const { error: frontUploadError } = await supabaseAdmin.storage
			.from('rendered-id-cards')
			.upload(frontPath, frontImage, {
				cacheControl: '3600',
				contentType: 'image/png',
				upsert: true
			});

		if (frontUploadError) {
			console.error('Front upload error:', frontUploadError);
			return fail(500, { error: `Front image upload failed: ${frontUploadError.message}` });
		}

		const { error: backUploadError } = await supabaseAdmin.storage
			.from('rendered-id-cards')
			.upload(backPath, backImage, {
				cacheControl: '3600',
				contentType: 'image/png',
				upsert: true
			});

		if (backUploadError) {
			// Rollback front image
			await supabaseAdmin.storage.from('rendered-id-cards').remove([frontPath]);
			console.error('Back upload error:', backUploadError);
			return fail(500, { error: `Back image upload failed: ${backUploadError.message}` });
		}

		// Parse card data
		let parsedData = null;
		try {
			parsedData = cardData ? JSON.parse(cardData) : {};
			if (bulkKey && bulkValue) {
				parsedData[bulkKey] = bulkValue;
			}
		} catch {
			parsedData = bulkKey && bulkValue ? { [bulkKey]: bulkValue } : null;
		}

		// Create new ID card record with Drizzle
		try {
			const [newCard] = await db.insert(idcards).values({
				templateId: newTemplateId,
				orgId: org_id,
				frontImage: frontPath,
				backImage: backPath,
				data: parsedData || {}
			}).returning();

			return { success: true, cardId: newCard.id, newCard };
		} catch (insertError: any) {
			// Rollback uploads
			await supabaseAdmin.storage.from('rendered-id-cards').remove([frontPath, backPath]);
			console.error('Insert error:', insertError);
			return fail(500, { error: `Database insert failed: ${insertError.message}` });
		}
	}
};
