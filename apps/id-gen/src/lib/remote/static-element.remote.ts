/**
 * Remote functions for managing Static Elements (GraphicElements paired with decompose layers)
 * Handles CRUD operations for syncing layers to template elements JSONB
 */
import { command } from '$app/server';
import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { checkAdmin } from '$lib/utils/adminPermissions';
import { getDb } from '$lib/server/db';
import { templates } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { GraphicElement, TemplateElement } from '$lib/schemas/template-element.schema';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const addStaticElementSchema = z.object({
	templateId: z.string().uuid(),
	layerId: z.string().uuid(),
	layerData: z.object({
		name: z.string().min(1),
		imageUrl: z.string().url(),
		bounds: z.object({
			x: z.number().int().min(0),
			y: z.number().int().min(0),
			width: z.number().int().positive(),
			height: z.number().int().positive()
		}),
		side: z.enum(['front', 'back'])
	})
});

const removeStaticElementSchema = z.object({
	templateId: z.string().uuid(),
	elementId: z.string().uuid()
});

const syncNameSchema = z.object({
	templateId: z.string().uuid(),
	elementId: z.string().uuid(),
	newName: z.string().min(1)
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function requireAdmin() {
	const { locals } = getRequestEvent();
	if (!checkAdmin(locals)) {
		throw error(403, 'Admin access required');
	}
	return locals;
}

/**
 * Convert layer name to valid variable name
 * - Remove special characters
 * - Replace spaces with underscores
 * - Ensure starts with letter
 */
function toVariableName(name: string): string {
	let varName = name
		.toLowerCase()
		.replace(/[^a-z0-9_\s]/gi, '')
		.replace(/\s+/g, '_')
		.replace(/^[0-9]+/, '');

	if (!varName || !/^[a-zA-Z]/.test(varName)) {
		varName = 'static_element_' + varName;
	}

	return varName;
}

// ============================================================================
// REMOTE FUNCTIONS
// ============================================================================

/**
 * Add a GraphicElement to template's elements JSONB
 * Creates a new element paired with the decompose layer
 */
export const addStaticElement = command(
	'unchecked',
	async (
		input: z.input<typeof addStaticElementSchema>
	): Promise<{ success: boolean; elementId?: string; error?: string }> => {
		const parseResult = addStaticElementSchema.safeParse(input);
		if (!parseResult.success) {
			return {
				success: false,
				error: `Validation error: ${parseResult.error.issues.map((e: { message: string }) => e.message).join(', ')}`
			};
		}

		await requireAdmin();
		const { templateId, layerId, layerData } = parseResult.data;

		console.log('[static-element.remote] addStaticElement called:', {
			templateId,
			layerId,
			layerData: { ...layerData, imageUrl: layerData.imageUrl.substring(0, 50) + '...' }
		});

		try {
			const db = getDb();

			// 1. Fetch current template
			const [template] = await db
				.select({ templateElements: templates.templateElements })
				.from(templates)
				.where(eq(templates.id, templateId))
				.limit(1);

			if (!template) {
				return { success: false, error: 'Template not found' };
			}

			// 2. Parse existing elements
			const existingElements = (template.templateElements || []) as TemplateElement[];

			// 3. Generate new element ID
			const elementId = crypto.randomUUID();

			// 4. Create the GraphicElement
			const newElement: GraphicElement = {
				id: elementId,
				type: 'graphic',
				variableName: toVariableName(layerData.name),
				x: layerData.bounds.x,
				y: layerData.bounds.y,
				width: layerData.bounds.width,
				height: layerData.bounds.height,
				rotation: 0,
				side: layerData.side,
				visible: true,
				opacity: 1,
				src: layerData.imageUrl,
				fit: 'contain',
				maintainAspectRatio: true
			};

			// 5. Add to elements array
			const updatedElements = [...existingElements, newElement];

			// 6. Update template
			await db
				.update(templates)
				.set({
					templateElements: updatedElements,
					updatedAt: new Date()
				})
				.where(eq(templates.id, templateId));

			console.log('[static-element.remote] Successfully added GraphicElement:', elementId);

			return { success: true, elementId };
		} catch (err) {
			console.error('[static-element.remote] addStaticElement error:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Failed to add static element'
			};
		}
	}
);

/**
 * Remove a GraphicElement from template's elements JSONB
 */
export const removeStaticElement = command(
	'unchecked',
	async (
		input: z.input<typeof removeStaticElementSchema>
	): Promise<{ success: boolean; error?: string }> => {
		const parseResult = removeStaticElementSchema.safeParse(input);
		if (!parseResult.success) {
			return {
				success: false,
				error: `Validation error: ${parseResult.error.issues.map((e: { message: string }) => e.message).join(', ')}`
			};
		}

		await requireAdmin();
		const { templateId, elementId } = parseResult.data;

		console.log('[static-element.remote] removeStaticElement called:', { templateId, elementId });

		try {
			const db = getDb();

			// 1. Fetch current template
			const [template] = await db
				.select({ templateElements: templates.templateElements })
				.from(templates)
				.where(eq(templates.id, templateId))
				.limit(1);

			if (!template) {
				return { success: false, error: 'Template not found' };
			}

			// 2. Filter out the element
			const existingElements = (template.templateElements || []) as TemplateElement[];
			const updatedElements = existingElements.filter((el) => el.id !== elementId);

			if (updatedElements.length === existingElements.length) {
				return { success: false, error: 'Element not found in template' };
			}

			// 3. Update template
			await db
				.update(templates)
				.set({
					templateElements: updatedElements,
					updatedAt: new Date()
				})
				.where(eq(templates.id, templateId));

			console.log('[static-element.remote] Successfully removed GraphicElement:', elementId);

			return { success: true };
		} catch (err) {
			console.error('[static-element.remote] removeStaticElement error:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Failed to remove static element'
			};
		}
	}
);

/**
 * Sync element name (variableName) when layer name changes
 */
export const syncStaticElementName = command(
	'unchecked',
	async (input: z.input<typeof syncNameSchema>): Promise<{ success: boolean; error?: string }> => {
		const parseResult = syncNameSchema.safeParse(input);
		if (!parseResult.success) {
			return {
				success: false,
				error: `Validation error: ${parseResult.error.issues.map((e: { message: string }) => e.message).join(', ')}`
			};
		}

		await requireAdmin();
		const { templateId, elementId, newName } = parseResult.data;

		console.log('[static-element.remote] syncStaticElementName called:', {
			templateId,
			elementId,
			newName
		});

		try {
			const db = getDb();

			// 1. Fetch current template
			const [template] = await db
				.select({ templateElements: templates.templateElements })
				.from(templates)
				.where(eq(templates.id, templateId))
				.limit(1);

			if (!template) {
				return { success: false, error: 'Template not found' };
			}

			// 2. Find and update the element
			const existingElements = (template.templateElements || []) as TemplateElement[];
			let found = false;

			const updatedElements = existingElements.map((el) => {
				if (el.id === elementId) {
					found = true;
					return { ...el, variableName: toVariableName(newName) };
				}
				return el;
			});

			if (!found) {
				return { success: false, error: 'Element not found in template' };
			}

			// 3. Update template
			await db
				.update(templates)
				.set({
					templateElements: updatedElements,
					updatedAt: new Date()
				})
				.where(eq(templates.id, templateId));

			console.log('[static-element.remote] Successfully synced element name:', elementId);

			return { success: true };
		} catch (err) {
			console.error('[static-element.remote] syncStaticElementName error:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Failed to sync element name'
			};
		}
	}
);

// Schema for position sync
const syncPositionSchema = z.object({
	templateId: z.string().uuid(),
	elementId: z.string().uuid(),
	bounds: z.object({
		x: z.number().int().min(0),
		y: z.number().int().min(0),
		width: z.number().int().positive(),
		height: z.number().int().positive()
	})
});

/**
 * Sync element position (x, y, width, height) when layer is moved
 */
export const syncStaticElementPosition = command(
	'unchecked',
	async (
		input: z.input<typeof syncPositionSchema>
	): Promise<{ success: boolean; error?: string }> => {
		const parseResult = syncPositionSchema.safeParse(input);
		if (!parseResult.success) {
			return {
				success: false,
				error: `Validation error: ${parseResult.error.issues.map((e: { message: string }) => e.message).join(', ')}`
			};
		}

		await requireAdmin();
		const { templateId, elementId, bounds } = parseResult.data;

		console.log('[static-element.remote] syncStaticElementPosition called:', {
			templateId,
			elementId,
			bounds
		});

		try {
			const db = getDb();

			// 1. Fetch current template
			const [template] = await db
				.select({ templateElements: templates.templateElements })
				.from(templates)
				.where(eq(templates.id, templateId))
				.limit(1);

			if (!template) {
				return { success: false, error: 'Template not found' };
			}

			// 2. Find and update the element
			const existingElements = (template.templateElements || []) as TemplateElement[];
			let found = false;

			const updatedElements = existingElements.map((el) => {
				if (el.id === elementId) {
					found = true;
					return {
						...el,
						x: bounds.x,
						y: bounds.y,
						width: bounds.width,
						height: bounds.height
					};
				}
				return el;
			});

			if (!found) {
				return { success: false, error: 'Element not found in template' };
			}

			// 3. Update template
			await db
				.update(templates)
				.set({
					templateElements: updatedElements,
					updatedAt: new Date()
				})
				.where(eq(templates.id, templateId));

			console.log('[static-element.remote] Successfully synced element position:', elementId);

			return { success: true };
		} catch (err) {
			console.error('[static-element.remote] syncStaticElementPosition error:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Failed to sync element position'
			};
		}
	}
);

/**
 * Check if a GraphicElement exists in template
 * Used to verify pairing status after template editor changes
 */
export const checkStaticElementExists = command(
	'unchecked',
	async ({
		templateId,
		elementId
	}: {
		templateId: string;
		elementId: string;
	}): Promise<{ exists: boolean; error?: string }> => {
		await requireAdmin();

		try {
			const db = getDb();

			const [template] = await db
				.select({ templateElements: templates.templateElements })
				.from(templates)
				.where(eq(templates.id, templateId))
				.limit(1);

			if (!template) {
				return { exists: false, error: 'Template not found' };
			}

			const existingElements = (template.templateElements || []) as TemplateElement[];
			const exists = existingElements.some((el) => el.id === elementId);

			return { exists };
		} catch (err) {
			console.error('[static-element.remote] checkStaticElementExists error:', err);
			return {
				exists: false,
				error: err instanceof Error ? err.message : 'Failed to check element'
			};
		}
	}
);
