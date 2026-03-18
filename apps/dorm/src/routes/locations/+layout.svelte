<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { Building2, Home, Layers, Gauge, Plus, ChevronDown } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let { children } = $props();

	const tabs = [
		{ id: 'properties', label: 'Properties', href: '/locations/properties', icon: Building2 },
		{ id: 'units', label: 'Units', href: '/locations/units', icon: Home },
		{ id: 'floors', label: 'Floors', href: '/locations/floors', icon: Layers },
		{ id: 'meters', label: 'Meters', href: '/locations/meters', icon: Gauge }
	];

	let activeTab = $derived(
		tabs.find((t) => $page.url.pathname.startsWith(t.href))?.id ?? 'properties'
	);

	let popoverOpen = $state(false);
	let currentTab = $derived(tabs.find((t) => t.id === activeTab)!);

	let addButtonLabel = $derived(
		{
			properties: 'Add Property',
			units: 'Add Unit',
			floors: 'Add Floor',
			meters: 'Add Meter'
		}[activeTab]
	);

	function handleAdd() {
		goto($page.url.pathname + '?add=1', { replaceState: true, keepFocus: true });
	}
</script>

<div class="space-y-6">
	<!-- Header row: Tab selector + Add button -->
	<div class="flex items-center justify-between gap-4">
		<div class="flex items-center gap-3">
			<!-- Desktop tabs (md+) -->
			<div class="hidden md:flex items-center gap-1 rounded-lg bg-muted p-1">
				{#each tabs as tab (tab.id)}
					<a
						href={tab.href}
						class="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm no-underline transition-colors {activeTab === tab.id
							? 'bg-background text-foreground shadow-sm font-medium'
							: 'text-muted-foreground hover:text-foreground'}"
						data-sveltekit-preload-data="hover"
					>
						<tab.icon class="h-4 w-4" />
						{tab.label}
					</a>
				{/each}
			</div>

			<!-- Mobile popover (<md) -->
			<div class="md:hidden">
				<Popover.Root bind:open={popoverOpen}>
					<Popover.Trigger>
						<Button variant="outline" class="flex items-center gap-2">
							<currentTab.icon class="h-4 w-4" />
							{currentTab.label}
							<ChevronDown class="h-4 w-4 opacity-50" />
						</Button>
					</Popover.Trigger>
					<Popover.Content class="w-48 p-1" align="start">
						{#each tabs as tab (tab.id)}
							<a
								href={tab.href}
								class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm no-underline transition-colors {activeTab ===
								tab.id
									? 'bg-primary/10 text-primary font-medium'
									: 'hover:bg-muted text-foreground'}"
								onclick={() => (popoverOpen = false)}
								data-sveltekit-preload-data="hover"
							>
								<tab.icon class="h-4 w-4" />
								{tab.label}
							</a>
						{/each}
					</Popover.Content>
				</Popover.Root>
			</div>
		</div>

		<Button onclick={handleAdd} class="shadow-sm shrink-0">
			<Plus class="w-4 h-4 mr-2" />
			<span class="hidden sm:inline">{addButtonLabel}</span>
			<span class="sm:hidden">Add</span>
		</Button>
	</div>

	<!-- Subroute content -->
	{@render children()}
</div>
