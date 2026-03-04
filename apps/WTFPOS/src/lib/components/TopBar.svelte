<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import { session, LOCATIONS, ELEVATED_ROLES, ROLE_NAV_ACCESS } from '$lib/stores/session.svelte';
	import HardwareStatus from '$lib/components/HardwareStatus.svelte';
	import NoSaleModal from '$lib/components/NoSaleModal.svelte';
	import { ScanBarcode } from 'lucide-svelte';

	let isNoSaleOpen = $state(false);

	const canSeeLocations = $derived(!session.isLocked && ELEVATED_ROLES.includes(session.role));
	const isWarehouse     = $derived(LOCATIONS.find(l => l.id === session.locationId)?.type === 'warehouse');

	const retailLocations    = $derived(LOCATIONS.filter(l => l.type === 'retail'));
	const warehouseLocations = $derived(LOCATIONS.filter(l => l.type === 'warehouse'));

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
		{#if canSeeLocations}
			<select
				bind:value={session.locationId}
				class="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-gray-700 outline-none focus:border-accent transition-all"
				style="min-height:unset"
			>
				<optgroup label="Retail">
					{#each retailLocations as loc}
						<option value={loc.id}>{loc.name}</option>
					{/each}
				</optgroup>
				{#if warehouseLocations.length > 0}
					<optgroup label="Warehouse">
						{#each warehouseLocations as loc}
							<option value={loc.id}>{loc.name}</option>
						{/each}
					</optgroup>
				{/if}
			</select>
		{/if}

		{#if isWarehouse}
			<span class="hidden sm:inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
				📦 Warehouse
			</span>
		{/if}

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
