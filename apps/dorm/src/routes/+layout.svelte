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
	import { browser } from '$app/environment';
	import { propertiesStore } from '$lib/stores/collections.svelte';
	// GlobalPropertyViewer removed — 3D View button now links to /property/[id]/floorplan
	import { featureFlags } from '$lib/stores/featureFlags';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import * as Accordion from '$lib/components/ui/accordion';
	import { onlineStatus } from '$lib/utils/offline.svelte';

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
		ChevronRight,
		Lightbulb,
		MapPin,
		WifiOff
	} from 'lucide-svelte';
	import NotificationBell from '$lib/components/notifications/NotificationBell.svelte';

	let { data, children }: { data: PageData; children: any } = $props();

	let ready = $state(false);
	let isAuthRoute = $state(false);
	// show3DModel removed — 3D View now links directly to floorplan page
	// Persist across HMR — plain `let` resets on hot reload, causing duplicate sync cycles
	let rxdbInitialized = (globalThis as any).__dorm_rxdb_initialized ?? false;

	onMount(() => {
		ready = true;
	});

	// Track auth route reactively — $effect doesn't run during SSR,
	// avoiding bits-ui Tabs setContext SSR crash on the auth page
	$effect(() => {
		isAuthRoute = $page.url.pathname.startsWith('/auth');
	});

	// F8: URL escape hatch — ?reset-db=1 clears all IndexedDB databases and reloads
	if (browser && new URL(location.href).searchParams.has('reset-db')) {
		indexedDB.databases().then(async (dbs) => {
			// Await each deletion — deleteDatabase is async via IDBOpenDBRequest
			await Promise.all(
				dbs.filter((d) => d.name).map((d) => new Promise<void>((resolve) => {
					const req = indexedDB.deleteDatabase(d.name!);
					req.onsuccess = () => resolve();
					req.onerror = () => resolve(); // proceed anyway
					req.onblocked = () => resolve();
				}))
			);
			sessionStorage.removeItem('__dorm_db_reset_v2');
			const url = new URL(location.href);
			url.searchParams.delete('reset-db');
			location.replace(url.toString());
		});
	}

	// F5: Multi-tab reset coordination — if another tab clears IndexedDB, reload this one
	const resetChannel = typeof BroadcastChannel !== 'undefined'
		? new BroadcastChannel('dorm-db-reset')
		: null;
	if (resetChannel) {
		resetChannel.onmessage = () => location.reload();
	}

	// Initialize RxDB reactively — triggers on login (including client-side goto from auth page)
	// Using $effect instead of onMount so it fires when data.user changes from null → user
	$effect(() => {
		if (!data.user || rxdbInitialized) return;
		rxdbInitialized = true;
		(globalThis as any).__dorm_rxdb_initialized = true;

		// Persist IndexedDB storage to prevent browser eviction
		navigator.storage?.persist?.().then((granted) => {
			if (!granted) console.warn('[Storage] Persistent storage not granted — data may be evicted');
		});

		// D4: syncStatus.checkNeonHealth() removed — replication.ts calls
		// syncStatus.setNeonHealthDirect() after its own preflight fetch, avoiding a duplicate round-trip.
		import('$lib/stores/sync-status.svelte').then(({ syncStatus }) => {
			syncStatus.setPhase('initializing');
			// Session separator with route for context
			const route = $page.url.pathname.split('/').filter(Boolean).slice(0, 2).join('/') || 'home';
			syncStatus.addLog(`─── Page load (${route}) ───`, 'info');
		});
		import('$lib/db').then(({ getDb }) => {
			import('$lib/stores/sync-status.svelte').then(({ syncStatus }) => {
				syncStatus.setRxdbHealth('checking');
			});
			const t0 = Date.now();
			// F4: Wrap getDb() with a 30-second timeout
			return Promise.race([
				getDb(),
				new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error('RxDB init timeout (30s)')), 30_000)
				)
			]).then((db) => {
				const initMs = Date.now() - t0;
				import('$lib/stores/sync-status.svelte').then(({ syncStatus }) => {
					syncStatus.setRxdbHealth('ok');
					syncStatus.addLog(`RxDB ready (${initMs}ms, ${Object.keys(db.collections).length} collections)`, 'success');
					// A2: Capture RxDB version
					import('rxdb').then(({ RXDB_VERSION }) => syncStatus.setVersionInfo(RXDB_VERSION)).catch(() => {});
					// F6: Clear reload-loop counter on successful init
					sessionStorage.removeItem('__dorm_db_reset_v2');

					// Log storage persistence only if NOT granted (warn-worthy)
					navigator.storage?.persisted?.().then((persisted) => {
						if (!persisted) syncStatus.addLog('Storage persistence not granted — data may be evicted', 'warn');
					});
				});
				const t1 = Date.now();
				return import('$lib/db/replication').then(({ startSync }) => startSync(db)).then(() => {
					const syncMs = Date.now() - t1;
					import('$lib/stores/sync-status.svelte').then(({ syncStatus }) => {
						syncStatus.addLog(`Sync completed in ${syncMs}ms`, 'success');

						// B2: Stale checkpoint auto-resync — check every 10 min
						// Guard against HMR creating duplicate intervals
						const STALE_CHECK_MS = 10 * 60 * 1000;
						if ((globalThis as any).__dorm_stale_interval) clearInterval((globalThis as any).__dorm_stale_interval);
						(globalThis as any).__dorm_stale_interval = setInterval(async () => {
							if (!navigator.onLine || document.visibilityState !== 'visible') return;
							const stale = syncStatus.getStaleCollections(STALE_CHECK_MS);
							if (stale.length === 0) return;
							syncStatus.addLog(`Auto-resyncing ${stale.length} stale collection(s)`, 'info');
							const { resyncCollection } = await import('$lib/db/replication');
							for (const name of stale) {
								resyncCollection(name).catch(() => {});
							}
						}, STALE_CHECK_MS);
					});
					// Post-sync: run client-side automation (overdue, penalties, reminders)
					import('$lib/db/client-automation').then(({ runClientAutomation }) => {
						runClientAutomation().then((auto) => {
							import('$lib/stores/sync-status.svelte').then(({ syncStatus }) => {
								const parts: string[] = [];
								if (auto.overdue.applied > 0) parts.push(`${auto.overdue.applied} overdue`);
								if (auto.penalties.applied > 0) parts.push(`${auto.penalties.applied} penalties`);
								if (auto.reminders.sent > 0) parts.push(`${auto.reminders.sent} reminders`);
								if (parts.length > 0) {
									syncStatus.addLog(`Automation: ${parts.join(', ')}`, 'success');
								} else if (auto.overdue.detected > 0 || auto.penalties.detected > 0 || auto.reminders.detected > 0) {
									syncStatus.addLog('Automation: all items already processed', 'info');
								}
								for (const err of auto.errors) {
									syncStatus.addLog(`Automation error: ${err}`, 'warn');
								}
							});
						}).catch((err) => {
							console.warn('[Automation] Failed:', err);
							import('$lib/stores/sync-status.svelte').then(({ syncStatus }) => {
								syncStatus.addLog(`Automation failed: ${err?.message || err}`, 'warn');
							});
						});
					});
					// Post-sync: prune old records and check storage usage
					import('$lib/db/pruning').then(({ pruneOldRecords }) => {
						pruneOldRecords().then((results) => {
							if (results.length > 0) {
								import('$lib/stores/sync-status.svelte').then(({ syncStatus }) => {
									for (const r of results) {
										syncStatus.addLog(`Pruned ${r.pruned} old ${r.collection} records`, 'info');
									}
								});
							} else {
								import('$lib/stores/sync-status.svelte').then(({ syncStatus }) => {
									syncStatus.addLog('Pruning: no stale records found', 'info');
								});
							}
						}).catch((err) => {
							console.warn('[Pruning] Failed:', err);
							import('$lib/stores/sync-status.svelte').then(({ syncStatus }) => {
								syncStatus.addLog(`Pruning failed: ${err?.message || err}`, 'warn');
							});
						});
					});
					// Use checkAndAutoPrune which handles toasts + log entries internally
					import('$lib/db/storage-monitor').then(({ checkAndAutoPrune }) => {
						checkAndAutoPrune().catch((err) => {
							console.warn('[Storage] Monitor failed:', err);
							import('$lib/stores/sync-status.svelte').then(({ syncStatus }) => {
								syncStatus.addLog(`Storage monitor failed: ${err?.message || err}`, 'warn');
							});
						});
					});
				});
			});
		}).catch(async (err) => {
			console.error('[RxDB] Init failed:', err);
			const { syncStatus } = await import('$lib/stores/sync-status.svelte');

			const isTimeout = err?.message?.includes('timeout');
			const isSchemaError = err?.code === 'DB6' || err?.code === 'SC36' ||
				err?.message?.includes('different schema') ||
				err?.message?.includes('Error code: DB6') ||
				err?.message?.includes('Error code: SC36');

			if (isTimeout) {
				syncStatus.addLog('RxDB init timed out after 30s — IndexedDB may be corrupted or locked', 'error');
				syncStatus.addLog('Recovery: try ?reset-db=1 or close other tabs', 'warn');
				syncStatus.setRxdbHealth('error', 'Init timeout (30s) — storage may be locked', err);
				return;
			}

			if (isSchemaError) {
				// F6: Reload-loop guard — stop after 2 consecutive failed resets
				const reloadCount = Number(sessionStorage.getItem('__dorm_db_reset_v2') || '0');
				syncStatus.addLog(`Schema error: ${err?.code || 'unknown'} — auto-clear attempt ${reloadCount + 1}/2`, 'warn');
				if (reloadCount >= 2) {
					syncStatus.addLog('Reload loop detected — manual recovery needed (?reset-db=1)', 'error');
					syncStatus.addLog('The auto-clear failed 2 times. Click "Clear Data" below or append ?reset-db=1 to URL.', 'error');
					syncStatus.setRxdbHealth('error', undefined, err);
					return;
				}
				sessionStorage.setItem('__dorm_db_reset_v2', String(reloadCount + 1));

				syncStatus.addLog('Schema mismatch detected — auto-clearing IndexedDB...', 'warn');
				try {
					const dbs = await indexedDB.databases();
					syncStatus.addLog(`Found ${dbs.length} IndexedDB database(s) to clear`, 'info');
					// Must await each deleteDatabase — it's async via IDBOpenDBRequest
					await Promise.all(
						dbs
							.filter((d) => d.name)
							.map((d) => new Promise<void>((resolve, reject) => {
								const req = indexedDB.deleteDatabase(d.name!);
								req.onsuccess = () => resolve();
								req.onerror = () => reject(req.error);
								req.onblocked = () => {
									console.warn(`[RxDB] deleteDatabase("${d.name}") blocked — another tab may have it open`);
									resolve(); // proceed anyway, reload will retry
								};
							}))
					);
					// F5: Notify other tabs that IndexedDB was cleared
					resetChannel?.postMessage('db-cleared');
					syncStatus.addLog('IndexedDB cleared — reloading...', 'info');
					location.reload();
					return;
				} catch (clearErr) {
					syncStatus.addLog(`Auto-clear failed: ${clearErr}`, 'error');
					syncStatus.addLog('Manual recovery: append ?reset-db=1 to URL', 'error');
				}
			} else {
				syncStatus.addLog(`Unexpected init error: ${err?.code || ''} ${err?.message?.slice(0, 150) || err}`, 'error');
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

	// F3: Properties gate — use singleton store so there is only one RxDB subscription
	let propertiesInitialized = $derived(propertiesStore.initialized);
	let resolvedProperties = $derived(
		propertiesStore.value.map((p: any) => ({ id: Number(p.id), name: p.name, address: p.address, type: p.type, status: p.status })) as Property[]
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
				{ href: '/payments', label: 'Payments', icon: CreditCard },
				{ href: '/payment-history', label: 'Payment History', icon: ArrowLeftRight },
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
	// Returns an array for type="multiple" accordion — always includes active category
	let activeCategories = $derived.by(() => {
		const pathname = $page.url.pathname;
		const allCategories = navigationLinks.map((g) => g.category);
		// On dashboard, expand all so mobile users see everything
		if (pathname === '/') return allCategories;
		const match = navigationLinks.find((group) =>
			group.links.some((link) => pathname.startsWith(link.href))
		);
		// Always expand all categories so mobile drawer isn't mostly empty
		return allCategories;
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
									aria-label="Dashboard"
								>
									<Sidebar.MenuItem>
										<Sidebar.MenuButton
											class={cn(
												$page.url.pathname === '/' && "bg-accent text-accent-foreground"
											)}
										>
											{#snippet tooltipContent()}
												Dashboard
											{/snippet}
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
									aria-label="Locations"
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
											{#snippet tooltipContent()}
												Locations
											{/snippet}
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
											aria-label={link.label}
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
													{#snippet tooltipContent()}
														{link.label}
													{/snippet}
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

							<Accordion.Root type="multiple" value={activeCategories} class="w-full">
								{#each navigationLinks as group (group.category)}
									<Accordion.Item value={group.category} class="border-b-0">
										<Accordion.Trigger
											class="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline hover:text-foreground transition-colors [&[data-state=open]>svg]:rotate-90"
											onmouseover={() => onSectionHover(group.links)}
										>
											<span class="flex items-center gap-1.5">
												<ChevronRight class="h-3 w-3 shrink-0 transition-transform duration-200" />
												{group.category}
											</span>
										</Accordion.Trigger>
										<Accordion.Content class="pb-2 pt-0">
											<Sidebar.Menu class="px-2">
												{#each group.links as link (link.href)}
													<a
														href={link.href}
														class="block no-underline"
														data-sveltekit-preload-data="hover"
														data-sveltekit-preload-code="hover"
														aria-label={link.label}
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
																{#snippet tooltipContent()}
																	{link.label}
																{/snippet}
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
										</div>
									</div>
									<a
										href="/auth/signout"
										class="flex items-center gap-2 rounded-lg px-2 py-2 mt-1 text-sm text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors group-data-[collapsible=icon]:justify-center"
										data-sveltekit-preload-data="off"
										data-sveltekit-reload
									aria-label="Sign out"
									>
										<LogOut class="h-4 w-4" />
										<span class="group-data-[collapsible=icon]:hidden">Sign out</span>
									</a>
								{:else}
									<a
										href="/auth"
										class="flex items-center gap-2 rounded-lg p-2 text-sm text-primary hover:bg-primary/10 transition-colors"
										data-sveltekit-preload-data="off"
									aria-label="Sign in"
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
										<!-- W11: Offline indicator -->
										{#if !onlineStatus.value}
											<div class="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md">
												<WifiOff class="w-3.5 h-3.5 text-red-500" />
												<span class="text-xs font-medium text-red-600 dark:text-red-400">Offline</span>
											</div>
										{/if}
										<PropertySelector />
										<NotificationBell />
										<SyncIndicator />

										<!-- 3D View link to floorplan -->
										{#if $featureFlags.enable3DView && $propertyStore.selectedPropertyId}
											<a
												href="/property/{$propertyStore.selectedPropertyId}/floorplan"
												class="inline-flex items-center gap-2 ml-2 px-3 py-1.5 text-sm font-medium rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
											>
												<Box class="w-4 h-4" />
												3D View
											</a>
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

							<!-- 3D Panel removed — now links to /property/[id]/floorplan -->
						</div>
					</div>
				</div>
			</Sidebar.Provider>
		{/if}

	{/if}
{/if}
