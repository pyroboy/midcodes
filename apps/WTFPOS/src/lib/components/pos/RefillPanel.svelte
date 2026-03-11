<script lang="ts">
	import type { Order, MenuItem } from '$lib/types';
	import { menuItems, addItemToOrder, addRefillRequest, addServiceRequest, REFILL_NOTE, getRefillCount } from '$lib/stores/pos.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		isOpen: boolean;
		order: Order | null;
		onclose: () => void;
	}

	let { isOpen, order, onclose }: Props = $props();

	// Transient feedback state
	let addedItemId = $state<string | null>(null);
	let repeatConfirmed = $state(false);

	// Service request state
	const SERVICE_PRESETS = ['Extra Tong', 'Extra Scissors', 'Extra Plates', 'Extra Tissue', 'Extra Cups'];
	let sentServiceKey = $state<string | null>(null);
	let customService = $state('');
	let showCustomInput = $state(false);

	const ICE_TEA_PITCHER_ID = 'side-tea-pitcher';

	async function requestService(text: string) {
		if (!order?.id || !text.trim()) return;
		await addServiceRequest(order.id, text.trim());
		sentServiceKey = text;
		customService = '';
		showCustomInput = false;
		setTimeout(() => { sentServiceKey = null; }, 1400);
	}

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

	// P1-3: Refill round counter
	const refillCount = $derived(getRefillCount(order));

	// Block duplicate refill taps — set of meat menuItemIds with an active (not yet served) refill
	const pendingRefillMeatIds = $derived(new Set(
		order?.items
			.filter(i => i.tag === 'FREE' && i.notes === REFILL_NOTE && i.status !== 'served' && i.status !== 'cancelled')
			.map(i => i.menuItemId) ?? []
	));

	async function requestMeat(meat: MenuItem) {
		if (!order) return;
		await addRefillRequest(order.id, meat);
		addedItemId = meat.id;
		setTimeout(() => { addedItemId = null; }, 1200);
	}

	async function requestSide(side: MenuItem) {
		if (!order) return;
		// Ice tea pitcher is auto-included only — no additional refills permitted
		if (side.id === ICE_TEA_PITCHER_ID) return;
		await addItemToOrder(order.id, side, 1, undefined, true);
		addedItemId = side.id;
		setTimeout(() => { addedItemId = null; }, 1200);
	}

	async function repeatLastRound() {
		if (!order) return;
		for (const meat of lastRoundMeats) {
			if (pendingRefillMeatIds.has(meat.id)) continue; // skip already-pending
			await addRefillRequest(order.id, meat);
		}
		repeatConfirmed = true;
		setTimeout(() => { repeatConfirmed = false; }, 1500);
	}

	// Repeat button is fully blocked only when every last-round meat already has a pending refill
	const allLastRoundPending = $derived(
		lastRoundMeats.length > 0 && lastRoundMeats.every(m => pendingRefillMeatIds.has(m.id))
	);
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
				{#if refillCount > 0}
					<span class="text-[11px] text-status-green font-semibold">🔄 {refillCount} refill{refillCount === 1 ? '' : 's'} sent</span>
				{/if}
			</div>
			<!-- P0-3: 44px close button -->
			<button onclick={onclose} class="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
				✕
			</button>
		</div>

		<!-- Content -->
		<div class="flex flex-col gap-4 px-4 py-3 max-h-[55vh] overflow-y-auto">
			{#if refillMeats.length > 0}
				<div>
					<!-- P2-1: section label 10px → 12px -->
					<p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Meats</p>
					<div class="grid grid-cols-3 gap-2">
						{#each refillMeats as meat (meat.id)}
							{@const isPending = pendingRefillMeatIds.has(meat.id)}
							<!-- P0-1: tap feedback overlay + relative/overflow-hidden -->
							<button
								onclick={() => requestMeat(meat)}
								disabled={isPending}
								class={cn(
									'relative flex flex-col rounded-lg border border-border bg-surface text-left transition-all overflow-hidden',
									isPending
										? 'opacity-60 cursor-not-allowed'
										: 'active:scale-95 hover:border-accent hover:bg-accent-light',
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
									<!-- P2-3: meat name 11px → 12px -->
									<span class="text-xs font-bold text-gray-900 leading-tight line-clamp-2">{meat.name}</span>
									{#if isPending}
										<span class="block text-[10px] font-semibold text-status-yellow mt-0.5">⏳ Pending...</span>
									{/if}
								</div>
								{#if addedItemId === meat.id}
									<div class="absolute inset-0 flex items-center justify-center rounded-lg bg-status-green/90 transition-opacity">
										<span class="text-sm font-black text-white">✓</span>
									</div>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- P2-2: visual divider between meats and sides -->
			{#if refillMeats.length > 0 && freeSides.length > 0}
				<hr class="border-border" />
			{/if}

			{#if freeSides.length > 0}
				<div>
					<!-- P2-1: section label 10px → 12px -->
					<p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Free Sides</p>
					<!-- P1-4 + P2-4: uniform chip layout, no image inconsistency, no green border semantic conflict -->
					<div class="flex flex-wrap gap-2">
						{#each freeSides as side (side.id)}
							{@const isPitcher = side.id === ICE_TEA_PITCHER_ID}
							<button
								onclick={() => requestSide(side)}
								disabled={isPitcher}
								class={cn(
									'relative flex items-center rounded-lg border bg-white px-3 text-xs font-bold transition-all overflow-hidden',
									isPitcher
										? 'opacity-50 cursor-not-allowed border-dashed border-gray-300 text-gray-400'
										: addedItemId === side.id
											? 'border-status-green bg-status-green/10 text-status-green active:scale-95 hover:border-accent hover:text-accent'
											: 'text-gray-700 border-border active:scale-95 hover:border-accent hover:text-accent'
								)}
								style="min-height: 44px"
							>
								{side.name}
								{#if isPitcher}
									<span class="ml-1 text-[10px] font-normal">(included)</span>
								{:else if addedItemId === side.id}
									<span class="ml-1">✓</span>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#if refillMeats.length === 0 && freeSides.length === 0}
				<p class="text-xs text-gray-400 text-center py-4">No active AYCE package on this order.</p>
			{/if}

			<!-- Service Requests -->
			<hr class="border-border" />
			<div>
				<p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">🔧 Needs (Kitchen Alert)</p>
				<div class="flex flex-wrap gap-2">
					{#each SERVICE_PRESETS as preset}
						<button
							onclick={() => requestService(preset)}
							class={cn(
								'relative flex items-center rounded-lg border px-3 text-xs font-bold transition-all active:scale-95 overflow-hidden',
								sentServiceKey === preset
									? 'border-status-purple bg-status-purple/10 text-status-purple'
									: 'border-border bg-white text-gray-700 hover:border-status-purple hover:text-status-purple'
							)}
							style="min-height: 44px"
						>
							{preset}
							{#if sentServiceKey === preset}<span class="ml-1">✓</span>{/if}
						</button>
					{/each}
					{#if showCustomInput}
						<div class="flex w-full gap-2 mt-1">
							<input
								type="text"
								bind:value={customService}
								placeholder="e.g. Extra napkins..."
								class="pos-input flex-1 text-xs"
								style="min-height: 44px"
								onkeydown={(e) => { if (e.key === 'Enter') requestService(customService); if (e.key === 'Escape') { showCustomInput = false; customService = ''; } }}
							/>
							<button
								onclick={() => requestService(customService)}
								disabled={!customService.trim()}
								class="rounded-lg bg-status-purple px-4 text-xs font-bold text-white disabled:opacity-40 active:scale-95 transition-all"
								style="min-height: 44px"
							>
								Send
							</button>
						</div>
					{:else}
						<button
							onclick={() => { showCustomInput = true; }}
							class="flex items-center rounded-lg border border-dashed border-gray-300 px-3 text-xs font-bold text-gray-400 hover:border-status-purple hover:text-status-purple transition-all active:scale-95"
							style="min-height: 44px"
						>
							+ Custom
						</button>
					{/if}
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div class="flex flex-col gap-1.5 border-t border-border px-4 py-3">
			{#if lastRoundMeats.length > 0}
				<!-- P0-2: repeat confirmation feedback + P1-1: 44px touch target -->
				<button
					onclick={repeatLastRound}
					disabled={allLastRoundPending}
					class={cn(
						'w-full rounded-lg border-2 border-dashed py-2.5 text-xs font-bold transition-all',
						allLastRoundPending
							? 'opacity-50 cursor-not-allowed border-status-yellow/40 bg-status-yellow/5 text-status-yellow'
							: repeatConfirmed
								? 'border-status-green/60 bg-status-green/10 text-status-green active:scale-95'
								: 'border-accent/40 bg-accent-light text-accent hover:bg-accent/10 hover:border-accent active:scale-95'
					)}
					style="min-height: 44px"
				>
					{#if allLastRoundPending}
						⏳ Pending — {lastRoundMeats.map(m => m.name).join(' + ')}
					{:else}
						{repeatConfirmed ? '✓ Sent!' : `Repeat Last — ${lastRoundMeats.map(m => m.name).join(' + ')}`}
					{/if}
				</button>
			{/if}
			<!-- P1-1: Done button 36px → 44px -->
			<button
				onclick={onclose}
				class="w-full rounded-lg bg-surface-secondary py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
				style="min-height: 44px"
			>
				Done
			</button>
		</div>
	</div>
</div>
{/if}
