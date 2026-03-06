<script lang="ts">
	import type { Order, MenuItem } from '$lib/types';
	import { menuItems, addItemToOrder, addRefillRequest, REFILL_NOTE } from '$lib/stores/pos.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		order: Order;
		onclose: () => void;
	}

	let { order, onclose }: Props = $props();

	const activePackage = $derived(
		order.packageId ? menuItems.value.find(m => m.id === order.packageId) : null
	);

	const packageMeatIds = $derived(new Set(activePackage?.meats ?? []));
	const packageSideIds = $derived(new Set(activePackage?.autoSides ?? []));

	const refillMeats = $derived(
		menuItems.value.filter(m => m.category === 'meats' && m.available && packageMeatIds.has(m.id))
	);

	const freeSides = $derived(
		menuItems.value.filter(m => packageSideIds.has(m.id) && m.available)
	);

	// Detect last refill round by scanning backward through order items
	const lastRoundMeats = $derived.by((): MenuItem[] => {
		const meatRefills = order.items.filter(
			i => i.tag === 'FREE' && i.notes === REFILL_NOTE && i.status !== 'cancelled' && packageMeatIds.has(i.menuItemId)
		);
		if (meatRefills.length === 0) return [];
		const seen = new Set<string>();
		const result: MenuItem[] = [];
		for (let i = meatRefills.length - 1; i >= 0; i--) {
			const ri = meatRefills[i];
			if (!seen.has(ri.menuItemId)) {
				seen.add(ri.menuItemId);
				const mi = menuItems.value.find(m => m.id === ri.menuItemId);
				if (mi) result.unshift(mi);
			}
		}
		return result;
	});

	async function requestMeat(meat: MenuItem) {
		await addRefillRequest(order.id, meat);
	}

	async function requestSide(side: MenuItem) {
		await addItemToOrder(order.id, side, 1, undefined, true);
	}

	async function repeatLastRound() {
		for (const meat of lastRoundMeats) {
			await addRefillRequest(order.id, meat);
		}
	}
</script>

<div class="border-t-2 border-accent/20 bg-orange-50 flex flex-col gap-3 px-4 py-3">
	<div class="flex items-center justify-between">
		<span class="text-xs font-bold uppercase tracking-wider text-accent">Refill Request</span>
		<button onclick={onclose} class="rounded px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100" style="min-height: unset">
			Close
		</button>
	</div>

	{#if refillMeats.length > 0}
		<div>
			<p class="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Meats — kitchen weighs</p>
			<div class="grid grid-cols-2 gap-2">
				{#each refillMeats as meat (meat.id)}
					<button
						onclick={() => requestMeat(meat)}
						class="flex flex-col items-start rounded-xl border-2 border-border bg-surface px-3 py-3 text-left transition-all active:scale-95 hover:border-accent hover:bg-accent-light"
						style="min-height: 60px"
					>
						<span class="text-xs font-bold text-gray-900 leading-snug">{meat.name}</span>
						<span class="text-[10px] text-gray-400 mt-0.5">weigh station</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if freeSides.length > 0}
		<div>
			<p class="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Free Sides — sent instantly</p>
			<div class="grid grid-cols-2 gap-2">
				{#each freeSides as side (side.id)}
					<button
						onclick={() => requestSide(side)}
						class="flex flex-col items-start rounded-xl border-2 border-status-green/30 bg-status-green-light px-3 py-3 text-left transition-all active:scale-95 hover:border-status-green"
						style="min-height: 60px"
					>
						<span class="text-xs font-bold text-gray-900 leading-snug">{side.name}</span>
						<span class="text-[10px] text-status-green mt-0.5">FREE to KDS</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if lastRoundMeats.length > 0}
		<button
			onclick={repeatLastRound}
			class="w-full rounded-xl border-2 border-dashed border-accent/40 bg-white py-3 text-xs font-bold text-accent hover:bg-accent-light hover:border-accent active:scale-95 transition-all"
			style="min-height: 44px"
		>
			Repeat Last — {lastRoundMeats.map(m => m.name).join(' + ')}
		</button>
	{/if}

	{#if refillMeats.length === 0 && freeSides.length === 0}
		<p class="text-xs text-gray-400 text-center py-2">No active AYCE package on this order.</p>
	{/if}
</div>
