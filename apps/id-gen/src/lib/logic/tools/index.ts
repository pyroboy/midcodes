/**
 * Tool registry and exports for the decompose graphics editor.
 *
 * Tool types available:
 * - Selection tools: lasso, rectangle, ellipse
 * - Drawing tools: brush, eraser
 * - Fill tools: bucket, gradient
 */

// Base interfaces and utilities
export {
	type CanvasTool,
	type ToolContext,
	type ToolOptions,
	type NormalizedPoint,
	type SelectionResult,
	SelectionTool,
	DrawingTool,
	normalizePointerEvent,
	distanceBetweenPoints
} from './BaseTool';

// Tool implementations
import { LassoTool, createLassoTool } from './LassoTool.svelte.js';
import { RectangleTool, createRectangleTool } from './RectangleTool.svelte.js';
import { EllipseTool, createEllipseTool } from './EllipseTool.svelte.js';
import { BrushTool, createBrushTool } from './BrushTool.svelte.js';
import { EraserTool, createEraserTool } from './EraserTool.svelte.js';
import { BucketTool, createBucketTool } from './BucketTool.svelte.js';
import { GradientTool, createGradientTool } from './GradientTool.svelte.js';
import { MoveTool, createMoveTool } from './MoveTool.svelte.js';
export { LassoTool, createLassoTool };
export { RectangleTool, createRectangleTool };
export { EllipseTool, createEllipseTool };
export { BrushTool, createBrushTool };
export { EraserTool, createEraserTool };
export { BucketTool, createBucketTool };
export { GradientTool, createGradientTool };
export { MoveTool, createMoveTool };

/**
 * Tool name type union.
 * Add new tool names here as they are implemented.
 */
export type ToolName = 'move' | 'lasso' | 'rectangle' | 'ellipse' | 'brush' | 'eraser' | 'bucket' | 'gradient' | 'eyedropper' | null;

/**
 * Tool keyboard shortcuts mapping.
 */
export const TOOL_SHORTCUTS: Record<string, ToolName> = {
	v: 'move',
	l: 'lasso',
	m: 'rectangle',
	o: 'ellipse',
	b: 'brush',
	e: 'eraser',
	g: 'bucket',
	x: 'gradient',
	i: 'eyedropper'
};

/**
 * Reverse mapping: tool name to keyboard shortcut.
 */
export const SHORTCUT_BY_TOOL: Partial<Record<NonNullable<ToolName>, string>> = {
	move: 'V',
	lasso: 'L',
	rectangle: 'M',
	ellipse: 'O',
	brush: 'B',
	eraser: 'E',
	bucket: 'G',
	gradient: 'X',
	eyedropper: 'I'
};

/**
 * Tool metadata for UI display.
 */
export interface ToolMetadata {
	id: NonNullable<ToolName>;
	label: string;
	shortcut: string;
	icon: string; // Lucide icon name
	color: string; // Tailwind color class when active
	category: 'selection' | 'drawing' | 'fill' | 'utility';
}

/**
 * Complete tool metadata registry.
 */
export const TOOL_METADATA: ToolMetadata[] = [
	{ id: 'move', label: 'Move', shortcut: 'V', icon: 'Move', color: 'text-cyan-500', category: 'utility' },
	{ id: 'lasso', label: 'Lasso Select', shortcut: 'L', icon: 'Lasso', color: 'text-amber-500', category: 'selection' },
	{ id: 'rectangle', label: 'Rectangle Select', shortcut: 'M', icon: 'Square', color: 'text-blue-500', category: 'selection' },
	{ id: 'ellipse', label: 'Ellipse Select', shortcut: 'O', icon: 'Circle', color: 'text-purple-500', category: 'selection' },
	{ id: 'brush', label: 'Brush', shortcut: 'B', icon: 'Paintbrush', color: 'text-blue-500', category: 'drawing' },
	{ id: 'eraser', label: 'Eraser', shortcut: 'E', icon: 'Eraser', color: 'text-rose-500', category: 'drawing' },
	{ id: 'bucket', label: 'Paint Bucket', shortcut: 'G', icon: 'PaintBucket', color: 'text-green-500', category: 'fill' },
	{ id: 'gradient', label: 'Gradient', shortcut: 'X', icon: 'Blend', color: 'text-orange-500', category: 'fill' },
	{ id: 'eyedropper', label: 'Eyedropper', shortcut: 'I', icon: 'Pipette', color: 'text-cyan-400', category: 'utility' }
];

/**
 * Get tool metadata by name.
 */
export function getToolMetadata(tool: ToolName): ToolMetadata | undefined {
	if (!tool) return undefined;
	return TOOL_METADATA.find(t => t.id === tool);
}

/**
 * Check if tool is a selection tool.
 */
export function isSelectionTool(tool: ToolName): boolean {
	if (!tool) return false;
	const meta = getToolMetadata(tool);
	return meta?.category === 'selection';
}

/**
 * Check if tool is a drawing tool.
 */
export function isDrawingTool(tool: ToolName): boolean {
	if (!tool) return false;
	const meta = getToolMetadata(tool);
	return meta?.category === 'drawing';
}

/**
 * Check if tool is a fill tool.
 */
export function isFillTool(tool: ToolName): boolean {
	if (!tool) return false;
	const meta = getToolMetadata(tool);
	return meta?.category === 'fill';
}

/**
 * Get tool cursor style by name.
 */
export function getToolCursor(tool: ToolName): string {
	switch (tool) {
		case 'move':
			return 'move';
		case 'lasso':
		case 'rectangle':
		case 'ellipse':
			return 'crosshair';
		case 'brush':
			return 'crosshair';
		case 'eraser':
			return 'crosshair';
		case 'bucket':
			return 'crosshair';
		case 'eyedropper':
			return 'crosshair';
		default:
			return 'default';
	}
}

/**
 * Create a tool instance by name.
 * Returns null for tools not yet implemented.
 */
export function createTool(name: ToolName): import('./BaseTool').CanvasTool | null {
	switch (name) {
		case 'move':
			return createMoveTool();
		case 'lasso':
			return createLassoTool();
		case 'rectangle':
			return createRectangleTool();
		case 'ellipse':
			return createEllipseTool();
		case 'brush':
			return createBrushTool();
		case 'eraser':
			return createEraserTool();
		case 'bucket':
			return createBucketTool();
		case 'gradient':
			return createGradientTool();
		default:
			return null;
	}
}

