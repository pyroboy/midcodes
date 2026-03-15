<script lang="ts">
	import type { Order, Table } from '$lib/types';
	import { formatPeso, cn } from '$lib/utils';
	import { mergeTakeoutToTable } from '$lib/stores/pos/orders.svelte';
	import ManagerPinModal from './ManagerPinModal.svelte';
	import ModalWrapper from '$lib/components/ModalWrapper.svelte';

	interface Props {
		tableOrder: Order;
		table: Table | null;
		takeoutOrders: Order[];
		onclose: () => void;
		onattached: () => void;
	}

	let { tableOrder, table, takeoutOrders, onclose, onattached }: Props = $props();

	type Step = 'select' | 'confirm' | 'pin';

	let step = $state<Step>('select');
	let selectedTakeout = $state<Order | null>(null);
	let errorMessage = $state('');
	let loading = $state(false);

	function selectTakeout(order: Order) {
		selectedTakeout = order;
		step = 'confirm';
	}

	function goBack() {
		if (step === 'confirm') { step = 'select'; selectedTakeout = null; }
		else if (step === 'pin') { step = 'confirm'; }
		else { onclose(); }
	}

	function onPinConfirmed(_pin: string) {
		step = 'confirm'; // will proceed with merge
		doMerge();
	}

	async function doMerge() {
		if (!selectedTakeout) return;
		loading = true;
		errorMessage = '';
		const result = await mergeTakeoutToTable(selectedTakeout.id, tableOrder.id);
		loading = false;
		if (result.success) {
			onattached();
		} else {
			errorMessage = result.error ?? 'Merge failed';
		}
	}

	function combinedTotal(): number {
		if (!selectedTakeout) return tableOrder.total;
		const takeoutNonCancelled = selectedTakeout.items
			.filter(i => i.status !== 'cancelled')
			.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
		return tableOrder.total + takeoutNonCancelled;
	}

	function formatItemCount(order: Order) {
		const n = order.items.filter(i => i.status !== 'cancelled').length;
		return `${n} item${n !== 1 ? 's' : ''}`;
	}
</script>

<ModalWrapper open={true} onclose={onclose} zIndex={70} ariaLabel="Attach takeout order" class="px-4">
	<div class="pos-card w-full max-w-[480px] min-h-[20rem] max-h-[85vh] flex flex-col">
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-border px-5 py-4">
			<div>
				<h3 class="font-bold text-gray-900">Attach Takeout to {table?.label ?? 'Table'}</h3>
				{#if step === 'select'}
					<p class="text-xs text-gray-400 mt-0.5">Select a takeout order to add to this table's bill</p>
				{:else if step === 'confirm' && selectedTakeout}
					<p class="text-xs text-gray-400 mt-0.5">Review before merging</p>
				{/if}
			</div>
			<button onclick={onclose} class="btn-ghost h-8 w-8 p-0 flex items-center justify-center text-gray-400">✕</button>
		</div>

		{#if step === 'select'}
			<!-- Select step -->
			<div class="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
				{#if takeoutOrders.length === 0}
					<p class="text-center text-sm text-gray-400 py-8">No open takeout orders.</p>
				{:else}
					{#each takeoutOrders as t}
						<button
							onclick={() => selectTakeout(t)}
							class="w-full rounded-xl border border-border bg-surface-secondary p-4 text-left hover:border-accent/60 transition-colors"
							style="min-height: 72px"
						>
							<div class="flex items-start justify-between gap-2">
								<div>
									<span class="font-semibold text-gray-900 text-sm">{t.customerName ?? 'Walk-in'}</span>
									<div class="flex items-center gap-2 mt-0.5">
										<span class="text-xs text-gray-400">{formatItemCount(t)}</span>
									</div>
								</div>
								<span class="font-mono font-bold text-gray-900">{formatPeso(t.total)}</span>
							</div>
						</button>
					{/each}
				{/if}
			</div>

		{:else if step === 'confirm' && selectedTakeout}
			<!-- Confirm step -->
			<div class="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
				<div class="rounded-xl bg-surface-secondary border border-border p-4 flex flex-col gap-3">
					<div class="flex justify-between items-center text-sm">
						<span class="font-semibold text-gray-700">{table?.label ?? 'Table'}</span>
						<span class="font-mono font-bold text-gray-900">{formatPeso(tableOrder.total)}</span>
					</div>
					<div class="text-center text-gray-400 text-xs">+ merge</div>
					<div class="flex justify-between items-center text-sm">
						<span class="font-semibold text-gray-700">{selectedTakeout.customerName ?? 'Walk-in'} (takeout)</span>
						<span class="font-mono font-bold text-gray-900">{formatPeso(selectedTakeout.total)}</span>
					</div>
					<div class="border-t border-border pt-2 flex justify-between items-center">
						<span class="font-semibold text-gray-900">Combined Total</span>
						<span class="font-mono font-extrabold text-xl text-gray-900">{formatPeso(combinedTotal())}</span>
					</div>
				</div>

				<p class="text-xs text-gray-400 text-center">
					All items from "{selectedTakeout.customerName ?? 'Walk-in'}" will be added to {table?.label ?? 'this table'}'s bill.
					The takeout order will be closed.
				</p>

				{#if errorMessage}
					<p class="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm font-semibold text-status-red">
						{errorMessage}
					</p>
				{/if}
			</div>
			<div class="flex gap-2 border-t border-border px-5 py-4">
				<button onclick={goBack} class="btn-ghost flex-1">Back</button>
				<button
					onclick={() => { step = 'pin'; }}
					class="btn-primary flex-1"
					style="min-height: 44px"
					disabled={loading}
				>
					{loading ? 'Merging…' : 'Confirm Merge'}
				</button>
			</div>
		{/if}
	</div>
</ModalWrapper>

{#if step === 'pin'}
	<ManagerPinModal
		isOpen={true}
		title="Manager PIN required"
		onConfirm={onPinConfirmed}
		onClose={() => step = 'confirm'}
	/>
{/if}
