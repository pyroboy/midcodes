import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { digitalCards } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const statusSchema = z.object({
	cardId: z.string().uuid(),
	status: z.enum(['unclaimed', 'active', 'suspended', 'banned', 'expired'])
});

export const POST: RequestHandler = async ({ request, locals }) => {
	// Admin permission check
	const allowedRoles = ['super_admin', 'org_admin', 'id_gen_admin'];
	const effectiveRole = locals.effectiveRoles?.[0] ?? '';
	const originalRole = (locals as any).roleEmulation?.originalRole ?? '';
	if (!allowedRoles.includes(effectiveRole) && !allowedRoles.includes(originalRole)) {
		throw error(403, 'Admin access required');
	}

	const body = await request.json();
	const parsed = statusSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: 'Invalid request' }, { status: 400 });
	}

	const { cardId, status } = parsed.data;

	const [updated] = await db
		.update(digitalCards)
		.set({ status, updatedAt: new Date() })
		.where(eq(digitalCards.id, cardId))
		.returning();

	if (!updated) {
		return json({ error: 'Card not found' }, { status: 404 });
	}

	return json({ success: true, status: updated.status });
};
