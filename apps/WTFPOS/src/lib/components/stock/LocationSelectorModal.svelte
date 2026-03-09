<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { session, LOCATIONS, type LocationId, ADMIN_ROLES, ELEVATED_ROLES, setLocation } from '$lib/stores/session.svelte';
	import { MapPin, CheckCircle, Package, AlertCircle, Lock, Globe } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	let { onClose }: { onClose: () => void } = $props();

	// In a real app, these values would come from a store or API
	const MOCK_STATS: Record<string, { activeStaff: number; alerts: number }> = {
		'tag': { activeStaff: 3, alerts: 1 },
		'pgl': { activeStaff: 2, alerts: 0 },
		'wh-tag': { activeStaff: 1, alerts: 0 },
		'all': { activeStaff: 0, alerts: 0 }
	};

	const retailBranches = $derived(LOCATIONS.filter(l => l.type === 'retail' && l.id !== 'all'));
	const warehouses     = $derived(LOCATIONS.filter(l => l.type === 'warehouse'));
	const allLocation    = $derived(LOCATIONS.find(l => l.id === 'all'));

	const canAccessWarehouse  = $derived(ADMIN_ROLES.includes(session.role));
	const canAccessAllBranches = $derived(ELEVATED_ROLES.includes(session.role));

	function selectLocation(id: LocationId) {
		if (id === 'wh-tag' && !canAccessWarehouse) return; // Guardrail
		setLocation(id);
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" transition:fade={{ duration: 150 }}>
	<button 
		class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
		onclick={onClose}
		aria-label="Close modal"
	></button>

	<div 
		class="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
		transition:fly={{ y: 20, duration: 250 }}
	>
		<!-- Header -->
		<div class="border-b px-6 py-5 bg-gray-50 flex items-center justify-between">
			<div>
				<h2 class="text-xl font-black text-gray-900 tracking-tight">Select Your Work Location</h2>
				<p class="text-sm text-gray-500 mt-1">Changing location updates your active inventory context.</p>
			</div>
			<button 
				class="rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-900 transition-colors"
				onclick={onClose}
			>
				<span class="sr-only">Close</span>
				<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
				</svg>
			</button>
		</div>

		<!-- Body -->
		<div class="p-6 overflow-y-auto max-h-[70vh]">
			
			<div class="mb-4 flex items-center gap-2">
				<MapPin class="h-5 w-5 text-gray-400" />
				<h3 class="text-sm font-bold uppercase tracking-widest text-gray-500">Retail Branches</h3>
			</div>
			
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
				{#each retailBranches as branch}
					{@const isActive = session.locationId === branch.id}
					{@const stats = MOCK_STATS[branch.id]}
					
					<button 
						onclick={() => selectLocation(branch.id)}
						class={cn(
							'relative flex flex-col text-left rounded-xl border p-5 transition-all text-gray-900',
							isActive 
								? 'border-accent bg-accent/5 ring-1 ring-accent' 
								: 'border-gray-200 hover:border-gray-400 hover:shadow-md'
						)}
					>
						<div class="mb-4 flex items-center justify-between">
							<div class={cn('flex h-10 w-10 items-center justify-center rounded-lg', isActive ? 'bg-accent text-white' : 'bg-gray-100 text-gray-500')}>
								<MapPin class="h-5 w-5" />
							</div>
							{#if isActive}
								<span class="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
									<CheckCircle class="h-3 w-3" /> Current
								</span>
							{/if}
						</div>
						
						<h4 class="text-lg font-black tracking-tight">{branch.name}</h4>
						
						<hr class="my-4 border-gray-100" />
						
						<div class="space-y-2 text-sm">
							<div class="flex items-center justify-between text-gray-600">
								<span>Active Staff</span>
								<span class="font-bold">{stats.activeStaff}</span>
							</div>
							<div class="flex items-center justify-between text-gray-600">
								<span>Stock Alerts</span>
								<span class={cn('font-bold flex items-center gap-1', stats.alerts > 0 ? 'text-status-red' : 'text-status-green')}>
									{stats.alerts > 0 ? stats.alerts : '0'} 
									{#if stats.alerts > 0}
										<AlertCircle class="h-3.5 w-3.5" />
									{:else}
										<CheckCircle class="h-3.5 w-3.5" />
									{/if}
								</span>
							</div>
						</div>
					</button>
				{/each}
			</div>

			{#if canAccessAllBranches && allLocation}
				<div class="mb-4 flex items-center gap-2">
					<Globe class="h-5 w-5 text-gray-400" />
					<h3 class="text-sm font-bold uppercase tracking-widest text-gray-500">Cross-Branch</h3>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
					<button
						onclick={() => selectLocation('all')}
						class={cn(
							'relative flex flex-col text-left rounded-xl border p-5 transition-all text-gray-900',
							session.locationId === 'all'
								? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500'
								: 'border-gray-200 hover:border-purple-300 hover:shadow-md'
						)}
					>
						<div class="mb-4 flex items-center justify-between">
							<div class={cn('flex h-10 w-10 items-center justify-center rounded-lg', session.locationId === 'all' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-500')}>
								<Globe class="h-5 w-5" />
							</div>
							{#if session.locationId === 'all'}
								<span class="inline-flex items-center gap-1.5 rounded-full bg-purple-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
									<CheckCircle class="h-3 w-3" /> Current
								</span>
							{/if}
						</div>

						<h4 class="text-lg font-black tracking-tight">{allLocation.name}</h4>

						<hr class="my-4 border-gray-100" />

						<div class="space-y-2 text-sm text-gray-600">
							<p><strong>View:</strong> Aggregate across all branches</p>
							<p><strong>Access:</strong> Reports & Comparisons</p>
						</div>
					</button>
				</div>
			{/if}

			<div class="mb-4 flex items-center gap-2">
				<Package class="h-5 w-5 text-gray-400" />
				<h3 class="text-sm font-bold uppercase tracking-widest text-gray-500">Warehouse</h3>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{#each warehouses as wh}
					{@const isActive = session.locationId === wh.id}
					{@const disabled = !canAccessWarehouse}
					
					<button 
						onclick={() => !disabled && selectLocation(wh.id)}
						disabled={disabled}
						class={cn(
							'relative flex flex-col text-left rounded-xl border p-5 transition-all text-gray-900',
							isActive 
								? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' 
								: disabled
									? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
									: 'border-gray-200 hover:border-amber-300 hover:shadow-md'
						)}
					>
						{#if disabled}
							<div class="absolute right-4 top-4">
								<Lock class="h-4 w-4 text-gray-400" />
							</div>
						{/if}
						<div class="mb-4 flex items-center justify-between">
							<div class={cn('flex h-10 w-10 items-center justify-center rounded-lg', isActive ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500')}>
								<Package class="h-5 w-5" />
							</div>
							{#if isActive}
								<span class="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
									<CheckCircle class="h-3 w-3" /> Current
								</span>
							{/if}
						</div>
						
						<h4 class="text-lg font-black tracking-tight">{wh.name}</h4>
						
						<hr class="my-4 border-gray-100" />
						
						<div class="space-y-2 text-sm text-gray-600">
							<p><strong>View:</strong> All Branches</p>
							<p><strong>Access:</strong> Full Inventory Control</p>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>
