<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Eraser, Loader2 } from 'lucide-svelte';
	import type { DecomposedLayer } from '$lib/schemas/decompose.schema';

	let {
		open = $bindable(false),
		actionLayer,
		removePrompt = $bindable(''),
		isProcessing,
		onProceed
	}: {
		open: boolean;
		actionLayer: DecomposedLayer | { id: string; name: string; imageUrl: string } | undefined;
		removePrompt: string;
		isProcessing: boolean;
		onProceed: () => void;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Eraser class="h-5 w-5 text-red-500" />
				Remove Element
			</Dialog.Title>
			<Dialog.Description> Use AI to remove unwanted elements from the layer. </Dialog.Description>
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
						<p class="text-xs text-muted-foreground">Specify what to remove below</p>
					</div>
				</div>

				<!-- Remove Prompt -->
				<div>
					<Label for="modal-remove-prompt" class="text-sm font-medium">What do you want to remove?</Label>
					<input
						id="modal-remove-prompt"
						type="text"
						bind:value={removePrompt}
						placeholder="e.g. watermark, logo, person, text, background clutter..."
						class="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50"
					/>
					<p class="mt-1.5 text-xs text-muted-foreground">
						AI will cleanly remove the specified element while maintaining image consistency.
					</p>
				</div>
			</div>
		{/if}

		<Dialog.Footer class="mt-6">
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button
				class="bg-red-600 hover:bg-red-700 text-white"
				disabled={isProcessing || !removePrompt.trim()}
				onclick={() => {
					open = false;
					onProceed();
				}}
			>
				{#if isProcessing}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Processing...
				{:else}
					<Eraser class="mr-2 h-4 w-4" />
					Remove
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
