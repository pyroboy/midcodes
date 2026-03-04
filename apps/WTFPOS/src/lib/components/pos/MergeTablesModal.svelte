<script lang="ts">
	import { tables as allTables, orders, mergeTables } from '$lib/stores/pos.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { cn } from '$lib/utils';
	import type { Table } from '$lib/types';

	let {
		primaryTable,
		onclose,
		onmerge
	}: {
		primaryTable: Table;
		onclose: () => void;
		onmerge: (targetTableId: string) => void;
	} = $props();

	const MANAGER_PIN = '1234';

	let step = $state<'select' | 'confirm' | 'pin'>('select');
	let selectedTargetId = $state<string | null>(null);
	let pin = $state('');
	let pinError = $state(false);
	let mergeError = $state<string | null>(null);

	// Target table derived state (for use in template)
	const targetTable = $derived(
		selectedTargetId ? allTables.find(t => t.id === selectedTargetId) : null
	);

	// Get primary table's order
	const primaryOrder = $derived(
		primaryTable.currentOrderId 
			? orders.find(o => o.id === primaryTable.currentOrderId)
			: null
	);

	// Get other occupied tables at the same location
	const mergeableTables = $derived(
		allTables.filter(t => 
			t.status === 'occupied' &&
			t.locationId === primaryTable.locationId &&
			t.id !== primaryTable.id &&
			t.currentOrderId !== null
		)
	);

	// Get target table's order
	const targetOrder = $derived(
		selectedTargetId 
			? orders.find(o => o.id === allTables.find(t => t.id === selectedTargetId)?.currentOrderId)
			: null
	);

	// Check if tables have different packages
	const packageConflict = $derived.by(() => {
		if (!primaryOrder?.packageId || !targetOrder?.packageId) return false;
		return primaryOrder.packageId !== targetOrder.packageId;
	});

	function selectTarget(tableId: string) {
		selectedTargetId = tableId;
		mergeError = null;
		
		// Check for package conflict
		if (packageConflict) {
			step = 'confirm';
		} else {
			step = 'pin';
		}
		pin = '';
		pinError = false;
	}

	function confirmPackageMerge() {
		step = 'pin';
		pin = '';
		pinError = false;
	}

	function confirmMerge() {
		if (pin !== MANAGER_PIN) {
			pinError = true;
			return;
		}
		if (!selectedTargetId) return;
		
		const result = mergeTables(primaryTable.id, selectedTargetId);
		if (result.success) {
			onmerge(selectedTargetId);
		} else {
			mergeError = result.error ?? 'Merge failed';
			step = 'select';
			selectedTargetId = null;
		}
	}

	function getPackageName(table: Table): string {
		const order = table.currentOrderId ? orders.find(o => o.id === table.currentOrderId) : null;
		return order?.packageName ?? 'No Package';
	}

	function getPax(table: Table): number {
		const order = table.currentOrderId ? orders.find(o => o.id === table.currentOrderId) : null;
		return order?.pax ?? table.capacity;
	}
</script>

<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
	<div class="pos-card w-[480px] flex flex-col gap-4">
		{#if step === 'select'}
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-bold text-gray-900">➕ Merge Tables</h3>
				<button onclick={onclose} class="text-gray-400 hover:text-gray-600" style="min-height: unset">✕</button>
			</div>
			<p class="text-sm text-gray-500">
				Select another occupied table to merge with <strong>{primaryTable.label}</strong>.
				The items from both tables will be combined into one bill.
			</p>

			{#if mergeError}
				<div class="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
					⚠️ {mergeError}
				</div>
			{/if}

			{#if mergeableTables.length === 0}
				<div class="flex flex-col items-center gap-2 py-8 text-center">
					<span class="text-3xl">😕</span>
					<span class="text-sm font-semibold text-gray-600">No tables available to merge</span>
					<span class="text-xs text-gray-400">All other tables in this location are available or don't have active orders.</span>
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-3">
					{#each mergeableTables as table (table.id)}
						<button
							onclick={() => selectTarget(table.id)}
							class="flex flex-col items-start gap-1 rounded-xl border-2 border-gray-300 bg-white p-4 text-left transition-all hover:border-accent hover:bg-accent-light active:scale-95"
							style="min-height: 80px"
						>
							<div class="flex items-center justify-between w-full">
								<span class="text-base font-extrabold text-gray-900">{table.label}</span>
								<span class="text-[10px] text-gray-400">{getPax(table)}p</span>
							</div>
							<span class="text-xs text-gray-500 truncate w-full">{getPackageName(table)}</span>
						</button>
					{/each}
				</div>
			{/if}

			<button class="btn-ghost w-full" onclick={onclose}>Cancel</button>

		{:else if step === 'confirm'}
			<!-- Package Conflict Confirmation -->
			<div class="flex flex-col gap-3">
				<h3 class="text-lg font-bold text-gray-900">⚠️ Different Packages</h3>
				<p class="text-sm text-gray-600">
					These tables have different packages. Merging will combine all items but may require price adjustments.
				</p>
				
				<div class="flex gap-3 rounded-lg bg-gray-50 p-3">
					<div class="flex-1">
						<span class="text-xs font-semibold text-gray-500">{primaryTable.label}</span>
						<p class="text-sm font-medium text-gray-900">{primaryOrder?.packageName ?? 'No Package'}</p>
						<p class="text-xs text-gray-500">{primaryOrder?.pax ?? 0} pax</p>
					</div>
					<div class="flex items-center">
						<span class="text-lg">➕</span>
					</div>
				<div class="flex-1">
					<span class="text-xs font-semibold text-gray-500">{targetTable?.label}</span>
					<p class="text-sm font-medium text-gray-900">{targetOrder?.packageName ?? 'No Package'}</p>
					<p class="text-xs text-gray-500">{targetOrder?.pax ?? 0} pax</p>
				</div>
				</div>

				<div class="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
					💡 <strong>Note:</strong> After merging, you may need to adjust the package or pricing manually.
				</div>

				<div class="flex gap-2">
					<button class="btn-ghost flex-1" onclick={() => { step = 'select'; selectedTargetId = null; }} style="min-height: 44px">← Back</button>
					<button class="btn-primary flex-1" onclick={confirmPackageMerge} style="min-height: 44px">Continue →</button>
				</div>
			</div>

		{:else}
			<!-- PIN Entry -->
			<div class="flex flex-col gap-1">
				<h3 class="text-lg font-bold text-gray-900">Manager PIN Required</h3>
				<p class="text-sm text-gray-500">
					Merge {primaryTable.label} → {allTables.find(t => t.id === selectedTargetId)?.label ?? '?'}
				</p>
			</div>

			<!-- PIN dots -->
			<div class="flex flex-col gap-2">
				<div class="flex justify-center gap-3">
					{#each [0, 1, 2, 3] as idx}
						<div class={cn(
							'h-4 w-4 rounded-full border-2 transition-all',
							idx < pin.length
								? (pinError ? 'bg-status-red border-status-red' : 'bg-accent border-accent')
								: 'border-gray-300'
						)}></div>
					{/each}
				</div>
				{#if pinError}
					<p class="text-center text-xs font-semibold text-status-red">Incorrect PIN. Try again.</p>
				{/if}
			</div>

			<!-- Numpad -->
			<div class="grid grid-cols-3 gap-2">
				{#each [1,2,3,4,5,6,7,8,9] as num}
					<button
						onclick={() => { pinError = false; if (pin.length < 4) pin += String(num); }}
						class="btn-secondary h-12 text-lg font-bold"
						style="min-height: 48px"
					>{num}</button>
				{/each}
				<button onclick={() => { pin = ''; pinError = false; }} class="btn-ghost h-12 text-sm" style="min-height: 48px">Clear</button>
				<button onclick={() => { pinError = false; if (pin.length < 4) pin += '0'; }} class="btn-secondary h-12 text-lg font-bold" style="min-height: 48px">0</button>
				<button onclick={() => { pin = pin.slice(0, -1); pinError = false; }} class="btn-ghost h-12 text-sm" style="min-height: 48px">⌫</button>
			</div>

			<div class="flex gap-2 mt-1">
				<button class="btn-ghost flex-1" onclick={() => { step = 'select'; pin = ''; }} style="min-height: 44px">← Back</button>
				<button
					onclick={confirmMerge}
					disabled={pin.length !== 4}
					class="btn-primary flex-1 disabled:opacity-40"
					style="min-height: 44px"
				>✓ Confirm Merge</button>
			</div>
		{/if}
	</div>
</div>
