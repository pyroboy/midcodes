<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Copy } from 'lucide-svelte';

	let {
		open = $bindable(false),
		templateName,
		onConfirm,
		onCancel
	} = $props<{
		open: boolean;
		templateName: string;
		onConfirm: (newName: string) => void;
		onCancel: () => void;
	}>();

	let newName = $state('');

	// Reset name when dialog opens
	$effect(() => {
		if (open) {
			newName = `${templateName} - Copy`;
		}
	});

	function handleConfirm() {
		if (newName.trim()) {
			onConfirm(newName.trim());
			open = false;
		}
	}

	function handleCancel() {
		onCancel();
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && newName.trim()) {
			handleConfirm();
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Copy class="h-5 w-5" />
				Duplicate Template
			</Dialog.Title>
			<Dialog.Description>
				Create a copy of "{templateName}" with a new name.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="newName">New Template Name</Label>
				<Input
					id="newName"
					bind:value={newName}
					placeholder="Enter template name"
					onkeydown={handleKeydown}
				/>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={handleCancel}>Cancel</Button>
			<Button onclick={handleConfirm} disabled={!newName.trim()}>
				<Copy class="mr-2 h-4 w-4" />
				Duplicate
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
