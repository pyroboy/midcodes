<script lang="ts">
	import { session, LOCATIONS, getCurrentLocation, ELEVATED_ROLES, ADMIN_ROLES } from '$lib/stores/session.svelte';
	import { MapPin, ShieldAlert, ArrowDownUp } from 'lucide-svelte';
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

	const accessLevel = $derived(
		ADMIN_ROLES.includes(session.role) ? 'Full Inventory Control' :
		session.role === 'manager' ? 'Branch Stock Control' : 'View Only'
	);

	const canChangeLocation = $derived(!session.isLocked && ELEVATED_ROLES.includes(session.role));
</script>

{#if canChangeLocation}
<div class={cn('sticky top-0 z-30 w-full border-b px-4 py-3 sm:px-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors', colors.bg, colors.border)}>
	<div class="flex items-start sm:items-center gap-3">
		<div class={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', colors.iconBg)}>
			<MapPin class={cn('h-5 w-5', colors.text)} />
		</div>
		<div>
			<div class="flex items-center gap-2">
				<p class="text-xs font-bold uppercase tracking-wider text-gray-500">You are viewing</p>
				{#if session.locationId === 'wh-tag'}
					<span class="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 uppercase tracking-widest">Warehouse</span>
				{:else if session.locationId === 'all'}
					<span class="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900 uppercase tracking-widest">Global</span>
				{:else}
					<span class="rounded bg-gray-500/10 px-1.5 py-0.5 text-[10px] font-bold text-gray-700 uppercase tracking-widest">Retail</span>
				{/if}
			</div>
			<h2 class={cn('text-lg font-black tracking-tight', colors.text)}>
				{currentLocation?.name?.toUpperCase() ?? 'UNKNOWN LOCATION'}
			</h2>
			<div class="mt-0.5 hidden items-center gap-3 sm:flex">
				<p class="flex items-center gap-1.5 text-xs font-medium text-gray-600">
					<span class="font-semibold text-gray-900 capitalize text-sm">Role: {session.role}</span>
				</p>
				<span class="text-gray-300">|</span>
				<p class="flex items-center gap-1.5 text-xs font-medium text-gray-600">
					<ShieldAlert class="h-3.5 w-3.5 opacity-70" />
					Access: {accessLevel}
				</p>
			</div>
		</div>
	</div>

	{#if canChangeLocation}
		<button
			onclick={() => isModalOpen = true}
			class="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95"
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
