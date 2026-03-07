<script lang="ts">
	import type { Order, MenuItem } from '$lib/types';
	import { menuItems, addItemToOrder, addRefillRequest, REFILL_NOTE } from '$lib/stores/pos.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		isOpen: boolean;
		order: Order | null;
		onclose: () => void;
	}

	let { isOpen, order, onclose }: Props = $props();

	const activePackage = $derived(
		order?.packageId ? menuItems.value.find(m => m.id === order.packageId) : null
	);

	const packageMeatIds = $derived(new Set(activePackage?.meats ?? []));
	const packageSideIds = $derived(new Set(activePackage?.autoSides ?? []));

	const refillMeats = $derived(
		menuItems.value.filter(m => m.category === 'meats' && m.available && packageMeatIds.has(m.id))
	);

	const freeSides = $derived(
		menuItems.value.filter(m => packageSideIds.has(m.id) && m.available)
	);

	const lastRoundMeats = $derived.by((): MenuItem[] => {
		if (!order) return [];
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
		if (!order) return;
		await addRefillRequest(order.id, meat);
	}

	async function requestSide(side: MenuItem) {
		if (!order) return;
		await addItemToOrder(order.id, side, 1, undefined, true);
	}

	async function repeatLastRound() {
		if (!order) return;
		for (const meat of lastRoundMeats) {
			await addRefillRequest(order.id, meat);
		}
	}
</script>

{#if isOpen && order}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onclick={onclose}>
	<div
		class="w-full max-w-sm rounded-2xl bg-surface shadow-2xl pos-card flex flex-col overflow-hidden"
		onclick={(e) => e.stopPropagation()}
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-border px-4 py-3">
			<div class="flex flex-col">
				<h2 class="text-base font-black text-gray-900">Refill</h2>
				{#if activePackage}
					<span class="text-[11px] text-gray-500">{activePackage.name}</span>
				{/if}
			</div>
			<button onclick={onclose} class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors" style="min-height: unset">
				✕
			</button>
		</div>

		<!-- Content -->
		<div class="flex flex-col gap-4 px-4 py-3 max-h-[55vh] overflow-y-auto">
			{#if refillMeats.length > 0}
				<div>
					<p class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Meats</p>
					<div class="grid grid-cols-3 gap-2">
						{#each refillMeats as meat (meat.id)}
							<button
								onclick={() => requestMeat(meat)}
								class={cn(
									'flex flex-col rounded-lg border border-border bg-surface text-left transition-all active:scale-95 hover:border-accent hover:bg-accent-light overflow-hidden',
									meat.protein === 'beef' ? '!border-l-red-500 !border-l-[3px]' : '',
									meat.protein === 'pork' ? '!border-l-orange-500 !border-l-[3px]' : '',
									meat.protein === 'chicken' ? '!border-l-yellow-500 !border-l-[3px]' : ''
								)}
							>
								{#if meat.image}
									<div class="w-full h-16 bg-gray-100">
										<img src={meat.image} alt={meat.name} class="w-full h-full object-cover" />
									</div>
								{/if}
								<div class={cn('px-2 pb-2', meat.image ? 'pt-1' : 'pt-2')}>
									<span class="text-[11px] font-bold text-gray-900 leading-tight line-clamp-2">{meat.name}</span>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#if freeSides.length > 0}
				<div>
					<p class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Free Sides</p>
					<div class="grid grid-cols-3 gap-2">
						{#each freeSides as side (side.id)}
							<button
								onclick={() => requestSide(side)}
								class="flex flex-col rounded-lg border border-status-green/30 bg-status-green-light text-left transition-all active:scale-95 hover:border-status-green overflow-hidden"
							>
								{#if side.image}
									<div class="w-full h-16 bg-gray-100">
										<img src={side.image} alt={side.name} class="w-full h-full object-cover" />
									</div>
								{/if}
								<div class={cn('px-2 pb-2', side.image ? 'pt-1' : 'pt-2')}>
									<span class="text-[11px] font-bold text-gray-900 leading-tight line-clamp-2">{side.name}</span>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#if refillMeats.length === 0 && freeSides.length === 0}
				<p class="text-xs text-gray-400 text-center py-4">No active AYCE package on this order.</p>
			{/if}
		</div>

		<!-- Footer -->
		<div class="flex flex-col gap-1.5 border-t border-border px-4 py-3">
			{#if lastRoundMeats.length > 0}
				<button
					onclick={repeatLastRound}
					class="w-full rounded-lg border-2 border-dashed border-accent/40 bg-accent-light py-2.5 text-xs font-bold text-accent hover:bg-accent/10 hover:border-accent active:scale-95 transition-all"
					style="min-height: 40px"
				>
					Repeat Last — {lastRoundMeats.map(m => m.name).join(' + ')}
				</button>
			{/if}
			<button
				onclick={onclose}
				class="w-full rounded-lg bg-surface-secondary py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
				style="min-height: 36px"
			>
				Done
			</button>
		</div>
	</div>
</div>
{/if}
