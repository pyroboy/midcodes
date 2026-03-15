<script lang="ts">
    import { untrack } from 'svelte';
    import type { Order, MenuItem, MenuCategory } from '$lib/types';
    import { menuItems, addItemToOrder } from '$lib/stores/pos.svelte';
    import { formatPeso, cn } from '$lib/utils';
    import BluetoothWeightInput from '$lib/components/BluetoothWeightInput.svelte';
    import { btScale } from '$lib/stores/bluetooth-scale.svelte';
    import { playSound } from '$lib/utils/audio';
    import ModalWrapper from '$lib/components/ModalWrapper.svelte';

    export interface ChargeItem {
        item: MenuItem;
        qty: number;
        weight?: number;
        forceFree: boolean;
        notes?: string;
    }

    interface Props {
        order: Order;
        onclose: () => void;
        oncharged?: (count: number, itemNames?: string[]) => void;
        oncharge?: (orderId: string, items: ChargeItem[]) => void;
    }

    let { order, onclose, oncharged, oncharge }: Props = $props();

    // P0-2: close-guard state — show confirm when pending items exist
    let confirmingClose = $state(false);

    function tryClose() {
        if (pendingItems.length > 0) {
            confirmingClose = true;
        } else {
            onclose();
        }
    }

    function discardAndClose() {
        playSound('warning');
        pendingItems = [];
        confirmingClose = false;
        onclose();
    }

    const categories: { id: MenuCategory; label: string }[] = [
        { id: 'packages', label: '🎫 Package' },
        { id: 'dishes',   label: '🍜 Dishes' },
        { id: 'drinks',   label: '🥤 Drinks' }
    ];

    let activeCategory = $state<MenuCategory>(
        untrack(() => order.orderType === 'takeout' ? 'dishes' : (order.packageId ? 'dishes' : 'packages'))
    );

    // Pending items staged before pushing to bill
    let pendingItems = $state<{ item: MenuItem; qty: number; weight?: number; forceFree?: boolean; isTakeout?: boolean; notes?: string }[]>([]);
    
    let weightScreenItem = $state<MenuItem | null>(null);
    let weightInput = $state('');
    let showIncluded = $state(false);
    let showMobilePending = $state(false);

    // P1-5: Split pending items into package line vs. included (collapsed by default)
    const hasPkg = $derived(pendingItems.some(p => p.item.category === 'packages'));
    const pkgItem = $derived(pendingItems.find(p => p.item.category === 'packages'));
    const includedItems = $derived(pendingItems.filter(p => p.forceFree && p.item.category !== 'packages'));
    const addOnItems = $derived(pendingItems.filter(p => !p.forceFree && p.item.category !== 'packages'));
    const includedMeatCount = $derived(includedItems.filter(p => p.item.category === 'meats').length);
    const includedSideCount = $derived(includedItems.filter(p => p.item.category !== 'meats').length);

    let dishSearch = $state('');
    // Clear search when leaving dishes tab so stale query doesn't persist on return.
    $effect(() => { if (activeCategory !== 'dishes') dishSearch = ''; });

    // O(1) lookup Map — avoids O(n) .find() scans inside tapItem() for each package meat/side
    const menuItemsById = $derived(new Map(menuItems.value.map(m => [m.id, m])));

    const activePax = $derived(order.pax);
    const activeChildPax = $derived(order.childPax ?? 0);
    const activeFreePax = $derived(order.freePax ?? 0);
    const activeAdultPax = $derived(Math.max(0, activePax - activeChildPax - activeFreePax));

    // Takeout hides "packages"; dine-in hides packages if already set
    const visibleCategories = $derived(
        order.orderType === 'takeout'
            ? categories.filter(c => c.id !== 'packages')
            : (order.packageId
                ? categories.filter(c => c.id !== 'packages')
                : categories)
    );

    const filteredItems = $derived(
        menuItems.value
            .filter((m) => m.category === activeCategory)
            .filter((m) => activeCategory !== 'dishes' || m.name.toLowerCase().includes(dishSearch.toLowerCase()))
            .sort((a, b) => (a.available === b.available ? 0 : a.available ? -1 : 1))
    );

    const pendingTotal = $derived(
        pendingItems.reduce((s, p) => {
            if (p.forceFree) return s;
            if (p.item.category === 'packages') {
                const adultTotal = p.item.price * activeAdultPax;
                const childTotal = (p.item.childPrice ?? p.item.price) * activeChildPax;
                return s + adultTotal + childTotal;
            }
            return s + (p.item.isWeightBased ? Math.round((p.weight ?? 0) * (p.item.pricePerGram ?? 0)) : p.item.price) * p.qty;
        }, 0)
    );

    function tapItem(item: MenuItem) {
        playSound('click');
        if (item.category === 'packages') {
            // Preserve any existing ala carte items, but clear old packages & auto-included items
            pendingItems = pendingItems.filter(p => p.item.category !== 'packages' && !p.forceFree);
            pendingItems.push({ item, qty: 1, forceFree: false });
            if (item.meats) {
                for (const meatId of item.meats) {
                    const meat = menuItemsById.get(meatId);
                    if (meat) pendingItems.push({ item: meat, qty: 1, forceFree: true });
                }
            }
            if (item.autoSides) {
                for (const sideId of item.autoSides) {
                    const side = menuItemsById.get(sideId);
                    if (side) pendingItems.push({ item: side, qty: 1, forceFree: true });
                }
            }
            // Pax-scaled sides: ceil(pax/6) — e.g. 1 ice tea pitcher per 6 pax
            if (item.scaledAutoSides) {
                for (const sideId of item.scaledAutoSides) {
                    const side = menuItemsById.get(sideId);
                    if (side) pendingItems.push({ item: side, qty: Math.ceil(activePax / 6), forceFree: true });
                }
            }
            return;
        }
        if (item.isWeightBased) { weightScreenItem = item; weightInput = ''; return; }
        const existing = pendingItems.find((p) => p.item.id === item.id);
        if (existing) existing.qty++;
        else pendingItems.push({ item, qty: 1, forceFree: false });
    }

    function commitMeat(weight: number) {
        if (!weightScreenItem || isNaN(weight) || weight <= 0) return;
        pendingItems.push({ item: weightScreenItem, qty: 1, weight, forceFree: true });
        weightScreenItem = null;
        playSound('click');
    }

    function changeQty(idx: number, delta: number) {
        const p = pendingItems[idx];
        playSound('click');
        if (p.item.isWeightBased) {
            p.weight = Math.max(0, (p.weight || 0) + delta * 50);
            if (p.weight === 0) pendingItems.splice(idx, 1);
        } else {
            p.qty += delta;
            if (p.qty <= 0) pendingItems.splice(idx, 1);
        }
    }

    function chargeToOrder() {
        if (!order) return;
        const items: ChargeItem[] = pendingItems.map(p => {
            const noteParts = [p.isTakeout ? '[TAKEOUT]' : '', p.notes?.trim() ?? ''].filter(Boolean);
            return {
                item: p.item,
                qty: p.qty,
                weight: p.weight,
                forceFree: p.forceFree ?? false,
                notes: noteParts.length > 0 ? noteParts.join(' — ') : undefined
            };
        });
        const orderId = order.id;
        pendingItems = [];
        // Close modal FIRST so the animation plays on the open floor plan
        onclose();
        // Delegate DB writes + sound + animation to parent
        playSound('success');
        oncharge?.(orderId, items);
    }

    function undoPending() { pendingItems = []; }
</script>

<ModalWrapper open={true} onclose={tryClose} zIndex={50} ariaLabel="Add items to order" class="sm:p-4 lg:p-6" backdropClose={false}>
    <div class="flex h-full w-full sm:h-[80vh] lg:max-w-[1100px] overflow-hidden sm:rounded-xl border border-border bg-surface shadow-2xl flex-col lg:flex-row">
        <div class="flex flex-1 flex-col overflow-hidden min-h-0">
            <div class="flex items-start justify-between border-b border-border px-4 sm:px-6 py-3 sm:py-4">
                <div class="flex flex-col gap-1.5">
                    {#if order.orderType === 'takeout'}
                        <div class="flex items-center gap-2">
                            <span class="rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold text-white">📦 TAKEOUT</span>
                            <h2 class="text-xl font-bold text-gray-900">Add to Takeout</h2>
                        </div>
                        <p class="text-sm text-gray-500">{order.customerName ?? 'Walk-in'}</p>
                    {:else}
                        <h2 class="text-xl font-bold text-gray-900">➕ Add to Order</h2>
                        <p class="text-sm text-gray-500">🔥 {order.packageName ?? 'Table'} · {order.pax} pax</p>
                    {/if}
                </div>
                <button onclick={tryClose} class="flex min-h-[44px] min-w-[44px] items-center justify-center text-gray-400 hover:text-gray-600" aria-label="Close modal">✕</button>
            </div>

            <div class="flex gap-1.5 sm:gap-2 border-b border-border bg-surface-secondary px-3 sm:px-6 py-2 sm:py-3">
                {#each visibleCategories as cat}
                    <button
                        onclick={() => (activeCategory = cat.id)}
                        class={cn(
                            'flex flex-1 items-center justify-center gap-1.5 sm:flex-col sm:gap-1 rounded-lg sm:rounded-xl transition-all active:scale-95',
                            activeCategory === cat.id
                                ? 'bg-accent text-white shadow-md'
                                : 'border border-border bg-surface text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        )}
                        style="min-height: 44px"
                    >
                        <span class="text-lg sm:text-2xl leading-none">{cat.label.split(' ')[0]}</span>
                        <span class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide">{cat.label.split(' ').slice(1).join(' ')}</span>
                    </button>
                {/each}
            </div>

            {#if order.orderType === 'takeout'}
                <p class="px-6 pb-2 text-[11px] text-gray-400">Packages and meats are dine-in only</p>
            {/if}

            <div class="flex-1 overflow-y-auto p-3 sm:p-6">
                {#if weightScreenItem}
                    <div class="flex h-full flex-col items-center justify-center gap-6">
                        <h3 class="text-3xl font-bold text-gray-900">{weightScreenItem.name}</h3>
                        <p class="text-sm text-gray-500">Enter weight from scale (grams)</p>
                        <p class="text-xs text-status-yellow font-medium">⚠ Use actual scale weight — estimates cause stock drift. Refills can be corrected at the weigh station.</p>
                        <div class="flex flex-wrap items-center justify-center gap-3 w-full max-w-[400px]">
                            {#each [100, 150, 200, 250, 300, 400] as preset}
                                <button onclick={() => commitMeat(preset)} class="btn-secondary font-mono w-[30%]">
                                    {preset}g
                                </button>
                            {/each}
                        </div>
                        <div class="mt-4 flex flex-col items-center gap-3">
                            <span class="text-xs font-semibold uppercase text-gray-400">
                                {btScale.connectionStatus === 'connected' ? 'Scale / Custom Amount' : 'Custom Amount'}
                            </span>
                            <div class="flex items-center gap-3">
                                <BluetoothWeightInput
                                    id="add-item-meat-weight"
                                    value={weightInput}
                                    onValueChange={(val) => { weightInput = val; }}
                                    placeholder="e.g. 235"
                                    class="w-32"
                                />
                                <button onclick={() => commitMeat(parseFloat(weightInput))} class="btn-primary">Add</button>
                            </div>
                        </div>
                        <div class="mt-8">
                            <button onclick={() => weightScreenItem = null} class="btn-ghost flex items-center gap-2">
                                ← Back to Meats
                            </button>
                        </div>
                    </div>
                {:else}
                    {#if activeCategory === 'dishes'}
                        <div class="mb-3 sm:mb-5">
                            <input
                                type="text"
                                bind:value={dishSearch}
                                placeholder="Search dishes..."
                                class="w-full rounded-lg sm:rounded-xl border border-border bg-surface px-3 py-2.5 sm:px-4 sm:py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent shadow-sm"
                            />
                        </div>
                    {/if}
                    <div class="grid grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-3 lg:gap-4">
                        {#each filteredItems as item (item.id)}
                            <button
                                onclick={() => item.available && tapItem(item)}
                                disabled={!item.available}
                                class={cn(
                                    'relative flex flex-col justify-between rounded-lg sm:rounded-xl border text-left transition-all overflow-hidden h-[88px] sm:h-[104px]',
                                    !item.available
                                        ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                                        : pendingItems.some(p => p.item.id === item.id)
                                            ? 'border-accent bg-accent-light active:scale-[0.98]'
                                            : 'border-border bg-surface-secondary hover:border-gray-300 active:scale-[0.98]',
                                    item.protein === 'beef' ? '!border-l-red-500 !border-l-4' : '',
                                    item.protein === 'pork' ? '!border-l-orange-500 !border-l-4' : '',
                                    item.protein === 'chicken' ? '!border-l-yellow-500 !border-l-4' : ''
                                )}
                            >
                                {#if item.image}
                                    <img src={item.image} alt="" class="absolute inset-0 w-full h-full object-cover opacity-10" />
                                {/if}
                                {#if !item.available}
                                    <div class="absolute inset-0 z-10 flex items-center justify-center">
                                        <span class="rounded-lg bg-gray-900/70 px-2.5 py-1 text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider">Sold Out</span>
                                    </div>
                                {/if}
                                <div class="relative z-[1] flex flex-col justify-between h-full px-2.5 py-2 sm:px-3 sm:py-2.5">
                                    <div class="flex items-start justify-between gap-1">
                                        <span class="text-xs sm:text-sm font-bold text-gray-900 leading-tight line-clamp-2">{item.name}</span>
                                        {#if item.protein}
                                            <span class={cn(
                                                "flex items-center gap-0.5 rounded-full px-1 py-0.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-wide shrink-0",
                                                item.protein === 'beef' ? 'bg-red-100 text-red-700' : '',
                                                item.protein === 'pork' ? 'bg-orange-100 text-orange-700' : '',
                                                item.protein === 'chicken' ? 'bg-yellow-100 text-yellow-700' : ''
                                            )}>
                                                {item.protein === 'beef' ? '🥩' : item.protein === 'pork' ? '🐷' : '🍗'}
                                            </span>
                                        {/if}
                                        {#if item.category === 'packages' && pendingItems.some(p => p.item.id === item.id)}
                                            <span class="rounded bg-accent px-1 py-0.5 text-[8px] sm:text-[10px] font-bold text-white shrink-0">ACTIVE</span>
                                        {/if}
                                    </div>
                                    {#if item.category === 'packages' && item.desc}
                                        <p class="text-[9px] sm:text-[11px] text-gray-500 leading-snug line-clamp-1 mt-0.5">{item.desc}</p>
                                    {/if}
                                    <div class="flex items-end justify-between gap-1 mt-auto">
                                        {#if item.category === 'packages'}
                                            {#if activeChildPax > 0 || activeFreePax > 0}
                                                <div class="font-mono text-[9px] sm:text-[11px] text-gray-700 leading-snug">
                                                    {#if activeAdultPax > 0}<span>₱{item.price}×{activeAdultPax}</span>{/if}
                                                    {#if activeChildPax > 0}<span class="ml-1">kid ₱{item.childPrice ?? item.price}×{activeChildPax}</span>{/if}
                                                </div>
                                            {:else}
                                                <span class="font-mono text-[10px] sm:text-sm font-bold text-gray-900">₱{item.price}/pax</span>
                                            {/if}
                                            {#if item.perks}<span class="text-[8px] sm:text-[10px] text-status-green line-clamp-1 shrink-0">✓ {item.perks}</span>{/if}
                                        {:else if item.isWeightBased}
                                            <span class="font-mono text-[10px] sm:text-xs font-bold text-gray-700">₱{((item.pricePerGram ?? 0) * 100).toFixed(0)}/100g</span>
                                            <span class="text-[9px] sm:text-[10px] text-gray-400">tap to weigh</span>
                                        {:else}
                                            {#if item.isFree}
                                                <span class="text-[10px] sm:text-xs font-semibold text-status-green">FREE</span>
                                            {:else}
                                                <span class="font-mono text-[10px] sm:text-sm font-bold text-gray-900">{formatPeso(item.price)}</span>
                                            {/if}
                                        {/if}
                                    </div>
                                </div>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Mobile pending bottom bar (< lg) -->
            {#if pendingItems.length > 0}
                <div class="lg:hidden border-t-2 border-accent/30 px-3 py-2.5 bg-surface shrink-0 flex items-center gap-2">
                    <button
                        onclick={() => showMobilePending = true}
                        class="flex-1 flex items-center gap-2 text-sm font-bold text-gray-900 min-h-[44px]"
                    >
                        <span class="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white shrink-0">{pendingItems.length}</span>
                        <span class="font-mono">{formatPeso(pendingTotal)}</span>
                        <span class="text-xs text-gray-400">▸ Review</span>
                    </button>
                    <button onclick={undoPending} class="btn-ghost text-xs px-3 shrink-0" style="min-height: 44px">Undo</button>
                    <button
                        onclick={chargeToOrder}
                        class="rounded-lg bg-accent px-4 text-sm font-bold text-white hover:bg-accent-dark active:scale-95 transition-all shrink-0"
                        style="min-height: 44px"
                    >
                        ⚡ CHARGE
                    </button>
                </div>
            {/if}
        </div>

        <!-- Desktop pending sidebar (hidden on mobile) -->
        <div class="hidden lg:flex w-[320px] shrink-0 flex-col border-l border-border bg-surface-secondary">
            <div class="flex flex-col gap-1.5 border-b border-border px-5 py-4">
                <h3 class="text-base font-bold text-gray-900">Pending Items</h3>
                <p class="text-xs text-gray-500">Review items before pushing to the bill.</p>
            </div>

            <div class="flex-1 overflow-y-auto divide-y divide-border px-5">
                {#if pendingItems.length === 0}
                    <div class="flex h-full items-center justify-center text-sm text-gray-400 py-12">
                        No items yet
                    </div>
                {:else if hasPkg}
                    <!-- P1-5: Package with collapsed included items -->
                    {#if pkgItem}
                        <div class="flex items-center justify-between py-3">
                            <div class="flex flex-col gap-0.5">
                                <div class="flex items-center gap-2">
                                    <span class="text-sm font-medium text-gray-900">{pkgItem.item.name}</span>
                                    <span class="rounded bg-accent-light px-1.5 py-0.5 text-[10px] font-bold text-accent">PKG</span>
                                </div>
                                <span class="text-xs text-gray-400">× {activePax} pax</span>
                            </div>
                        </div>
                    {/if}
                    {#if includedItems.length > 0}
                        <button
                            onclick={() => showIncluded = !showIncluded}
                            class="flex items-center justify-between w-full py-2 text-xs text-gray-500 hover:text-gray-700"
                        >
                            <span>Includes {includedMeatCount > 0 ? `${includedMeatCount} meats` : ''}{includedMeatCount > 0 && includedSideCount > 0 ? ', ' : ''}{includedSideCount > 0 ? `${includedSideCount} sides` : ''}</span>
                            <span class="text-[10px]">{showIncluded ? '▲ hide' : '▼ show'}</span>
                        </button>
                        {#if showIncluded}
                            {#each includedItems as p}
                                <div class="flex items-center justify-between py-2 pl-3">
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs text-gray-500">{p.item.name}</span>
                                        {#if p.qty > 1}
                                            <span class="rounded bg-gray-100 px-1 py-0.5 text-[9px] font-bold text-gray-600">×{p.qty}</span>
                                        {/if}
                                        <span class="rounded bg-status-green-light px-1 py-0.5 text-[9px] font-bold text-status-green">FREE</span>
                                    </div>
                                </div>
                            {/each}
                        {/if}
                    {/if}
                    <!-- Non-free add-ons still show normally -->
                    {#each addOnItems as p}
                        {@const idx = pendingItems.indexOf(p)}
                        <div class="flex flex-col gap-1 py-3">
                            <div class="flex items-center justify-between">
                                <div class="flex flex-col gap-0.5">
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm font-medium text-gray-900">{p.item.name}</span>
                                    </div>
                                    {#if p.weight}<span class="text-xs text-gray-400">{p.weight}g</span>{/if}
                                </div>
                                <div class="flex items-center gap-2">
                                    {#if order.orderType === 'dine-in'}
                                        <button
                                            onclick={() => p.isTakeout = !p.isTakeout}
                                            class={cn('flex items-center justify-center rounded-lg border-2 px-1.5 py-1 text-[10px] font-bold transition-colors min-h-[44px] w-20 shadow-sm', p.isTakeout ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-surface text-gray-600 border-gray-200 hover:border-gray-300 underline decoration-gray-300 underline-offset-2')}
                                        >
                                            {p.isTakeout ? '📦 To Go' : '🍽 Dine-In'}
                                        </button>
                                    {/if}
                                    <div class="flex items-center gap-1.5 ml-1">
                                        <button onclick={() => changeQty(idx, -1)} class="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-gray-100 text-sm font-bold hover:bg-gray-200">−</button>
                                        <span class="min-w-[1.5rem] text-center text-sm font-semibold">{p.item.isWeightBased && p.weight ? p.weight / 100 : p.qty}</span>
                                        <button onclick={() => changeQty(idx, +1)} class="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-gray-100 text-sm font-bold hover:bg-gray-200">+</button>
                                    </div>
                                </div>
                            </div>
                            <input
                                type="text"
                                bind:value={p.notes}
                                placeholder="Special request (e.g. less spicy, no garlic)..."
                                class="w-full rounded-md border border-border bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:border-accent focus:outline-none"
                            />
                        </div>
                    {/each}
                {:else}
                    <!-- Non-package items (takeout, etc.) — flat list -->
                    {#each pendingItems as p, idx (p.item.id + idx)}
                        <div class="flex flex-col gap-1 py-3">
                            <div class="flex items-center justify-between">
                                <div class="flex flex-col gap-0.5">
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm font-medium text-gray-900">{p.item.name}</span>
                                        {#if p.forceFree}
                                            <span class="rounded bg-status-green-light px-1.5 py-0.5 text-[10px] font-bold text-status-green">FREE</span>
                                        {/if}
                                    </div>
                                    {#if p.weight}<span class="text-xs text-gray-400">{p.weight}g</span>{/if}
                                </div>
                                <div class="flex items-center gap-2">
                                    {#if order.orderType === 'dine-in'}
                                        <button
                                            onclick={() => p.isTakeout = !p.isTakeout}
                                            class={cn('flex items-center justify-center rounded-lg border-2 px-1.5 py-1 text-[10px] font-bold transition-colors min-h-[44px] w-20 shadow-sm', p.isTakeout ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-surface text-gray-600 border-gray-200 hover:border-gray-300 underline decoration-gray-300 underline-offset-2')}
                                        >
                                            {p.isTakeout ? '📦 To Go' : '🍽 Dine-In'}
                                        </button>
                                    {/if}
                                    <div class="flex items-center gap-1.5 ml-1">
                                        <button onclick={() => changeQty(idx, -1)} class="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-gray-100 text-sm font-bold hover:bg-gray-200">−</button>
                                        <span class="min-w-[1.5rem] text-center text-sm font-semibold">{p.item.isWeightBased && p.weight ? p.weight / 100 : p.qty}</span>
                                        <button onclick={() => changeQty(idx, +1)} class="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-gray-100 text-sm font-bold hover:bg-gray-200">+</button>
                                    </div>
                                </div>
                            </div>
                            {#if !p.forceFree}
                                <input
                                    type="text"
                                    bind:value={p.notes}
                                    placeholder="Special request (e.g. less spicy, no garlic)..."
                                    class="w-full rounded-md border border-border bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:border-accent focus:outline-none"
                                />
                            {/if}
                        </div>
                    {/each}
                {/if}
            </div>

            <div class="border-t border-border px-5 py-4 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-semibold text-gray-500">PENDING TOTAL</span>
                    <span class="font-mono text-lg font-extrabold text-gray-900">{formatPeso(pendingTotal)}</span>
                </div>
                <div class="flex gap-2">
                    <button onclick={undoPending} class="btn-secondary flex-1 text-sm" style="min-height: 44px">Undo</button>
                    <button
                        onclick={chargeToOrder}
                        disabled={pendingItems.length === 0}
                        class="flex flex-1 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-dark active:scale-95 disabled:opacity-40"
                        style="min-height: 44px"
                    >
                        ⚡ CHARGE ({pendingItems.length})
                    </button>
                </div>

            </div>
        </div>
    </div>
</ModalWrapper>

<!-- Mobile pending items sheet (< lg) -->
{#if showMobilePending}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-[55] flex flex-col lg:hidden" role="dialog">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div class="flex-1 bg-black/30" onclick={() => showMobilePending = false} role="presentation"></div>
        <div class="max-h-[75vh] bg-surface rounded-t-2xl shadow-2xl flex flex-col overflow-hidden">
            <div class="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <h3 class="text-base font-bold text-gray-900">Pending Items ({pendingItems.length})</h3>
                <button onclick={() => showMobilePending = false} class="flex h-11 w-11 items-center justify-center text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div class="flex-1 overflow-y-auto divide-y divide-border px-4">
                {#each pendingItems as p, idx (p.item.id + idx)}
                    <div class="flex items-center justify-between py-3">
                        <div class="flex items-center gap-2 min-w-0 flex-1">
                            <span class="text-sm font-medium text-gray-900 truncate">{p.item.name}</span>
                            {#if p.forceFree}
                                <span class="rounded bg-status-green-light px-1.5 py-0.5 text-[10px] font-bold text-status-green shrink-0">FREE</span>
                            {/if}
                            {#if p.item.category === 'packages'}
                                <span class="rounded bg-accent-light px-1.5 py-0.5 text-[10px] font-bold text-accent shrink-0">PKG</span>
                            {/if}
                            {#if p.weight}
                                <span class="text-xs text-gray-400 shrink-0">{p.weight}g</span>
                            {/if}
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            {#if !p.forceFree && p.item.category !== 'packages'}
                                <button onclick={() => changeQty(idx, -1)} class="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-sm font-bold">−</button>
                                <span class="w-6 text-center text-sm font-semibold">{p.item.isWeightBased && p.weight ? p.weight / 100 : p.qty}</span>
                                <button onclick={() => changeQty(idx, +1)} class="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-sm font-bold">+</button>
                            {:else}
                                <span class="text-xs text-gray-400">×{p.qty}</span>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
            <div class="border-t border-border px-4 py-3 flex flex-col gap-3 shrink-0">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-semibold text-gray-500">PENDING TOTAL</span>
                    <span class="font-mono text-lg font-extrabold text-gray-900">{formatPeso(pendingTotal)}</span>
                </div>
                <div class="flex gap-2">
                    <button onclick={() => { undoPending(); showMobilePending = false; }} class="btn-secondary flex-1 text-sm" style="min-height: 44px">Clear All</button>
                    <button
                        onclick={() => { showMobilePending = false; chargeToOrder(); }}
                        disabled={pendingItems.length === 0}
                        class="flex flex-1 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-dark active:scale-95 disabled:opacity-40"
                        style="min-height: 44px"
                    >
                        ⚡ CHARGE ({pendingItems.length})
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<ModalWrapper open={confirmingClose} onclose={() => { confirmingClose = false; }} zIndex={60} ariaLabel="Confirm discard pending items" class="px-4">
        <div class="pos-card flex flex-col gap-4 p-6 w-full max-w-[380px]">
            <div class="flex flex-col gap-1">
                <p class="text-base font-bold text-gray-900">Discard {pendingItems.length} pending item{pendingItems.length !== 1 ? 's' : ''}?</p>
                <p class="text-sm text-gray-500">These items have not been charged yet and will not be sent to the kitchen.</p>
            </div>
            <div class="flex gap-2">
                <button onclick={() => { confirmingClose = false; }} class="btn-secondary flex-1 text-sm" style="min-height: 44px">Keep Editing</button>
                <button onclick={discardAndClose} class="btn-danger flex-1 text-sm" style="min-height: 44px">Discard</button>
            </div>
        </div>
</ModalWrapper>
