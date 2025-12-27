<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { Copy, Trash2, ArrowUp, ArrowDown, Pencil, MoreHorizontal } from 'lucide-svelte';

	type Action = 'rename' | 'duplicate' | 'delete' | 'moveUp' | 'moveDown';

	let {
		layerId,
		onAction,
		disabled = false
	}: {
		layerId: string;
		onAction: (action: Action) => void;
		disabled?: boolean;
	} = $props();

	let isDeleting = $state(false);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="icon"
				class="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
				{disabled}
				aria-label="Layer actions"
			>
				<MoreHorizontal class="h-4 w-4" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end" class="w-48">
		<DropdownMenu.Item onclick={() => onAction('rename')}>
			<Pencil class="mr-2 h-4 w-4" />
			<span>Rename</span>
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => onAction('duplicate')}>
			<Copy class="mr-2 h-4 w-4" />
			<span>Duplicate</span>
			<DropdownMenu.Shortcut>⌘D</DropdownMenu.Shortcut>
		</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<DropdownMenu.Item onclick={() => onAction('moveUp')}>
			<ArrowUp class="mr-2 h-4 w-4" />
			<span>Move Up</span>
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => onAction('moveDown')}>
			<ArrowDown class="mr-2 h-4 w-4" />
			<span>Move Down</span>
		</DropdownMenu.Item>
		<DropdownMenu.Separator />
		{#if isDeleting}
			<DropdownMenu.Item
				onclick={() => {
					onAction('delete');
					isDeleting = false;
				}}
				class="bg-red-100 text-red-700 focus:bg-red-200 focus:text-red-800"
			>
				<Trash2 class="mr-2 h-4 w-4" />
				<span>Confirm Delete?</span>
			</DropdownMenu.Item>
		{:else}
			<DropdownMenu.Item
				onclick={(e) => {
					e.preventDefault(); // Prevent menu close
					isDeleting = true;
				}}
				class="text-red-600 focus:bg-red-50 focus:text-red-700"
			>
				<Trash2 class="mr-2 h-4 w-4" />
				<span>Delete</span>
				<DropdownMenu.Shortcut>⌫</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
