<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import PrintPreview from './PrintPreview.svelte';
	import type { MeterData, ShareData } from './types';

	type Props = {
		open: boolean;
		reading: MeterData | null;
		data: ShareData[];
		onBack: () => void;
		onPrint: (data: any) => void;
	};

	let { open = $bindable(), reading, data, onBack, onPrint }: Props = $props();

	function handleClose() {
		open = false;
	}
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen && handleClose()}>
	<Dialog.Content class="sm:max-w-[800px]">
		<Dialog.Header>
			<Dialog.Title>Print Preview</Dialog.Title>
			<Dialog.Description>Review the billing statement before printing.</Dialog.Description>
		</Dialog.Header>

		{#if reading && data.length > 0}
			<PrintPreview {reading} {data} {onBack} {onPrint} />
		{:else}
			<div class="flex items-center justify-center p-8">
				<p class="text-muted-foreground">No data available for preview.</p>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
