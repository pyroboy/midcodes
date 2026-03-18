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
	import SyncIndicator from '$lib/components/sync/SyncIndicator.svelte';
	import { createRxStore } from '$lib/stores/rx.svelte';
	import GlobalPropertyViewer from '$lib/components/3d/GlobalPropertyViewer.svelte';
	import { featureFlags } from '$lib/stores/featureFlags';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import * as Accordion from '$lib/components/ui/accordion';

	// Import Lucide icons
	import {
		Building,
		Building2,
		Home,
		Layers,
		Gauge,
		Users,
		FileText,
		CreditCard,
		AlertTriangle,
		Zap,
		ArrowLeftRight,
		Receipt,
		PiggyBank,
		BarChart3,
		ClipboardList,
		LayoutDashboard,
		LogOut,
		User,
		Box,
		X,
		ChevronRight,
		Lightbulb,
		MapPin
	} from 'lucide-svelte';
	import NotificationBell from '$lib/components/notifications/NotificationBell.svelte';

	let { data, children }: { data: PageData; children: any } = $props();

	let ready = $state(false);
	let isAuthRoute = $state(false);
	let show3DModel = $state(false);
	let rxdbInitialized = false;

	onMount(() => {
		ready = true;
	});

	// Track auth route reactively — $effect doesn't run during SSR,
	// avoiding bits-ui Tabs setContext SSR crash on the auth page
	$effect(() => {
		isAuthRoute = $page.url.pathname.startsWith('/auth');
	});

	// Initialize RxDB reactively — triggers on login (including client-side goto from auth page)
	// Using $effect instead of onMount so it fires when data.user changes from null → user
	$effect(() => {
		if (!data.user || rxdbInitialized) return;
		rxdbInitialized = true;

		import('$lib/stores/sync-status.svelte').then(({ syncStatus }) => {
			syncStatus.setPhase('initializing');
			syncStatus.checkNeonHealth();
		});
		import('$lib/db').then(({ getDb }) => {
			import('$lib/stores/sync-status.svelte').then(({ syncStatus }) => {
				syncStatus.setRxdbHealth('checking', 'Opening RxDB...');
			});
			return getDb().then((db) => {
				import('$lib/stores/sync-status.svelte').then(({ syncStatus }) => {
					syncStatus.setRxdbHealth('ok', 'RxDB ready (IndexedDB)');
				});
				return import('$lib/db/replication').then(({ startSync }) => startSync(db));
			});
		}).catch(async (err) => {
			console.error('[RxDB] Init failed:', err);
			const { syncStatus } = await import('$lib/stores/sync-status.svelte');

			const isSchemaError = err?.code === 'DB6' ||
				err?.message?.includes('different schema') ||
				err?.message?.includes('Error code: DB6');

			if (isSchemaError) {
				syncStatus.addLog('Schema mismatch detected — auto-clearing IndexedDB...', 'warn');
				try {
					const dbs = await indexedDB.databases();
					for (const d of dbs) {
						if (d.name) indexedDB.deleteDatabase(d.name);
					}
					syncStatus.addLog('IndexedDB cleared — reloading...', 'info');
					location.reload();
					return;
				} catch (clearErr) {
					syncStatus.addLog(`Auto-clear failed: ${clearErr}`, 'error');
				}
			}

			syncStatus.setRxdbHealth('error', undefined, err);
		});
	});

	// Enhanced hover preloading for navigation sections
	function onSectionHover(sectionLinks: { href: string; label: string }[]) {
		// Preloading disabled due to SSR issues
		// sectionLinks.forEach((link) => {
		//   safePreloadData(link.href);
		// });
	}

	// Properties gate — RxDB is the source of truth (offline-first)
	const rxProperties = createRxStore<any>('properties',
		(db) => db.properties.find({ sort: [{ name: 'asc' }] })
	);
	let propertiesInitialized = $derived(rxProperties.initialized);
	let resolvedProperties = $derived(
		rxProperties.value.map((p: any) => ({ id: Number(p.id), name: p.name, address: p.address, type: p.type, status: p.status })) as Property[]
	);

	// Sync propertyStore when RxDB properties change
	$effect(() => {
		if (resolvedProperties.length > 0) {
			propertyStore.init(resolvedProperties);
		}
	});

	const locationLinks = [
		{ href: '/locations/properties', label: 'Properties', icon: Building2 },
		{ href: '/locations/units', label: 'Units', icon: Home },
		{ href: '/locations/floors', label: 'Floors', icon: Layers },
		{ href: '/locations/meters', label: 'Meters', icon: Gauge }
	];

	const navigationLinks = [
		{
			category: 'Rent Management',
			links: [
				{ href: '/tenants', label: 'Tenants', icon: Users },
				{ href: '/leases', label: 'Leases', icon: FileText },
				{ href: '/utility-billings', label: 'Utilities', icon: Zap },
				{ href: '/penalties', label: 'Penalties', icon: AlertTriangle }
			]
		},
		{
			category: 'Finance',
			links: [
				{ href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
				{ href: '/expenses', label: 'Expenses', icon: Receipt },
				{ href: '/budgets', label: 'Budgets', icon: PiggyBank }
			]
		},
		{
			category: 'Reports',
			links: [
				{ href: '/insights', label: 'Insights', icon: Lightbulb },
				{ href: '/reports', label: 'Monthly Reports', icon: BarChart3 },
				{ href: '/lease-report', label: 'Lease Reports', icon: ClipboardList }
			]
		}
	];

	// Auto-expand the category containing the current page
	let activeCategory = $derived.by(() => {
		const pathname = $page.url.pathname;
		if (pathname === '/') return ''; // Dashboard — don't expand any category
		const match = navigationLinks.find((group) =>
			group.links.some((link) => pathname.startsWith(link.href))
		);
		return match?.category ?? '';
	});
</script>

{#if isAuthRoute}
	<!-- Auth routes - minimal layout, just render the auth page -->
	<Toaster />
	{@render children()}
{:else}
	<!-- Regular app routes - full layout with sidebar -->
	<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-black focus:shadow-lg focus:rounded">
		Skip to content
	</a>
	<Toaster />
	{#if ready}
		{#if $page.url.pathname.startsWith('/utility-input')}
			<!-- Utility Input Routes - No Sidebar, Full Width -->
			<main id="main-content" class="w-full min-h-screen overflow-auto">
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
							<div class="px-4 py-5 flex items-center gap-3">
								<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
									<Building class="h-4 w-4" />
								</div>
								<div class="flex flex-col group-data-[collapsible=icon]:hidden">
									<span class="font-semibold text-sm leading-tight">Dorm</span>
									<span class="text-xs text-muted-foreground leading-tight">Management</span>
								</div>
							</div>
						</Sidebar.Header>

						<Sidebar.Content>
							<!-- Dashboard link (always visible, outside accordion) -->
							<Sidebar.Menu class="px-2 mb-1">
								<a
									href="/"
									class="block no-underline"
									data-sveltekit-preload-data="hover"
								>
									<Sidebar.MenuItem>
										<Sidebar.MenuButton
											class={cn(
												$page.url.pathname === '/' && "bg-accent text-accent-foreground"
											)}
										>
											<LayoutDashboard class="h-5 w-5" />
											<span>Dashboard</span>
										</Sidebar.MenuButton>
									</Sidebar.MenuItem>
								</a>
							</Sidebar.Menu>

							<!-- Locations section -->
							<Sidebar.Menu class="px-2 mb-1">
								<a
									href="/locations"
									class="block no-underline"
									data-sveltekit-preload-data="hover"
								>
									<Sidebar.MenuItem>
										<Sidebar.MenuButton
											class={cn(
												"transition-colors",
												$page.url.pathname.startsWith('/locations')
													? "bg-primary/10 text-primary font-medium"
													: "hover:bg-muted"
											)}
										>
											<MapPin class={cn(
												"h-5 w-5",
												$page.url.pathname.startsWith('/locations')
													? "text-primary"
													: "text-muted-foreground"
											)} />
											<span>Locations</span>
										</Sidebar.MenuButton>
									</Sidebar.MenuItem>
								</a>
								{#if $page.url.pathname.startsWith('/locations')}
									{#each locationLinks as link (link.href)}
										<a
											href={link.href}
											class="block no-underline"
											data-sveltekit-preload-data="hover"
										>
											<Sidebar.MenuItem>
												<Sidebar.MenuButton
													class={cn(
														"transition-colors pl-7",
														$page.url.pathname.startsWith(link.href)
															? "bg-primary/10 text-primary font-medium"
															: "hover:bg-muted"
													)}
												>
													<link.icon class={cn(
														"h-4 w-4",
														$page.url.pathname.startsWith(link.href)
															? "text-primary"
															: "text-muted-foreground"
													)} />
													<span>{link.label}</span>
												</Sidebar.MenuButton>
											</Sidebar.MenuItem>
										</a>
									{/each}
								{/if}
							</Sidebar.Menu>

							<div class="px-4 mb-2">
								<div class="border-t"></div>
							</div>

							<Accordion.Root type="single" value={activeCategory} class="w-full">
								{#each navigationLinks as group (group.category)}
									<Accordion.Item value={group.category} class="border-b-0">
										<Accordion.Trigger
											class="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:no-underline hover:text-foreground transition-colors"
											onmouseover={() => onSectionHover(group.links)}
										>
											{group.category}
										</Accordion.Trigger>
										<Accordion.Content class="pb-2 pt-0">
											<Sidebar.Menu class="px-2">
												{#each group.links as link (link.href)}
													<a
														href={link.href}
														class="block no-underline"
														data-sveltekit-preload-data="hover"
														data-sveltekit-preload-code="hover"
													>
														<Sidebar.MenuItem>
															<Sidebar.MenuButton
																class={cn(
																	"transition-colors",
																	$page.url.pathname.startsWith(link.href)
																		? "bg-primary/10 text-primary font-medium"
																		: "hover:bg-muted"
																)}
															>
																<link.icon class={cn(
																	"h-4 w-4",
																	$page.url.pathname.startsWith(link.href)
																		? "text-primary"
																		: "text-muted-foreground"
																)} />
																<span>{link.label}</span>
															</Sidebar.MenuButton>
														</Sidebar.MenuItem>
													</a>
												{/each}
											</Sidebar.Menu>
										</Accordion.Content>
									</Accordion.Item>
								{/each}
							</Accordion.Root>
						</Sidebar.Content>

						<Sidebar.Footer>
							<div class="border-t p-3">
								{#if data.session}
									<div class="flex items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors group/user">
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0">
											<User class="h-4 w-4" />
										</div>
										<div class="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
											<span class="text-sm font-medium truncate">{data.user?.email || 'Logged in'}</span>
											<div class="flex items-center gap-2">
												<SyncIndicator />
											</div>
										</div>
									</div>
									<a
										href="/auth/signout"
										class="flex items-center gap-2 rounded-lg px-2 py-2 mt-1 text-sm text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors group-data-[collapsible=icon]:justify-center"
										data-sveltekit-preload-data="off"
										data-sveltekit-reload
									>
										<LogOut class="h-4 w-4" />
										<span class="group-data-[collapsible=icon]:hidden">Sign out</span>
									</a>
								{:else}
									<a
										href="/auth"
										class="flex items-center gap-2 rounded-lg p-2 text-sm text-primary hover:bg-primary/10 transition-colors"
										data-sveltekit-preload-data="off"
									>
										<User class="h-4 w-4" />
										<span class="group-data-[collapsible=icon]:hidden">Sign in</span>
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
										<NotificationBell />

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
							<main id="main-content" class="flex-1 overflow-y-auto p-4 md:p-6">
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

	{/if}
{/if}
