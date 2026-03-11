<script lang="ts">
	import {
		Sidebar,
		SidebarContent,
		SidebarFooter,
		SidebarGroup,
		SidebarGroupContent,
		SidebarHeader,
		SidebarMenu,
		SidebarMenuButton,
		SidebarMenuItem,
		SidebarRail,
		SidebarSeparator,
	} from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import {
		session,
		ROLE_NAV_ACCESS,
		LOCATIONS,
		getCurrentLocation,
		isWarehouseSession,
		clearSession,
	} from '$lib/stores/session.svelte';
	import {
		ShoppingCart,
		ChefHat,
		Package,
		BarChart3,
		Settings,
		LogOut,
		Receipt,
		Truck,
		Moon,
		Trash2,
		ClipboardCheck,
		FileText,
		ArrowLeftRight,
	} from 'lucide-svelte';
	import { ELEVATED_ROLES } from '$lib/stores/session.svelte';
	import { orders } from '$lib/stores/pos.svelte';
	import LocationSelectorModal from '$lib/components/stock/LocationSelectorModal.svelte';

	const allNavItems = [
		{ href: '/pos',     label: 'POS',     Icon: ShoppingCart },
		{ href: '/kitchen', label: 'Kitchen',  Icon: ChefHat      },
		{ href: '/stock',   label: 'Stock',    Icon: Package      },
		{ href: '/reports', label: 'Reports',  Icon: BarChart3    },
		{ href: '/admin',   label: 'Admin',    Icon: Settings     },
	];

	const RETAIL_ONLY = new Set(['/pos', '/kitchen']);

	const isWarehouse = $derived(
		LOCATIONS.find(l => l.id === session.locationId)?.type === 'warehouse'
	);

	const navItems = $derived.by(() => {
		const baseAccess = ROLE_NAV_ACCESS[session.role] ?? [];
		const accessSet = new Set(baseAccess);
		if (isWarehouseSession() && session.role === 'staff' && !accessSet.has('/stock')) {
			accessSet.add('/stock');
		}
		return allNavItems
			.filter(l => accessSet.has(l.href))
			.filter(l => !isWarehouse || !RETAIL_ONLY.has(l.href));
	});

	const currentLoc = $derived(getCurrentLocation());
	const tickerLocations = LOCATIONS.filter(l => l.id !== 'all');

	let clockTime = $state('');

	$effect(() => {
		function tick() {
			const now = new Date();
			clockTime = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
		}
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	});

	const roleClass = $derived(
		session.role === 'admin' || session.role === 'owner'
			? 'border-status-purple/30 bg-status-purple-light text-status-purple'
			: session.role === 'manager'
				? 'border-accent/30 bg-accent-light text-accent'
				: session.role === 'kitchen'
					? 'border-status-green/30 bg-status-green-light text-status-green'
					: 'border-gray-200 bg-gray-50 text-gray-500'
	);

	const sidebar = useSidebar();

	function isActive(href: string) {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}

	// ─── P1-15 / P2-17: Change Location confirmation state ───────────────────
	let showLocationConfirm = $state(false);
	let showLocationModal = $state(false);

	// Count open orders at current branch (P2-17)
	const openOrderCount = $derived(
		session.locationId === 'all'
			? 0
			: orders.value.filter(o =>
				o.locationId === session.locationId &&
				(o.status === 'open' || o.status === 'pending_payment')
			).length
	);

	function requestLocationChange() {
		showLocationConfirm = true;
	}

	function cancelLocationChange() {
		showLocationConfirm = false;
	}

	function confirmLocationSwitch() {
		showLocationConfirm = false;
		showLocationModal = true;
	}
</script>

<Sidebar collapsible="icon">
	<!-- Brand header -->
	<SidebarHeader>
		<div class="flex items-center gap-2 px-1 py-1">
			<button
				onclick={() => sidebar.toggle()}
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent hover:bg-accent-dark transition-colors cursor-pointer focus:outline-none"
				aria-label="Toggle sidebar"
			>
				<span class="text-xs font-extrabold text-white">W!</span>
			</button>
			<div class="flex flex-col group-data-[collapsible=icon]:hidden">
				<span class="text-sm font-extrabold tracking-tight text-gray-900 leading-tight">WTF! SAMGYUP</span>
				<span class="text-[10px] font-bold uppercase tracking-widest text-accent leading-tight">POS System</span>
			</div>
		</div>
		<!-- Location display (all users) + Clock -->
		<div class="px-2 pt-0.5 pb-1 group-data-[collapsible=icon]:hidden">
			{#if session.locationId === 'all'}
				<p class="text-[10px] font-bold uppercase tracking-widest text-gray-600 text-center">
					All Locations <span class="font-normal text-gray-400">({tickerLocations.length})</span>
				</p>
				<!-- Ticker box -->
				<div class="mt-1 mx-auto w-full overflow-hidden rounded border border-gray-100" style="height: 48px;">
					<div class="ticker-scroll">
						{#each [...tickerLocations, ...tickerLocations] as loc}
							<p class="text-center text-[10px] text-gray-400 leading-4 py-0.5">{loc.name}</p>
						{/each}
					</div>
				</div>
			{:else}
				<!-- P2-15: Use short name matching LocationBanner format -->
				<p class="text-xs font-semibold text-gray-700 truncate text-center">{currentLoc?.name ?? 'Unknown'}</p>
			{/if}
			<p class="mt-0.5 font-mono text-[11px] tracking-widest text-gray-400 text-center">{clockTime}</p>
		</div>
	</SidebarHeader>

	<SidebarSeparator />

	<!-- Quick Actions (manager / owner / admin only) -->
	{#if ELEVATED_ROLES.includes(session.role)}
		{@const quickActions = [
			{ href: '/stock/deliveries', label: 'Receive Delivery', Icon: Truck },
			{ href: '/reports/expenses-daily', label: 'Log Expense', Icon: Receipt },
			{ href: '/stock/waste', label: 'Log Waste', Icon: Trash2 },
			{ href: '/stock/counts', label: 'Stock Count', Icon: ClipboardCheck },
			{ href: '/reports/x-read', label: 'X-Reading', Icon: FileText },
			{ href: '/stock/transfers', label: 'Transfer Stock', Icon: ArrowLeftRight },
			{ href: '/reports/eod', label: 'End of Day', Icon: Moon },
		]}
		{@const isAllLocation = session.locationId === 'all'}
		<!-- P0-7: overflow-hidden prevents quick action elements from extending outside sidebar bounds -->
		<div class="px-2 py-1.5 group-data-[collapsible=icon]:px-1 overflow-hidden">
			<div class="mb-1.5 flex items-center justify-between group-data-[collapsible=icon]:hidden">
				<p class="px-1 text-[9px] font-bold uppercase tracking-widest text-gray-400">
					Quick Actions
				</p>
				{#if isAllLocation}
					<span class="rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100">Select branch</span>
				{/if}
			</div>
			<div class={cn('flex flex-col gap-1', isAllLocation && 'opacity-50 pointer-events-none')} title={isAllLocation ? 'Select a specific branch to use quick actions' : undefined}>
				{#each quickActions as qa}
					<a
						href="{qa.href}?action=open"
						title={isAllLocation ? 'Select a branch first' : qa.label}
						class={cn(
							'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
							isActive(qa.href)
								? 'bg-accent text-white'
								: 'border border-dashed border-gray-200 bg-white text-gray-600 hover:border-accent/40 hover:bg-accent-light hover:text-accent',
							'group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:rounded-md'
						)}
					>
						<qa.Icon class="h-4 w-4 shrink-0" />
						<!-- P1-18: Visible label in expanded mode; sr-only in collapsed mode -->
						<span class="group-data-[collapsible=icon]:sr-only">{qa.label}</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Primary navigation -->
	<SidebarContent>
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					{#each navItems as item}
						{@const active = isActive(item.href)}
						<SidebarMenuItem>
							<SidebarMenuButton
								isActive={active}
								class={cn(active && 'bg-accent-light !text-accent font-semibold')}
							>
								{#snippet tooltipContent()}{item.label}{/snippet}
								{#snippet child({ props })}
									<a href={item.href} {...props}>
										<item.Icon class="h-4 w-4 shrink-0" />
										<span>{item.label}</span>
									</a>
								{/snippet}
							</SidebarMenuButton>
						</SidebarMenuItem>
					{/each}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	</SidebarContent>

	<!-- Footer: location + user + logout -->
	<SidebarFooter>
		<SidebarSeparator />

		<!-- User info -->
		<div class="flex items-center gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
			<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-light text-sm font-semibold text-accent">
				{(session.userName || 'U').charAt(0).toUpperCase()}
			</div>
			<div class="flex flex-1 flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
				<span class="truncate text-sm font-medium text-gray-900 leading-tight">{session.userName || 'User'}</span>
				<span class={cn('mt-0.5 inline-flex w-fit items-center rounded-full border px-1.5 py-0 text-[10px] font-bold uppercase', roleClass)}>
					{session.role}
				</span>
			</div>
		</div>

		<!-- P1-15: Change Location button with confirmation (elevated roles only) -->
		{#if ELEVATED_ROLES.includes(session.role)}
			<div class="px-1 group-data-[collapsible=icon]:hidden">
				{#if showLocationConfirm}
					<!-- Inline confirmation panel -->
					<div class="rounded-lg border border-amber-200 bg-amber-50 p-3 flex flex-col gap-2">
						<p class="text-xs font-semibold text-amber-800 leading-snug">
							Switch location? This will change all data views to the new branch.
						</p>
						{#if openOrderCount > 0}
							<p class="text-xs text-amber-700">
								You have <strong>{openOrderCount}</strong> open {openOrderCount === 1 ? 'table' : 'tables'} at this branch.
							</p>
						{/if}
						<div class="flex gap-2 mt-1">
							<button
								onclick={confirmLocationSwitch}
								class="flex-1 rounded-md bg-amber-600 px-2 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors"
							>
								Switch Anyway
							</button>
							<button
								onclick={cancelLocationChange}
								class="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
							>
								Cancel
							</button>
						</div>
					</div>
				{:else}
					<button
						onclick={requestLocationChange}
						class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors border border-dashed border-gray-200"
					>
						<ArrowLeftRight class="h-3.5 w-3.5 shrink-0" />
						<span>Change Location</span>
					</button>
				{/if}
			</div>
		{/if}

		<!-- Logout -->
		<div class="px-1 group-data-[collapsible=icon]:px-0">
			<a
				href="/"
				onclick={() => clearSession()}
				class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0"
				title="Logout"
			>
				<LogOut class="h-4 w-4 shrink-0" />
				<span class="group-data-[collapsible=icon]:hidden">Logout</span>
			</a>
		</div>
	</SidebarFooter>

	<SidebarRail />
</Sidebar>

{#if showLocationModal}
	<LocationSelectorModal onClose={() => (showLocationModal = false)} />
{/if}

<style>
	@keyframes ticker-up {
		0%   { transform: translateY(0); }
		100% { transform: translateY(-50%); }
	}
	.ticker-scroll {
		animation: ticker-up 12s linear infinite;
	}
</style>
