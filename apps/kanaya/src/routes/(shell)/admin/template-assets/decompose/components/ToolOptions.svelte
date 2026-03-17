<script lang="ts">
	import { Slider } from '$lib/components/ui/slider';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { ChevronDown, Pipette } from 'lucide-svelte';
	import { isDrawingTool, isFillTool, type ToolName, type ToolOptions } from '$lib/logic/tools';

	let {
		activeTool,
		toolOptions = {
			size: 20,
			opacity: 100,
			color: '#3b82f6',
			hardness: 100,
			tolerance: 32
		},
		onOptionsChange,
		onToolChange,
		eyedropperPreviewColor
	}: {
		activeTool: ToolName;
		toolOptions?: ToolOptions;
		onOptionsChange?: (options: Partial<ToolOptions>) => void;
		onToolChange?: (tool: ToolName) => void;
		eyedropperPreviewColor?: string | null;
	} = $props();

	// Check if native EyeDropper API is available
	const hasNativeEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;

	// Track if eyedropper is currently picking
	let isPickingColor = $state(false);

	/**
	 * Open the native EyeDropper immediately.
	 * Shows the big zoom circle for pixel-perfect color picking from anywhere on screen.
	 */
	async function openEyeDropper() {
		if (!hasNativeEyeDropper || isPickingColor) return;

		isPickingColor = true;

		try {
			// @ts-expect-error - EyeDropper is not in TypeScript's lib yet
			const eyeDropper = new window.EyeDropper();
			const result = await eyeDropper.open();

			if (result?.sRGBHex) {
				// Update the color
				onOptionsChange?.({ color: result.sRGBHex });
			}
		} catch (err) {
			// User cancelled (pressed Escape) - that's fine
			if ((err as Error)?.name !== 'AbortError') {
				console.warn('[ToolOptions] EyeDropper error:', err);
			}
		} finally {
			isPickingColor = false;
		}
	}

	// Determine if eyedropper is active
	const isEyedropperActive = $derived(activeTool === 'eyedropper' || isPickingColor);

	// Color presets - primary row (most used)
	const primaryColors = ['#000000', '#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#eab308'];

	// Extended color presets for popover
	const allColorPresets = [
		'#000000',
		'#ffffff',
		'#ef4444',
		'#22c55e',
		'#3b82f6',
		'#eab308',
		'#a855f7',
		'#ec4899',
		'#f97316',
		'#06b6d4',
		'#64748b',
		'#f59e0b',
		'#10b981',
		'#8b5cf6',
		'#14b8a6'
	];

	// Determine which options to show based on active tool
	const showSizeOption = $derived(isDrawingTool(activeTool));
	const showOpacityOption = $derived(isDrawingTool(activeTool));
	const showHardnessOption = $derived(isDrawingTool(activeTool));
	const showColorOption = $derived(isDrawingTool(activeTool) || isFillTool(activeTool));
	const showToleranceOption = $derived(activeTool === 'bucket');

	// Always show color bar, but highlight when tool uses color
	const colorIsActive = $derived(isDrawingTool(activeTool) || isFillTool(activeTool));

	function updateOption<K extends keyof ToolOptions>(key: K, value: ToolOptions[K]) {
		onOptionsChange?.({ [key]: value });
	}
</script>

<!-- Persistent Color Bar - Always visible -->
<div
	class="flex items-center gap-2 rounded-lg border border-border bg-background/90 px-3 py-2 shadow-lg backdrop-blur-sm transition-opacity {colorIsActive || isEyedropperActive
		? 'opacity-100'
		: 'opacity-70'}"
>
	<!-- Current Color Indicator with Eyedropper Preview -->
	<div class="flex items-center gap-1.5">
		<!-- Main Color Swatch -->
		<div class="relative">
			<div
				class="w-7 h-7 rounded-md border-2 shadow-inner transition-all {colorIsActive
					? 'border-primary'
					: 'border-border'}"
				style="background-color: {toolOptions.color}"
				title="Current Color: {toolOptions.color}"
			></div>
			<!-- Eyedropper Preview Overlay (when active and hovering) -->
			{#if isEyedropperActive && eyedropperPreviewColor}
				<div
					class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-md ring-1 ring-black/20"
					style="background-color: {eyedropperPreviewColor}"
					title="Preview: {eyedropperPreviewColor}"
				></div>
			{/if}
		</div>

		<!-- Eyedropper Button - Opens native color picker immediately -->
		<Tooltip.Root delayDuration={300}>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant={isPickingColor ? 'secondary' : 'ghost'}
						size="icon"
						class="h-7 w-7 transition-all {isPickingColor
							? 'ring-2 ring-cyan-400/50 bg-cyan-400/10'
							: 'hover:bg-muted'}"
						onclick={openEyeDropper}
						disabled={!hasNativeEyeDropper || isPickingColor}
					>
						<Pipette
							class="h-3.5 w-3.5 {isPickingColor ? 'text-cyan-400' : 'text-muted-foreground'}"
						/>
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content side="bottom" class="flex items-center gap-2">
				<span>{hasNativeEyeDropper ? 'Pick Color' : 'Not supported'}</span>
				<kbd class="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">I</kbd>
			</Tooltip.Content>
		</Tooltip.Root>
	</div>

	<!-- Quick Color Presets -->
	<div class="flex items-center gap-1">
		{#each primaryColors as color}
			<button
				class="w-5 h-5 rounded-md border transition-all hover:scale-110 active:scale-95 {toolOptions.color ===
				color
					? 'ring-2 ring-primary ring-offset-1 border-primary'
					: 'border-black/10 hover:border-primary/50'}"
				style="background-color: {color}"
				onclick={() => updateOption('color', color)}
				title={color}
			></button>
		{/each}
	</div>

	<!-- More Colors Popover -->
	<Popover.Root>
		<Popover.Trigger>
			<Button variant="ghost" size="sm" class="h-6 w-6 p-0 hover:bg-muted" title="More Colors">
				<ChevronDown class="h-3 w-3 text-muted-foreground" />
			</Button>
		</Popover.Trigger>
		<Popover.Content class="w-64 p-3 bg-background/95 backdrop-blur-md border-border shadow-2xl">
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
						>Color Picker</span
					>
					<div
						class="h-4 w-12 rounded border border-border"
						style="background-color: {toolOptions.color}"
					></div>
				</div>

				<div class="grid grid-cols-5 gap-2">
					{#each allColorPresets as color}
						<button
							class="w-8 h-8 rounded-md border border-black/10 transition-transform hover:scale-110 active:scale-95 shadow-sm {toolOptions.color ===
							color
								? 'ring-2 ring-primary ring-offset-2'
								: ''}"
							style="background-color: {color}"
							onclick={() => updateOption('color', color)}
							title={color}
						></button>
					{/each}
				</div>

				<div class="space-y-1.5">
					<label for="custom-color" class="text-[10px] font-medium text-muted-foreground"
						>Custom HEX</label
					>
					<div class="flex gap-2">
						<div class="relative flex-1">
							<Input
								id="custom-color"
								type="text"
								value={toolOptions.color}
								oninput={(e) => updateOption('color', (e.target as HTMLInputElement).value)}
								class="h-8 text-xs font-mono pl-7"
								placeholder="#000000"
							/>
							<div
								class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-black/10"
								style="background-color: {toolOptions.color}"
							></div>
						</div>
						<input
							type="color"
							value={toolOptions.color}
							oninput={(e) => updateOption('color', (e.target as HTMLInputElement).value)}
							class="w-8 h-8 rounded-md border border-border bg-transparent p-0 cursor-pointer overflow-hidden"
						/>
					</div>
				</div>
			</div>
		</Popover.Content>
	</Popover.Root>
</div>

<!-- Tool-specific Options Bar -->
{#if activeTool && (showSizeOption || showOpacityOption || showToleranceOption)}
	<div
		class="flex items-center gap-4 rounded-lg border border-border bg-background/90 px-4 py-2 shadow-lg backdrop-blur-sm"
	>
		<!-- Size Slider -->
		{#if showSizeOption}
			<div class="flex items-center gap-2">
				<Label class="text-xs text-muted-foreground whitespace-nowrap">Size</Label>
				<Slider
					value={[toolOptions.size]}
					type="multiple"
					onValueChange={(val: number[]) => updateOption('size', val[0])}
					min={1}
					max={100}
					step={1}
					class="w-24"
				/>
				<span class="w-8 text-xs text-muted-foreground text-right">{toolOptions.size}px</span>
			</div>
		{/if}

		<!-- Opacity Slider -->
		{#if showOpacityOption}
			<div class="flex items-center gap-2">
				<Label class="text-xs text-muted-foreground whitespace-nowrap">Opacity</Label>
				<Slider
					value={[toolOptions.opacity]}
					type="multiple"
					onValueChange={(val: number[]) => updateOption('opacity', val[0])}
					min={0}
					max={100}
					step={1}
					class="w-24"
				/>
				<span class="w-8 text-xs text-muted-foreground text-right">{toolOptions.opacity}%</span>
			</div>
		{/if}

		<!-- Hardness Slider -->
		{#if showHardnessOption}
			<div class="flex items-center gap-2">
				<Label class="text-xs text-muted-foreground whitespace-nowrap">Hardness</Label>
				<Slider
					value={[toolOptions.hardness ?? 100]}
					type="multiple"
					onValueChange={(val: number[]) => updateOption('hardness', val[0])}
					min={0}
					max={100}
					step={1}
					class="w-24"
				/>
				<span class="w-8 text-xs text-muted-foreground text-right"
					>{toolOptions.hardness ?? 100}%</span
				>
			</div>
		{/if}

		<!-- Tolerance Slider (Bucket tool) -->
		{#if showToleranceOption}
			<div class="flex items-center gap-2">
				<Label class="text-xs text-muted-foreground whitespace-nowrap">Tolerance</Label>
				<Slider
					value={[toolOptions.tolerance ?? 32]}
					type="multiple"
					onValueChange={(val: number[]) => updateOption('tolerance', val[0])}
					min={0}
					max={255}
					step={1}
					class="w-24"
				/>
				<span class="w-8 text-xs text-muted-foreground text-right">{toolOptions.tolerance}</span>
			</div>
		{/if}
	</div>
{/if}
