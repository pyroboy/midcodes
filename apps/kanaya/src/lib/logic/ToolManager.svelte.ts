import type { ToolName, ToolOptions } from './tools';

export class ToolManager {
	// Tool State
	activeTool = $state<ToolName>(null);
	previousTool = $state<ToolName>(null);

	// Tool Options
	toolOptions = $state<ToolOptions>({
		size: 20,
		opacity: 100,
		color: '#3b82f6',
		hardness: 100,
		tolerance: 32
	});

	// Eyedropper preview color (shown while hovering before clicking)
	eyedropperPreviewColor = $state<string | null>(null);

	constructor() {}

	/**
	 * Set the active tool. Stores previous tool for eyedropper-style returns.
	 */
	setTool(tool: ToolName): void {
		if (tool === this.activeTool) return;
		this.previousTool = this.activeTool;
		this.activeTool = tool;
	}

	/**
	 * Return to the previous tool (used after eyedropper).
	 */
	revertTool(): void {
		this.activeTool = this.previousTool;
		this.previousTool = null;
	}

	/**
	 * Update a single tool option.
	 */
	setToolOption<K extends keyof ToolOptions>(key: K, value: ToolOptions[K]): void {
		this.toolOptions = { ...this.toolOptions, [key]: value };
	}

	/**
	 * Update multiple tool options at once.
	 */
	setToolOptions(updates: Partial<ToolOptions>): void {
		this.toolOptions = { ...this.toolOptions, ...updates };
	}
}
