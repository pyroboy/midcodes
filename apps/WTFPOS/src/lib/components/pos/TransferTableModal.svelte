<script lang="ts">
	import { tables as allTables, transferTable } from '$lib/stores/pos.svelte';
	import { session, MANAGER_PIN } from '$lib/stores/session.svelte';
	import { cn } from '$lib/utils';
	import type { Table } from '$lib/types';

	let {
		fromTable,
		onclose,
		ontransfer
	}: {
		fromTable: Table;
		onclose: () => void;
		ontransfer: (newTableId: string) => void;
	} = $props();

	let step = $state<'select' | 'pin'>('select');
	let selectedTargetId = $state<string | null>(null);
	let pin = $state('');
	let pinError = $state(false);

	const availableTables = $derived(
		allTables.value.filter(t =>
			t.status === 'available' &&
			t.locationId === fromTable.locationId &&
			t.id !== fromTable.id
		)
	);

	function selectTarget(tableId: string) {
		selectedTargetId = tableId;
		step = 'pin';
		pin = '';
		pinError = false;
	}

	async function confirmTransfer() {
		if (pin !== MANAGER_PIN) {
			pinError = true;
			return;
		}
		if (!selectedTargetId) return;
		const result = await transferTable(fromTable.id, selectedTargetId);
		if (result.success) {
			ontransfer(selectedTargetId);
		}
	}
</script>

<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
	<div class="pos-card w-full max-w-[420px] flex flex-col gap-4">
		{#if step === 'select'}
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-bold text-gray-900">🔀 Transfer {fromTable.label}</h3>
				<button onclick={onclose} class="flex min-h-[44px] min-w-[44px] items-center justify-center text-gray-400 hover:text-gray-600">✕</button>
			</div>
			<p class="text-sm text-gray-500">Select an available table to transfer the active bill to.</p>

			{#if availableTables.length === 0}
				<div class="flex flex-col items-center gap-2 py-8 text-center">
					<span class="text-3xl">😕</span>
					<span class="text-sm font-semibold text-gray-600">No available tables</span>
					<span class="text-xs text-gray-400">All tables in this location are currently occupied.</span>
				</div>
			{:else}
				<div class="grid grid-cols-4 gap-2">
					{#each availableTables as table (table.id)}
						<button
							onclick={() => selectTarget(table.id)}
							class="flex flex-col items-center gap-1 rounded-xl border-2 border-gray-300 bg-white p-3 text-center transition-all hover:border-accent hover:bg-accent-light active:scale-95"
							style="min-height: 64px"
						>
							<span class="text-base font-extrabold text-gray-900">{table.label}</span>
							<span class="text-[10px] text-gray-400">{table.capacity}p</span>
						</button>
					{/each}
				</div>
			{/if}

			<button class="btn-ghost w-full" onclick={onclose}>Cancel</button>

		{:else}
			<!-- PIN Entry -->
			<div class="flex flex-col gap-1">
				<h3 class="text-lg font-bold text-gray-900">Manager PIN Required</h3>
				<p class="text-sm text-gray-500">
					Transfer {fromTable.label} → {allTables.value.find(t => t.id === selectedTargetId)?.label ?? '?'}
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
					onclick={confirmTransfer}
					disabled={pin.length !== 4}
					class="btn-primary flex-1 disabled:opacity-40"
					style="min-height: 44px"
				>✓ Confirm Transfer</button>
			</div>
		{/if}
	</div>
</div>
