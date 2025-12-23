<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { ZoomIn, Loader2 } from 'lucide-svelte';
	import type { DecomposedLayer } from '$lib/schemas/decompose.schema';

	let {
		open = $bindable(false),
		actionLayer,
		upscaleModel = $bindable('ccsr'),
		removeWatermark = $bindable(false),
		isProcessing,
		onProceed
	}: {
		open: boolean;
		actionLayer: DecomposedLayer | { id: string; name: string; imageUrl: string } | undefined;
		upscaleModel: string;
		removeWatermark?: boolean;
		isProcessing: boolean;
		onProceed: () => void;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<ZoomIn class="h-5 w-5 text-green-500" />
				Upscale Layer
			</Dialog.Title>
			<Dialog.Description>
				Enhance the resolution of the selected layer using AI upscaling.
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
						<p class="text-xs text-muted-foreground">Layer will be upscaled 2x</p>
					</div>
				</div>

				<!-- Model Selection -->
				<div>
					<Label for="upscale-model" class="text-sm font-medium">Upscale Model</Label>
					<select
						id="upscale-model"
						bind:value={upscaleModel}
						class="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
					>
						<option value="ccsr">CCSR (Balanced)</option>
						<option value="seedvr">SeedVR (High Quality)</option>
						<option value="aurasr">AuraSR (Fast)</option>
						<option value="esrgan">ESRGAN (Classic)</option>
						<option value="recraft-creative">Recraft Creative</option>
					</select>
				</div>
                
                <div class="flex items-center gap-2">
                    <input type="checkbox" id="remove-watermark" bind:checked={removeWatermark} />
                    <Label for="remove-watermark" class="text-sm">Remove Watermark (SynthID)</Label>
                </div>
			</div>
		{/if}

		<Dialog.Footer class="mt-6">
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button
				class="bg-green-600 hover:bg-green-700 text-white"
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
					<ZoomIn class="mr-2 h-4 w-4" />
					Upscale
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
