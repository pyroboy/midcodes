<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { ZoomIn, Wand2 } from 'lucide-svelte';

	let {
		open = $bindable(false),
		imageUrl,
		onDecompose
	}: {
		open: boolean;
		imageUrl: string | null;
		onDecompose: () => void;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-4xl max-h-[90vh] overflow-auto">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<ZoomIn class="h-5 w-5 text-green-500" />
				Upscaled Image Preview (2x)
			</Dialog.Title>
			<Dialog.Description>
				This is the upscaled version that will be used for decomposition.
			</Dialog.Description>
		</Dialog.Header>
		<div class="mt-4 flex items-center justify-center bg-muted/30 rounded-lg p-4 overflow-auto">
			{#if imageUrl}
				<img
					src={imageUrl}
					alt="Upscaled preview full size"
					class="max-w-full max-h-[70vh] object-contain rounded border border-border"
				/>
			{/if}
		</div>
		<Dialog.Footer class="mt-4">
			<Button variant="outline" onclick={() => (open = false)}>Close</Button>
			<Button
				onclick={() => {
					open = false;
					onDecompose();
				}}
			>
				<Wand2 class="mr-2 h-4 w-4" />
				Decompose This Image
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
