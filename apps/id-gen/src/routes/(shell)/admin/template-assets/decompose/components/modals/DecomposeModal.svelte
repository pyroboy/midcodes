<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { Wand2, Loader2, ChevronDown } from 'lucide-svelte';
	import { CREDIT_COSTS } from '$lib/config/credits';
	import type { DecomposedLayer } from '$lib/schemas/decompose.schema';

	let {
		open = $bindable(false),
		actionLayer,
		numLayers = $bindable(4),
		prompt = $bindable(''),
		negativePrompt = $bindable(''),
		numInferenceSteps = $bindable(50),
		guidanceScale = $bindable(1),
		acceleration = $bindable('none'),
		isProcessing,
		onProceed
	}: {
		open: boolean;
		actionLayer: DecomposedLayer | { id: string; name: string; imageUrl: string } | undefined;
		numLayers: number;
		prompt: string;
		negativePrompt: string;
		numInferenceSteps: number;
		guidanceScale: number;
		acceleration: string;
		isProcessing: boolean;
		onProceed: () => void;
	} = $props();

	let decomposeCost = $derived(CREDIT_COSTS.AI_DECOMPOSE * numLayers);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Wand2 class="h-5 w-5 text-violet-500" />
				Decompose Layer
			</Dialog.Title>
			<Dialog.Description>
				Break down the selected layer into multiple sub-layers using AI.
			</Dialog.Description>
		</Dialog.Header>

		{#if actionLayer}
			<div class="mt-4 space-y-4">
				<!-- Layer Preview -->
				<div class="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
					<div class="w-16 h-12 rounded border border-border bg-muted overflow-hidden flex-shrink-0">
						<img src={actionLayer.imageUrl} alt={actionLayer.name} class="w-full h-full object-contain" />
					</div>
					<div>
						<p class="font-medium text-sm">{actionLayer.name}</p>
						<p class="text-xs text-muted-foreground">Will be decomposed into {numLayers} layers</p>
					</div>
				</div>

				<!-- Number of Layers Slider -->
				<div>
					<div class="flex items-center justify-between mb-2">
						<Label class="text-sm font-medium">Number of Layers</Label>
						<span class="w-8 text-center font-medium">{numLayers}</span>
					</div>
					<Slider
						min={2}
						max={10}
						step={1}
						value={[numLayers]}
						type="multiple"
						onValueChange={(v: number[]) => (numLayers = v[0])}
						class="flex-1"
					/>
				</div>

				<p class="text-xs text-muted-foreground">Cost: {decomposeCost} credits</p>

				<!-- Advanced Settings Toggle -->
				<Collapsible.Root>
					<Collapsible.Trigger
						class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						<ChevronDown class="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180" />
						Advanced Settings
					</Collapsible.Trigger>
					<Collapsible.Content class="mt-3 space-y-4">
						<!-- Prompt -->
						<div class="space-y-2">
							<Label for="modal-prompt" class="text-sm">Prompt</Label>
							<Textarea
								id="modal-prompt"
								bind:value={prompt}
								class="h-20 text-xs"
								placeholder="Describe the ID card structure..."
							/>
						</div>

						<!-- Negative Prompt -->
						<div class="space-y-2">
							<Label for="modal-negative-prompt" class="text-sm">Negative Prompt</Label>
							<Textarea
								id="modal-negative-prompt"
								bind:value={negativePrompt}
								class="h-16 text-xs"
								placeholder="What to avoid..."
							/>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<!-- Inference Steps -->
							<div class="space-y-2">
								<Label class="text-sm">Steps: {numInferenceSteps}</Label>
								<Slider
									min={10}
									max={50}
									step={1}
									value={[numInferenceSteps]}
									type="multiple"
									onValueChange={(v: number[]) => (numInferenceSteps = v[0])}
								/>
							</div>

							<!-- Guidance Scale -->
							<div class="space-y-2">
								<Label class="text-sm">Guidance: {guidanceScale}</Label>
								<Slider
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
						<div>
							<Label class="text-sm mb-2 block">Acceleration</Label>
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
									<Label for="acc_none" class="font-normal text-sm">None</Label>
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
									<Label for="acc_regular" class="font-normal text-sm">Regular</Label>
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
									<Label for="acc_high" class="font-normal text-sm">High</Label>
								</div>
							</div>
						</div>
					</Collapsible.Content>
				</Collapsible.Root>
			</div>
		{/if}

		<Dialog.Footer class="mt-6">
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button
				class="bg-violet-600 hover:bg-violet-700 text-white"
				disabled={isProcessing}
				onclick={() => {
					open = false;
					onProceed();
				}}
			>
				{#if isProcessing}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Processing...
				{:else}
					<Wand2 class="mr-2 h-4 w-4" />
					Decompose
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
