<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Slider } from '$lib/components/ui/slider';
	import { Switch } from '$lib/components/ui/switch';
	import { ChevronDown, ChevronUp, X, ZoomIn } from 'lucide-svelte';

	let {
		numLayers = $bindable(4),
		prompt = $bindable(''),
		negativePrompt = $bindable(''),
		numInferenceSteps = $bindable(50),
		guidanceScale = $bindable(1),
		acceleration = $bindable('none'),
		upscaleModel = $bindable('ccsr'),
		removeWatermarks = $bindable(false),
		showAdvancedSettings = $bindable(false),
		hasUpscaledPreview,
		currentUpscaledUrl,
		template,
		enableSynthIdRemoval,
		onShowUpscaleModal,
		onClearUpscaledPreview
	}: {
		numLayers: number;
		prompt: string;
		negativePrompt: string;
		numInferenceSteps: number;
		guidanceScale: number;
		acceleration: string;
		upscaleModel: string;
		removeWatermarks: boolean;
		showAdvancedSettings: boolean;
		hasUpscaledPreview: boolean;
		currentUpscaledUrl: string | null;
		template: any;
		enableSynthIdRemoval: boolean;
		onShowUpscaleModal: () => void;
		onClearUpscaledPreview: () => void;
	} = $props();
</script>

<div class="space-y-4">
	<!-- Advanced Settings Toggle -->
	<div class="flex items-center justify-between">
		<Button
			variant="ghost"
			size="sm"
			class="h-8 text-xs text-muted-foreground"
			onclick={() => (showAdvancedSettings = !showAdvancedSettings)}
		>
			{#if showAdvancedSettings}
				<ChevronUp class="mr-2 h-3 w-3" />
				Hide Advanced Settings
			{:else}
				<ChevronDown class="mr-2 h-3 w-3" />
				Show Advanced Settings
			{/if}
		</Button>
	</div>

	{#if showAdvancedSettings}
		<div class="space-y-4 pt-2 pb-4 border-b border-border">
			<!-- Prompt -->
			<div class="grid gap-2">
				<Label for="prompt">Prompt</Label>
				<Textarea
					id="prompt"
					bind:value={prompt}
					class="h-24 text-xs"
					placeholder="Describe the ID card structure..."
				/>
			</div>

			<!-- Negative Prompt -->
			<div class="grid gap-2">
				<Label for="negative_prompt">Negative Prompt</Label>
				<Textarea
					id="negative_prompt"
					bind:value={negativePrompt}
					class="h-16 text-xs"
					placeholder="What to avoid..."
				/>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<!-- Inference Steps -->
				<div class="grid gap-2">
					<div class="flex items-center justify-between">
						<Label for="steps">Inference Steps: {numInferenceSteps}</Label>
					</div>
					<Slider
						id="steps"
						min={10}
						max={50}
						step={1}
						value={[numInferenceSteps]}
						type="multiple"
						onValueChange={(v: number[]) => (numInferenceSteps = v[0])}
					/>
				</div>

				<!-- Guidance Scale -->
				<div class="grid gap-2">
					<div class="flex items-center justify-between">
						<Label for="guidance">Guidance Scale: {guidanceScale}</Label>
					</div>
					<Slider
						id="guidance"
						min={1}
						max={20}
						step={0.1}
						value={[guidanceScale]}
						type="multiple"
						onValueChange={(v: number[]) => (guidanceScale = v[0])}
					/>
				</div>
			</div>

			<!-- Acceleration -->
			<div class="grid gap-2">
				<Label>Acceleration</Label>
				<div class="flex items-center gap-4">
					<div class="flex items-center space-x-2">
						<input
							type="radio"
							id="acc_none"
							name="acceleration"
							value="none"
							bind:group={acceleration}
							class="radio"
						/>
						<Label for="acc_none" class="font-normal">None</Label>
					</div>
					<div class="flex items-center space-x-2">
						<input
							type="radio"
							id="acc_regular"
							name="acceleration"
							value="regular"
							bind:group={acceleration}
							class="radio"
						/>
						<Label for="acc_regular" class="font-normal">Regular</Label>
					</div>
					<div class="flex items-center space-x-2">
						<input
							type="radio"
							id="acc_high"
							name="acceleration"
							value="high"
							bind:group={acceleration}
							class="radio"
						/>
						<Label for="acc_high" class="font-normal">High</Label>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Upscale Preview Section -->
	{#if hasUpscaledPreview}
		<div class="mb-4 rounded-lg border border-green-500/30 bg-green-500/5 p-3">
			<div class="flex items-start gap-3">
				<button
					onclick={onShowUpscaleModal}
					class="h-16 w-24 flex-shrink-0 overflow-hidden rounded border border-green-500/30 bg-muted cursor-pointer hover:border-green-500 transition-colors group relative"
					title="Click to view full size"
				>
					<img
						src={currentUpscaledUrl}
						alt="Upscaled preview"
						class="h-full w-full object-contain"
					/>
					<div
						class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center"
					>
						<ZoomIn
							class="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
						/>
					</div>
				</button>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
						<ZoomIn class="h-4 w-4" />
						Upscaled Preview Ready
					</p>
					<p class="text-xs text-green-600/80 dark:text-green-400/80 mt-0.5">
						Click thumbnail to view full size. Click "Decompose" to use this version.
					</p>
				</div>
				<button
					onclick={onClearUpscaledPreview}
					class="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
					title="Clear upscaled preview"
				>
					<X class="h-4 w-4" />
				</button>
			</div>
		</div>
	{/if}

	<div class="flex items-center gap-4 flex-wrap">
		<div class="flex items-center gap-2">
			<label for="numLayers" class="text-sm text-muted-foreground">Layers:</label>
			<select
				id="numLayers"
				bind:value={numLayers}
				class="rounded border border-border bg-background px-2 py-1 text-sm"
			>
				{#each [2, 3, 4, 5, 6, 8, 10] as n}
					<option value={n}>{n}</option>
				{/each}
			</select>
		</div>

		<!-- Upscale Model -->
		<div class="flex items-center gap-2">
			<label for="upscaleModel" class="text-sm text-muted-foreground">Model:</label>
			<select
				id="upscaleModel"
				bind:value={upscaleModel}
				class="rounded border border-border bg-background px-2 py-1 text-sm"
			>
				<option value="ccsr">CCSR (1.5x)</option>
				<option value="seedvr">SeedVR</option>
				<option value="aurasr">AuraSR</option>
				<option value="esrgan">ESRGAN</option>
				<option value="recraft-creative">Creative (Recraft)</option>
			</select>
		</div>

		<!-- SynthID Removal Toggle (stays here) -->
		{#if enableSynthIdRemoval}
			<div class="flex items-center gap-2 border-l border-border pl-4 ml-2">
				<div class="flex items-center space-x-2">
					<Switch id="remove-watermarks" bind:checked={removeWatermarks} />
					<Label for="remove-watermarks" class="text-xs cursor-pointer">Remove SynthID</Label>
				</div>
			</div>
		{/if}
	</div>

	<!-- Linked Template Info -->
	{#if template}
		<div class="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
			<div class="flex items-start gap-3">
				<div class="flex-1">
					<p class="text-sm font-medium text-blue-700 dark:text-blue-300">
						Linked Template: {template.name}
					</p>
					<p class="text-xs text-blue-600/80 dark:text-blue-400/80">
						{template.templateElements?.length || 0} existing elements • {template.widthPixels}x{template.heightPixels}px
					</p>
				</div>
				<a
					href="/templates?id={template.id}"
					class="text-xs text-blue-600 hover:underline"
					target="_blank"
				>
					Open Editor →
				</a>
			</div>
		</div>
	{:else}
		<div class="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
			<p class="text-sm text-yellow-700 dark:text-yellow-300">
				No template linked. Layers cannot be saved.
			</p>
		</div>
	{/if}
</div>
