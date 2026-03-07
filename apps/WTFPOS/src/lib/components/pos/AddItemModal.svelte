<script lang="ts">
    import { untrack } from 'svelte';
    import type { Order, MenuItem, MenuCategory } from '$lib/types';
    import { menuItems, addItemToOrder } from '$lib/stores/pos.svelte';
    import { formatPeso, cn } from '$lib/utils';
    import BluetoothWeightInput from '$lib/components/BluetoothWeightInput.svelte';
    import { btScale } from '$lib/stores/bluetooth-scale.svelte';

    interface Props {
        order: Order;
        onclose: () => void;
    }

    let { order, onclose }: Props = $props();

    const categories: { id: MenuCategory; label: string }[] = [
        { id: 'packages', label: '🎫 Package' },
        { id: 'meats',    label: '🥩 Meats' },
        { id: 'sides',    label: '🥬 Sides' },
        { id: 'dishes',   label: '🍜 Dishes' },
        { id: 'drinks',   label: '🥤 Drinks' }
    ];

    let activeCategory = $state<MenuCategory>(
        untrack(() => order.orderType === 'takeout' ? 'sides' : (order.packageId ? 'meats' : 'packages'))
    );

    // Pending items staged before pushing to bill
    let pendingItems = $state<{ item: MenuItem; qty: number; weight?: number; forceFree?: boolean; isTakeout?: boolean }[]>([]);
    
    let weightScreenItem = $state<MenuItem | null>(null);
    let weightInput = $state('');

    const activePax = $derived(order.pax);

    // Takeout hides "packages" + "meats"; dine-in hides packages if already set
    const visibleCategories = $derived(
        order.orderType === 'takeout'
            ? categories.filter(c => c.id !== 'packages' && c.id !== 'meats')
            : (order.packageId
                ? categories.filter(c => c.id !== 'packages')
                : categories)
    );

    const filteredItems = $derived(menuItems.value.filter((m) => m.category === activeCategory && m.available));

    const pendingTotal = $derived(
        pendingItems.reduce((s, p) => {
            if (p.forceFree) return s;
            if (p.item.category === 'packages') return s + (p.item.price * activePax);
            return s + (p.item.isWeightBased ? Math.round((p.weight ?? 0) * (p.item.pricePerGram ?? 0)) : p.item.price) * p.qty;
        }, 0)
    );

    function tapItem(item: MenuItem) {
        if (item.category === 'packages') {
            pendingItems = [{ item, qty: 1, forceFree: false }];
            if (item.meats) {
                for (const meatId of item.meats) {
                    const meat = menuItems.value.find(m => m.id === meatId);
                    if (meat) pendingItems.push({ item: meat, qty: 1, forceFree: true });
                }
            }
            if (item.autoSides) {
                for (const sideId of item.autoSides) {
                    const side = menuItems.value.find(m => m.id === sideId);
                    if (side) pendingItems.push({ item: side, qty: 1, forceFree: true });
                }
            }
            activeCategory = 'meats';
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
    }

    function changeQty(idx: number, delta: number) {
        const p = pendingItems[idx];
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
        for (const p of pendingItems) {
            addItemToOrder(order.id, p.item, p.qty, p.weight, p.forceFree, p.isTakeout ? '[TAKEOUT]' : undefined);
        }
        pendingItems = [];
        onclose();
    }

    function undoPending() { pendingItems = []; }
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') onclose(); }} />

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
    <div class="flex h-[700px] w-full max-w-[1100px] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <div class="flex flex-1 flex-col overflow-hidden">
            <div class="flex items-start justify-between border-b border-border px-6 py-4">
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
                <button onclick={onclose} class="text-gray-400 hover:text-gray-600 p-2" aria-label="Close modal">✕</button>
            </div>

            <div class="flex gap-2 border-b border-border bg-surface-secondary px-6 py-3">
                {#each visibleCategories as cat}
                    <button
                        onclick={() => (activeCategory = cat.id)}
                        class={cn(
                            'flex flex-1 flex-col items-center justify-center gap-1 rounded-xl transition-all active:scale-95',
                            activeCategory === cat.id
                                ? 'bg-accent text-white shadow-md'
                                : 'border border-border bg-surface text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        )}
                        style="min-height: 72px"
                    >
                        <span class="text-2xl leading-none">{cat.label.split(' ')[0]}</span>
                        <span class="text-[11px] font-bold uppercase tracking-wide">{cat.label.split(' ').slice(1).join(' ')}</span>
                    </button>
                {/each}
            </div>

            {#if activeCategory === 'sides' || activeCategory === 'packages'}
                <div class="flex items-center gap-2 bg-status-green-light px-6 py-2.5">
                    <span class="text-xs font-semibold text-status-green">FREE — inventory tracked</span>
                </div>
            {/if}

            <div class="flex-1 overflow-y-auto p-6">
                {#if weightScreenItem}
                    <div class="flex h-full flex-col items-center justify-center gap-6">
                        <h3 class="text-3xl font-bold text-gray-900">{weightScreenItem.name}</h3>
                        <p class="text-sm text-gray-500">Enter weight from scale (grams)</p>
                        <div class="flex flex-wrap items-center justify-center gap-3 w-[400px]">
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
                    <div class="grid grid-cols-3 gap-4">
                        {#each filteredItems as item (item.id)}
                            <button
                                onclick={() => tapItem(item)}
                                class={cn(
                                    'relative flex flex-col gap-2.5 rounded-xl border text-left transition-all active:scale-[0.98] overflow-hidden',
                                    pendingItems.some(p => p.item.id === item.id)
                                        ? 'border-accent bg-accent-light'
                                        : 'border-border bg-surface-secondary hover:border-gray-300',
                                    item.protein === 'beef' ? '!border-l-red-500 !border-l-4' : '',
                                    item.protein === 'pork' ? '!border-l-orange-500 !border-l-4' : '',
                                    item.protein === 'chicken' ? '!border-l-yellow-500 !border-l-4' : ''
                                )}
                            >
                                {#if item.image}
                                    <div class="w-full h-28 bg-gray-100">
                                        <img src={item.image} alt={item.name} class="w-full h-full object-cover" />
                                    </div>
                                {/if}
                                <div class={cn('flex flex-col gap-2.5 px-5 pb-5', item.image ? 'pt-3' : 'pt-5')}>
                                    {#if item.protein}
                                        <span class={cn(
                                            "absolute top-3 right-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                            item.protein === 'beef' ? 'bg-red-100 text-red-700' : '',
                                            item.protein === 'pork' ? 'bg-orange-100 text-orange-700' : '',
                                            item.protein === 'chicken' ? 'bg-yellow-100 text-yellow-700' : ''
                                        )}>
                                            {item.protein === 'beef' ? '🥩' : item.protein === 'pork' ? '🐷' : '🍗'} {item.protein}
                                        </span>
                                    {/if}
                                    {#if item.category === 'packages'}
                                        <div class="flex items-center justify-between">
                                            <span class="text-base font-bold text-gray-900">{item.name}</span>
                                            {#if pendingItems.some(p => p.item.id === item.id)}
                                                <span class="rounded bg-accent px-2 py-0.5 text-[10px] font-bold text-white">ACTIVE</span>
                                            {/if}
                                        </div>
                                        {#if item.desc}<p class="text-sm text-gray-500">{item.desc}</p>{/if}
                                        <p class="font-mono text-sm font-bold text-gray-900">₱{item.price}/pax</p>
                                        {#if item.perks}<p class="text-xs text-status-green">✓ {item.perks}</p>{/if}
                                    {:else if item.isWeightBased}
                                        <span class="text-sm font-semibold text-gray-900">{item.name}</span>
                                        <span class="text-xs text-gray-400">tap to enter weight</span>
                                        <span class="font-mono text-xs font-bold text-gray-700">₱{((item.pricePerGram ?? 0) * 100).toFixed(0)}/100g</span>
                                    {:else}
                                        <span class="text-sm font-semibold text-gray-900">{item.name}</span>
                                        {#if item.isFree}
                                            <span class="text-xs font-semibold text-status-green">FREE</span>
                                        {:else}
                                            <span class="font-mono text-sm font-bold text-gray-900">{formatPeso(item.price)}</span>
                                        {/if}
                                    {/if}
                                </div>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <div class="flex w-[320px] shrink-0 flex-col border-l border-border bg-surface-secondary">
            <div class="flex flex-col gap-1.5 border-b border-border px-5 py-4">
                <h3 class="text-base font-bold text-gray-900">Pending Items</h3>
                <p class="text-xs text-gray-500">Review items before pushing to the bill.</p>
            </div>

            <div class="flex-1 overflow-y-auto divide-y divide-border px-5">
                {#if pendingItems.length === 0}
                    <div class="flex h-full items-center justify-center text-sm text-gray-400 py-12">
                        No items yet
                    </div>
                {:else}
                    {#each pendingItems as p, idx (p.item.id + idx)}
                        <div class="flex items-center justify-between py-3">
                            <div class="flex flex-col gap-0.5">
                                <div class="flex items-center gap-2">
                                    <span class="text-sm font-medium text-gray-900">{p.item.name}</span>
                                    {#if p.item.category === 'packages'}
                                        <span class="rounded bg-accent-light px-1.5 py-0.5 text-[10px] font-bold text-accent">PKG</span>
                                    {:else if p.forceFree}
                                        <span class="rounded bg-status-green-light px-1.5 py-0.5 text-[10px] font-bold text-status-green">FREE</span>
                                    {/if}
                                </div>
                                {#if p.weight}<span class="text-xs text-gray-400">{p.weight}g</span>{/if}
                            </div>
                            <div class="flex items-center gap-2">
                                {#if order.orderType === 'dine-in'}
                                    <button
                                        onclick={() => p.isTakeout = !p.isTakeout}
                                        class={cn('flex items-center justify-center rounded px-1.5 py-1 text-[10px] font-bold transition-colors w-16', p.isTakeout ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-transparent')}
                                    >
                                        {p.isTakeout ? '📦 To Go' : '🍽 Dine-In'}
                                    </button>
                                {/if}
                                <div class="flex items-center gap-1.5 ml-1">
                                    <button onclick={() => changeQty(idx, -1)} class="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-sm font-bold hover:bg-gray-200" style="min-height: unset">−</button>
                                    <span class="min-w-[1.5rem] text-center text-sm font-semibold">{p.item.isWeightBased && p.weight ? p.weight / 100 : p.qty}</span>
                                    <button onclick={() => changeQty(idx, +1)} class="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-sm font-bold hover:bg-gray-200" style="min-height: unset">+</button>
                                </div>
                            </div>
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
</div>
