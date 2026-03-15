<script lang="ts">
	import { untrack } from 'svelte';
	import { cn } from '$lib/utils';
	import { X } from 'lucide-svelte';
	import ModalWrapper from '$lib/components/ModalWrapper.svelte';
	import type { StockItem, StockStatus } from '$lib/stores/stock.svelte';

	interface InventoryItem extends StockItem {
		currentStock: number;
		status: StockStatus;
		description?: string;
		image?: string;
	}

	interface Props {
		editItem: InventoryItem;
		onClose: () => void;
	}

	let { editItem, onClose }: Props = $props();

	let editName      = $state(untrack(() => editItem.name));
	let editDesc      = $state(untrack(() => (editItem as any).description ?? ''));
	let editImage     = $state<File | null>(null);
	let editImageUrl  = $state<string | undefined>(untrack(() => (editItem as any).image));
	let editMinLevel  = $state(untrack(() => editItem.minLevel ?? 0));

	let formError = $state('');

	async function handleConfirm() {
		if (!editName.trim()) return;
		formError = '';

		const updates = {
			name: editName.trim(),
			description: editDesc,
			minLevel: Math.max(0, Number(editMinLevel) || 0),
			...(editImageUrl !== undefined && { image: editImageUrl })
		};

		try {
			const { updateStockItem } = await import('$lib/stores/stock.svelte');
			await updateStockItem(editItem.id, updates as any);
			onClose();
		} catch (err) {
			formError = `Failed to save: ${err instanceof Error ? err.message : 'try again'}`;
		}
	}
</script>

<ModalWrapper open={true} onclose={onClose} zIndex={50} ariaLabel="Edit inventory item" class="p-4">
	<div class="w-full max-w-[480px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl flex flex-col">
		<div class="flex items-center justify-between border-b border-border px-5 py-4">
			<h3 class="font-bold text-gray-900 leading-tight">Edit Item Info</h3>
			<button onclick={onClose} class="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
				<X class="w-5 h-5" />
			</button>
		</div>

		<div class="px-5 py-4 flex flex-col gap-4">
			<label class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Item Name *</span>
				<input type="text" bind:value={editName} class="pos-input" />
			</label>

			<label class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Description (Optional)</span>
				<textarea bind:value={editDesc} class="pos-input resize-none h-20" placeholder="e.g. For cooking use"></textarea>
			</label>

			<label class="flex flex-col gap-1.5">
				<span class="block text-xs font-medium text-gray-500 uppercase tracking-wide">
					Minimum Stock ({editItem.unit ?? 'units'})
				</span>
				<input
					type="number"
					min="0"
					bind:value={editMinLevel}
					class="pos-input w-full"
				/>
			</label>

			<label class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Item Picture</span>
				{#if editImageUrl}
					<div class="mb-2 relative w-32 h-32 rounded-lg overflow-hidden border border-border">
						<img src={editImageUrl} alt="Preview" class="w-full h-full object-cover bg-gray-50" />
						<button
							onclick={(e) => { e.preventDefault(); editImageUrl = undefined; editImage = null; }}
							class="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70"
							title="Remove image"
						>
							✕
						</button>
					</div>
				{/if}
				<input
					type="file"
					accept="image/*"
					onchange={(e) => {
						const target = e.currentTarget;
						const file = target?.files?.[0];
						if (file) {
							editImage = file;
							editImageUrl = URL.createObjectURL(file);
						}
					}}
					class="pos-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
				/>
			</label>
		</div>

		<div class="flex flex-col gap-2 rounded-b-2xl border-t border-border bg-gray-50 p-4">
			<p class={cn('text-xs text-status-red font-semibold', !formError && 'invisible')}>{formError || '\u00A0'}</p>
			<div class="flex items-center justify-end gap-3">
			<button onclick={onClose} class="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
				Cancel
			</button>
			<button
				onclick={handleConfirm}
				disabled={!editName.trim()}
				class="rounded-lg px-5 py-2.5 text-sm font-bold text-white bg-accent hover:bg-accent-light hover:text-accent transition-colors disabled:cursor-not-allowed disabled:opacity-40"
			>
				Save Changes
			</button>
			</div>
		</div>
	</div>
</ModalWrapper>
