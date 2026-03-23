import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { productPrices, recipes, businesses } from '$lib/server/schema';
import { publishPriceEvent } from '$lib/server/ably';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json();
	const existing = await db.query.productPrices.findFirst({
		where: eq(productPrices.id, params.id),
		with: { recipe: true, business: true }
	});

	if (!existing) return json({ error: 'Not found' }, { status: 404 });

	const perUnitCost = existing.recipe.perUnitCostCentavos;
	const defaultMarkup = existing.business ? parseFloat(existing.business.defaultMarkup) : 2.5;
	const markup = body.markupMultiplier ? parseFloat(body.markupMultiplier) : (existing.markupMultiplier ? parseFloat(existing.markupMultiplier) : defaultMarkup);
	const mode = body.pricingMode || existing.pricingMode;

	let computedPrice = 0;
	if (mode === 'fixed') {
		computedPrice = body.fixedPrice ?? existing.fixedPrice ?? 0;
	} else if (mode === 'round_up') {
		const raw = Math.round(perUnitCost * markup);
		const target = body.roundingTarget ?? existing.roundingTarget ?? 10;
		computedPrice = Math.ceil(raw / target) * target;
	} else {
		computedPrice = Math.round(perUnitCost * markup);
	}

	const margin = computedPrice > 0 ? ((computedPrice - perUnitCost) / computedPrice * 100) : 0;

	const [row] = await db.update(productPrices)
		.set({
			pricingMode: mode,
			markupMultiplier: body.markupMultiplier ?? existing.markupMultiplier,
			fixedPrice: body.fixedPrice ?? existing.fixedPrice,
			roundingTarget: body.roundingTarget ?? existing.roundingTarget,
			computedCost: perUnitCost,
			computedPrice,
			marginPercentage: String(margin.toFixed(2)),
			isActive: body.isActive ?? existing.isActive
		})
		.where(eq(productPrices.id, params.id))
		.returning();

	await publishPriceEvent('price:updated', row);
	return json(row);
};
