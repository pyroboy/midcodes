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
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import {
		session,
		ROLE_NAV_ACCESS,
		LOCATIONS,
		getCurrentLocation,
		clearSession,
	} from '$lib/stores/session.svelte';
	import {
		ShoppingCart,
		ChefHat,
		Package,
		BarChart3,
		Settings,
		LogOut,
	} from 'lucide-svelte';

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

	const navItems = $derived(
		allNavItems
			.filter(l => ROLE_NAV_ACCESS[session.role]?.includes(l.href))
			.filter(l => !isWarehouse || !RETAIL_ONLY.has(l.href))
	);

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

	function isActive(href: string) {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

<Sidebar collapsible="icon">
	<!-- Brand header -->
	<SidebarHeader>
		<div class="flex items-center gap-2 px-1 py-1">
			<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent">
				<span class="text-xs font-extrabold text-white">W!</span>
			</div>
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
				<p class="text-xs font-semibold text-gray-700 truncate text-center">{currentLoc?.name ?? 'Unknown'}</p>
			{/if}
			<p class="mt-0.5 font-mono text-[11px] tracking-widest text-gray-400 text-center">{clockTime}</p>
		</div>
	</SidebarHeader>

	<SidebarSeparator />

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

<style>
	@keyframes ticker-up {
		0%   { transform: translateY(0); }
		100% { transform: translateY(-50%); }
	}
	.ticker-scroll {
		animation: ticker-up 12s linear infinite;
	}
</style>
