<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { AlertTriangle } from 'lucide-svelte';

	let {
		open = $bindable(false),
		onConvert,
		onCancel
	}: {
		open?: boolean;
		onConvert?: () => void;
		onCancel?: () => void;
	} = $props();

	function handleCancel() {
		open = false;
		onCancel?.();
	}

	function handleConvert() {
		open = false;
		onConvert?.();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<div class="flex items-center gap-3">
				<div class="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
					<AlertTriangle class="h-5 w-5 text-amber-600 dark:text-amber-400" />
				</div>
				<Dialog.Title>Convert to Editable Layer?</Dialog.Title>
			</div>
			<Dialog.Description class="mt-3 text-left">
				This layer is synced as a <strong class="font-semibold">Static Element</strong> in the
				template. Converting back to a regular layer will
				<strong class="font-semibold">remove it from the template</strong>.
				<br /><br />
				Do you want to proceed?
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer class="gap-2 sm:gap-0">
			<Button variant="outline" onclick={handleCancel}>Cancel</Button>
			<Button variant="default" class="bg-amber-600 hover:bg-amber-700" onclick={handleConvert}>
				Convert & Edit
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
