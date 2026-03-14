<script lang="ts">
    import { untrack } from 'svelte';
    import type { Order, Table, DiscountType } from '$lib/types';
    import { recalcOrder, holdPayment, checkoutOrder } from '$lib/stores/pos.svelte';
    import { calculateOrderTotals } from '$lib/stores/pos/utils';
    import { printReceipt } from '$lib/stores/hardware.svelte';
    import { log } from '$lib/stores/audit.svelte';
    import { session, MANAGER_PIN } from '$lib/stores/session.svelte';
    import { formatPeso, cn } from '$lib/utils';
    import ManagerPinModal from './ManagerPinModal.svelte';
    import PhotoCapture from '$lib/components/PhotoCapture.svelte';
    import { ChevronDown, ChevronUp, Minus, Plus, X, Check, Pause, Banknote, Smartphone, Camera } from 'lucide-svelte';
    import { playSound } from '$lib/utils/audio';

    interface Props {
        order: Order;
        table: Table | null;
        onclose: () => void;
        onhold?: () => void;
        onsuccess: (paidOrder: Order, change: number, methodLabel: string) => void;
    }

    let { order, table, onclose, onhold, onsuccess }: Props = $props();

    let checkoutLoading = $state(false);
    let checkoutError = $state('');
    let showPinForDiscount = $state(false);
    let showDiscountConfirm = $state(false);
    let discountConfirmPin = $state('');
    let discountConfirmPinError = $state(false);
    $effect(() => { if (showDiscountConfirm) { discountConfirmPin = ''; discountConfirmPinError = false; } });
    let pendingDiscountType = $state<DiscountType>('none');

    // ─── Discount section expand/collapse ──────────────────────────────────────
    let discountExpanded = $state(
        untrack(() => (order.scCount ?? 0) > 0 || (order.pwdCount ?? 0) > 0 || Object.keys(order.discountEntries ?? {}).length > 0)
    );

    // ─── Multi-method payment state ─────────────────────────────────────────
    type PaymentMethod = 'cash' | 'gcash' | 'maya';
    interface PaymentEntry { method: PaymentMethod; amount: number }
    let paymentEntries = $state<PaymentEntry[]>([{ method: 'cash', amount: 0 }]);

    // Reset payment amounts to 0 whenever the modal opens for a *different* order.
    let prevOrderId = $state(untrack(() => order?.id));
    $effect(() => {
        const _id = order?.id;
        if (_id && _id !== prevOrderId) {
            untrack(() => {
                paymentEntries = paymentEntries.map(e => ({ ...e, amount: 0 }));
                prevOrderId = _id;
            });
        }
    });

    const totalPaid = $derived(paymentEntries.reduce((s, e) => s + (e.amount || 0), 0));
    const cashEntry = $derived(paymentEntries.find(e => e.method === 'cash'));
    const cashChange = $derived(cashEntry ? Math.max(0, (cashEntry.amount || 0) - (order.total - (totalPaid - (cashEntry.amount || 0)))) : 0);
    const paymentProgress = $derived(order.total > 0 ? Math.min(100, (totalPaid / order.total) * 100) : 0);
    const isFullyPaid = $derived(totalPaid >= order.total);
    const shortAmount = $derived(Math.max(0, order.total - totalPaid));

    function hasMethod(m: PaymentMethod) { return paymentEntries.some(e => e.method === m); }

    function toggleMethod(m: PaymentMethod) {
        playSound('click');
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
        exactForMethod('cash');
    }

    function selectCashPreset(amount: number) {
        playSound('click');
        if (hasMethod('cash')) setAmount('cash', amount);
    }

    function exactForMethod(m: PaymentMethod) {
        const otherTotal = paymentEntries.filter(e => e.method !== m).reduce((s, e) => s + (e.amount || 0), 0);
        setAmount(m, Math.max(0, order.total - otherTotal));
    }

    function selectEwalletPreset(m: PaymentMethod, amount: number) {
        playSound('click');
        setAmount(m, amount);
    }

    // Manager PIN grace period state
    let pinGraceUntil = $state<number>(0);
    let pinGraceSecondsLeft = $state(0);
    const hasPinGrace = $derived(pinGraceSecondsLeft > 0);
    $effect(() => {
        if (pinGraceUntil === 0) { pinGraceSecondsLeft = 0; return; }
        function tick() {
            const remaining = Math.max(0, Math.round((pinGraceUntil - Date.now()) / 1000));
            pinGraceSecondsLeft = remaining;
        }
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    });

    // Local discount state
    let localDiscountEntries = $state<Partial<Record<DiscountType, import('$lib/types').DiscountEntry>>>(
        untrack(() => {
            if (order.discountEntries) {
                // Backfill names/tins for entries migrated from pre-v14
                const parsed = JSON.parse(JSON.stringify(order.discountEntries));
                for (const entry of Object.values(parsed) as any[]) {
                    if (entry && typeof entry === 'object') {
                        entry.names = entry.names ?? Array.from({ length: entry.pax ?? 1 }, () => '');
                        entry.tins = entry.tins ?? Array.from({ length: entry.pax ?? 1 }, () => '');
                    }
                }
                return parsed;
            }
            if (order.discountType !== 'none') {
                const pax = order.discountPax ?? 1;
                return {
                    [order.discountType]: {
                        pax,
                        names: Array.from({ length: pax }, () => ''),
                        ids: order.discountIds ?? [],
                        tins: Array.from({ length: pax }, () => ''),
                        idPhotos: Array.from({ length: pax }, (_, i) => order.discountIdPhotos?.[i] ? [order.discountIdPhotos[i]] : [])
                    }
                };
            }
            const auto: Partial<Record<DiscountType, import('$lib/types').DiscountEntry>> = {};
            let remaining = order.pax;
            if ((order.scCount ?? 0) > 0) {
                const pax = Math.min(order.scCount!, remaining);
                auto['senior'] = { pax, names: Array.from({ length: pax }, () => ''), ids: Array.from({ length: pax }, () => ''), tins: Array.from({ length: pax }, () => ''), idPhotos: Array.from({ length: pax }, () => []) };
                remaining -= pax;
            }
            if ((order.pwdCount ?? 0) > 0 && remaining > 0) {
                const pax = Math.min(order.pwdCount!, remaining);
                auto['pwd'] = { pax, names: Array.from({ length: pax }, () => ''), ids: Array.from({ length: pax }, () => ''), tins: Array.from({ length: pax }, () => ''), idPhotos: Array.from({ length: pax }, () => []) };
            }
            return auto;
        })
    );

    $effect(() => {
        untrack(() => {
            if (Object.keys(localDiscountEntries).length > 0 && !order.discountEntries) {
                recalcWithEntries();
            }
        });
    });

    const activeScPwdTypes = $derived(['senior', 'pwd'].filter(t => {
        const e = localDiscountEntries[t as DiscountType];
        return e && e.pax > 0;
    }) as DiscountType[]);
    const hasDeclaredScPwd = $derived((order.scCount ?? 0) > 0 || (order.pwdCount ?? 0) > 0);
    const hasActiveDiscount = $derived(activeScPwdTypes.length > 0);

    const hasItems = $derived(order.items.filter(i => i.status !== 'cancelled').length > 0);

    const canConfirmCheckout = $derived(
        hasItems && totalPaid >= order.total &&
        activeScPwdTypes.every(type => {
            const entry = localDiscountEntries[type]!;
            const hasAllNames = (entry.names?.length ?? 0) >= entry.pax && entry.names.every(n => n.trim() !== '');
            const hasAllIds = entry.ids.length >= entry.pax && entry.ids.every(id => id.trim() !== '');
            return hasAllNames && hasAllIds;
        })
    );

    const checkoutBlockReason = $derived.by((): string | null => {
        if (canConfirmCheckout) return null;
        if (!hasItems) return 'No active items on this order.';
        const missingFields = activeScPwdTypes.filter(type => {
            const entry = localDiscountEntries[type]!;
            return entry.ids.some(id => id.trim() === '') || (entry.names ?? []).some(n => n.trim() === '');
        });
        if (missingFields.length > 0) {
            const labels = missingFields.map(t => t === 'senior' ? 'SC' : 'PWD').join(' & ');
            return `Fill in ${labels} name and ID to confirm`;
        }
        if (totalPaid < order.total) {
            return `Short by ${formatPeso(order.total - totalPaid)}`;
        }
        return null;
    });

    function recalcWithEntries() {
        const cleaned: typeof localDiscountEntries = {};
        for (const [k, v] of Object.entries(localDiscountEntries)) {
            if (v && v.pax > 0) cleaned[k as DiscountType] = v;
        }
        recalcOrder(order, { discountEntries: Object.keys(cleaned).length > 0 ? JSON.parse(JSON.stringify(cleaned)) : null });
    }

    function applyScPwdPax(type: DiscountType, newPax: number) {
        const otherType = type === 'senior' ? 'pwd' : 'senior';
        const otherPax = localDiscountEntries[otherType as DiscountType]?.pax ?? 0;
        const maxForType = order.pax - otherPax;
        const validatedPax = Math.max(0, Math.min(newPax, maxForType));
        if (localDiscountEntries[type]) {
            localDiscountEntries[type]!.pax = validatedPax;
            localDiscountEntries[type]!.names = Array.from({ length: validatedPax }, (_, i) => localDiscountEntries[type]!.names?.[i] ?? '');
            localDiscountEntries[type]!.ids = Array.from({ length: validatedPax }, (_, i) => localDiscountEntries[type]!.ids[i] ?? '');
            localDiscountEntries[type]!.tins = Array.from({ length: validatedPax }, (_, i) => localDiscountEntries[type]!.tins?.[i] ?? '');
            localDiscountEntries[type]!.idPhotos = Array.from({ length: validatedPax }, (_, i) => localDiscountEntries[type]!.idPhotos[i] ?? []);
        }
        recalcWithEntries();
    }

    function syncDiscountIds(type: DiscountType) {
        recalcWithEntries();
    }

    function previewDiscountAmount(type: DiscountType, paxCount: number): number {
        const testEntries: Partial<Record<DiscountType, import('$lib/types').DiscountEntry>> = {
            ...JSON.parse(JSON.stringify(localDiscountEntries)),
            [type]: { pax: paxCount, names: [], ids: [], tins: [], idPhotos: [] }
        };
        const { discountAmount } = calculateOrderTotals({
            ...order,
            discountType: type,
            discountEntries: testEntries
        });
        return discountAmount;
    }

    let pendingDiscountDescription = $state('Manager PIN required. Total will adjust based on active discounts.');

    function applyDiscount(type: DiscountType) {
        if (!hasPinGrace) {
            pendingDiscountType = type;
            if (type === 'senior' || type === 'pwd') {
                const declared = type === 'senior' ? (order.scCount ?? 0) : (order.pwdCount ?? 0);
                const prefillPax = Math.max(1, Math.min(declared || 1, order.pax));
                const amount = previewDiscountAmount(type, prefillPax);
                const label = type === 'senior' ? 'SC' : 'PWD';
                pendingDiscountDescription = `20% off for ${prefillPax} ${label} guest${prefillPax !== 1 ? 's' : ''} — estimated ${formatPeso(amount)}`;
            } else {
                pendingDiscountDescription = 'Manager PIN required. Total will adjust based on active discounts.';
            }
            showPinForDiscount = true;
            return;
        }
        toggleDiscountInternal(type);
    }

    function toggleDiscountInternal(type: DiscountType) {
        const isCurrentlyActive = !!localDiscountEntries[type];

        const tableLabel = order.orderType === 'takeout'
            ? `Takeout (${order.customerName ?? 'Walk-in'})`
            : (table?.label ?? '');

        if (isCurrentlyActive) {
            delete localDiscountEntries[type];
            log.discountRemoved(`${type} discount removed from ${tableLabel}`);
        } else {
            const declared = type === 'senior' ? (order.scCount ?? 0) : (order.pwdCount ?? 0);
            const prefillPax = Math.max(1, Math.min(declared || 1, order.pax));
            localDiscountEntries[type] = {
                pax: prefillPax,
                names: Array.from({ length: prefillPax }, () => ''),
                ids: Array.from({ length: prefillPax }, () => ''),
                tins: Array.from({ length: prefillPax }, () => ''),
                idPhotos: Array.from({ length: prefillPax }, () => [])
            };
            log.discountApplied(tableLabel, type, 0);
            discountExpanded = true;
        }
        recalcWithEntries();
    }

    function handlePinConfirmed() {
        showPinForDiscount = false;
        pinGraceUntil = Date.now() + 60000;

        toggleDiscountInternal(pendingDiscountType);

        log.managerPinVerified(`${pendingDiscountType} discount`);
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

        const activePayments = paymentEntries
            .filter(e => (e.amount || 0) > 0)
            .map(e => ({ method: e.method, amount: e.amount }));

        if (activePayments.length === 0 && order.total > 0) {
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

        const methodLabel = activePayments.length === 0 ? 'Comp'
            : activePayments.length === 1
            ? (activePayments[0].method === 'gcash' ? 'GCash' : activePayments[0].method === 'maya' ? 'Maya' : 'Cash')
            : 'Split';
        const actualChange = cashEntry ? Math.max(0, cashChange) : 0;

        checkoutError = '';
        checkoutLoading = false;
        playSound('sale');
        onsuccess(snapshot, actualChange, methodLabel);
    }

    // ─── Method display helpers ───────────────────────────────────────────────
    const methodMeta: Record<PaymentMethod, { label: string; color: string; activeColor: string; iconType: 'banknote' | 'phone' }> = {
        cash:  { label: 'Cash',  color: 'border-status-green/40 text-status-green', activeColor: 'bg-status-green text-white shadow-lg shadow-status-green/20', iconType: 'banknote' },
        gcash: { label: 'GCash', color: 'border-status-cyan/40 text-status-cyan', activeColor: 'bg-status-cyan text-white shadow-lg shadow-status-cyan/20', iconType: 'phone' },
        maya:  { label: 'Maya',  color: 'border-status-purple/40 text-status-purple', activeColor: 'bg-status-purple text-white shadow-lg shadow-status-purple/20', iconType: 'phone' },
    };
</script>

<!-- ═══ CHECKOUT MODAL ═══════════════════════════════════════════════════════ -->
<div class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
    <div class="w-full h-[95vh] sm:h-auto sm:max-w-[480px] sm:max-h-[92vh] flex flex-col overflow-hidden bg-white sm:rounded-2xl shadow-2xl">

        <!-- ─── HEADER ─────────────────────────────────────────────────────── -->
        <div class="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div class="flex items-center gap-2.5">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                    <Banknote class="h-4 w-4 text-accent" />
                </div>
                <div class="flex flex-col">
                    <span class="text-sm font-bold text-gray-900">Checkout</span>
                    <span class="text-[11px] text-gray-400">
                        {#if order.orderType === 'takeout'}
                            Takeout — {order.customerName ?? 'Walk-in'}
                        {:else}
                            {table?.label ?? 'Table'} · {order.pax} pax
                        {/if}
                    </span>
                </div>
            </div>
            <button onclick={onclose} class="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X class="h-5 w-5" />
            </button>
        </div>

        <!-- ─── SCROLLABLE CONTENT ─────────────────────────────────────────── -->
        <div class="flex-1 overflow-y-auto">

            <!-- ═══ SECTION 1: TOTAL HERO ═══════════════════════════════════ -->
            <div class="px-5 pt-5 pb-4">
                <!-- Total amount — big and bold -->
                <div class="text-center">
                    <p class="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Total Due</p>
                    <p class="font-mono text-4xl font-extrabold text-gray-900 tracking-tight">{formatPeso(order.total)}</p>
                </div>

                <!-- Compact summary -->
                <div class="mt-3 flex flex-col gap-1">
                    <div class="flex items-center justify-between text-xs text-gray-500">
                        <span>Subtotal ({order.packageId ? `${order.pax} pax` : `${order.items.filter(i => i.status !== 'cancelled').length} items`})</span>
                        <span class="font-mono font-medium">{formatPeso(order.subtotal)}</span>
                    </div>
                    {#if order.packageId && ((order.childPax ?? 0) > 0 || (order.freePax ?? 0) > 0)}
                        {@const pkgItem = order.items.find(i => i.tag === 'PKG' && i.status !== 'cancelled')}
                        {@const adultPax = Math.max(0, order.pax - (order.childPax ?? 0) - (order.freePax ?? 0))}
                        {#if adultPax > 0 && pkgItem}
                            <div class="flex justify-between text-[11px] text-gray-400 font-mono pl-2">
                                <span>{adultPax} adult × {formatPeso(pkgItem.unitPrice)}</span>
                                <span>{formatPeso(pkgItem.unitPrice * adultPax)}</span>
                            </div>
                        {/if}
                        {#if (order.childPax ?? 0) > 0 && pkgItem}
                            <div class="flex justify-between text-[11px] text-gray-400 font-mono pl-2">
                                <span>{order.childPax} child × {formatPeso(pkgItem.childUnitPrice ?? pkgItem.unitPrice)}</span>
                                <span>{formatPeso((pkgItem.childUnitPrice ?? pkgItem.unitPrice) * (order.childPax ?? 0))}</span>
                            </div>
                        {/if}
                        {#if (order.freePax ?? 0) > 0}
                            <div class="flex justify-between text-[11px] text-gray-400 font-mono pl-2">
                                <span>{order.freePax} free (&lt;5)</span>
                                <span>-</span>
                            </div>
                        {/if}
                    {/if}
                    {#if order.discountEntries && Object.keys(order.discountEntries).length > 0 && order.discountAmount > 0}
                        {#each Object.entries(order.discountEntries) as [type, entry]}
                            <div class="flex justify-between text-xs text-status-green">
                                <span>{type === 'senior' ? 'SC' : 'PWD'} 20% ({entry.pax} of {order.pax} pax)</span>
                            </div>
                        {/each}
                        <div class="flex justify-between text-xs text-status-green font-bold">
                            <span>Discount</span>
                            <span class="font-mono">-{formatPeso(order.discountAmount)}</span>
                        </div>
                    {:else if order.discountType !== 'none' && order.discountAmount > 0}
                        <div class="flex justify-between text-xs text-status-green">
                            <span>Discount</span>
                            <span class="font-mono font-medium">-{formatPeso(order.discountAmount)}</span>
                        </div>
                    {/if}
                    <div class="flex justify-between text-[11px] text-gray-400">
                        <span>{order.discountType === 'senior' || order.discountType === 'pwd' ? 'VAT Exempt' : 'Incl. VAT 12%'}</span>
                        <span class="font-mono">{formatPeso(order.vatAmount)}</span>
                    </div>
                </div>

                <!-- Payment progress bar -->
                <div class="mt-4 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                        class={cn(
                            'h-full rounded-full transition-all duration-300',
                            isFullyPaid ? 'bg-status-green' : paymentProgress > 50 ? 'bg-status-yellow' : 'bg-accent'
                        )}
                        style="width: {paymentProgress}%"
                    ></div>
                </div>
            </div>

            <!-- ═══ SECTION 2: PAYMENT ══════════════════════════════════════ -->
            <div class="px-5 pb-4">
                <!-- Method toggle pills -->
                <div class="flex gap-2 mb-4">
                    {#each (['cash', 'gcash', 'maya'] as const) as method}
                        {@const meta = methodMeta[method]}
                        {@const active = hasMethod(method)}
                        <button
                            onclick={() => toggleMethod(method)}
                            class={cn(
                                'flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-all active:scale-[0.97]',
                                active
                                    ? meta.activeColor
                                    : 'border-2 border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                            )}
                            style="min-height: 50px"
                        >
                            {#if meta.iconType === 'banknote'}
                                <Banknote class="h-4 w-4" />
                            {:else}
                                <Smartphone class="h-4 w-4" />
                            {/if}
                            {meta.label}
                        </button>
                    {/each}
                </div>

                <!-- Amount inputs for each active method -->
                {#each paymentEntries as entry (entry.method)}
                    {@const meta = methodMeta[entry.method]}
                    <div class="mb-3 rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden">
                        <!-- Method label + exact button -->
                        <div class="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">{meta.label}</span>
                            <button
                                onclick={() => exactForMethod(entry.method)}
                                class="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors min-h-[36px] px-2"
                            >
                                Fill exact amount
                            </button>
                        </div>

                        <!-- Amount display -->
                        <div class="px-4 py-3">
                            <div class="relative">
                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400 font-mono font-bold">₱</span>
                                <input
                                    type="number"
                                    value={entry.amount || ''}
                                    oninput={(e) => setAmount(entry.method, parseFloat((e.target as HTMLInputElement).value) || 0)}
                                    class="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-9 pr-4 text-center font-mono text-2xl font-extrabold text-gray-900 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
                                    min="0"
                                    placeholder="0"
                                    inputmode="numeric"
                                />
                            </div>
                        </div>

                        <!-- Preset buttons -->
                        <div class="px-4 pb-3">
                            {#if entry.method === 'cash'}
                                <div class="grid grid-cols-3 gap-1.5">
                                    {#each [500, 1000, 1500, 2000, 3000, 5000] as amount}
                                        <button
                                            onclick={() => selectCashPreset(amount)}
                                            class={cn(
                                                'rounded-lg py-2.5 font-mono text-sm font-bold transition-all active:scale-[0.97]',
                                                entry.amount === amount
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                                            )}
                                            style="min-height: 44px"
                                        >
                                            {amount >= 1000 ? `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K` : `₱${amount}`}
                                        </button>
                                    {/each}
                                </div>
                            {:else}
                                <div class="grid grid-cols-3 gap-1.5">
                                    {#each [500, 1000, 2000] as amount}
                                        <button
                                            onclick={() => selectEwalletPreset(entry.method, amount)}
                                            class={cn(
                                                'rounded-lg py-2.5 font-mono text-sm font-bold transition-all active:scale-[0.97]',
                                                entry.amount === amount
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                                            )}
                                            style="min-height: 44px"
                                        >
                                            {amount >= 1000 ? `${amount / 1000}K` : `₱${amount}`}
                                        </button>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>
                {/each}

                <!-- ═══ CHANGE / SHORT STATUS ═══════════════════════════════ -->
                {#if cashEntry && cashEntry.amount > 0 && isFullyPaid}
                    <div class="flex items-center justify-between rounded-xl bg-status-green/10 border border-status-green/25 px-5 py-4 mt-1">
                        <div class="flex flex-col">
                            <span class="text-[11px] font-semibold uppercase tracking-wider text-status-green/70">Cash Change</span>
                            <span class="text-xs text-gray-500 mt-0.5">Paid {formatPeso(totalPaid)}</span>
                        </div>
                        <span class="font-mono text-3xl font-extrabold text-status-green">{formatPeso(cashChange)}</span>
                    </div>
                {:else if totalPaid > 0 && !isFullyPaid}
                    <div class="flex items-center justify-between rounded-xl bg-status-red/5 border border-status-red/20 px-5 py-3 mt-1">
                        <span class="text-xs font-semibold text-status-red/80">Remaining</span>
                        <span class="font-mono text-lg font-bold text-status-red">{formatPeso(shortAmount)}</span>
                    </div>
                {:else if isFullyPaid && !cashEntry}
                    <div class="flex items-center justify-center gap-2 rounded-xl bg-status-green/10 border border-status-green/25 px-5 py-3 mt-1">
                        <Check class="h-4 w-4 text-status-green" />
                        <span class="text-sm font-bold text-status-green">Payment Complete — {formatPeso(totalPaid)}</span>
                    </div>
                {/if}
            </div>

            <!-- ═══ SECTION 3: DISCOUNTS (COLLAPSIBLE) ══════════════════════ -->
            <div class="border-t border-gray-100">
                <!-- Accordion header -->
                <button
                    onclick={() => discountExpanded = !discountExpanded}
                    class="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                    style="min-height: 44px"
                >
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold uppercase tracking-wider text-gray-400">Discounts</span>
                        {#if hasActiveDiscount}
                            <span class="rounded-full bg-status-green/15 px-2 py-0.5 text-[10px] font-bold text-status-green">
                                {activeScPwdTypes.length} active
                            </span>
                        {/if}
                        {#if hasDeclaredScPwd && !hasActiveDiscount}
                            <span class="rounded-full bg-status-yellow/15 px-2 py-0.5 text-[10px] font-bold text-status-yellow">
                                SC/PWD declared
                            </span>
                        {/if}
                    </div>
                    {#if discountExpanded}
                        <ChevronUp class="h-4 w-4 text-gray-400" />
                    {:else}
                        <ChevronDown class="h-4 w-4 text-gray-400" />
                    {/if}
                </button>

                {#if discountExpanded}
                    <div class="px-5 pb-4">
                        <!-- SC / PWD toggle buttons -->
                        <div class="grid grid-cols-2 gap-2 mb-3">
                            {#each [
                                { id: 'senior' as const, label: 'Senior Citizen 20%' },
                                { id: 'pwd' as const, label: 'Person with Disability 20%' }
                            ] as discount}
                                {@const entry = localDiscountEntries[discount.id]}
                                <button
                                    onclick={() => applyDiscount(discount.id)}
                                    class={cn(
                                        'rounded-xl px-3 py-2.5 font-semibold transition-all text-sm flex items-center justify-center gap-2',
                                        entry
                                            ? 'bg-status-green text-white shadow-md'
                                            : 'border-2 border-dashed border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                                    )}
                                    style="min-height: 48px"
                                >
                                    <span>{discount.label}</span>
                                    {#if entry}
                                        <span class="rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-bold">{entry.pax}</span>
                                    {/if}
                                </button>
                            {/each}
                        </div>

                        {#if pinGraceSecondsLeft > 0}
                            <div class="flex items-center gap-1.5 rounded-lg bg-status-yellow/10 px-3 py-1.5 text-[11px] text-status-yellow font-semibold mb-3">
                                PIN grace: {pinGraceSecondsLeft}s remaining
                            </div>
                        {/if}

                        <!-- Per-type detail sections -->
                        {#each [
                            { type: 'senior' as DiscountType, label: 'Senior Citizen', shortLabel: 'SC', declared: order.scCount ?? 0 },
                            { type: 'pwd' as DiscountType, label: 'PWD', shortLabel: 'PWD', declared: order.pwdCount ?? 0 }
                        ].filter(d => d.declared > 0 || !!localDiscountEntries[d.type]) as disc}
                            {@const entry = localDiscountEntries[disc.type]}
                            {@const currentPax = entry?.pax ?? 0}
                            {@const otherPax = localDiscountEntries[disc.type === 'senior' ? 'pwd' : 'senior']?.pax ?? 0}
                            {@const needsAttention = entry && entry.pax > 0 && (entry.ids.some(id => id.trim() === '') || (entry.names ?? []).some(n => n.trim() === ''))}
                            <div class={cn(
                                'rounded-xl p-4 mb-3 transition-all',
                                needsAttention
                                    ? 'bg-accent/5 border-2 border-accent shadow-[0_0_12px_rgba(234,88,12,0.25)] animate-border-pulse-accent'
                                    : entry && entry.pax > 0 && entry.ids.every(id => id.trim() !== '')
                                        ? 'bg-status-green/5 border border-status-green/30'
                                        : 'bg-gray-50 border border-gray-100'
                            )}>
                                <!-- Pax stepper -->
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex flex-col">
                                        <span class={cn('text-xs font-bold', needsAttention ? 'text-accent-dark' : 'text-gray-700')}>{disc.shortLabel} Qualifying Pax</span>
                                        <span class={cn('text-[10px]', needsAttention ? 'text-accent-dark/70' : 'text-gray-400')}>
                                            {#if currentPax > 0}
                                                {currentPax} of {order.pax} qualify
                                            {:else}
                                                Declared {disc.declared} — tap + to apply
                                            {/if}
                                        </span>
                                    </div>
                                    <div class="flex items-center gap-1.5">
                                        <button
                                            onclick={() => {
                                                if (currentPax === 1 && entry) applyScPwdPax(disc.type, 0);
                                                else if (currentPax > 1 && entry) applyScPwdPax(disc.type, currentPax - 1);
                                            }}
                                            disabled={currentPax <= 0}
                                            class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-25 transition-colors"
                                        ><Minus class="h-3.5 w-3.5" /></button>
                                        <span class={cn('w-8 text-center font-mono text-lg font-extrabold', currentPax > 0 ? 'text-gray-900' : 'text-gray-300')}>{currentPax}</span>
                                        <button
                                            onclick={() => {
                                                if (!entry) {
                                                    localDiscountEntries[disc.type] = { pax: 1, names: [''], ids: [''], tins: [''], idPhotos: [[]] };
                                                    recalcWithEntries();
                                                } else {
                                                    applyScPwdPax(disc.type, currentPax + 1);
                                                }
                                            }}
                                            disabled={currentPax >= order.pax - otherPax}
                                            class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-25 transition-colors"
                                        ><Plus class="h-3.5 w-3.5" /></button>
                                    </div>
                                </div>

                                <!-- Per-person fields (BIR compliance) -->
                                {#if entry}
                                    <div class={cn('flex flex-col gap-3 mt-3 pt-3', needsAttention ? 'border-t border-accent/20' : 'border-t border-gray-200')}>
                                        {#each entry.ids as _, i}
                                            {@const nameEmpty = (entry.names?.[i] ?? '').trim() === ''}
                                            {@const idEmpty = entry.ids[i].trim() === ''}
                                            {@const personIncomplete = nameEmpty || idEmpty}
                                            <div class={cn(
                                                'flex flex-col gap-1.5 rounded-lg p-2.5',
                                                personIncomplete ? 'bg-accent/5' : 'bg-status-green/5'
                                            )}>
                                                <span class={cn('text-[11px] font-bold', personIncomplete ? 'text-accent-dark' : 'text-status-green')}>{disc.shortLabel} #{i + 1}</span>
                                                <!-- Name (required) -->
                                                <input
                                                    type="text"
                                                    bind:value={entry.names[i]}
                                                    oninput={() => syncDiscountIds(disc.type)}
                                                    placeholder="Full name *"
                                                    class={cn(
                                                        'w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition-all',
                                                        nameEmpty
                                                            ? 'border-2 border-accent bg-white animate-border-pulse-accent placeholder:text-accent/60 placeholder:font-bold focus:border-accent focus:ring-2 focus:ring-accent/30'
                                                            : 'border border-status-green/40 bg-white focus:border-status-green focus:ring-2 focus:ring-status-green/20'
                                                    )}
                                                />
                                                <!-- ID + Photo (required) -->
                                                <div class="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        bind:value={entry.ids[i]}
                                                        oninput={() => syncDiscountIds(disc.type)}
                                                        placeholder="{disc.shortLabel} ID number *"
                                                        class={cn(
                                                            'flex-1 min-w-0 rounded-lg px-3 py-2 text-sm focus:outline-none transition-all',
                                                            idEmpty
                                                                ? 'border-2 border-accent bg-white animate-border-pulse-accent placeholder:text-accent/60 placeholder:font-bold focus:border-accent focus:ring-2 focus:ring-accent/30'
                                                                : 'border border-status-green/40 bg-white focus:border-status-green focus:ring-2 focus:ring-status-green/20'
                                                        )}
                                                    />
                                                    <PhotoCapture
                                                        photos={entry.idPhotos[i] ?? []}
                                                        onchange={(photos) => {
                                                            entry.idPhotos[i] = photos;
                                                            recalcWithEntries();
                                                        }}
                                                        max={1}
                                                        label=""
                                                    />
                                                </div>
                                                <!-- TIN (optional) -->
                                                <input
                                                    type="text"
                                                    bind:value={entry.tins[i]}
                                                    oninput={() => syncDiscountIds(disc.type)}
                                                    placeholder="TIN (optional)"
                                                    class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
                                                />
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <!-- ─── FOOTER (STICKY) ────────────────────────────────────────────── -->
        <div class="shrink-0 border-t border-gray-100 bg-white px-5 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
            {#if checkoutError}
                <div class="rounded-xl bg-status-red/5 border border-status-red/20 p-4 mb-3">
                    <p class="text-sm font-bold text-status-red mb-1">Printer Error</p>
                    <p class="text-xs text-status-red/80 mb-3">{checkoutError}</p>
                    <div class="flex gap-2">
                        <button onclick={skipReceipt} class="flex-1 rounded-lg border border-status-red/30 bg-white py-2.5 text-sm font-semibold text-status-red hover:bg-status-red/5 transition-colors" style="min-height: 44px">
                            Skip Receipt
                        </button>
                        <button onclick={confirmCheckout} class="flex-1 rounded-lg bg-status-red py-2.5 text-sm font-bold text-white hover:bg-red-600 transition-colors" style="min-height: 44px">
                            Retry Print
                        </button>
                    </div>
                </div>
            {/if}

            {#if checkoutBlockReason && !checkoutError}
                <div class="flex items-center justify-center rounded-lg bg-status-yellow/10 border border-status-yellow/25 px-4 py-3 mb-3">
                    <span class="text-sm font-bold text-yellow-700">{checkoutBlockReason}</span>
                </div>
            {/if}

            {#if !checkoutError}
                <div class="flex gap-2.5">
                    <!-- Hold for Manager -->
                    <button
                        onclick={onhold ?? onclose}
                        disabled={checkoutLoading}
                        class="flex items-center justify-center gap-1.5 rounded-xl border-2 border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.97]"
                        style="min-height: 52px"
                        title="Pause payment — manager required to resume"
                    >
                        <Pause class="h-4 w-4" />
                        <span class="hidden sm:inline">Hold</span>
                    </button>

                    <!-- Pending e-wallet (only when single e-wallet selected) -->
                    {#if paymentEntries.length === 1 && paymentEntries[0].method !== 'cash'}
                        <button
                            onclick={() => { holdPayment(order.id, paymentEntries[0].method === 'maya' ? 'maya' : 'gcash'); onclose(); }}
                            disabled={!hasItems || checkoutLoading}
                            class="flex items-center justify-center gap-1.5 rounded-xl border-2 border-status-cyan/30 bg-white px-4 text-sm font-semibold text-status-cyan hover:bg-status-cyan/5 transition-all active:scale-[0.97] disabled:opacity-40"
                            style="min-height: 52px"
                            title="Await e-wallet confirmation"
                        >
                            <Pause class="h-4 w-4" />
                            <span class="text-xs">Pending</span>
                        </button>
                    {/if}

                    <!-- Confirm button -->
                    <button
                        onclick={() => {
                            if (order.discountAmount > 0 && !hasPinGrace) {
                                showDiscountConfirm = true;
                            } else {
                                confirmCheckout();
                            }
                        }}
                        disabled={!canConfirmCheckout || checkoutLoading}
                        class={cn(
                            'flex flex-1 items-center justify-center gap-2 rounded-xl text-white text-base font-bold transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed',
                            isFullyPaid
                                ? 'bg-status-green hover:bg-emerald-600 shadow-lg shadow-status-green/25'
                                : 'bg-gray-300 cursor-not-allowed'
                        )}
                        style="min-height: 52px"
                    >
                        {#if checkoutLoading}
                            <span class="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Printing...
                        {:else}
                            <Check class="h-5 w-5" />
                            Confirm {formatPeso(order.total)}
                        {/if}
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>

<!-- ═══ MANAGER PIN MODAL (DISCOUNT AUTH) ════════════════════════════════════ -->
<ManagerPinModal
    isOpen={showPinForDiscount}
    title={`Authorize ${pendingDiscountType === 'senior' ? 'Senior Citizen' : pendingDiscountType === 'pwd' ? 'PWD' : 'Discount'}`}
    description={pendingDiscountDescription}
    confirmLabel="Authorize"
    onClose={() => { showPinForDiscount = false; pendingDiscountType = 'none'; }}
    onConfirm={handlePinConfirmed}
/>

<!-- ═══ DISCOUNT CONFIRM + PIN MODAL ════════════════════════════════════════ -->
{#if showDiscountConfirm}
    <div class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
        <div class="w-full max-w-[400px] flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[95vh] overflow-y-auto">
            <div class="px-6 py-4 border-b border-gray-100">
                <h3 class="text-lg font-bold text-gray-900">Confirm Discount</h3>
                <p class="text-xs text-gray-400 mt-0.5">Manager PIN required to authorize</p>
            </div>
            <div class="flex flex-col gap-3 px-6 py-4">
                <!-- Discount summary -->
                {#if hasActiveDiscount}
                    <div class="flex flex-col gap-1 rounded-xl bg-status-green/5 border border-status-green/15 px-4 py-3">
                        {#each activeScPwdTypes as type}
                            {@const entry = localDiscountEntries[type]!}
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-gray-700">{type === 'senior' ? 'SC' : 'PWD'} 20%</span>
                                <span class="font-mono font-semibold text-status-green">{entry.pax} pax · -{formatPeso(order.discountAmount)}</span>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div class="rounded-xl bg-status-yellow/10 border border-status-yellow/20 px-4 py-3">
                        <span class="text-sm font-semibold text-yellow-700">No discount applied — full price will be charged.</span>
                    </div>
                {/if}

                <!-- PIN dots -->
                <div class="flex flex-col gap-2 mt-1">
                    <span class="text-xs font-semibold text-gray-400 text-center">Enter Manager PIN</span>
                    <div class="flex justify-center gap-3">
                        {#each [0, 1, 2, 3] as idx}
                            <div class={cn(
                                'h-3.5 w-3.5 rounded-full border-2 transition-all',
                                idx < discountConfirmPin.length
                                    ? (discountConfirmPinError ? 'bg-status-red border-status-red' : 'bg-gray-900 border-gray-900')
                                    : 'border-gray-300'
                            )}></div>
                        {/each}
                    </div>
                    {#if discountConfirmPinError}
                        <p class="text-center text-xs font-semibold text-status-red">Incorrect PIN. Try again.</p>
                    {/if}
                </div>

                <!-- Numpad -->
                <div class="grid grid-cols-3 gap-2">
                    {#each [1,2,3,4,5,6,7,8,9] as num}
                        <button
                            onclick={() => { discountConfirmPinError = false; if (discountConfirmPin.length < 4) { discountConfirmPin += String(num); playSound('click'); } }}
                            class="flex items-center justify-center rounded-xl border border-gray-200 bg-white text-lg font-bold text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                            style="min-height: 52px"
                        >{num}</button>
                    {/each}
                    <button
                        onclick={() => { discountConfirmPin = ''; discountConfirmPinError = false; }}
                        class="flex items-center justify-center rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                        style="min-height: 52px"
                    >Clear</button>
                    <button
                        onclick={() => { discountConfirmPinError = false; if (discountConfirmPin.length < 4) { discountConfirmPin += '0'; playSound('click'); } }}
                        class="flex items-center justify-center rounded-xl border border-gray-200 bg-white text-lg font-bold text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        style="min-height: 52px"
                    >0</button>
                    <button
                        onclick={() => { discountConfirmPin = discountConfirmPin.slice(0, -1); discountConfirmPinError = false; }}
                        class="flex items-center justify-center rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                        style="min-height: 52px"
                    >&#9003;</button>
                </div>
            </div>
            <div class="flex gap-3 px-6 py-4 border-t border-gray-100">
                <button
                    onclick={() => { showDiscountConfirm = false; }}
                    class="flex-1 rounded-xl border-2 border-gray-200 bg-white py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    style="min-height: 48px"
                >
                    Go Back
                </button>
                <button
                    onclick={() => {
                        if (discountConfirmPin !== MANAGER_PIN) { discountConfirmPinError = true; playSound('error'); return; }
                        playSound('success');
                        pinGraceUntil = Date.now() + 60000;
                        showDiscountConfirm = false;
                        confirmCheckout();
                    }}
                    disabled={discountConfirmPin.length !== 4}
                    class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-status-green text-white text-sm font-bold hover:bg-emerald-600 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style="min-height: 48px"
                >
                    <Check class="h-4 w-4" />
                    Proceed
                </button>
            </div>
        </div>
    </div>
{/if}
