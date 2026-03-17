import type { CanvasTool, ToolContext } from './BaseTool';

/**
 * Eyedropper (color picker) tool.
 *
 * This tool provides pixel-perfect color picking from the canvas
 * with a custom magnifying zoom cursor that shows the exact pixels
 * around the cursor position.
 *
 * The actual color picking is handled by ImagePreview.svelte which:
 * 1. Builds a composite canvas of all visible layers
 * 2. Shows an EyedropperCursor with magnified pixels
 * 3. Picks the center pixel color on click
 */
export class EyedropperTool implements CanvasTool {
	readonly name = 'eyedropper';
	readonly cursor = 'none'; // Hide cursor, we show custom cursor
	readonly requiresLayer = false;

	/** Currently previewed color */
	previewColor = $state<string | null>(null);

	/** Whether the eyedropper is currently active/open */
	isActive = $state(false);

	/** Callback when a color is sampled */
	onColorSampled?: (color: string) => void;

	onActivate(_ctx: ToolContext): void {
		this.previewColor = null;
		this.isActive = true;
	}

	onDeactivate(): void {
		this.reset();
	}

	onPointerDown(_e: PointerEvent, _ctx: ToolContext): void {
		// Color picking is handled by ImagePreview.svelte
		// It reads from the composite canvas at the cursor position
	}

	onPointerMove(_e: PointerEvent, _ctx: ToolContext): void {
		// Position tracking is handled by ImagePreview.svelte
	}

	onPointerUp(_e: PointerEvent, _ctx: ToolContext): void {
		// No action needed
	}

	reset(): void {
		this.previewColor = null;
		this.isActive = false;
	}
}

/**
 * Factory function to create an EyedropperTool instance.
 */
export function createEyedropperTool(): EyedropperTool {
	return new EyedropperTool();
}
