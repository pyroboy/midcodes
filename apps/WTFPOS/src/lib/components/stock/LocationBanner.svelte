<script lang="ts">
	import { page } from '$app/state';
	import { session, LOCATIONS, getCurrentLocation, ELEVATED_ROLES, ADMIN_ROLES } from '$lib/stores/session.svelte';
	import { MapPin, ArrowDownUp } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import LocationSelectorModal from './LocationSelectorModal.svelte';

	let isModalOpen = $state(false);

	const currentLocation = $derived(getCurrentLocation());

	const BANNER_COLORS: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
		'tag':    { bg: 'bg-blue-50',     border: 'border-blue-200',    text: 'text-blue-900',    iconBg: 'bg-blue-100/50' },
		'pgl':    { bg: 'bg-violet-50',   border: 'border-violet-200',  text: 'text-violet-900',  iconBg: 'bg-violet-100/50' },
		'wh-tag': { bg: 'bg-amber-50',    border: 'border-amber-200',   text: 'text-amber-900',   iconBg: 'bg-amber-100/50' },
		'all':    { bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-900', iconBg: 'bg-emerald-100/50' },
	};

	const colors = $derived(BANNER_COLORS[session.locationId] ?? BANNER_COLORS['tag']);

	const currentSection = $derived(page.url.pathname.split('/')[1] || '');

	const accessLevel = $derived.by(() => {
		const role = session.role;
		if (ADMIN_ROLES.includes(role)) return 'Full Control';
		if (role === 'manager') return 'Branch Control';
		if (role === 'staff' && currentSection === 'pos') return 'Cashier';
		if (role === 'kitchen' && currentSection === 'kitchen') return 'Kitchen Ops';
		if (role === 'kitchen' && currentSection === 'stock') return 'View Only';
		return 'View Only';
	});

	// Elevated roles can change location; locked roles (staff, kitchen) only see the banner read-only (P1-14)
	const canChangeLocation = $derived(!session.isLocked && ELEVATED_ROLES.includes(session.role));

	const locationTypeLabel = $derived(
		session.locationId === 'wh-tag' ? 'Warehouse' :
		session.locationId === 'all' ? 'Global' : 'Retail'
	);

	const locationTypeBadgeClass = $derived(
		session.locationId === 'wh-tag' ? 'bg-amber-500/20 text-amber-900' :
		session.locationId === 'all' ? 'bg-emerald-500/20 text-emerald-900' :
		'bg-gray-500/10 text-gray-700'
	);

	// Show banner to ALL authenticated users — only show Change Location button to elevated roles
	const isAuthenticated = $derived(!!session.userName);
</script>

{#if isAuthenticated}
<div class={cn('location-banner-compact sticky top-0 z-30 w-full border-b px-4 py-2 sm:px-6 shadow-sm flex items-center justify-between gap-3 transition-colors', colors.bg, colors.border)}>
	<div class="flex items-center gap-2.5">
		<MapPin class={cn('h-4 w-4 shrink-0', colors.text)} />
		<h2 class={cn('text-base font-black tracking-tight', colors.text)}>
			{currentLocation?.name?.toUpperCase() ?? 'UNKNOWN LOCATION'}
		</h2>
	</div>

	{#if canChangeLocation}
	<button
		data-testid="location-change-btn"
		onclick={() => isModalOpen = true}
		class="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95"
	>
		<ArrowDownUp class="h-4 w-4" />
		Change Location
	</button>
	{/if}
</div>

{#if isModalOpen}
	<LocationSelectorModal onClose={() => isModalOpen = false} />
{/if}
{/if}
