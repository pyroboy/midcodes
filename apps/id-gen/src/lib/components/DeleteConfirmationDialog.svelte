<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';

	let {
		open = $bindable(false),
		templateName,
		onConfirm,
		onCancel
	} = $props<{
		open: boolean;
		templateName: string;
		onConfirm: (deleteIds: boolean) => void;
		onCancel: () => void;
	}>();

	let deleteIds = $state(false);

	function handleConfirm() {
		onConfirm(deleteIds);
		open = false;
	}

	function handleCancel() {
		onCancel();
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Delete Template</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete "{templateName}"? This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="flex items-center space-x-2">
				<Checkbox id="deleteIds" bind:checked={deleteIds} />
				<Label
					for="deleteIds"
					class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					Also delete all associated ID cards?
				</Label>
			</div>
			<p class="text-xs text-muted-foreground">
				If unchecked, associated ID cards will be kept but marked as "Unassigned".
			</p>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={handleCancel}>Cancel</Button>
			<Button variant="destructive" onclick={handleConfirm}>Delete</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
