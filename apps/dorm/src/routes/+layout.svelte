<script lang="ts">
	import '../app.css';
	import { Toaster } from '$lib/components/ui/sonner';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import PropertySelector from '$lib/components/ui/PropertySelector.svelte';
	import { propertyStore } from '$lib/stores/property';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';


	// Import Lucide icons
	import Building from 'lucide-svelte/icons/building';
	import Home from 'lucide-svelte/icons/home';
	import Layers from 'lucide-svelte/icons/layers';
	import Gauge from 'lucide-svelte/icons/gauge';
	import Users from 'lucide-svelte/icons/users';
	import FileText from 'lucide-svelte/icons/file-text';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import List from 'lucide-svelte/icons/list';
	import LogOut from 'lucide-svelte/icons/log-out';
	import User from 'lucide-svelte/icons/user';

	let { data, children }: { data: PageData; children: any } = $props();

	let ready = $state(false);
	onMount(() => {
		ready = true;
	});

	// Use an effect to safely initialize the store after data is loaded
	$effect(() => {
		if (data.properties) {
			// The promise itself is a dependency. When it resolves, the effect re-runs.
			data.properties.then((properties) => {
				if (properties) {
					propertyStore.init(properties);
				}
			});
		}
	});

	const navigationLinks = [
		{
			category: 'Locations',
			links: [
				{ href: '/properties', label: 'Properties', icon: Building },
				{ href: '/rental-unit', label: 'Rental Units', icon: Home },
				{ href: '/floors', label: 'Floors', icon: Layers },
				{ href: '/meters', label: 'Meters', icon: Gauge }
			]
		},
		{
			category: 'Rent Management',
			links: [
				{ href: '/tenants', label: 'Tenants', icon: Users },
				{ href: '/leases', label: 'Leases', icon: FileText },
				{ href: '/utility-billings', label: 'Utilities', icon: CreditCard },
				{ href: '/penalties', label: 'Penalties', icon: List }
			]
		},
		{
			category: 'Finance',
			links: [
				{ href: '/transactions', label: 'Transactions', icon: CreditCard },
				{ href: '/expenses', label: 'Expenses', icon: FileText },
				{ href: '/budgets', label: 'Budgets', icon: FileText }
			]
		},
		{
			category: 'Reports',
			links: [
				{ href: '/reports', label: 'Monthly Reports', icon: CreditCard },
				{ href: '/lease-report', label: 'Lease Reports', icon: CreditCard }
			]
		}
	];
</script>

{#await data.properties}
	<div class="flex h-screen w-full items-center justify-center">
		<p>Loading application data...</p>
	</div>
{:then properties}

	<Toaster />
	{#if properties && properties.length > 0}
	{#if ready}
		<Sidebar.Provider>
		<div class="flex min-h-screen w-full">
			<!-- Sidebar -->
			<Sidebar.Root collapsible="icon" class="shrink-0">
				<Sidebar.Header>
					<div class="p-4 font-bold text-lg">Dorm Management</div>
				</Sidebar.Header>

				<Sidebar.Content>
					{#each navigationLinks as group (group.category)}
						<Sidebar.Group>
							<Sidebar.GroupLabel>{group.category}</Sidebar.GroupLabel>
							<Sidebar.GroupContent>
								<Sidebar.Menu>
									{#each group.links as link (link.href)}
										<a href={link.href} class="block no-underline">
											<Sidebar.MenuItem>
												<Sidebar.MenuButton>
													<link.icon class="h-5 w-5" />
													<span>{link.label}</span>
												</Sidebar.MenuButton>
											</Sidebar.MenuItem>
										</a>
									{/each}
								</Sidebar.Menu>
							</Sidebar.GroupContent>
						</Sidebar.Group>
					{/each}
				</Sidebar.Content>

				<Sidebar.Footer>
					<div class="p-4 border-t">
						{#if data.session}
							<div class="flex flex-col space-y-3">
								<div class="flex items-center space-x-2 text-sm">
									<User class="w-4 h-4 text-muted-foreground" />
									<span class="truncate">{data.user?.email || 'Logged in'}</span>
								</div>
								<a
									href="/auth/signout"
									class="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800"
								>
									<LogOut class="w-4 h-4" />
									<span>Sign out</span>
								</a>
							</div>
						{:else}
							<a
								href="/auth"
								class="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
							>
								<User class="w-4 h-4" />
								<span>Sign in</span>
							</a>
						{/if}
					</div>
				</Sidebar.Footer>
				<Sidebar.Rail />
			</Sidebar.Root>

			<!-- Main Content Area - Full Width -->
			<main class="flex-1 overflow-auto w-full">
				<div class="flex items-center justify-between p-4 md:p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
					<div class="flex items-center gap-4">
						<Sidebar.Trigger />
						{#if data.user}
							<PropertySelector />
						{/if}
					</div>
				</div>
				<div class="w-full">
					{@render children()}
				</div>
			</main>
		</div>
		</Sidebar.Provider>
	{/if}
	{:else}
		<div class="flex h-screen w-full items-center justify-center">
			<p>No properties found. Please add a property to continue.</p>
		</div>
	{/if}
{:catch error}
	<div class="flex h-screen w-full items-center justify-center">
		<p class="text-red-500">Error: Could not load essential property data. {error.message}</p>
	</div>
{/await}