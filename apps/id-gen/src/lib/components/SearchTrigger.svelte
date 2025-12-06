<script lang="ts">
	import { Search, FileText, CreditCard, Settings, User, LayoutGrid } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import * as Command from '$lib/components/ui/command';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';

	let open = $state(false);

	// Handle keyboard shortcut (Cmd/Ctrl + K)
	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			open = !open;
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	});

	function navigateTo(href: string) {
		open = false;
		goto(href);
	}

	const navigationItems = [
		{ label: 'Home', href: '/', icon: LayoutGrid },
		{ label: 'All IDs', href: '/all-ids', icon: CreditCard },
		{ label: 'Templates', href: '/templates', icon: FileText },
		{ label: 'Profile', href: '/profile', icon: User },
		{ label: 'Settings', href: '/settings', icon: Settings }
	];

	const quickActions = [
		{ label: 'New Template', href: '/templates/new', icon: FileText },
		{ label: 'Generate ID', href: '/use-template', icon: CreditCard }
	];
</script>

<Button
	variant="outline"
	class="relative w-full justify-start text-sm text-muted-foreground h-10"
	onclick={() => (open = true)}
>
	<Search class="mr-2 h-4 w-4" />
	<span class="hidden sm:inline-flex">Search...</span>
	<kbd
		class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex"
	>
		<span class="text-xs">Ctrl</span>K
	</kbd>
</Button>

<Command.Dialog bind:open>
	<Command.Input placeholder="Type a command or search..." />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>

		<Command.Group heading="Navigation">
			{#each navigationItems as item}
				<Command.Item onSelect={() => navigateTo(item.href)}>
					<item.icon class="mr-2 h-4 w-4" />
					<span>{item.label}</span>
				</Command.Item>
			{/each}
		</Command.Group>

		<Command.Separator />

		<Command.Group heading="Quick Actions">
			{#each quickActions as item}
				<Command.Item onSelect={() => navigateTo(item.href)}>
					<item.icon class="mr-2 h-4 w-4" />
					<span>{item.label}</span>
				</Command.Item>
			{/each}
		</Command.Group>
	</Command.List>
</Command.Dialog>
