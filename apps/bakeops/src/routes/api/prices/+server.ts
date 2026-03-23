import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { productPrices, recipes, businesses } from '$lib/server/schema';
import { publishPriceEvent } from '$lib/server/ably';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const businessId = url.searchParams.get('businessId');
	const rows = await db.query.productPrices.findMany({
		where: businessId ? eq(productPrices.businessId, businessId) : undefined,
		with: { recipe: true, business: true }
	});
	return json(rows);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json();

	// Get recipe cost
	const recipe = await db.query.recipes.findFirst({ where: eq(recipes.id, body.recipeId) });
	if (!recipe) return json({ error: 'Recipe not found' }, { status: 404 });

	// Get business default markup
	const business = await db.query.businesses.findFirst({ where: eq(businesses.id, body.businessId) });
	const defaultMarkup = business ? parseFloat(business.defaultMarkup) : 2.5;
	const markup = body.markupMultiplier ? parseFloat(body.markupMultiplier) : defaultMarkup;

	const perUnitCost = recipe.perUnitCostCentavos;
	let computedPrice = 0;

	if (body.pricingMode === 'fixed') {
		computedPrice = body.fixedPrice || 0;
	} else if (body.pricingMode === 'round_up') {
		const raw = Math.round(perUnitCost * markup);
		const target = body.roundingTarget || 10;
		computedPrice = Math.ceil(raw / target) * target;
	} else {
		// auto
		computedPrice = Math.round(perUnitCost * markup);
	}

	const margin = computedPrice > 0 ? ((computedPrice - perUnitCost) / computedPrice * 100) : 0;

	const [row] = await db.insert(productPrices).values({
		recipeId: body.recipeId,
		businessId: body.businessId,
		pricingMode: body.pricingMode || 'auto',
		markupMultiplier: body.markupMultiplier || null,
		fixedPrice: body.fixedPrice || null,
		roundingTarget: body.roundingTarget || 10,
		computedCost: perUnitCost,
		computedPrice,
		marginPercentage: String(margin.toFixed(2)),
		minMarginAlert: body.minMarginAlert || '0.30'
	}).returning();

	await publishPriceEvent('price:created', row);
	return json(row, { status: 201 });
};
