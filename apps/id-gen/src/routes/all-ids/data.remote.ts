import { query, getRequestEvent } from '$app/server';
import { z } from 'zod';

// Types for ID cards
interface IDCardField {
	value: string | null;
	side: 'front' | 'back';
}

export interface IDCard {
	idcard_id: string;
	template_name: string;
	front_image: string | null;
	back_image: string | null;
	created_at: string;
	fields: {
		[fieldName: string]: IDCardField;
	};
}

interface TemplateVariable {
	variableName: string;
	side: 'front' | 'back';
}

// Schema for pagination arguments
const PaginationSchema = z.object({
	offset: z.number().default(0),
	limit: z.number().default(10)
});

// Schema for template names
const TemplateNamesSchema = z.array(z.string());

// Query for paginated ID cards
export const getIDCards = query(PaginationSchema, async ({ offset, limit }) => {
	const { locals } = getRequestEvent();
	const { supabase, org_id } = locals;

	if (!org_id) {
		return { cards: [], hasMore: false };
	}

	// Fetch one extra row so we can accurately determine if there's more.
	const fetchLimit = Math.max(0, limit) + 1;

	const { data: cards, error } = await supabase
		.from('idcards')
		.select(`
			id,
			template_id,
			front_image,
			back_image,
			created_at,
			data,
			templates (
				name
			)
		`)
		.eq('org_id', org_id)
		.order('created_at', { ascending: false })
		.range(offset, offset + fetchLimit - 1);

	if (error) {
		console.error('Error fetching ID cards:', error);
		return { cards: [], hasMore: false };
	}

	const rows = cards || [];
	const hasMore = rows.length > limit;
	const pageRows = hasMore ? rows.slice(0, limit) : rows;

	// Transform to expected format
	const idCards: IDCard[] = pageRows.map((card: any) => {
		const templateName = card.templates?.name || null;
		const cardData = card.data || {};

		const fields: { [fieldName: string]: IDCardField } = {};
		Object.entries(cardData).forEach(([key, value]) => {
			if (typeof value === 'string' || value === null) {
				fields[key] = {
					value: value as string | null,
					side: 'front'
				};
			}
		});

		return {
			idcard_id: card.id,
			template_name: templateName,
			front_image: card.front_image,
			back_image: card.back_image,
			created_at: card.created_at,
			fields
		};
	});

	return {
		cards: idCards,
		hasMore
	};
});

// Query for paginated card IDs only (lightweight)
export const getCardIDs = query(PaginationSchema, async ({ offset, limit }) => {
	const { locals } = getRequestEvent();
	const { supabase, org_id } = locals;

	if (!org_id) {
		return { cards: [], hasMore: false };
	}

	// Fetch one extra row so we can accurately determine if there's more.
	const fetchLimit = Math.max(0, limit) + 1;

	const { data: cards, error } = await supabase
		.from('idcards')
		.select(`
			id,
			templates (
				name
			)
		`)
		.eq('org_id', org_id)
		.order('created_at', { ascending: false })
		.range(offset, offset + fetchLimit - 1);

	if (error) {
		console.error('Error fetching card IDs:', error);
		return { cards: [], hasMore: false };
	}

	const rows = cards || [];
	const hasMore = rows.length > limit;
	const pageRows = hasMore ? rows.slice(0, limit) : rows;

	const cardIDs = pageRows.map((card: any) => ({
		idcard_id: card.id,
		template_name: card.templates?.name || null
	}));

	return {
		cards: cardIDs,
		hasMore
	};
});

// Query for single card details
export const getCardDetails = query(z.string(), async (id) => {
	const { locals } = getRequestEvent();
	const { supabase, org_id } = locals;

	if (!org_id) return null;

	const { data: card, error } = await supabase
		.from('idcards')
		.select(`
			id,
			template_id,
			front_image,
			back_image,
			created_at,
			data,
			templates (
				name
			)
		`)
		.eq('id', id)
		.eq('org_id', org_id)
		.single();

	if (error) {
		console.error('Error fetching card details:', error);
		return null;
	}

	if (!card) return null;

	const cardAny = card as any;
	const templateName = cardAny.templates?.name || null;
	const cardData = cardAny.data || {};

	const fields: { [fieldName: string]: IDCardField } = {};
	Object.entries(cardData).forEach(([key, value]) => {
		if (typeof value === 'string' || value === null) {
			fields[key] = {
				value: value as string | null,
				side: 'front'
			};
		}
	});

	return {
		idcard_id: cardAny.id,
		template_name: templateName,
		front_image: cardAny.front_image,
		back_image: cardAny.back_image,
		created_at: cardAny.created_at,
		fields
	} as IDCard;
});

// Query for total card count (no args)
export const getCardCount = query(async () => {
	const { locals } = getRequestEvent();
	const { supabase, org_id } = locals;
	
	if (!org_id) return 0;

	const { count, error } = await supabase
		.from('idcards')
		.select('*', { count: 'exact', head: true })
		.eq('org_id', org_id);

	if (error) {
		console.error('Error fetching card count:', error);
		return 0;
	}

	return count || 0;
});

// Query for template dimensions (with template names arg)
export const getTemplateDimensions = query(TemplateNamesSchema, async (templateNames) => {
	const { locals } = getRequestEvent();
	const { supabase, org_id } = locals;
	
	if (!org_id || templateNames.length === 0) {
		return {};
	}

	const { data, error } = await supabase
		.from('templates')
		.select('name, width_pixels, height_pixels')
		.eq('org_id', org_id)
		.in('name', templateNames);

	if (error) {
		console.error('Error fetching template dimensions:', error);
		return {};
	}

	const dimensions: Record<string, { width: number; height: number; unit: string }> = {};
	(data || []).forEach((template: any) => {
		dimensions[template.name] = {
			width: template.width_pixels || 1013,
			height: template.height_pixels || 638,
			unit: 'pixels'
		};
	});

	return dimensions;
});

// Query for template metadata (fields)
export const getTemplateMetadata = query(TemplateNamesSchema, async (templateNames) => {
	const { locals } = getRequestEvent();
	const { supabase, org_id } = locals;
	
	if (!org_id || templateNames.length === 0) {
		return {};
	}

	const { data, error } = await supabase
		.from('templates')
		.select('name, template_elements')
		.eq('org_id', org_id)
		.in('name', templateNames);

	if (error) {
		console.error('Error fetching template metadata:', error);
		return {};
	}

	const templateFields: { [templateName: string]: TemplateVariable[] } = {};
	(data || []).forEach((template: any) => {
		const elements = template.template_elements || [];
		templateFields[template.name] = elements
			.filter((el: any) => el.type === 'text' || el.type === 'selection')
			.map((el: any) => ({
				variableName: el.variableName,
				side: el.side
			}));
	});

	return templateFields;
});
