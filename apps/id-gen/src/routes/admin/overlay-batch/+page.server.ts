import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import type { Database } from '$lib/types/database.types';

type TemplateRow = Database['public']['Tables']['templates']['Row'];
type TemplateInsert = Database['public']['Tables']['templates']['Insert'];
type IdCardInsert = Database['public']['Tables']['idcards']['Insert'];

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
	const { supabase, org_id } = locals;

	if (!org_id) {
		return {
			templates: [] as TemplateListItem[],
			templateCardCounts: {} as Record<string, number>
		};
	}

	// Fetch all templates for this org with card counts
	const { data: templates, error: templatesError } = await supabase
		.from('templates')
		.select('id, name, width_pixels, height_pixels, dpi, orientation, front_background, back_background')
		.eq('org_id', org_id)
		.order('name');

	if (templatesError) {
		console.error('Error fetching templates:', templatesError);
		return {
			templates: [] as TemplateListItem[],
			templateCardCounts: {} as Record<string, number>
		};
	}

	const typedTemplates = (templates || []) as TemplateListItem[];

	// Get card counts for each template
	const templateIds = typedTemplates.map((t) => t.id);
	const cardCounts: Record<string, number> = {};

	if (templateIds.length > 0) {
		const { data: countData, error: countError } = await supabase
			.from('idcards')
			.select('template_id')
			.in('template_id', templateIds);

		if (!countError && countData) {
			for (const card of countData as { template_id: string | null }[]) {
				if (card.template_id) {
					cardCounts[card.template_id] = (cardCounts[card.template_id] || 0) + 1;
				}
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
		const { supabase, org_id, user } = locals;

		if (!org_id) {
			return fail(400, { error: 'Organization not found' });
		}

		const formData = await request.formData();
		const sourceTemplateId = formData.get('sourceTemplateId') as string;
		const newTemplateName = formData.get('newTemplateName') as string;

		if (!sourceTemplateId || !newTemplateName) {
			return fail(400, { error: 'Missing required fields' });
		}

		// Fetch source template
		const { data: sourceTemplate, error: sourceError } = await supabase
			.from('templates')
			.select('*')
			.eq('id', sourceTemplateId)
			.eq('org_id', org_id)
			.single();

		if (sourceError || !sourceTemplate) {
			return fail(404, { error: 'Source template not found' });
		}

		const typedSource = sourceTemplate as TemplateRow;

		const templateFront = formData.get('templateFront') as Blob;
		const templateBack = formData.get('templateBack') as Blob;

		console.log('Server received templateFront:', templateFront ? `Blob size: ${templateFront.size}` : 'null');
		console.log('Server received templateBack:', templateBack ? `Blob size: ${templateBack.size}` : 'null');

		let frontPath = null;
		let backPath = null;

		// Upload new template backgrounds if provided
		if (templateFront) {
			const timestamp = Date.now();
			const frontFilename = `${org_id}/${timestamp}_front.png`;

			const { error: frontUploadError } = await supabase.storage
				.from('templates')
				.upload(frontFilename, templateFront, {
					cacheControl: '3600',
					contentType: 'image/png',
					upsert: true
				});

			if (frontUploadError) {
				console.error('Template front upload error:', frontUploadError);
				return fail(500, { error: `Failed to upload template front background: ${frontUploadError.message}` });
			}
			frontPath = frontFilename;
		}

		if (templateBack) {
			const timestamp = Date.now();
			const backFilename = `${org_id}/${timestamp}_back.png`;

			const { error: backUploadError } = await supabase.storage
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
					await supabase.storage.from('templates').remove([frontPath]);
				}
				return fail(500, { error: `Failed to upload template back background: ${backUploadError.message}` });
			}
			backPath = backFilename;
		}

		// Create new template with same dimensions
		const insertData: TemplateInsert = {
			name: newTemplateName,
			org_id: org_id,
			user_id: user?.id,
			width_pixels: typedSource.width_pixels,
			height_pixels: typedSource.height_pixels,
			dpi: typedSource.dpi,
			orientation: typedSource.orientation,
			template_elements: typedSource.template_elements,
			front_background: frontPath,
			back_background: backPath
		};

		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const { data: newTemplate, error: createError } = await supabase
				.from('templates')
				.insert(insertData as any)
				.select()
				.single();

			if (createError) {
				console.error('Error creating template:', createError);
				return fail(500, {
					error: createError.message || 'Failed to create template',
					details: createError.details,
					hint: createError.hint
				});
			}

			if (!newTemplate) {
				console.error('Template created but no data returned. Possible RLS issue.');
				return fail(500, { error: 'Template created but no data returned. Check RLS policies.' });
			}

			const typedNew = newTemplate as TemplateRow;
			return { success: true, newTemplateId: typedNew.id, newTemplate: typedNew };
		} catch (e) {
			console.error('Unexpected error in createTemplate:', e);
			return fail(500, { error: 'Unexpected server error during template creation: ' + (e instanceof Error ? e.message : String(e)) });
		}
	},

	getSourceCards: async ({ request, locals }) => {
		const { supabase, org_id } = locals;

		if (!org_id) {
			return fail(400, { error: 'Organization not found' });
		}

		const formData = await request.formData();
		const sourceTemplateId = formData.get('sourceTemplateId') as string;

		if (!sourceTemplateId) {
			return fail(400, { error: 'Missing source template ID' });
		}

		// Fetch all ID cards for the source template
		const { data: cards, error: cardsError } = await supabase
			.from('idcards')
			.select('id, front_image, back_image, data')
			.eq('template_id', sourceTemplateId)
			.eq('org_id', org_id);

		if (cardsError) {
			console.error('Error fetching cards:', cardsError);
			return fail(500, { error: cardsError.message || 'Failed to fetch source cards' });
		}

		console.log('[getSourceCards] Fetched cards:', {
			count: cards?.length,
			isArray: Array.isArray(cards),
			firstCard: cards?.[0] ? 'exists' : 'null',
			dataType: typeof cards
		});

		return { success: true, cards: cards || [] };
	},

	saveCard: async ({ request, locals }) => {
		const { supabase, org_id } = locals;

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

		console.log('[saveCard] Inputs:', {
			newTemplateId,
			cardDataLength: cardData?.length,
			frontImageSize: frontImage?.size,
			backImageSize: backImage?.size,
			bulkUpdate: bulkKey ? { key: bulkKey, value: bulkValue } : 'none'
		});

		if (!newTemplateId || !frontImage || !backImage) {
			console.error('[saveCard] Missing required fields');
			return fail(400, { error: 'Missing required fields' });
		}

		// Upload images
		const timestamp = Date.now();
		const frontPath = `${org_id}/${newTemplateId}/${timestamp}_front.png`;
		const backPath = `${org_id}/${newTemplateId}/${timestamp}_back.png`;

		const { error: frontUploadError } = await supabase.storage
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

		const { error: backUploadError } = await supabase.storage
			.from('rendered-id-cards')
			.upload(backPath, backImage, {
				cacheControl: '3600',
				contentType: 'image/png',
				upsert: true
			});

		if (backUploadError) {
			// Rollback front image
			await supabase.storage.from('rendered-id-cards').remove([frontPath]);
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
			// Keep as null if parse fails, or empty object if we want to force update?
			// Better to default to empty object if we have bulk update
			parsedData = bulkKey && bulkValue ? { [bulkKey]: bulkValue } : null;
		}

		// Create new ID card record
		const cardInsert: IdCardInsert = {
			template_id: newTemplateId,
			org_id: org_id,
			front_image: frontPath,
			back_image: backPath,
			data: parsedData
		};
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { data: newCard, error: insertError } = await supabase
			.from('idcards')
			.insert(cardInsert as any)
			.select()
			.single();

		console.log('[saveCard] Insert result:', {
			success: !!newCard,
			error: insertError?.message,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			newCardId: (newCard as any)?.id
		});

		if (insertError) {
			// Rollback uploads
			await supabase.storage.from('rendered-id-cards').remove([frontPath, backPath]);
			console.error('Insert error:', insertError);
			return fail(500, { error: `Database insert failed: ${insertError.message}` });
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const typedNewCard = newCard as any;
		return { success: true, cardId: typedNewCard.id, newCard: typedNewCard };
	}
};
