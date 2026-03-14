<script lang="ts">
	import type { Order, MenuItem } from '$lib/types';
	import { menuItems, addItemToOrder, addRefillRequest, addServiceRequest, REFILL_NOTE, getRefillCount } from '$lib/stores/pos.svelte';
	import { cn } from '$lib/utils';
	import { X, RotateCcw, UtensilsCrossed, Beef, LeafyGreen, Wrench, Plus } from 'lucide-svelte';
	import { playSound } from '$lib/utils/audio';

	interface Props {
		isOpen: boolean;
		order: Order | null;
		onclose: () => void;
	}

	let { isOpen, order, onclose }: Props = $props();

	// Transient feedback state
	let addedItemId = $state<string | null>(null);
	let sentSideIds = $state<Set<string>>(new Set());
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
		playSound('click');
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

	const refillCount = $derived(getRefillCount(order));

	const pendingRefillMeatIds = $derived(new Set(
		order?.items
			.filter(i => i.tag === 'FREE' && i.notes === REFILL_NOTE && i.status !== 'served' && i.status !== 'cancelled')
			.map(i => i.menuItemId) ?? []
	));

	async function requestMeat(meat: MenuItem) {
		if (!order) return;
		await addRefillRequest(order.id, meat);
		playSound('click');
		addedItemId = meat.id;
		setTimeout(() => { addedItemId = null; }, 1200);
	}

	async function requestSide(side: MenuItem) {
		if (!order) return;
		if (side.id === ICE_TEA_PITCHER_ID) return;
		await addItemToOrder(order.id, side, 1, undefined, true);
		playSound('click');
		addedItemId = side.id;
		sentSideIds = new Set([...sentSideIds, side.id]);
		setTimeout(() => { addedItemId = null; }, 1200);
	}

	async function repeatLastRound() {
		if (!order) return;
		for (const meat of lastRoundMeats) {
			if (pendingRefillMeatIds.has(meat.id)) continue;
			await addRefillRequest(order.id, meat);
		}
		playSound('success');
		repeatConfirmed = true;
		setTimeout(() => { repeatConfirmed = false; }, 1500);
	}

	const allLastRoundPending = $derived(
		lastRoundMeats.length > 0 && lastRoundMeats.every(m => pendingRefillMeatIds.has(m.id))
	);

	const PROTEIN_COLORS: Record<string, { bg: string; border: string; text: string }> = {
		beef:    { bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-700' },
		pork:    { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' },
		chicken: { bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-700' },
	};

	function proteinStyle(meat: MenuItem) {
		return PROTEIN_COLORS[meat.protein ?? ''] ?? { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
	}
</script>

{#if isOpen && order}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onclick={onclose}>
	<div
		class="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden max-h-[92vh] sm:max-h-[85vh]"
		onclick={(e) => e.stopPropagation()}
	>
		<!-- ─── Header ─────────────────────────────────────────────── -->
		<div class="shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
					<RotateCcw class="h-5 w-5 text-accent" />
				</div>
				<div class="flex flex-col">
					<h2 class="text-lg font-black text-gray-900">Refill</h2>
					<div class="flex items-center gap-2">
						{#if activePackage}
							<span class="text-xs text-gray-500">{activePackage.name}</span>
						{/if}
						{#if refillCount > 0}
							<span class="inline-flex items-center rounded-full bg-status-green/10 px-2 py-0.5 text-[11px] font-bold text-status-green">
								R{refillCount}
							</span>
						{/if}
					</div>
				</div>
			</div>
			<button onclick={onclose} class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
				<X class="h-5 w-5" />
			</button>
		</div>

		<!-- ─── Repeat Last Round (hidden when all pending) ── -->
		{#if lastRoundMeats.length > 0 && !allLastRoundPending}
			<div class="shrink-0 px-5 py-3 border-b border-gray-100 bg-gray-50/50">
				<button
					onclick={repeatLastRound}
					class={cn(
						'w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all active:scale-[0.97]',
						repeatConfirmed
							? 'bg-status-green text-white shadow-lg'
							: 'bg-accent text-white shadow-md hover:bg-accent-dark'
					)}
					style="min-height: 52px"
				>
					<RotateCcw class="h-4 w-4" />
					{repeatConfirmed ? 'Sent!' : `Repeat — ${lastRoundMeats.map(m => m.name).join(', ')}`}
				</button>
			</div>
		{/if}

		<!-- ─── Scrollable Content ─────────────────────────────────── -->
		<div class="flex-1 overflow-y-auto">

			<!-- Meats Section -->
			{#if refillMeats.length > 0}
				<div class="px-5 pt-4 pb-3">
					<div class="flex items-center gap-2 mb-3">
						<Beef class="h-4 w-4 text-red-400" />
						<span class="text-xs font-bold uppercase tracking-wider text-gray-400">Meats</span>
					</div>
					<div class="grid grid-cols-2 gap-2.5">
						{#each refillMeats as meat (meat.id)}
							{@const isPending = pendingRefillMeatIds.has(meat.id)}
							{@const colors = proteinStyle(meat)}
							<button
								onclick={() => requestMeat(meat)}
								disabled={isPending}
								class={cn(
									'relative flex flex-col rounded-xl border-2 overflow-hidden transition-all',
									isPending
										? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50'
										: cn(colors.border, colors.bg, 'hover:shadow-md active:scale-[0.96]')
								)}
							>
								{#if meat.image}
									<div class="w-full h-20 bg-gray-100">
										<img src={meat.image} alt={meat.name} class="w-full h-full object-cover" />
									</div>
								{/if}
								<div class={cn('px-3 py-2.5', !meat.image && 'py-4')}>
									<span class={cn('text-sm font-bold leading-tight line-clamp-2', isPending ? 'text-gray-400' : colors.text)}>
										{meat.name}
									</span>
									{#if isPending}
										<span class="block text-[11px] font-semibold text-status-yellow mt-1">Pending...</span>
									{/if}
								</div>
								{#if addedItemId === meat.id}
									<div class="absolute inset-0 flex items-center justify-center bg-status-green/90 rounded-xl">
										<span class="text-xl font-black text-white">Sent</span>
									</div>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Sides Section -->
			{#if freeSides.length > 0}
				<div class="px-5 py-3 border-t border-gray-100">
					<div class="flex items-center gap-2 mb-3">
						<LeafyGreen class="h-4 w-4 text-status-green" />
						<span class="text-xs font-bold uppercase tracking-wider text-gray-400">Sides</span>
					</div>
					<div class="flex flex-wrap gap-2">
						{#each freeSides as side (side.id)}
							{@const isPitcher = side.id === ICE_TEA_PITCHER_ID}
							{@const justAdded = addedItemId === side.id}
							{@const alreadySent = sentSideIds.has(side.id)}
							<button
								onclick={() => requestSide(side)}
								disabled={isPitcher}
								class={cn(
									'relative flex items-center gap-1.5 rounded-xl border-2 px-4 text-sm font-bold transition-all overflow-hidden active:scale-[0.96]',
									isPitcher
										? 'opacity-40 cursor-not-allowed border-dashed border-gray-200 text-gray-400'
										: justAdded
											? 'border-status-green bg-status-green/10 text-status-green'
											: alreadySent
												? 'border-gray-200 bg-gray-100 text-gray-400'
												: 'border-gray-200 bg-white text-gray-700 hover:border-status-green hover:bg-status-green/5'
								)}
								style="min-height: 48px"
							>
								{side.name}
								{#if isPitcher}
									<span class="text-[10px] font-normal">(incl.)</span>
								{:else if justAdded}
									<span class="ml-0.5">Sent</span>
								{:else if alreadySent}
									<span class="ml-0.5 text-xs font-normal">Sent</span>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#if refillMeats.length === 0 && freeSides.length === 0}
				<div class="flex flex-col items-center justify-center py-12 text-gray-400">
					<UtensilsCrossed class="h-8 w-8 mb-2 opacity-40" />
					<p class="text-sm">No active AYCE package on this order.</p>
				</div>
			{/if}

			<!-- Service Requests -->
			<div class="px-5 py-3 border-t border-gray-100">
				<div class="flex items-center gap-2 mb-3">
					<Wrench class="h-4 w-4 text-status-purple" />
					<span class="text-xs font-bold uppercase tracking-wider text-gray-400">Service Needs</span>
				</div>
				<div class="flex flex-wrap gap-2">
					{#each SERVICE_PRESETS as preset}
						{@const justSent = sentServiceKey === preset}
						<button
							onclick={() => requestService(preset)}
							class={cn(
								'relative flex items-center rounded-xl border-2 px-4 text-sm font-bold transition-all active:scale-[0.96] overflow-hidden',
								justSent
									? 'border-status-purple bg-status-purple/10 text-status-purple'
									: 'border-gray-200 bg-white text-gray-600 hover:border-status-purple hover:text-status-purple'
							)}
							style="min-height: 48px"
						>
							{preset}
							{#if justSent}<span class="ml-1.5 text-xs">Sent</span>{/if}
						</button>
					{/each}
					{#if showCustomInput}
						<div class="flex w-full gap-2 mt-1">
							<input
								type="text"
								bind:value={customService}
								placeholder="e.g. Extra napkins..."
								class="flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-status-purple focus:ring-2 focus:ring-status-purple/20 focus:outline-none transition-all"
								style="min-height: 48px"
								onkeydown={(e) => { if (e.key === 'Enter') requestService(customService); if (e.key === 'Escape') { showCustomInput = false; customService = ''; } }}
							/>
							<button
								onclick={() => requestService(customService)}
								disabled={!customService.trim()}
								class="rounded-xl bg-status-purple px-5 text-sm font-bold text-white disabled:opacity-40 active:scale-[0.96] transition-all"
								style="min-height: 48px"
							>
								Send
							</button>
						</div>
					{:else}
						<button
							onclick={() => { showCustomInput = true; }}
							class="flex items-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 px-4 text-sm font-bold text-gray-400 hover:border-status-purple hover:text-status-purple transition-all active:scale-[0.96]"
							style="min-height: 48px"
						>
							<Plus class="h-3.5 w-3.5" />
							Custom
						</button>
					{/if}
				</div>
			</div>
		</div>

		<!-- ─── Footer ─────────────────────────────────────────────── -->
		<div class="shrink-0 border-t border-gray-100 px-5 py-3">
			<button
				onclick={onclose}
				class="w-full rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-200 transition-colors"
				style="min-height: 48px"
			>
				Done
			</button>
		</div>
	</div>
</div>
{/if}
