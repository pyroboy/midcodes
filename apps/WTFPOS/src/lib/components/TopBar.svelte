<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import { session, LOCATIONS, ELEVATED_ROLES, ROLE_NAV_ACCESS, getCurrentLocation } from '$lib/stores/session.svelte';
	import type { LocationId } from '$lib/stores/session.svelte';
	import HardwareStatus from '$lib/components/HardwareStatus.svelte';
	import NoSaleModal from '$lib/components/NoSaleModal.svelte';
	import { ScanBarcode, MapPin, ChevronDown } from 'lucide-svelte';
	import { APP_VERSION, BUILD_DATE } from '$lib/version';
	import { format } from 'date-fns';

	let isNoSaleOpen = $state(false);
	let locationDropdownOpen = $state(false);

	const canSeeLocations = $derived(!session.isLocked && ELEVATED_ROLES.includes(session.role));
	const isWarehouse     = $derived(LOCATIONS.find(l => l.id === session.locationId)?.type === 'warehouse');
	const currentLoc      = $derived(getCurrentLocation());

	const switchableLocations = $derived(
		LOCATIONS.filter(l => l.id !== 'all' || ELEVATED_ROLES.includes(session.role))
	);

	/** Color scheme per location */
	const LOCATION_COLORS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
		'qc':    { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    border: 'border-blue-200' },
		'mkti':  { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-500',  border: 'border-violet-200' },
		'wh-qc': { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   border: 'border-amber-200' },
		'all':   { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
	};

	const locColors = $derived(LOCATION_COLORS[session.locationId] ?? LOCATION_COLORS['qc']);

	function selectLocation(id: LocationId) {
		session.locationId = id;
		locationDropdownOpen = false;
	}

	const allNavLinks = [
		{ href: '/pos',     label: 'POS',     icon: '💻' },
		{ href: '/kitchen', label: 'Kitchen', icon: '🍳' },
		{ href: '/stock',   label: 'Stock',   icon: '📦' },
		{ href: '/reports', label: 'Reports', icon: '📊' },
		{ href: '/admin',   label: 'Admin',   icon: '⚙️' }
	];

	/** Floor and Kitchen are retail-only — hidden when in a warehouse location */
	const RETAIL_ONLY = new Set(['/pos', '/kitchen']);

	const navLinks = $derived(
		allNavLinks
			.filter(l => ROLE_NAV_ACCESS[session.role]?.includes(l.href))
			.filter(l => !isWarehouse || !RETAIL_ONLY.has(l.href))
	);

	function isActive(href: string) {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	}

	const roleClass = $derived(
		session.role === 'admin' || session.role === 'owner'
			? 'border-status-purple/30 bg-status-purple-light text-status-purple'
			: session.role === 'manager'
				? 'border-accent/30 bg-accent-light text-accent'
				: session.role === 'kitchen'
					? 'border-status-green/30 bg-status-green-light text-status-green'
					: 'border-gray-200 bg-gray-50 text-gray-500'
	);
</script>

<header class="topbar shrink-0">
	<!-- Brand -->
	<div class="flex shrink-0 items-center gap-2">
		<span class="text-base font-extrabold tracking-tight text-gray-900">WTF! SAMGYUP</span>
		<span class="inline-flex h-5 items-center rounded-full bg-accent px-2 text-[10px] font-bold uppercase tracking-wide text-white">
			POS
		</span>
		<span
			class="hidden sm:inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-mono text-gray-400 cursor-default"
			title="v{APP_VERSION} — Built {format(new Date(BUILD_DATE), 'MMM d, yyyy h:mm a')}"
		>
			v{APP_VERSION}
		</span>
	</div>

	<!-- Center primary nav -->
	<nav class="flex flex-1 items-center justify-center gap-0.5">
		{#each navLinks as link}
			{@const active = isActive(link.href)}
			<a
				href={link.href}
				class={cn(
					'flex items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors no-select',
					active
						? 'bg-accent-light text-accent'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
				)}
				style="min-height:36px"
			>
				<span class="text-sm leading-none">{link.icon}</span>
				{link.label}
			</a>
		{/each}
	</nav>

	<!-- Right: location select + warehouse badge + role badge + user + logout -->
	<div class="flex shrink-0 items-center gap-3">
		<!-- Location indicator -->
		<div class="relative">
			{#if canSeeLocations}
				<button
					onclick={() => { locationDropdownOpen = !locationDropdownOpen; }}
					class={cn(
						'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
						locColors.bg, locColors.text, locColors.border,
						'hover:brightness-95'
					)}
					style="min-height:unset"
				>
					<MapPin class="w-3.5 h-3.5 flex-shrink-0" />
					<span class="hidden sm:inline">{currentLoc?.name ?? 'Unknown'}</span>
					<span class="sm:hidden">{session.locationId === 'wh-qc' ? 'WH' : session.locationId.toUpperCase()}</span>
					<ChevronDown class="w-3 h-3 opacity-60" />
				</button>
			{:else}
				<span class={cn(
					'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
					locColors.bg, locColors.text, locColors.border
				)}
				style="min-height:unset"
				>
					<MapPin class="w-3.5 h-3.5 flex-shrink-0" />
					<span class="hidden sm:inline">{currentLoc?.name ?? 'Unknown'}</span>
					<span class="sm:hidden">{session.locationId === 'wh-qc' ? 'WH' : session.locationId.toUpperCase()}</span>
				</span>
			{/if}

			{#if locationDropdownOpen}
				<button
					class="fixed inset-0 z-40"
					onclick={() => { locationDropdownOpen = false; }}
					aria-label="Close location picker"
				></button>
				<div class="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-lg border border-border bg-white shadow-lg overflow-hidden">
					{#each switchableLocations as loc}
						{@const isActiveLoc = loc.id === session.locationId}
						{@const lc = LOCATION_COLORS[loc.id] ?? LOCATION_COLORS['qc']}
						<button
							onclick={() => selectLocation(loc.id)}
							class={cn(
								'flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors',
								isActiveLoc ? cn(lc.bg, 'font-semibold', lc.text) : 'text-gray-700 hover:bg-gray-50'
							)}
						>
							<span class={cn('flex h-2 w-2 rounded-full flex-shrink-0', isActiveLoc ? lc.dot : 'bg-gray-300')}></span>
							<span class="flex-1">{loc.name}</span>
							{#if isActiveLoc}
								<span class="text-[10px] font-bold uppercase tracking-wider opacity-60">Current</span>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<span class={cn('hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase', roleClass)}>
			{session.role}
		</span>

		<div class="flex items-center gap-1.5">
			<span class="flex h-7 w-7 items-center justify-center rounded-full bg-accent-light text-sm font-semibold text-accent">
				{(session.userName || 'U').charAt(0).toUpperCase()}
			</span>
			<span class="hidden text-sm font-medium text-gray-700 md:inline">{session.userName || 'User'}</span>
		</div>
		
		<div class="flex items-center gap-1.5 border-l border-gray-200 pl-3 ml-1">
			<!-- Hardware / Device Tools -->
			<button class="p-2 rounded-full hover:bg-gray-100 transition-colors hidden sm:block" title="Barcode Scanner (Keyboard listener active)">
				<ScanBarcode class="w-5 h-5 text-gray-400" />
			</button>
			
			<HardwareStatus />

			<!-- No Sale Button -->
			<button 
				onclick={() => { isNoSaleOpen = true; }}
				class="hidden sm:flex h-8 items-center justify-center rounded bg-gray-100 px-3 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-200"
			>
				No Sale
			</button>
		</div>

		<a href="/" class="flex items-center rounded-md border border-border px-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors ml-2" style="min-height:32px">
			Logout
		</a>
	</div>
</header>

<NoSaleModal isOpen={isNoSaleOpen} onClose={() => { isNoSaleOpen = false; }} />
