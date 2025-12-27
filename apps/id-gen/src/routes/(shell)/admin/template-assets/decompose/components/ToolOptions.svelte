<script lang="ts">
	import { Slider } from '$lib/components/ui/slider';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { isDrawingTool, isFillTool, type ToolName, type ToolOptions } from '$lib/logic/tools';

	let {
		activeTool,
		toolOptions = $bindable<ToolOptions>({
			size: 20,
			opacity: 100,
			color: '#3b82f6',
			tolerance: 32
		}),
		onOptionsChange
	}: {
		activeTool: ToolName;
		toolOptions?: ToolOptions;
		onOptionsChange?: (options: Partial<ToolOptions>) => void;
	} = $props();

	// Color presets
	const colorPresets = [
		'#000000',
		'#ffffff',
		'#ef4444',
		'#22c55e',
		'#3b82f6',
		'#eab308',
		'#a855f7',
		'#ec4899',
		'#f97316',
		'#06b6d4'
	];

	// Determine which options to show based on active tool
	const showSizeOption = $derived(isDrawingTool(activeTool));
	const showOpacityOption = $derived(isDrawingTool(activeTool));
	const showColorOption = $derived(isDrawingTool(activeTool) || isFillTool(activeTool));
	const showToleranceOption = $derived(activeTool === 'bucket');

	function updateOption<K extends keyof ToolOptions>(key: K, value: ToolOptions[K]) {
		toolOptions = { ...toolOptions, [key]: value };
		onOptionsChange?.({ [key]: value });
	}
</script>

{#if activeTool && (showSizeOption || showOpacityOption || showColorOption || showToleranceOption)}
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

		<!-- Color Picker -->
		{#if showColorOption}
			<Popover.Root>
				<Popover.Trigger>
					<Button
						variant="ghost"
						size="icon"
						class="h-9 w-9 p-0 relative overflow-hidden ring-offset-background hover:ring-2 hover:ring-ring hover:ring-offset-2"
						title="Color Picker"
					>
						<div
							class="w-5 h-5 rounded-full border border-border shadow-inner"
							style="background-color: {toolOptions.color}"
						></div>
					</Button>
				</Popover.Trigger>
				<Popover.Content
					class="w-64 p-3 bg-background/95 backdrop-blur-md border-border shadow-2xl"
				>
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
							{#each colorPresets as color}
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
		{/if}
	</div>
{/if}
