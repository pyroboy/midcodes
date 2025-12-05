<script lang="ts">
	import '../app.css';
	import { Toaster } from '$lib/components/ui/sonner';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import PropertySelector from '$lib/components/ui/PropertySelector.svelte';
	import { propertyStore } from '$lib/stores/property';
	import type { PageData } from './$types';
	import type { Property } from '$lib/types/database';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { contextualPreload, safePreloadData } from '$lib/utils/prefetch';
	import { preloadHeavyComponents } from '$lib/utils/lazyLoad';
	import CacheDebugPanel from '$lib/components/debug/CacheDebugPanel.svelte';
	import { dev } from '$app/environment';
	import GlobalPropertyViewer from '$lib/components/3d/GlobalPropertyViewer.svelte';
	import { featureFlags } from '$lib/stores/featureFlags';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	// Import Lucide icons
	import {
		Building,
		Home,
		Layers,
		Gauge,
		Users,
		FileText,
		CreditCard,
		List,
		LogOut,
		User,
		Box,
		X
	} from 'lucide-svelte';

	let { data, children }: { data: PageData; children: any } = $props();

	let ready = $state(false);
	let isAuthRoute = $state(false);
	let show3DModel = $state(false);

	onMount(() => {
		ready = true;
		isAuthRoute = $page.url.pathname.startsWith('/auth');

		// Subscribe to page changes to update auth route status
		const unsubscribe = page.subscribe(($page) => {
			isAuthRoute = $page.url.pathname.startsWith('/auth');
		});

		// Preloading disabled due to SSR issues
		// TODO: Re-enable when SSR is working properly
		// if (data.user) {
		//   const userRoles = data.user.user_metadata?.roles || [];
		//   contextualPreload($page.url.pathname, userRoles);
		// }
		// preloadHeavyComponents();

		return unsubscribe;
	});

	// Enhanced hover preloading for navigation sections
	function onSectionHover(sectionLinks: { href: string; label: string }[]) {
		// Preloading disabled due to SSR issues
		// sectionLinks.forEach((link) => {
		//   safePreloadData(link.href);
		// });
	}

	// Initialize properties store - simplified approach
	let propertiesInitialized = $state(false);
	let resolvedProperties = $state<Property[]>([]);

	$effect(() => {
		// Reset initialization state when data changes
		if (data.properties) {
			// Handle the properties promise
			if (data.properties instanceof Promise) {
				propertiesInitialized = false;
				data.properties
					.then((properties) => {
						resolvedProperties = properties || [];
						propertiesInitialized = true;
						if (properties && properties.length > 0) {
							propertyStore.init(properties);
						}
					})
					.catch((error) => {
						console.error('Failed to load properties:', error);
						resolvedProperties = [];
						propertiesInitialized = true; // Still mark as initialized even on error
					});
			} else {
				// Properties already resolved
				const props = (data.properties as Property[]) || [];
				resolvedProperties = props;
				propertiesInitialized = true;
				if (props.length > 0) {
					propertyStore.init(props);
				}
			}
		} else {
			// No properties data
			resolvedProperties = [];
			propertiesInitialized = true;
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

{#if isAuthRoute}
	<!-- Auth routes - minimal layout, just render the auth page -->
	<Toaster />
	{@render children()}
{:else}
	<!-- Regular app routes - full layout with sidebar -->
	<Toaster />
	{#if ready}
		{#if $page.url.pathname.startsWith('/utility-input')}
			<!-- Utility Input Routes - No Sidebar, Full Width -->
			<main class="w-full min-h-screen overflow-auto">
				<div class="w-full">
					{#if !propertiesInitialized}
						<!-- Loading state -->
						<div class="flex items-center justify-center h-[calc(100vh-120px)]">
							<div class="flex flex-col items-center space-y-4">
								<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
								<p class="text-sm text-muted-foreground">Loading...</p>
							</div>
						</div>
					{:else}
						<!-- App content for utility input routes -->
						{@render children()}
					{/if}
				</div>
			</main>
		{:else}
			<!-- Regular routes with sidebar -->
			<Sidebar.Provider>
				<div class="flex min-h-screen w-full overflow-hidden">
					<!-- Sidebar -->
					<Sidebar.Root collapsible="icon" class="shrink-0 z-20">
						<Sidebar.Header>
							<div class="p-4 font-bold text-lg">Dorm Management</div>
						</Sidebar.Header>

						<Sidebar.Content>
							{#each navigationLinks as group (group.category)}
								<Sidebar.Group>
									<Sidebar.GroupLabel onmouseover={() => onSectionHover(group.links)}>
										{group.category}
									</Sidebar.GroupLabel>
									<Sidebar.GroupContent>
										<Sidebar.Menu>
											{#each group.links as link (link.href)}
												<a
													href={link.href}
													class="block no-underline"
													data-sveltekit-preload-data="hover"
													data-sveltekit-preload-code="hover"
												>
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
											data-sveltekit-preload-data="off"
										>
											<LogOut class="w-4 h-4" />
											<span>Sign out</span>
										</a>
									</div>
								{:else}
									<a
										href="/auth"
										class="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
										data-sveltekit-preload-data="off"
									>
										<User class="w-4 h-4" />
										<span>Sign in</span>
									</a>
								{/if}
							</div>
						</Sidebar.Footer>
						<Sidebar.Rail />
					</Sidebar.Root>

					<!-- Flex container for Main Content + 3D Panel -->
					<div class="flex flex-1 min-w-0 flex-col h-screen">
						<!-- Header -->
						<div
							class="flex items-center justify-between p-4 md:p-6 border-b bg-background/95 backdrop-blur shrink-0"
						>
							<div class="flex items-center gap-4">
								<Sidebar.Trigger />

								{#if data.user}
									<div class="flex items-center gap-2">
										<PropertySelector />

										<!-- 3D Toggle Button moved here -->
										{#if $featureFlags.enable3DView}
											<Button
												variant={show3DModel ? "secondary" : "outline"}
												size="sm"
												class="flex items-center gap-2 ml-2 border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
												onclick={() => (show3DModel = !show3DModel)}
											>
												{#if show3DModel}
													<X class="w-4 h-4" />
													Close 3D
												{:else}
													<Box class="w-4 h-4" />
													3D View
												{/if}
											</Button>
										{/if}
									</div>
								{/if}
							</div>
						</div>

						<!-- Scrollable content area containing both Page and 3D Panel -->
						<div class="flex flex-1 overflow-hidden">
							<!-- Main Page Content -->
							<main class="flex-1 overflow-y-auto p-4 md:p-6">
								<div class="w-full max-w-[1600px] mx-auto">
									{#if !propertiesInitialized}
										<!-- Loading state -->
										<div class="flex items-center justify-center h-[50vh]">
											<div class="flex flex-col items-center space-y-4">
												<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
												<p class="text-sm text-muted-foreground">Loading...</p>
											</div>
										</div>
									{:else if resolvedProperties.length === 0 && $page.url.pathname !== '/'}
										<!-- No properties state -->
										<div class="flex flex-col items-center justify-center h-[50vh] text-center p-8">
											<Building class="h-16 w-16 text-muted-foreground mb-4" />
											<h2 class="text-2xl font-semibold mb-2">Welcome to Dorm Management</h2>
											<p class="text-muted-foreground mb-6 max-w-md">
												To get started, you'll need to add your first property.
											</p>
											<a
												href="/properties"
												class="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
											>
												<Building class="mr-2 h-4 w-4" />
												Add Your First Property
											</a>
										</div>
									{:else}
										{@render children()}
									{/if}
								</div>
							</main>

							<!-- 3D Panel (Slides in from Right) -->
							{#if data.user && $featureFlags.enable3DView}
								<div 
									class={cn(
										"border-l bg-background transition-all duration-300 ease-in-out overflow-hidden flex flex-col",
										show3DModel ? "w-[450px] opacity-100" : "w-0 opacity-0"
									)}
								>
									{#if show3DModel}
										<GlobalPropertyViewer />
									{/if}
								</div>
							{/if}
						</div>
					</div>
				</div>
			</Sidebar.Provider>
		{/if}

		<!-- Cache Debug Panel (Development Only) - Visible on all non-auth routes except utility-input -->
		{#if dev && !isAuthRoute && !$page.url.pathname.startsWith('/utility-input')}
			<CacheDebugPanel />
		{/if}
	{/if}
{/if}
