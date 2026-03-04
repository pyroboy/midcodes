<script lang="ts">
    import type { Order, Table, DiscountType } from '$lib/types';
    import { closeTable, recalcOrder, holdPayment } from '$lib/stores/pos.svelte';
    import { printReceipt } from '$lib/stores/hardware.svelte';
    import { log } from '$lib/stores/audit.svelte';
    import { session } from '$lib/stores/session.svelte';
    import { formatPeso, cn } from '$lib/utils';
    import ManagerPinModal from './ManagerPinModal.svelte';

    interface Props {
        order: Order;
        table: Table | null;
        onclose: () => void;
        onsuccess: () => void;
    }

    let { order, table, onclose, onsuccess }: Props = $props();

    let checkoutLoading = $state(false);
    let checkoutError = $state('');
    let checkoutMethod = $state<'cash' | 'gcash' | 'maya'>('cash');
    let cashTendered = $state<number>(0);
    let showPinForDiscount = $state(false);
    let pendingDiscountType = $state<DiscountType>('none');

    const cashChange = $derived(cashTendered - order.total);
    const hasItems = $derived(order.items.filter(i => i.status !== 'cancelled').length > 0);
    const canConfirmCheckout = $derived(
        hasItems && (checkoutMethod !== 'cash' || cashTendered >= order.total)
    );

    function selectCashPreset(amount: number) {
        cashTendered = amount;
    }

    function exactCash() {
        cashTendered = order.total;
    }

    function applyDiscount(type: DiscountType) {
        // Comp and Service Recovery require manager PIN (100% write-offs)
        if ((type === 'comp' || type === 'service_recovery') && order.discountType !== type) {
            pendingDiscountType = type;
            showPinForDiscount = true;
            return;
        }
        const prev = order.discountType;
        order.discountType = (prev === type) ? 'none' : type;
        recalcOrder(order);
        if (table) table.billTotal = order.total;
        const tableLabel = order.orderType === 'takeout'
            ? `Takeout (${order.customerName ?? 'Walk-in'})`
            : (table?.label ?? '');
        if (order.discountType !== 'none') {
            log.discountApplied(tableLabel, order.discountType, order.discountAmount);
        } else {
            log.discountRemoved(tableLabel);
        }
    }

    function handlePinConfirmed() {
        showPinForDiscount = false;
        order.discountType = pendingDiscountType;
        recalcOrder(order);
        if (table) table.billTotal = order.total;
        const tableLabel = order.orderType === 'takeout'
            ? `Takeout (${order.customerName ?? 'Walk-in'})`
            : (table?.label ?? '');
        log.discountApplied(tableLabel, order.discountType, order.discountAmount);
        log.managerPinVerified(`${pendingDiscountType} discount on ${tableLabel}`);
        pendingDiscountType = 'none';
    }

    async function confirmCheckout() {
        if (!canConfirmCheckout) return;

        checkoutLoading = true;
        checkoutError = '';

        try {
            order.printStatus = 'printing';
            const printResult = await printReceipt(order.id);

            if (!printResult.success) {
                checkoutError = printResult.error || 'Unknown Printer Error';
                order.printStatus = 'failed';
                checkoutLoading = false;
                return;
            }

            finalizeCheckout(false);
        } catch (err) {
            checkoutError = err instanceof Error ? err.message : 'Unknown error during checkout';
            order.printStatus = 'failed';
            checkoutLoading = false;
        }
    }

    function skipReceipt() {
        finalizeCheckout(true);
    }

    function finalizeCheckout(skippedPrint: boolean = false) {
        order.printStatus = skippedPrint ? 'failed' : 'success';
        const methodLabel = checkoutMethod === 'cash' ? 'Cash' : checkoutMethod === 'gcash' ? 'GCash' : 'Maya';
        const label = order.orderType === 'takeout'
            ? `Takeout (${order.customerName ?? 'Walk-in'})`
            : (table?.label ?? '');

        // Record payment
        order.payments.push({
            method: checkoutMethod === 'maya' ? 'gcash' : checkoutMethod,
            amount: checkoutMethod === 'cash' ? cashTendered : order.total
        });
        order.status = 'paid';
        order.closedAt = new Date().toISOString();
        order.closedBy = session.userName || 'Staff';

        // Free the table for dine-in
        if (order.tableId) {
            closeTable(order.tableId);
        }

        log.tableClosed(label, order.total, methodLabel);
        checkoutError = '';
        checkoutLoading = false;
        onsuccess();
    }
</script>

<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div class="pos-card w-[460px] flex flex-col gap-0 overflow-hidden p-0">
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
            <div class="flex justify-between text-sm text-gray-600">
                <span>Subtotal ({order.items.filter(i => i.status !== 'cancelled').length} items)</span>
                <span class="font-mono font-semibold">{formatPeso(order.subtotal)}</span>
            </div>
            {#if order.discountType !== 'none'}
                <div class="flex justify-between text-sm text-status-green">
                    <span>Discount ({order.discountType === 'senior' ? 'Senior 20%' : 'PWD 20%'})</span>
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

        <div class="flex items-center gap-2 border-b border-border px-6 py-3 overflow-x-auto">
            <span class="text-xs font-semibold text-gray-500 mr-auto shrink-0">Discount:</span>
            {#each [
                { id: 'senior' as const, label: '👴 Senior' },
                { id: 'pwd' as const, label: '♿ PWD' },
                { id: 'promo' as const, label: '🎟️ Promo' },
                { id: 'comp' as const, label: '💯 Comp' },
                { id: 'service_recovery' as const, label: '❤️ Service Rec' }
            ] as discount}
                <button
                    onclick={() => applyDiscount(discount.id)}
                    class={cn(
                        'shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                        order.discountType === discount.id
                            ? 'bg-status-green text-white shadow-md'
                            : 'border border-border bg-surface text-gray-600 hover:bg-gray-50'
                    )}
                    style="min-height: 32px"
                >
                    {discount.label}
                </button>
            {/each}
        </div>

        <div class="flex flex-col gap-3 border-b border-border px-6 py-4">
            <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Payment Method</span>
            <div class="grid grid-cols-3 gap-2">
                {#each [
                    { id: 'cash' as const, label: '💵 Cash' },
                    { id: 'gcash' as const, label: '📱 GCash' },
                    { id: 'maya' as const, label: '📱 Maya' }
                ] as method}
                    <button
                        onclick={() => { checkoutMethod = method.id; if (method.id !== 'cash') cashTendered = 0; }}
                        class={cn(
                            'flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all active:scale-95',
                            checkoutMethod === method.id
                                ? 'bg-accent text-white shadow-md'
                                : 'border border-border bg-surface text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        )}
                        style="min-height: 48px"
                    >
                        {method.label}
                    </button>
                {/each}
            </div>
        </div>

        {#if checkoutMethod === 'cash'}
            <div class="flex flex-col gap-3 border-b border-border px-6 py-4">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Cash Tendered</span>
                    <button onclick={exactCash} class="text-xs font-semibold text-accent hover:underline" style="min-height: unset">Exact</button>
                </div>

                <div class="flex items-center justify-center rounded-xl bg-surface-secondary border border-border py-3">
                    <span class={cn(
                        'font-mono text-3xl font-extrabold',
                        cashTendered > 0 ? 'text-gray-900' : 'text-gray-300'
                    )}>
                        {cashTendered > 0 ? formatPeso(cashTendered) : '₱0.00'}
                    </span>
                </div>

                <div class="grid grid-cols-4 gap-2">
                    {#each [20, 50, 100, 200, 500, 1000, 1500, 2000] as amount}
                        <button
                            onclick={() => selectCashPreset(amount)}
                            class={cn(
                                'rounded-lg py-2 font-mono text-sm font-bold transition-all active:scale-95',
                                cashTendered === amount
                                    ? 'bg-accent text-white'
                                    : 'border border-border bg-surface text-gray-700 hover:bg-gray-50'
                            )}
                            style="min-height: 40px"
                        >
                            ₱{amount.toLocaleString()}
                        </button>
                    {/each}
                </div>

                <input
                    type="number"
                    bind:value={cashTendered}
                    placeholder="Enter custom amount"
                    class="pos-input text-center font-mono text-lg"
                    min="0"
                />

                {#if cashTendered >= order.total}
                    <div class="flex items-center justify-between rounded-xl bg-status-green-light border border-status-green/20 px-4 py-3">
                        <span class="text-sm font-semibold text-status-green">Change</span>
                        <span class="font-mono text-2xl font-extrabold text-status-green">{formatPeso(cashChange)}</span>
                    </div>
                {:else if cashTendered > 0}
                    <div class="flex items-center justify-between rounded-xl bg-status-red-light border border-status-red/20 px-4 py-2">
                        <span class="text-xs font-semibold text-status-red">Short by {formatPeso(order.total - cashTendered)}</span>
                    </div>
                {/if}
            </div>
        {/if}

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
                {#if checkoutMethod !== 'cash'}
                    <button
                        onclick={() => { holdPayment(order.id, checkoutMethod === 'maya' ? 'maya' : 'gcash'); onclose(); }}
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
    description="Comp and Service Recovery discounts write off the entire bill. Enter Manager PIN to authorize."
    confirmLabel="Authorize"
    onClose={() => { showPinForDiscount = false; pendingDiscountType = 'none'; }}
    onConfirm={handlePinConfirmed}
/>
