<script lang="ts">
	import { cn } from '$lib/utils';
	import { X, Plus, Minus, Pencil } from 'lucide-svelte';
	import { adjustStock, setStock, type StockItem, type StockStatus } from '$lib/stores/stock.svelte';
	import CategoryIcon from './CategoryIcon.svelte';
	import ModalWrapper from '$lib/components/ModalWrapper.svelte';

	interface InventoryItem extends StockItem {
		currentStock: number;
		status: StockStatus;
	}

	interface Props {
		selectedItem: InventoryItem;
		onClose: () => void;
	}

	let { selectedItem, onClose }: Props = $props();

	let modalAction = $state<'add' | 'deduct' | 'set' | null>(null);
	let adjustQty    = $state('');
	let adjustReason = $state('');

	function selectAction(action: 'add' | 'deduct' | 'set') {
		modalAction  = action;
		adjustReason = '';
		adjustQty    = action === 'set' ? String(selectedItem.currentStock) : '';
	}

	async function handleConfirm() {
		if (!modalAction) return;
		const qty = parseFloat(adjustQty);
		if (isNaN(qty) || qty < 0) return;
		if (modalAction !== 'set' && qty <= 0) return;
		if ((modalAction === 'deduct' || modalAction === 'set') && !adjustReason.trim()) return;

		if (modalAction === 'set') {
			await setStock(selectedItem.id, selectedItem.name, qty, selectedItem.unit, adjustReason);
		} else {
			await adjustStock(selectedItem.id, selectedItem.name, modalAction, qty, selectedItem.unit, adjustReason);
		}
		onClose();
	}

	const reasonRequired = $derived(modalAction === 'deduct' || modalAction === 'set');
	const confirmDisabled = $derived(
		!adjustQty ||
		isNaN(parseFloat(adjustQty)) ||
		parseFloat(adjustQty) < 0 ||
		(modalAction !== 'set' && parseFloat(adjustQty) <= 0) ||
		(reasonRequired && !adjustReason.trim())
	);
</script>

<ModalWrapper open={true} onclose={onClose} zIndex={50} ariaLabel="Inventory action" class="p-4">
	<div class="w-full max-w-[480px] min-h-[28rem] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl flex flex-col">

		<!-- Header -->
		<div class="flex items-center justify-between border-b border-border px-5 py-4">
			<div class="flex items-center gap-3">
				<CategoryIcon category={selectedItem.category} class="h-12 w-12" iconClass="w-6 h-6" />
				<div>
					<h3 class="font-bold text-gray-900 leading-tight">{selectedItem.name}</h3>
					<p class="text-xs text-gray-500 mt-0.5">
						Current:
						<span class="font-mono font-bold text-gray-900">{selectedItem.currentStock.toLocaleString()} {selectedItem.unit}</span>
						<span class="mx-1 text-gray-300">·</span>
						Min: <span class="font-mono font-semibold text-gray-600">{selectedItem.minLevel.toLocaleString()}</span>
					</p>
				</div>
			</div>
			<button onclick={onClose} class="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
				<X class="w-5 h-5" />
			</button>
		</div>

		<!-- Action selector -->
		<div class="px-5 pt-4 pb-3">
			<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Select Action</p>
			<div class="grid grid-cols-3 gap-2">
				<button
					onclick={() => selectAction('add')}
					class={cn(
						'flex flex-col items-center gap-2 rounded-xl border-2 py-3 px-2 transition-all',
						modalAction === 'add' ? 'border-green-500 bg-green-50' : 'border-border bg-white hover:border-green-300 hover:bg-green-50/50'
					)}
				>
					<div class={cn('flex h-8 w-8 items-center justify-center rounded-full transition-colors', modalAction === 'add' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500')}>
						<Plus class="w-4 h-4" />
					</div>
					<span class={cn('text-xs font-semibold', modalAction === 'add' ? 'text-green-700' : 'text-gray-600')}>Add</span>
				</button>
				<button
					onclick={() => selectAction('deduct')}
					class={cn(
						'flex flex-col items-center gap-2 rounded-xl border-2 py-3 px-2 transition-all',
						modalAction === 'deduct' ? 'border-red-500 bg-red-50' : 'border-border bg-white hover:border-red-300 hover:bg-red-50/50'
					)}
				>
					<div class={cn('flex h-8 w-8 items-center justify-center rounded-full transition-colors', modalAction === 'deduct' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500')}>
						<Minus class="w-4 h-4" />
					</div>
					<span class={cn('text-xs font-semibold', modalAction === 'deduct' ? 'text-red-700' : 'text-gray-600')}>Deduct</span>
				</button>
				<button
					onclick={() => selectAction('set')}
					class={cn(
						'flex flex-col items-center gap-2 rounded-xl border-2 py-3 px-2 transition-all',
						modalAction === 'set' ? 'border-blue-500 bg-blue-50' : 'border-border bg-white hover:border-blue-300 hover:bg-blue-50/50'
					)}
				>
					<div class={cn('flex h-8 w-8 items-center justify-center rounded-full transition-colors', modalAction === 'set' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500')}>
						<Pencil class="w-4 h-4" />
					</div>
					<span class={cn('text-xs font-semibold', modalAction === 'set' ? 'text-blue-700' : 'text-gray-600')}>Set Level</span>
				</button>
			</div>
		</div>

		<!-- Form -->
		{#if modalAction}
			<div class="px-5 pb-2 flex flex-col gap-4">
				<!-- Quantity -->
				<div class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">
						{modalAction === 'add' ? 'Quantity to Add' : modalAction === 'deduct' ? 'Quantity to Deduct' : 'Set Stock Level'}
						({selectedItem.unit}) *
					</span>
					<div class="relative">
						<input
							type="number"
							bind:value={adjustQty}
							placeholder={modalAction === 'set' ? String(selectedItem.currentStock) : '0'}
							min="0"
							step="any"
							class={cn(
								'w-full pl-4 pr-16 py-2.5 text-lg font-mono rounded-lg border focus:ring-2 focus:outline-none transition-shadow',
								modalAction === 'add'    ? 'border-green-200 focus:border-green-500 focus:ring-green-500/20' :
								modalAction === 'deduct' ? 'border-red-200 focus:border-red-500 focus:ring-red-500/20' :
								                          'border-blue-200 focus:border-blue-500 focus:ring-blue-500/20'
							)}
						/>
						<span class="absolute right-4 top-1/2 -translate-y-1/2 select-none text-sm font-medium text-gray-400">
							{selectedItem.unit}
						</span>
					</div>
				</div>

				<!-- Reason -->
				<div class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">
						Reason {reasonRequired ? '*' : '(Optional)'}
					</span>
					<input
						type="text"
						bind:value={adjustReason}
						placeholder={modalAction === 'deduct' ? 'e.g. Spoilage, manual correction…' : modalAction === 'set' ? 'e.g. Physical count result…' : 'e.g. New delivery received…'}
						class="pos-input"
					/>
					<p class={cn('text-xs text-status-red', !(reasonRequired && adjustReason.trim() === '' && adjustQty) && 'invisible')}>Reason is required for {modalAction === 'deduct' ? 'deductions' : 'stock level overrides'}</p>
				</div>
			</div>
		{:else}
			<div class="flex items-center justify-center px-5 py-6 text-sm text-gray-400">
				Select an action above to continue
			</div>
		{/if}

		<!-- Footer -->
		<div class="flex items-center justify-end gap-3 rounded-b-2xl border-t border-border bg-gray-50 p-4">
			<button onclick={onClose} class="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
				Cancel
			</button>
			{#if modalAction}
				<button
					onclick={handleConfirm}
					disabled={confirmDisabled}
					class={cn(
						'rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40',
						modalAction === 'add'    ? 'bg-green-600 hover:bg-green-700' :
						modalAction === 'deduct' ? 'bg-red-600 hover:bg-red-700' :
						                          'bg-blue-600 hover:bg-blue-700'
					)}
				>
					{modalAction === 'add' ? 'Confirm Addition' : modalAction === 'deduct' ? 'Confirm Deduction' : 'Set Stock Level'}
				</button>
			{/if}
		</div>

	</div>
</ModalWrapper>
