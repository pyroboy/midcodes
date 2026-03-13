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

    // ─── Multi-method payment state ─────────────────────────────────────────
    type PaymentMethod = 'cash' | 'gcash' | 'maya';
    interface PaymentEntry { method: PaymentMethod; amount: number }
    let paymentEntries = $state<PaymentEntry[]>([{ method: 'cash', amount: 0 }]);

    // Reset payment amounts to 0 whenever the modal opens for a *different* order.
    // Track the previous ID so RxDB mutations on the same order don't re-zero amounts.
    let prevOrderId = $state(order?.id);
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
        exactForMethod('cash');
    }

    function selectCashPreset(amount: number) {
        if (hasMethod('cash')) setAmount('cash', amount);
    }

    // Fill the exact remaining balance for a given e-wallet method
    function exactForMethod(m: PaymentMethod) {
        const otherTotal = paymentEntries.filter(e => e.method !== m).reduce((s, e) => s + (e.amount || 0), 0);
        setAmount(m, Math.max(0, order.total - otherTotal));
    }

    function selectEwalletPreset(m: PaymentMethod, amount: number) {
        setAmount(m, amount);
    }

    // Manager PIN grace period state
    let pinGraceUntil = $state<number>(0);

    // Reactive countdown for the PIN grace window (updates every second via effect)
    let pinGraceSecondsLeft = $state(0);
    // NOTE: Do NOT use Date.now() in $derived — it's evaluated once and becomes stale.
    // Derive from pinGraceSecondsLeft which is kept current by the setInterval below.
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

    // Local discount state — never mutate the RxDB proxy directly.
    // Ensure we parse the DB state into a local deep copy.
    let localDiscountEntries = $state<Partial<Record<DiscountType, import('$lib/types').DiscountEntry>>>(
        untrack(() => {
            if (order.discountEntries) return JSON.parse(JSON.stringify(order.discountEntries));
            // Backwards compatibility for old discountType format
            if (order.discountType !== 'none') {
                return {
                    [order.discountType]: {
                        pax: order.discountPax ?? 1,
                        ids: order.discountIds ?? [],
                        idPhotos: Array.from({ length: order.discountPax ?? 1 }, (_, i) => order.discountIdPhotos?.[i] ? [order.discountIdPhotos[i]] : [])
                    }
                };
            }
            // Auto-activate SC/PWD from table-open declaration (mutually exclusive per person)
            const auto: Partial<Record<DiscountType, import('$lib/types').DiscountEntry>> = {};
            let remaining = order.pax;
            if ((order.scCount ?? 0) > 0) {
                const pax = Math.min(order.scCount!, remaining);
                auto['senior'] = { pax, ids: Array.from({ length: pax }, () => ''), idPhotos: Array.from({ length: pax }, () => []) };
                remaining -= pax;
            }
            if ((order.pwdCount ?? 0) > 0 && remaining > 0) {
                const pax = Math.min(order.pwdCount!, remaining);
                auto['pwd'] = { pax, ids: Array.from({ length: pax }, () => ''), idPhotos: Array.from({ length: pax }, () => []) };
            }
            return auto;
        })
    );

    // Auto-recalc totals on mount if SC/PWD were pre-activated
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
            return entry.ids.length === entry.pax && entry.ids.every(id => id.trim() !== '');
        })
    );

    // Human-readable reason why Confirm is blocked — shown as a hint above the button.
    const checkoutBlockReason = $derived.by((): string | null => {
        if (canConfirmCheckout) return null;
        if (!hasItems) return 'No active items on this order.';
        const missingIds = activeScPwdTypes.filter(type => {
            const entry = localDiscountEntries[type]!;
            return entry.ids.some(id => id.trim() === '');
        });
        if (missingIds.length > 0) {
            const labels = missingIds.map(t => t === 'senior' ? 'SC' : 'PWD').join(' & ');
            return `Enter all ${labels} ID numbers above to confirm.`;
        }
        if (totalPaid < order.total) {
            return `Still short by ${formatPeso(order.total - totalPaid)} — add more payment.`;
        }
        return null;
    });

    function recalcWithEntries() {
        // Only persist entries with pax > 0 to the order — keeps receipt and totals clean
        const cleaned: typeof localDiscountEntries = {};
        for (const [k, v] of Object.entries(localDiscountEntries)) {
            if (v && v.pax > 0) cleaned[k as DiscountType] = v;
        }
        recalcOrder(order, { discountEntries: Object.keys(cleaned).length > 0 ? JSON.parse(JSON.stringify(cleaned)) : null });
    }

    function applyScPwdPax(type: DiscountType, newPax: number) {
        // SC + PWD combined must not exceed total pax
        const otherType = type === 'senior' ? 'pwd' : 'senior';
        const otherPax = localDiscountEntries[otherType as DiscountType]?.pax ?? 0;
        const maxForType = order.pax - otherPax;
        const validatedPax = Math.max(0, Math.min(newPax, maxForType));
        if (localDiscountEntries[type]) {
            localDiscountEntries[type]!.pax = validatedPax;
            localDiscountEntries[type]!.ids = Array.from({ length: validatedPax }, (_, i) => localDiscountEntries[type]!.ids[i] ?? '');
            localDiscountEntries[type]!.idPhotos = Array.from({ length: validatedPax }, (_, i) => localDiscountEntries[type]!.idPhotos[i] ?? []);
        }
        recalcWithEntries();
    }

    function syncDiscountIds(type: DiscountType) {
        recalcWithEntries();
    }

    // Compute a preview of the discount amount for a given type + pax count.
    // Used in the PIN modal description so the manager knows what they're approving.
    function previewDiscountAmount(type: DiscountType, paxCount: number): number {
        const testEntries: Partial<Record<DiscountType, import('$lib/types').DiscountEntry>> = {
            ...JSON.parse(JSON.stringify(localDiscountEntries)),
            [type]: { pax: paxCount, ids: [], idPhotos: [] }
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
            // Build a human-readable description with the estimated discount amount
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
                ids: Array.from({ length: prefillPax }, () => ''),
                idPhotos: Array.from({ length: prefillPax }, () => [])
            };
            log.discountApplied(tableLabel, type, 0); // amount is logged as 0 here since recalculation happens async
        }
        recalcWithEntries();
    }

    function handlePinConfirmed() {
        showPinForDiscount = false;
        pinGraceUntil = Date.now() + 60000; // 60-second grace period
        
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

        // Build the payments array (only include entries with amount > 0)
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
        onsuccess(snapshot, actualChange, methodLabel);
    }
</script>

<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div class="pos-card w-[460px] flex flex-col gap-0 p-0 max-h-[95vh] overflow-hidden">
        <div class="sticky top-0 z-10 flex items-center justify-between border-b border-border px-6 py-4 shrink-0 bg-surface">
            <div class="flex items-center gap-3">
                <span class="text-lg font-bold text-gray-900">Checkout</span>
                {#if order.orderType === 'takeout'}
                    <span class="rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold text-white">TAKEOUT</span>
                {:else}
                    <span class="text-sm font-semibold text-gray-500">{table?.label}</span>
                {/if}
            </div>
            <button onclick={onclose} class="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <div class="flex-1 overflow-y-auto flex flex-col">

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
            {#if order.discountEntries && Object.keys(order.discountEntries).length > 0 && order.discountAmount > 0}
                {#each Object.entries(order.discountEntries) as [type, entry]}
                    {@const discountLabel =
                        type === 'senior' ? `Senior Citizen 20% (${entry.pax} of ${order.pax} pax)` :
                        `PWD 20% (${entry.pax} of ${order.pax} pax)`}
                    <div class="flex justify-between text-sm text-status-green">
                        <span>{discountLabel}</span>
                    </div>
                {/each}
                <div class="flex justify-between text-sm text-status-green font-bold border-t border-status-green/20 pt-1 mt-1">
                    <span>Total Discount ({Object.keys(order.discountEntries).length} applied)</span>
                    <span class="font-mono">-{formatPeso(order.discountAmount)}</span>
                </div>
            {:else if order.discountType !== 'none' && order.discountAmount > 0}
                <div class="flex justify-between text-sm text-status-green">
                    <span>Discount</span>
                    <span class="font-mono font-semibold">-{formatPeso(order.discountAmount)}</span>
                </div>
            {/if}
            <div class="flex justify-between border-t border-border pt-2 mt-1">
                <span class="text-base font-bold text-gray-900">TOTAL</span>
                <span class="font-mono text-2xl font-extrabold text-gray-900">{formatPeso(order.total)}</span>
            </div>
            <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>{order.discountType === 'senior' || order.discountType === 'pwd' ? 'VAT Exempt' : 'Incl. VAT (12%):'}</span>
                <span class="font-mono">{formatPeso(order.vatAmount)}</span>
            </div>
        </div>

        <div class="flex flex-col gap-2 border-b border-border px-6 py-3">
            <span class="text-xs font-semibold text-gray-500">Discount:</span>
            <!-- SC and PWD: primary row — most common discounts, always visible -->
            <div class="grid grid-cols-2 gap-2">
                {#each [
                    { id: 'senior' as const, label: '👴 Senior Citizen (20%)', shortLabel: 'SC' },
                    { id: 'pwd' as const, label: '♿ PWD (20%)', shortLabel: 'PWD' }
                ] as discount}
                    {@const entry = localDiscountEntries[discount.id]}
                    <button
                        onclick={() => applyDiscount(discount.id)}
                        class={cn(
                            'rounded-xl px-3 font-semibold transition-all text-sm min-h-[44px]',
                            entry
                                ? 'bg-status-green text-white shadow-md'
                                : 'border border-border bg-surface text-gray-700 hover:bg-gray-50'
                        )}
                    >
                        {discount.label}
                        {#if entry}
                            <span class="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">{entry.pax}</span>
                        {/if}
                    </button>
                {/each}
            </div>
            {#if pinGraceSecondsLeft > 0}
                <div class="flex items-center gap-1.5 rounded-lg bg-status-yellow/10 px-3 py-1.5 text-xs text-status-yellow font-semibold w-fit">
                    ⏱ PIN grace: {pinGraceSecondsLeft}s remaining
                </div>
            {/if}
        </div>

        {#each [
            { type: 'senior' as DiscountType, label: 'Senior Citizen', shortLabel: 'SC', declared: order.scCount ?? 0 },
            { type: 'pwd' as DiscountType, label: 'PWD', shortLabel: 'PWD', declared: order.pwdCount ?? 0 }
        ].filter(d => d.declared > 0 || !!localDiscountEntries[d.type]) as disc}
            {@const entry = localDiscountEntries[disc.type]}
            {@const currentPax = entry?.pax ?? 0}
            {@const otherPax = localDiscountEntries[disc.type === 'senior' ? 'pwd' : 'senior']?.pax ?? 0}
            <div class="flex flex-col gap-3 border-b border-border px-6 py-4 bg-surface-secondary">
                <!-- Qualifying pax stepper — always visible when declared -->
                <div class="flex items-center justify-between">
                    <div class="flex flex-col gap-0.5">
                        <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            {disc.shortLabel} Qualifying Persons
                        </span>
                        <span class="text-[10px] text-gray-400">
                            {#if currentPax > 0}
                                {currentPax} of {order.pax} pax qualify for 20% discount
                            {:else}
                                Declared {disc.declared} {disc.shortLabel} — tap + to apply discount
                            {/if}
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            onclick={() => {
                                if (currentPax === 1 && entry) {
                                    applyScPwdPax(disc.type, 0);
                                } else if (currentPax > 1 && entry) {
                                    applyScPwdPax(disc.type, currentPax - 1);
                                }
                            }}
                            disabled={currentPax <= 0}
                            class="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-lg font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-30"
                        >−</button>
                        <span class={cn('w-8 text-center font-mono text-xl font-extrabold', currentPax > 0 ? 'text-gray-900' : 'text-gray-300')}>{currentPax}</span>
                        <button
                            onclick={() => {
                                if (!entry) {
                                    // Re-add the discount entry at 1 pax
                                    localDiscountEntries[disc.type] = {
                                        pax: 1,
                                        ids: [''],
                                        idPhotos: [[]]
                                    };
                                    recalcWithEntries();
                                } else {
                                    applyScPwdPax(disc.type, currentPax + 1);
                                }
                            }}
                            disabled={currentPax >= order.pax - otherPax}
                            class="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-lg font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-30"
                        >+</button>
                    </div>
                </div>
                {#if entry}
                    <div class="flex flex-col gap-2">
                        <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-400">ID Numbers (required to confirm checkout)</span>
                        {#each entry.ids as _, i}
                            <div class="flex flex-col gap-1.5">
                                <div class="flex items-center gap-2">
                                    <span class="w-20 shrink-0 text-xs font-semibold text-gray-500">
                                        {disc.shortLabel} ID #{i + 1}
                                    </span>
                                    <input
                                        type="text"
                                        bind:value={entry.ids[i]}
                                        oninput={() => syncDiscountIds(disc.type)}
                                        placeholder="e.g. 12345678"
                                        class="pos-input flex-1 text-sm"
                                    />
                                </div>
                                <PhotoCapture
                                    photos={entry.idPhotos[i] ?? []}
                                    onchange={(photos) => {
                                        entry.idPhotos[i] = photos;
                                        recalcWithEntries();
                                    }}
                                    max={1}
                                    label="📷 Attach ID photo"
                                />
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/each}

        <!-- Payment method toggles + amount inputs -->
        <div class="flex flex-col gap-3 px-6 py-4">
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
                            <button onclick={exactCash} class="text-xs font-semibold text-accent hover:bg-accent/10 rounded-md min-h-[44px] px-3 transition-colors shrink-0">Exact</button>
                        {:else}
                            <button onclick={() => exactForMethod(entry.method)} class="text-xs font-semibold text-accent hover:bg-accent/10 rounded-md min-h-[44px] px-3 transition-colors shrink-0">Exact</button>
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
                            {#each [20, 50, 100, 200, 500, 1000, 2000, 5000] as amount}
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
                    {:else}
                        <!-- GCash / Maya preset buttons — common e-wallet amounts -->
                        <div class="grid grid-cols-5 gap-1.5">
                            {#each [100, 500, 1000, 2000, 5000] as amount}
                                <button
                                    onclick={() => selectEwalletPreset(entry.method, amount)}
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
        </div>

        <!-- Running totals — inside scroll area so they don't crowd the footer -->
        <div class="flex flex-col gap-2 px-6 py-4 border-t border-border">
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
        </div>

        <div class="shrink-0 flex flex-col gap-3 px-6 py-4 bg-surface border-t border-border shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-10">
            {#if checkoutError}
                <div class="bg-red-50 border border-red-200 rounded-xl flex flex-col items-center text-center gap-2 p-4">
                    <p class="text-sm font-bold text-red-700">Hardware Error</p>
                    <p class="text-sm text-red-600">{checkoutError}</p>
                    <div class="flex gap-3 w-full mt-2">
                        <button class="btn-secondary flex-1 border-red-200 hover:bg-red-100 text-red-700 font-semibold" onclick={skipReceipt}>Skip Receipt</button>
                        <button class="btn-primary flex-1 bg-red-600 hover:bg-red-700" onclick={confirmCheckout}>Retry Print</button>
                    </div>
                </div>
            {/if}

            {#if checkoutBlockReason && !checkoutError}
                <div class="flex items-center gap-2 rounded-lg bg-status-yellow/10 border border-status-yellow/30 px-3 py-2">
                    <span class="text-status-yellow text-sm leading-none shrink-0">⚠</span>
                    <span class="text-xs font-semibold text-yellow-700">{checkoutBlockReason}</span>
                </div>
            {/if}

            {#if !checkoutError}
                <div class="flex gap-3">
                    <button
                        onclick={onhold ?? onclose}
                        class="btn-secondary flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white shadow-sm"
                        style="min-height: 48px"
                        disabled={checkoutLoading}
                        title="Pause payment entry — manager required to resume."
                    >
                        ⏸ Hold for Manager
                    </button>
                    {#if paymentEntries.length === 1 && paymentEntries[0].method !== 'cash'}
                        <button
                            onclick={() => { holdPayment(order.id, paymentEntries[0].method === 'maya' ? 'maya' : 'gcash'); onclose(); }}
                            class="btn-secondary flex-1 border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                            style="min-height: 48px"
                            disabled={!hasItems || checkoutLoading}
                            title="Mark order as pending e-wallet confirmation — cashier will confirm once payment clears."
                        >
                            ⏸ Pending {paymentEntries[0].method === 'maya' ? 'Maya' : 'GCash'}
                        </button>
                    {/if}
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
                            'flex flex-1 items-center justify-center gap-2 rounded-xl text-white text-base font-bold active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                            order.discountAmount > 0
                                ? 'bg-status-green hover:bg-emerald-600'
                                : 'bg-status-green hover:bg-emerald-600'
                        )}
                        style="min-height: 48px"
                    >
                        {#if checkoutLoading}
                            <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Printing...
                        {:else if order.discountAmount > 0}
                            ✓ Confirm Discount
                        {:else}
                            ✓ Confirm Payment
                        {/if}
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>

<ManagerPinModal
    isOpen={showPinForDiscount}
    title={`Authorize ${pendingDiscountType === 'senior' ? 'Senior Citizen' : pendingDiscountType === 'pwd' ? 'PWD' : 'Discount'}`}
    description={pendingDiscountDescription}
    confirmLabel="Authorize"
    onClose={() => { showPinForDiscount = false; pendingDiscountType = 'none'; }}
    onConfirm={handlePinConfirmed}
/>

{#if showDiscountConfirm}
    <div class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="pos-card w-[400px] flex flex-col gap-0 p-0 overflow-hidden max-h-[95vh] overflow-y-auto">
            <div class="px-6 py-4 border-b border-border bg-surface">
                <h3 class="text-lg font-bold text-gray-900">Confirm Discount</h3>
                <p class="text-xs text-gray-500 mt-0.5">Manager PIN required to authorize</p>
            </div>
            <div class="flex flex-col gap-3 px-6 py-4">
                <div class="flex flex-col gap-2 rounded-xl bg-surface-secondary border border-border px-4 py-3">
                    {#if (order.scCount ?? 0) > 0}
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-semibold text-gray-700">👴 Senior Citizen</span>
                            <span class="font-mono font-bold text-gray-900">{order.scCount} pax</span>
                        </div>
                    {/if}
                    {#if (order.pwdCount ?? 0) > 0}
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-semibold text-gray-700">♿ PWD</span>
                            <span class="font-mono font-bold text-gray-900">{order.pwdCount} pax</span>
                        </div>
                    {/if}
                </div>
                {#if hasActiveDiscount}
                    <div class="flex flex-col gap-1 rounded-xl bg-status-green/10 border border-status-green/20 px-4 py-3">
                        {#each activeScPwdTypes as type}
                            {@const entry = localDiscountEntries[type]!}
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-gray-700">{type === 'senior' ? 'SC' : 'PWD'} 20%</span>
                                <span class="font-mono font-semibold text-status-green">{entry.pax} pax · −{formatPeso(order.discountAmount)}</span>
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
                    <span class="text-xs font-semibold text-gray-500 text-center">Enter Manager PIN</span>
                    <div class="flex justify-center gap-3">
                        {#each [0, 1, 2, 3] as idx}
                            <div class={cn(
                                'h-4 w-4 rounded-full border-2 transition-all',
                                idx < discountConfirmPin.length
                                    ? (discountConfirmPinError ? 'bg-status-red border-status-red' : 'bg-accent border-accent')
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
                            onclick={() => { discountConfirmPinError = false; if (discountConfirmPin.length < 4) discountConfirmPin += String(num); }}
                            class="btn-secondary h-12 text-lg font-bold"
                            style="min-height: 48px"
                        >{num}</button>
                    {/each}
                    <button
                        onclick={() => { discountConfirmPin = ''; discountConfirmPinError = false; }}
                        class="btn-ghost h-12 text-sm"
                        style="min-height: 48px"
                    >Clear</button>
                    <button
                        onclick={() => { discountConfirmPinError = false; if (discountConfirmPin.length < 4) discountConfirmPin += '0'; }}
                        class="btn-secondary h-12 text-lg font-bold"
                        style="min-height: 48px"
                    >0</button>
                    <button
                        onclick={() => { discountConfirmPin = discountConfirmPin.slice(0, -1); discountConfirmPinError = false; }}
                        class="btn-ghost h-12 text-sm"
                        style="min-height: 48px"
                    >⌫</button>
                </div>
            </div>
            <div class="flex gap-3 px-6 py-4 border-t border-border bg-surface">
                <button
                    onclick={() => { showDiscountConfirm = false; }}
                    class="btn-secondary flex-1"
                    style="min-height: 48px"
                >
                    ← Go Back
                </button>
                <button
                    onclick={() => {
                        if (discountConfirmPin !== MANAGER_PIN) { discountConfirmPinError = true; return; }
                        pinGraceUntil = Date.now() + 60000;
                        showDiscountConfirm = false;
                        confirmCheckout();
                    }}
                    disabled={discountConfirmPin.length !== 4}
                    class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-status-green text-white text-base font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style="min-height: 48px"
                >
                    ✓ Proceed
                </button>
            </div>
        </div>
    </div>
{/if}
