import { error } from '@sveltejs/kit';
import { query, command, getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

// --- Schemas ---

const addTargetSchema = z.object({
	name: z.string().min(1),
	org: z.string().min(1),
	type: z.enum(['school', 'company', 'government']),
	contactPerson: z.string().optional().default(''),
	contactEmail: z.string().optional().default(''),
	contactPhone: z.string().optional().default(''),
	notes: z.string().optional().default('')
});

const updateTargetSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).optional(),
	org: z.string().min(1).optional(),
	type: z.enum(['school', 'company', 'government']).optional(),
	contactPerson: z.string().optional(),
	contactEmail: z.string().optional(),
	contactPhone: z.string().optional(),
	notes: z.string().optional(),
	researchedAt: z.string().datetime().nullable().optional(),
	mdPath: z.string().nullable().optional(),
	pdfPath: z.string().nullable().optional()
});

// --- Permission Helper ---

async function requireAdmin() {
	const { locals } = getRequestEvent();
	const { effectiveRoles, roleEmulation } = locals;
	const allowedRoles = ['super_admin', 'org_admin', 'id_gen_admin'];
	const originalRole = roleEmulation?.originalRole;
	const originalIsAdmin = originalRole && allowedRoles.includes(originalRole);
	const hasEffectiveRole = effectiveRoles?.some((r: string) => allowedRoles.includes(r));
	if (!originalIsAdmin && !hasEffectiveRole) {
		throw error(403, 'Access denied. Admin privileges required.');
	}
}

// --- Queries ---

export const getAllTargets = query(async () => {
	await requireAdmin();
	const targets = await db
		.select()
		.from(schema.pipelineTargets)
		.orderBy(desc(schema.pipelineTargets.createdAt));
	return targets;
});

// --- Commands ---

export const addTarget = command('unchecked', async (input: z.infer<typeof addTargetSchema>) => {
	await requireAdmin();
	const parsed = addTargetSchema.parse(input);
	const [target] = await db
		.insert(schema.pipelineTargets)
		.values({
			name: parsed.name,
			org: parsed.org,
			type: parsed.type,
			contactPerson: parsed.contactPerson || null,
			contactEmail: parsed.contactEmail || null,
			contactPhone: parsed.contactPhone || null,
			notes: parsed.notes || null
		})
		.returning();
	return target;
});

export const updateTarget = command('unchecked', async (input: z.infer<typeof updateTargetSchema>) => {
	await requireAdmin();
	const parsed = updateTargetSchema.parse(input);
	const { id, ...updates } = parsed;

	// Filter out undefined values, keep nulls
	const cleanUpdates: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(updates)) {
		if (value !== undefined) {
			cleanUpdates[key] = value;
		}
	}
	cleanUpdates.updatedAt = new Date();

	const [target] = await db
		.update(schema.pipelineTargets)
		.set(cleanUpdates)
		.where(eq(schema.pipelineTargets.id, id))
		.returning();

	if (!target) throw error(404, 'Target not found');
	return target;
});

export const deleteTarget = command('unchecked', async (id: string) => {
	await requireAdmin();
	const [deleted] = await db
		.delete(schema.pipelineTargets)
		.where(eq(schema.pipelineTargets.id, id))
		.returning();
	if (!deleted) throw error(404, 'Target not found');
	return { success: true };
});
