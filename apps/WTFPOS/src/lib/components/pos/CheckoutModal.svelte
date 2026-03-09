<script lang="ts">
    import { untrack } from 'svelte';
    import type { Order, Table, DiscountType } from '$lib/types';
    import { recalcOrder, holdPayment, checkoutOrder } from '$lib/stores/pos.svelte';
    import { printReceipt } from '$lib/stores/hardware.svelte';
    import { log } from '$lib/stores/audit.svelte';
    import { session } from '$lib/stores/session.svelte';
    import { formatPeso, cn } from '$lib/utils';
    import ManagerPinModal from './ManagerPinModal.svelte';
    import PhotoCapture from '$lib/components/PhotoCapture.svelte';

    interface Props {
        order: Order;
        table: Table | null;
        onclose: () => void;
        onsuccess: (paidOrder: Order, change: number, methodLabel: string) => void;
    }

    let { order, table, onclose, onsuccess }: Props = $props();

    let checkoutLoading = $state(false);
    let checkoutError = $state('');
    let showPinForDiscount = $state(false);
    let pendingDiscountType = $state<DiscountType>('none');

    // ─── Multi-method payment state ─────────────────────────────────────────
    type PaymentMethod = 'cash' | 'gcash' | 'maya';
    interface PaymentEntry { method: PaymentMethod; amount: number }
    let paymentEntries = $state<PaymentEntry[]>([{ method: 'cash', amount: 0 }]);

    const totalPaid = $derived(paymentEntries.reduce((s, e) => s + (e.amount || 0), 0));
    const cashEntry = $derived(paymentEntries.find(e => e.method === 'cash'));
    const cashChange = $derived(cashEntry ? Math.max(0, (cashEntry.amount || 0) - (order.total - (totalPaid - (cashEntry.amount || 0)))) : 0);

    function hasMethod(m: PaymentMethod) { return paymentEntries.some(e => e.method === m); }

    function toggleMethod(m: PaymentMethod) {
        if (hasMethod(m)) {
            if (paymentEntries.length > 1) {
                paymentEntries = paymentEntries.filter(e => e.method !== m);
            }
        } else {
            paymentEntries = [...paymentEntries, { method: m, amount: 0 }];
        }
    }

    function setAmount(m: PaymentMethod, val: number) {
        paymentEntries = paymentEntries.map(e => e.method === m ? { ...e, amount: val } : e);
    }

    function exactCash() {
        if (paymentEntries.length === 1) {
            setAmount(paymentEntries[0].method, order.total);
        } else {
            // Fill remaining on cash
            const otherTotal = paymentEntries.filter(e => e.method !== 'cash').reduce((s, e) => s + (e.amount || 0), 0);
            setAmount('cash', Math.max(0, order.total - otherTotal));
        }
    }

    function selectCashPreset(amount: number) {
        if (hasMethod('cash')) setAmount('cash', amount);
    }

    // Local discount state — never mutate the RxDB proxy directly.
    // The actual DB value is updated via recalcOrder(); the reactive order prop
    // will reflect the new totals once RxDB propagates the change.
    let localDiscountType = $state<DiscountType>(untrack(() => order.discountType));
    let discountPaxInput  = $state<number>(untrack(() => order.discountPax ?? 1));
    let discountIdsInput  = $state<string[]>([]);
    // Restore persisted photos from RxDB on mount (BIR audit trail survives modal close)
    let discountIdPhotos  = $state<string[][]>(untrack(() => {
        const stored = order.discountIdPhotos ?? [];
        const pax = order.discountPax ?? 1;
        return Array.from({ length: pax }, (_, i) => (stored[i] ? [stored[i]] : []));
    }));

    const showScPwdSection = $derived(localDiscountType === 'senior' || localDiscountType === 'pwd');

    const hasItems = $derived(order.items.filter(i => i.status !== 'cancelled').length > 0);
    const canConfirmCheckout = $derived(
        hasItems && totalPaid >= order.total &&
        (!(localDiscountType === 'senior' || localDiscountType === 'pwd') ||
         (discountIdsInput.length === discountPaxInput && discountIdsInput.every(id => id.trim() !== '')))
    );

    function applyScPwdPax(newPax: number) {
        const validatedPax = Math.max(1, Math.min(newPax, order.pax));
        discountPaxInput = validatedPax;
        discountIdsInput = Array.from({ length: validatedPax }, (_, i) => discountIdsInput[i] ?? '');
        discountIdPhotos = Array.from({ length: validatedPax }, (_, i) => discountIdPhotos[i] ?? []);
        recalcOrder(order, { discountType: localDiscountType, discountPax: validatedPax, discountIds: [...discountIdsInput] });
    }

    function syncDiscountIds() {
        // discountIdsInput is already updated by Svelte bind — just persist to DB
        recalcOrder(order, { discountType: localDiscountType, discountPax: discountPaxInput, discountIds: [...discountIdsInput] });
    }

    function applyDiscount(type: DiscountType) {
        // All discount types require manager PIN — SC-13/SC-14 compliance
        if (type !== 'none' && localDiscountType !== type) {
            pendingDiscountType = type;
            showPinForDiscount = true;
            return;
        }
        const newType: DiscountType = (localDiscountType === type) ? 'none' : type;
        localDiscountType = newType;

        if (newType === 'none') {
            discountPaxInput = order.pax;
            discountIdsInput = [];
        } else if (newType === 'senior' || newType === 'pwd') {
            discountPaxInput = order.discountPax ?? 1;
            discountIdsInput = Array.from({ length: discountPaxInput }, (_, i) => order.discountIds?.[i] ?? '');
        }

        recalcOrder(order, { discountType: newType, discountPax: discountPaxInput, discountIds: [...discountIdsInput] });

        const tableLabel = order.orderType === 'takeout'
            ? `Takeout (${order.customerName ?? 'Walk-in'})`
            : (table?.label ?? '');
        if (newType !== 'none') {
            log.discountApplied(tableLabel, newType, order.discountAmount);
        } else {
            log.discountRemoved(tableLabel);
        }
    }

    function handlePinConfirmed() {
        showPinForDiscount = false;
        localDiscountType = pendingDiscountType;
        // P0-01: Initialize ID input slots so the form renders immediately after PIN
        discountIdsInput = Array.from({ length: discountPaxInput }, (_, i) => discountIdsInput[i] ?? '');
        discountIdPhotos = Array.from({ length: discountPaxInput }, (_, i) => discountIdPhotos[i] ?? []);
        recalcOrder(order, { discountType: pendingDiscountType, discountPax: discountPaxInput, discountIds: [...discountIdsInput] });
        const tableLabel = order.orderType === 'takeout'
            ? `Takeout (${order.customerName ?? 'Walk-in'})`
            : (table?.label ?? '');
        log.discountApplied(tableLabel, pendingDiscountType, order.discountAmount);
        log.managerPinVerified(`${pendingDiscountType} discount on ${tableLabel}`);
        pendingDiscountType = 'none';
    }

    async function confirmCheckout() {
        if (!order || !canConfirmCheckout) return;

        checkoutLoading = true;
        checkoutError = '';

        try {
            const printResult = await printReceipt(order.id);

            if (!printResult.success) {
                checkoutError = printResult.error || 'Unknown Printer Error';
                checkoutLoading = false;
                return;
            }

            await finalizeCheckout();
        } catch (err) {
            console.error('[CHECKOUT] Error during confirmCheckout:', err);
            checkoutError = err instanceof Error ? err.message : 'Unknown error during checkout';
            checkoutLoading = false;
        }
    }

    async function skipReceipt() {
        await finalizeCheckout();
    }

    async function finalizeCheckout() {
        if (!order) { checkoutLoading = false; return; }

        // Build the payments array (only include entries with amount > 0)
        const activePayments = paymentEntries
            .filter(e => (e.amount || 0) > 0)
            .map(e => ({ method: e.method, amount: e.amount }));

        if (activePayments.length === 0) {
            checkoutError = 'Enter a payment amount to continue.';
            checkoutLoading = false;
            return;
        }

        try {
            await checkoutOrder(order.id, activePayments, order.tableId ?? null);
        } catch (err) {
            console.error('[CHECKOUT] finalizeCheckout error:', err);
            checkoutError = err instanceof Error ? err.message : 'Checkout failed';
            checkoutLoading = false;
            return;
        }

        const snapshot: Order = { ...order, payments: [...order.payments], items: [...order.items], closedAt: order.closedAt ?? new Date().toISOString() };

        const methodLabel = activePayments.length === 1
            ? (activePayments[0].method === 'gcash' ? 'GCash' : activePayments[0].method === 'maya' ? 'Maya' : 'Cash')
            : 'Split';
        const actualChange = cashEntry ? Math.max(0, cashChange) : 0;

        checkoutError = '';
        checkoutLoading = false;
        onsuccess(snapshot, actualChange, methodLabel);
    }
</script>

<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div class="pos-card w-[460px] flex flex-col gap-0 overflow-y-auto p-0 max-h-[95vh]">
        <div class="flex items-center justify-between border-b border-border px-6 py-4">
            <div class="flex items-center gap-3">
                <span class="text-lg font-bold text-gray-900">Checkout</span>
                {#if order.orderType === 'takeout'}
                    <span class="rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold text-white">TAKEOUT</span>
                {:else}
                    <span class="text-sm font-semibold text-gray-500">{table?.label}</span>
                {/if}
            </div>
            <button onclick={onclose} class="text-gray-400 hover:text-gray-600 text-lg" style="min-height: unset">✕</button>
        </div>

        <div class="flex flex-col gap-2 border-b border-border px-6 py-4 bg-surface-secondary">
            {#if order.packageId && ((order.childPax ?? 0) > 0 || (order.freePax ?? 0) > 0)}
                {@const pkgItem = order.items.find(i => i.tag === 'PKG' && i.status !== 'cancelled')}
                {@const adultPax = Math.max(0, order.pax - (order.childPax ?? 0) - (order.freePax ?? 0))}
                <div class="flex flex-col gap-0.5 text-xs text-gray-500 font-mono">
                    {#if adultPax > 0 && pkgItem}
                        <div class="flex justify-between">
                            <span>{adultPax} adult{adultPax !== 1 ? 's' : ''} × ₱{pkgItem.unitPrice}</span>
                            <span>{formatPeso(pkgItem.unitPrice * adultPax)}</span>
                        </div>
                    {/if}
                    {#if (order.childPax ?? 0) > 0 && pkgItem}
                        <div class="flex justify-between">
                            <span>{order.childPax} child{(order.childPax ?? 0) !== 1 ? 'ren' : ''} × ₱{pkgItem.childUnitPrice ?? pkgItem.unitPrice}</span>
                            <span>{formatPeso((pkgItem.childUnitPrice ?? pkgItem.unitPrice) * (order.childPax ?? 0))}</span>
                        </div>
                    {/if}
                    {#if (order.freePax ?? 0) > 0}
                        <div class="flex justify-between text-gray-400">
                            <span>{order.freePax} free (&lt;5)</span>
                            <span>₱0</span>
                        </div>
                    {/if}
                </div>
            {/if}
            <div class="flex justify-between text-sm text-gray-600">
                <span>Subtotal ({order.packageId ? `${order.pax} pax` : `${order.items.filter(i => i.status !== 'cancelled').length} items`})</span>
                <span class="font-mono font-semibold">{formatPeso(order.subtotal)}</span>
            </div>
            {#if order.discountType !== 'none' && order.discountAmount > 0}
                {@const discountLabel =
                    order.discountType === 'senior' ? `Senior Citizen 20% (${order.discountPax ?? 1} of ${order.pax} pax)` :
                    order.discountType === 'pwd'    ? `PWD 20% (${order.discountPax ?? 1} of ${order.pax} pax)` :
                    order.discountType === 'promo'  ? 'Promo Discount' :
                    order.discountType === 'comp'   ? 'Complimentary' :
                    'Service Recovery'}
                <div class="flex justify-between text-sm text-status-green">
                    <span>{discountLabel}</span>
                    <span class="font-mono font-semibold">-{formatPeso(order.discountAmount)}</span>
                </div>
            {/if}
            <div class="flex justify-between text-sm text-gray-500">
                <span>VAT {order.discountType === 'senior' || order.discountType === 'pwd' ? '(exempt)' : '(inclusive)'}</span>
                <span class="font-mono">{formatPeso(order.vatAmount)}</span>
            </div>
            <div class="flex justify-between border-t border-border pt-2 mt-1">
                <span class="text-base font-bold text-gray-900">TOTAL</span>
                <span class="font-mono text-2xl font-extrabold text-gray-900">{formatPeso(order.total)}</span>
            </div>
        </div>

        <div class="flex flex-col gap-2 border-b border-border px-6 py-3">
            <span class="text-xs font-semibold text-gray-500">Discount:</span>
            <!-- SC and PWD: primary row — most common discounts, always visible -->
            <div class="grid grid-cols-2 gap-2">
                {#each [
                    { id: 'senior' as const, label: '👴 Senior Citizen (20%)' },
                    { id: 'pwd' as const, label: '♿ PWD (20%)' }
                ] as discount}
                    <button
                        onclick={() => applyDiscount(discount.id)}
                        class={cn(
                            'rounded-xl px-3 font-semibold transition-all text-sm min-h-[44px]',
                            localDiscountType === discount.id
                                ? 'bg-status-green text-white shadow-md'
                                : 'border border-border bg-surface text-gray-700 hover:bg-gray-50'
                        )}
                    >
                        {discount.label}
                    </button>
                {/each}
            </div>
            <!-- Secondary discounts: smaller row -->
            <div class="grid grid-cols-3 gap-2">
                {#each [
                    { id: 'promo' as const, label: '🎟️ Promo' },
                    { id: 'comp' as const, label: '💯 Comp' },
                    { id: 'service_recovery' as const, label: '❤️ Service Rec' }
                ] as discount}
                    <button
                        onclick={() => applyDiscount(discount.id)}
                        class={cn(
                            'rounded-lg px-2 text-xs font-semibold transition-all min-h-[44px]',
                            localDiscountType === discount.id
                                ? 'bg-status-green text-white shadow-md'
                                : 'border border-border bg-surface text-gray-600 hover:bg-gray-50'
                        )}
                    >
                        {discount.label}
                    </button>
                {/each}
            </div>
        </div>

        {#if showScPwdSection}
            <div class="flex flex-col gap-3 border-b border-border px-6 py-4 bg-surface-secondary">
                <!-- Qualifying pax stepper -->
                <div class="flex items-center justify-between">
                    <div class="flex flex-col gap-0.5">
                        <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Qualifying Persons ({localDiscountType === 'senior' ? 'Senior Citizen' : 'PWD'})
                        </span>
                        <span class="text-[10px] text-gray-400">
                            {discountPaxInput} of {order.pax} pax qualify for 20% discount
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            onclick={() => applyScPwdPax(discountPaxInput - 1)}
                            disabled={discountPaxInput <= 1}
                            class="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-lg font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-30"
                        >−</button>
                        <span class="w-8 text-center font-mono text-xl font-extrabold text-gray-900">{discountPaxInput}</span>
                        <button
                            onclick={() => applyScPwdPax(discountPaxInput + 1)}
                            disabled={discountPaxInput >= order.pax}
                            class="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-lg font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-30"
                        >+</button>
                    </div>
                </div>
                <!-- SC/PWD ID inputs -->
                <div class="flex flex-col gap-2">
                    <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-400">ID Numbers (required to confirm checkout)</span>
                    {#each discountIdsInput as _, i}
                        <div class="flex flex-col gap-1.5">
                            <div class="flex items-center gap-2">
                                <span class="w-20 shrink-0 text-xs font-semibold text-gray-500">
                                    {localDiscountType === 'senior' ? 'SC' : 'PWD'} ID #{i + 1}
                                </span>
                                <input
                                    type="text"
                                    bind:value={discountIdsInput[i]}
                                    oninput={syncDiscountIds}
                                    placeholder="e.g. 12345678"
                                    class="pos-input flex-1 text-sm"
                                />
                            </div>
                            <PhotoCapture
                                photos={discountIdPhotos[i] ?? []}
                                onchange={(photos) => {
                                    discountIdPhotos[i] = photos;
                                    // Persist to RxDB so photos survive modal close (BIR audit trail)
                                    const flat = discountIdPhotos.map(p => p[0] ?? '');
                                    recalcOrder(order, { discountType: localDiscountType, discountPax: discountPaxInput, discountIds: [...discountIdsInput], discountIdPhotos: flat });
                                }}
                                max={1}
                                label="📷 Attach ID photo"
                            />
                        </div>
                    {/each}
                </div>
                <!-- Live discount preview -->
                <div class="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                    <span class="text-xs font-semibold text-emerald-700">
                        Discount ({discountPaxInput}/{order.pax} pax × 20%)
                    </span>
                    <span class="font-mono text-sm font-bold text-emerald-700">−{formatPeso(order.discountAmount)}</span>
                </div>
            </div>
        {/if}

        <!-- Payment method toggles + amount inputs -->
        <div class="flex flex-col gap-3 border-b border-border px-6 py-4">
            <div class="flex items-center justify-between">
                <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Payment Method</span>
                <span class="text-xs text-gray-400">Tap to add/remove</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
                {#each [
                    { id: 'cash' as const, label: '💵 Cash' },
                    { id: 'gcash' as const, label: '📱 GCash' },
                    { id: 'maya' as const, label: '📱 Maya' }
                ] as method}
                    <button
                        onclick={() => toggleMethod(method.id)}
                        class={cn(
                            'flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all active:scale-95',
                            hasMethod(method.id)
                                ? 'bg-accent text-white shadow-md'
                                : 'border border-border bg-surface text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        )}
                        style="min-height: 48px"
                    >
                        {method.label}
                    </button>
                {/each}
            </div>

            <!-- Amount inputs for each active method -->
            {#each paymentEntries as entry (entry.method)}
                <div class="flex flex-col gap-2 rounded-xl bg-surface-secondary border border-border p-4">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-gray-600">
                            {entry.method === 'cash' ? '💵 Cash' : entry.method === 'gcash' ? '📱 GCash' : '📱 Maya'}
                        </span>
                        {#if entry.method === 'cash'}
                            <button onclick={exactCash} class="text-xs font-semibold text-accent hover:underline" style="min-height: unset">Exact</button>
                        {/if}
                    </div>
                    <input
                        type="number"
                        value={entry.amount || 0}
                        oninput={(e) => setAmount(entry.method, parseFloat((e.target as HTMLInputElement).value) || 0)}
                        class="pos-input text-center font-mono text-xl font-bold"
                        min="0"
                        placeholder="0"
                    />
                    {#if entry.method === 'cash'}
                        <!-- Cash preset buttons -->
                        <div class="grid grid-cols-4 gap-1.5">
                            {#each [20, 50, 100, 200, 500, 1000, 1500, 2000] as amount}
                                <button
                                    onclick={() => selectCashPreset(amount)}
                                    class={cn(
                                        'rounded-lg py-1.5 font-mono text-xs font-bold transition-all active:scale-95 min-h-[44px]',
                                        entry.amount === amount
                                            ? 'bg-accent text-white'
                                            : 'border border-border bg-surface text-gray-700 hover:bg-gray-50'
                                    )}
                                >
                                    ₱{amount.toLocaleString()}
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/each}

            <!-- Running totals -->
            <div class="flex items-center justify-between rounded-lg bg-surface px-3 py-2 border border-border">
                <span class="text-sm font-semibold text-gray-600">Total Paid</span>
                <span class={cn('font-mono text-lg font-extrabold', totalPaid >= order.total ? 'text-status-green' : 'text-gray-900')}>
                    {formatPeso(totalPaid)}
                </span>
            </div>

            {#if cashEntry && cashEntry.amount > 0 && totalPaid >= order.total}
                <div class="flex items-center justify-between rounded-xl bg-status-green-light border border-status-green/20 px-4 py-3">
                    <span class="text-sm font-semibold text-status-green">Cash Change</span>
                    <span class="font-mono text-2xl font-extrabold text-status-green">{formatPeso(cashChange)}</span>
                </div>
            {:else if totalPaid > 0 && totalPaid < order.total}
                <div class="flex items-center justify-between rounded-xl bg-status-red-light border border-status-red/20 px-4 py-2">
                    <span class="text-xs font-semibold text-status-red">Short by {formatPeso(order.total - totalPaid)}</span>
                </div>
            {/if}
        </div>

        {#if checkoutError}
            <div class="px-6 py-4 mx-6 mt-4 mb-2 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center text-center gap-2">
                <p class="text-sm font-bold text-red-700">Hardware Error</p>
                <p class="text-sm text-red-600">{checkoutError}</p>
                <div class="flex gap-3 w-full mt-3">
                    <button class="btn-secondary flex-1 border-red-200 hover:bg-red-100 text-red-700 font-semibold" onclick={skipReceipt}>Skip Receipt</button>
                    <button class="btn-primary flex-1 bg-red-600 hover:bg-red-700" onclick={confirmCheckout}>Retry Print</button>
                </div>
            </div>
        {/if}

        {#if !checkoutError}
            <div class="flex gap-3 px-6 py-4">
                <button
                    onclick={onclose}
                    class="btn-ghost flex-1"
                    style="min-height: 48px"
                    disabled={checkoutLoading}
                >
                    Cancel
                </button>
                {#if paymentEntries.length === 1 && paymentEntries[0].method !== 'cash'}
                    <button
                        onclick={() => { holdPayment(order.id, paymentEntries[0].method === 'maya' ? 'maya' : 'gcash'); onclose(); }}
                        class="btn-secondary flex-1 border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                        style="min-height: 48px"
                        disabled={!hasItems || checkoutLoading}
                    >
                        ⏳ Hold Payment
                    </button>
                {/if}
                <button
                    onclick={confirmCheckout}
                    disabled={!canConfirmCheckout || checkoutLoading}
                    class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-status-green text-white text-base font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style="min-height: 48px"
                >
                    {#if checkoutLoading}
                        <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Printing...
                    {:else}
                        ✓ Confirm Payment
                    {/if}
                </button>
            </div>
        {/if}
    </div>
</div>

<ManagerPinModal
    isOpen={showPinForDiscount}
    title="Authorize Discount"
    description="All discounts require Manager PIN authorization. Enter PIN to apply."
    confirmLabel="Authorize"
    onClose={() => { showPinForDiscount = false; pendingDiscountType = 'none'; }}
    onConfirm={handlePinConfirmed}
/>
