import { query, getRequestEvent } from '$app/server';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { idcards, templates, digitalCards } from '$lib/server/schema';
import { eq, sql, desc, inArray, and } from 'drizzle-orm';

// Digital card status type
export type DigitalCardStatus = 'unclaimed' | 'active' | 'banned' | 'suspended' | 'expired';

// Digital card info for display
export interface DigitalCardInfo {
	slug: string;
	status: DigitalCardStatus;
	profileUrl: string;
}

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
	front_image_low_res?: string | null;
	back_image_low_res?: string | null;
	created_at: Date | null;
	fields: {
		[fieldName: string]: IDCardField;
	};
	digital_card?: DigitalCardInfo | null;
}

interface TemplateVariable {
	variableName: string;
	side: 'front' | 'back';
}

// Schema for pagination arguments
const PaginationSchema = z.object({
	offset: z.number().default(0),
	limit: z.number().default(10),
	sortBy: z.string().optional(),
	sortDirection: z.enum(['asc', 'desc']).default('asc')
});

// Schema for template names
const TemplateNamesSchema = z.array(z.string());

// Query for paginated ID cards
export const getIDCards = query(PaginationSchema, async ({ offset, limit, sortBy = 'createdAt', sortDirection = 'desc' }) => {
	const { locals } = getRequestEvent();
	const { org_id } = locals;

	if (!org_id) {
		return { cards: [], hasMore: false };
	}

	// Fetch one extra row so we can accurately determine if there's more.
	const fetchLimit = Math.max(0, limit) + 1;

	// Determine sort order
	let orderByClause;
	const direction = sortDirection === 'asc' ? sql`asc` : sql`desc`;

	if (sortBy === 'template_name') {
		orderByClause = sql`${templates.name} ${direction}`;
	} else if (sortBy === 'created_at') {
		orderByClause = sql`${idcards.createdAt} ${direction}`;
	} else if (sortBy === 'updated_at') {
		orderByClause = sql`${idcards.updatedAt} ${direction}`; // Assuming updatedAt exists, or fallback
	} else {
		// Default / Dynamic JSONB sorting
		// If sortBy is provided and not one of the above, assume it's a field in the JSONB 'data' column
		// We cast to text for safe sorting.
		// NOTE: 'id-number' will fall through here, which is what we want.
		if (sortBy) {
			orderByClause = sql`${idcards.data}->>${sortBy} ${direction}`;
		} else {
			orderByClause = desc(idcards.createdAt);
		}
	}

	// Fetch cards with template names and digital card info using Drizzle
	console.log(`[getIDCards] Querying DB (offset=${offset}, limit=${limit}, sort=${sortBy}:${sortDirection})...`);
	const results = await db
		.select({
			id: idcards.id,
			templateId: idcards.templateId,
			frontImage: idcards.frontImage,
			backImage: idcards.backImage,
			frontImageLowRes: idcards.frontImageLowRes,
			backImageLowRes: idcards.backImageLowRes,
			createdAt: idcards.createdAt,
			data: idcards.data,
			templateName: templates.name,
			digitalCardSlug: digitalCards.slug,
			digitalCardStatus: digitalCards.status
		})
		.from(idcards)
		.leftJoin(templates, eq(idcards.templateId, templates.id))
		.leftJoin(digitalCards, eq(digitalCards.linkedIdCardId, idcards.id))
		.where(eq(idcards.orgId, org_id))
		.orderBy(orderByClause)
		.offset(offset)
		.limit(fetchLimit);

	console.log(`[getIDCards] Found ${results.length} cards.`);

	const hasMore = results.length > limit;
	const pageRows = hasMore ? results.slice(0, limit) : results;

	// Transform to expected format
	const cards: IDCard[] = pageRows.map((row) => {
		const cardData = (row.data as any) || {};

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
			idcard_id: row.id,
			template_name: row.templateName || '',
			front_image: row.frontImage,
			back_image: row.backImage,
			front_image_low_res: row.frontImageLowRes,
			back_image_low_res: row.backImageLowRes,
			created_at: row.createdAt,
			fields,
			digital_card: row.digitalCardSlug
				? {
						slug: row.digitalCardSlug,
						status: (row.digitalCardStatus as DigitalCardStatus) || 'unclaimed',
						profileUrl: `/id/${row.digitalCardSlug}`
					}
				: null
		};
	});

	return {
		cards,
		hasMore
	};
});

// Query for paginated card IDs only (lightweight)
export const getCardIDs = query(PaginationSchema, async ({ offset, limit }) => {
	const { locals } = getRequestEvent();
	const { org_id } = locals;

	if (!org_id) {
		return { cards: [], hasMore: false };
	}

	const fetchLimit = Math.max(0, limit) + 1;

	const results = await db
		.select({
			id: idcards.id,
			templateName: templates.name
		})
		.from(idcards)
		.leftJoin(templates, eq(idcards.templateId, templates.id))
		.where(eq(idcards.orgId, org_id))
		.orderBy(desc(idcards.createdAt))
		.offset(offset)
		.limit(fetchLimit);

	const hasMore = results.length > limit;
	const pageRows = hasMore ? results.slice(0, limit) : results;

	const cardIDs = pageRows.map((row) => ({
		idcard_id: row.id,
		template_name: row.templateName || ''
	}));

	return {
		cards: cardIDs,
		hasMore
	};
});

// Query for single card details
export const getCardDetails = query(z.string(), async (id) => {
	const { locals } = getRequestEvent();
	const { org_id } = locals;

	if (!org_id) return null;

	const results = await db
		.select({
			id: idcards.id,
			templateId: idcards.templateId,
			frontImage: idcards.frontImage,
			backImage: idcards.backImage,
			frontImageLowRes: idcards.frontImageLowRes,
			backImageLowRes: idcards.backImageLowRes,
			createdAt: idcards.createdAt,
			data: idcards.data,
			templateName: templates.name
		})
		.from(idcards)
		.leftJoin(templates, eq(idcards.templateId, templates.id))
		.where(and(eq(idcards.id, id), eq(idcards.orgId, org_id)))
		.limit(1);

	if (results.length === 0) return null;

	const row = results[0];
	const cardData = (row.data as any) || {};

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
		idcard_id: row.id,
		template_name: row.templateName || '',
		front_image: row.frontImage,
		back_image: row.backImage,
		front_image_low_res: row.frontImageLowRes,
		back_image_low_res: row.backImageLowRes,
		created_at: row.createdAt,
		fields
	} as IDCard;
});

// Query for total card count (no args)
export const getCardCount = query(async () => {
	const { locals } = getRequestEvent();
	const { org_id } = locals;

	if (!org_id) return 0;

	const result = await db
		.select({ count: sql<number>`count(*)` })
		.from(idcards)
		.where(eq(idcards.orgId, org_id));

	return Number(result[0]?.count || 0);
});

// Query for template dimensions (with template names arg)
export const getTemplateDimensions = query(TemplateNamesSchema, async (templateNames) => {
	const { locals } = getRequestEvent();
	const { org_id } = locals;

	if (!org_id || templateNames.length === 0) {
		return {};
	}

	const foundTemplates = await db
		.select({
			name: templates.name,
			widthPixels: templates.widthPixels,
			heightPixels: templates.heightPixels,
			orientation: templates.orientation
		})
		.from(templates)
		.where(and(eq(templates.orgId, org_id), inArray(templates.name, templateNames)));

	const dimensions: Record<
		string,
		{ width: number; height: number; orientation: 'landscape' | 'portrait'; unit: string }
	> = {};

	foundTemplates.forEach((template) => {
		const width = template.widthPixels;
		const height = template.heightPixels;

		let orientation: 'landscape' | 'portrait';
		if (width && height) {
			orientation = width < height ? 'portrait' : 'landscape';
		} else {
			orientation = (template.orientation as 'landscape' | 'portrait') || 'landscape';
		}

		const defaultWidth = orientation === 'portrait' ? 638 : 1013;
		const defaultHeight = orientation === 'portrait' ? 1013 : 638;

		dimensions[template.name] = {
			width: width || defaultWidth,
			height: height || defaultHeight,
			orientation,
			unit: 'pixels'
		};
	});

	return dimensions;
});

// Query for template metadata (fields)
export const getTemplateMetadata = query(TemplateNamesSchema, async (templateNames) => {
	const { locals } = getRequestEvent();
	const { org_id } = locals;

	if (!org_id || templateNames.length === 0) {
		return {};
	}

	const foundTemplates = await db
		.select({
			name: templates.name,
			templateElements: templates.templateElements
		})
		.from(templates)
		.where(and(eq(templates.orgId, org_id), inArray(templates.name, templateNames)));

	const templateFields: { [templateName: string]: TemplateVariable[] } = {};
	foundTemplates.forEach((template) => {
		const elements = (template.templateElements as any[]) || [];
		templateFields[template.name] = elements
			.filter((el: any) => el.type === 'text' || el.type === 'selection')
			.map((el: any) => ({
				variableName: el.variableName,
				side: el.side
			}));
	});

	return templateFields;
});
