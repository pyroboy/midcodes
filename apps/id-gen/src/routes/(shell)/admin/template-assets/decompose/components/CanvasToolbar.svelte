<script lang="ts">
	import { Paintbrush, Eraser, Lasso, Pipette } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	type CanvasTool = 'brush' | 'eraser' | 'lasso' | 'eyedropper' | null;
	import * as Popover from '$lib/components/ui/popover';
	import { Input } from '$lib/components/ui/input';

	let {
		activeTool = $bindable<CanvasTool>(null),
		currentColor = $bindable<string>('#3b82f6'),
		disabled = false
	}: {
		activeTool?: CanvasTool;
		currentColor?: string;
		disabled?: boolean;
	} = $props();

	const tools: {
		id: Exclude<CanvasTool, null>;
		icon: typeof Paintbrush;
		label: string;
		color: string;
	}[] = [
		{ id: 'brush', icon: Paintbrush, label: 'Brush', color: 'text-blue-500' },
		{ id: 'eraser', icon: Eraser, label: 'Eraser', color: 'text-rose-500' },
		{ id: 'lasso', icon: Lasso, label: 'Lasso', color: 'text-amber-500' },
		{ id: 'eyedropper', icon: Pipette, label: 'Eyedropper', color: 'text-cyan-400' }
	];

	const presets = [
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
</script>

<div
	class="flex items-center justify-center gap-1 pt-2.5 pb-1.5 px-2 rounded-lg bg-background/90 backdrop-blur-sm border border-border shadow-lg"
>
	{#each tools as tool (tool.id)}
		<Button
			variant={activeTool === tool.id ? 'secondary' : 'ghost'}
			size="icon"
			class="h-9 w-9 transition-all {activeTool === tool.id
				? 'ring-2 ring-primary/50 bg-primary/10'
				: 'hover:bg-muted'}"
			onclick={() => (activeTool = tool.id)}
			disabled={disabled && (tool.id === 'brush' || tool.id === 'eraser' || tool.id === 'lasso')}
			title={tool.label}
		>
			<tool.icon class="h-4 w-4 {activeTool === tool.id ? tool.color : 'text-muted-foreground'}" />
		</Button>
	{/each}

	<div class="w-px h-6 bg-border mx-1"></div>

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
					style="background-color: {currentColor}"
				></div>
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
						style="background-color: {currentColor}"
					></div>
				</div>

				<div class="grid grid-cols-5 gap-2">
					{#each presets as color}
						<button
							class="w-8 h-8 rounded-md border border-black/10 transition-transform hover:scale-110 active:scale-95 shadow-sm"
							style="background-color: {color}"
							onclick={() => (currentColor = color)}
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
								bind:value={currentColor}
								class="h-8 text-xs font-mono pl-7"
								placeholder="#000000"
							/>
							<div
								class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-black/10"
								style="background-color: {currentColor}"
							></div>
						</div>
						<input
							type="color"
							bind:value={currentColor}
							class="w-8 h-8 rounded-md border border-border bg-transparent p-0 cursor-pointer overflow-hidden"
						/>
					</div>
				</div>
			</div>
		</Popover.Content>
	</Popover.Root>
</div>
