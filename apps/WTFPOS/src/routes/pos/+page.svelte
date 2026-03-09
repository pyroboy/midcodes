<script lang="ts">
    import { tables as allTables, orders as allOrders, openTable, updateTableTimers, menuItems as menuItemsStore, addItemToOrder, createTakeoutOrder, advanceTakeoutStatus, setTableMaintenance, voidOrder, closeTable } from '$lib/stores/pos.svelte';
    import { getPendingRejectionsForTable, acknowledgeAlert, getUnacknowledgedAlerts, type KitchenAlert } from '$lib/stores/alert.svelte';
    import type { Table, MenuItem, Order } from '$lib/types';
    import AlertBanner from '$lib/components/AlertBanner.svelte';
    import TransferTableModal from '$lib/components/pos/TransferTableModal.svelte';
    import PackageChangeModal from '$lib/components/pos/PackageChangeModal.svelte';
    import SplitBillModal from '$lib/components/pos/SplitBillModal.svelte';
    import NewTakeoutModal from '$lib/components/pos/NewTakeoutModal.svelte';
    import ReceiptModal from '$lib/components/pos/ReceiptModal.svelte';
    import VoidModal from '$lib/components/pos/VoidModal.svelte';
    import OrderHistoryModal from '$lib/components/pos/OrderHistoryModal.svelte';
    import AllBranchesDashboard from '$lib/components/pos/AllBranchesDashboard.svelte';
    import FloorPlan from '$lib/components/pos/FloorPlan.svelte';
    import TakeoutQueue from '$lib/components/pos/TakeoutQueue.svelte';
    import OrderSidebar from '$lib/components/pos/OrderSidebar.svelte';
    import AddItemModal from '$lib/components/pos/AddItemModal.svelte';
    import CheckoutModal from '$lib/components/pos/CheckoutModal.svelte';
    import PaxModal from '$lib/components/pos/PaxModal.svelte';
    import PaxChangeModal from '$lib/components/pos/PaxChangeModal.svelte';
    import LeftoverPenaltyModal from '$lib/components/pos/LeftoverPenaltyModal.svelte';
    import MergeTablesModal from '$lib/components/pos/MergeTablesModal.svelte';
    import RefillPanel from '$lib/components/pos/RefillPanel.svelte';
    import ShiftStartModal from '$lib/components/pos/ShiftStartModal.svelte';
    import { getActiveShift } from '$lib/stores/pos/shifts.svelte';
    import { session, isWarehouseSession } from '$lib/stores/session.svelte';
    import { Info } from 'lucide-svelte';
    import { SidebarTrigger } from '$lib/components/ui/sidebar/index.js';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';

    let showLegend = $state(false);

    // P0-5: Redirect kitchen role away from POS to their intended page
    onMount(() => {
        if (session.role === 'kitchen') {
            goto('/kitchen/orders');
        }
    });

    // P1-03: Track shift-started state in localStorage to skip modal on refresh
    // Key is per-location so switching branches re-checks independently.
    function shiftLocalKey(): string {
        return `wtfpos_shift_started_${session.locationId}`;
    }

    function markShiftStartedLocally() {
        if (browser) localStorage.setItem(shiftLocalKey(), '1');
    }

    function clearShiftStartedLocally() {
        if (browser) localStorage.removeItem(shiftLocalKey());
    }

    // Returns true if either RxDB has an active shift OR localStorage says we've already started
    const shiftStarted = $derived(
        !isWarehouseSession() &&
        session.locationId !== 'all' &&
        (!!getActiveShift() || (browser ? !!localStorage.getItem(shiftLocalKey()) : false))
    );

    // Sync localStorage whenever a real shift becomes active (written by openShift())
    $effect(() => {
        if (getActiveShift()) {
            markShiftStartedLocally();
        }
    });

    // ─── Branch-filtered tables/orders ───────────────────────────────────────────
    const tables = $derived(session.locationId === 'all' ? allTables.value : allTables.value.filter(t => t.locationId === session.locationId));
    const orders = $derived(session.locationId === 'all' ? allOrders.value : allOrders.value.filter(o => o.locationId === session.locationId));
    const menuItems = $derived(menuItemsStore.value);

    // Takeout orders for current branch (open/active, not picked up)
    const takeoutOrders = $derived(orders.filter(o => o.orderType === 'takeout' && o.status === 'open' && o.takeoutStatus !== 'picked_up'));

    // ─── Timer ───────────────────────────────────────────────────────────────
    $effect(() => {
        const id = setInterval(updateTableTimers, 1000);
        return () => clearInterval(id);
    });

    // ─── Floor stats ──────────────────────────────────────────────────────────
    const occupied = $derived(tables.filter((t) => t.status !== 'available' && t.status !== 'maintenance').length);
    const free     = $derived(tables.filter((t) => t.status === 'available').length);
    const maintenance = $derived(tables.filter((t) => t.status === 'maintenance').length);
    const mainTables = $derived(tables.filter((t) => t.zone === 'main'));

    // ─── Selected Order (dine-in or takeout) ──────────────────────────────────
    let selectedTableId    = $state<string | null>(null);
    let selectedTakeoutId  = $state<string | null>(null);

    // P1-20: Ghost-occupied table recovery prompt state
    let ghostTableId = $state<string | null>(null);
    const ghostTable = $derived(ghostTableId ? (tables.find(t => t.id === ghostTableId) ?? null) : null);

    const selectedTable = $derived(selectedTableId ? (tables.find((t) => t.id === selectedTableId) ?? null) : null);

    // Active order: either from a table or from a takeout selection
    const currentActiveOrder = $derived<Order | undefined>(
        selectedTakeoutId
            ? orders.find(o => o.id === selectedTakeoutId)
            : selectedTable?.currentOrderId
                ? orders.find(o => o.id === selectedTable.currentOrderId)
                : undefined
    );

    // ─── Modal State ──────────────────────────────────────────────────────────
    let showAddItem = $state(false);
    let showCheckout = $state(false);
    let checkoutOrder = $state<Order | null>(null); // captured when checkout opens
    let showVoidConfirm = $state(false);
    let showTransferModal = $state(false);
    let showPackageChange = $state(false);
    let showSplitBill = $state(false);
    let showHistory = $state(false);
    let showTakeoutModal = $state(false);
    let showPaxChange = $state(false);
    let showLeftoverPenalty = $state(false);
    let showMergeModal = $state(false);
    let showRefill = $state(false);
    let paxModalTable = $state<Table | null>(null);

    // ─── Kitchen Rejection Alerts ──────────────────────────────────────────────
    const pendingRejections = $derived<KitchenAlert[]>(
        getPendingRejectionsForTable(selectedTableId)
    );

    // Map of tableId → unacknowledged rejection count (for floor plan badges)
    const tableRejectionMap = $derived.by(() => {
        const unacked = getUnacknowledgedAlerts();
        const map = new Map<string, number>();
        for (const alert of unacked) {
            const order = orders.find(o => o.id === alert.orderId && o.status === 'open');
            if (order?.tableId) {
                map.set(order.tableId, (map.get(order.tableId) ?? 0) + 1);
            }
        }
        return map;
    });

    // ─── Receipt State ────────────────────────────────────────────────────────
    let showReceipt = $state(false);
    let receiptOrder = $state<Order | null>(null);
    let receiptChange = $state(0);
    let receiptMethod = $state('');

    // ─── Kitchen Charge Toast ────────────────────────────────────────────────
    let kitchenToastCount = $state(0);
    let kitchenToastTimer: ReturnType<typeof setTimeout> | null = null;

    function handleCharged(count: number) {
        kitchenToastCount = count;
        if (kitchenToastTimer) clearTimeout(kitchenToastTimer);
        kitchenToastTimer = setTimeout(() => { kitchenToastCount = 0; }, 2500);
    }

    // ─── Closed/Orphaned Orders for History ──────────────────────────────────
    const closedOrders = $derived(
        orders.filter(o =>
            o.status === 'paid' ||
            o.status === 'cancelled' ||
            (o.orderType === 'takeout' && o.takeoutStatus === 'picked_up') ||
            (o.orderType === 'dine-in' && !tables.some(t => t.currentOrderId === o.id))
        ).sort((a, b) => (b.closedAt ?? b.createdAt).localeCompare(a.closedAt ?? a.createdAt))
    );

    // P1-6: History badge shows today's closed orders only
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const todayMidnightIso = todayMidnight.toISOString();
    const closedOrdersTodayCount = $derived(
        closedOrders.filter(o => (o.closedAt ?? o.createdAt) >= todayMidnightIso).length
    );

    // P1-5: Per-shift sequential takeout counter
    // Count today's takeout orders to derive the next sequence number
    const takeoutCountToday = $derived(
        orders.filter(o =>
            o.orderType === 'takeout' &&
            o.createdAt >= todayMidnightIso
        ).length
    );
    const currentTakeoutSeq = $derived(
        currentActiveOrder?.orderType === 'takeout'
            ? orders
                .filter(o => o.orderType === 'takeout' && o.createdAt >= todayMidnightIso)
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
                .findIndex(o => o.id === currentActiveOrder?.id) + 1
            : undefined
    );

    // ─── Handlers ─────────────────────────────────────────────────────────────
    function handleTableClick(table: Table) {
        selectedTakeoutId = null;
        if (table.status === 'maintenance') return; // Can't interact with maintenance tables
        if (table.status === 'available') {
            paxModalTable = table;
        } else {
            // P1-20: Detect ghost-occupied table (occupied status but empty order)
            const order = table.currentOrderId
                ? allOrders.value.find(o => o.id === table.currentOrderId)
                : undefined;
            const activeItems = order?.items.filter(i => i.status !== 'cancelled') ?? [];
            if (!order || activeItems.length === 0) {
                ghostTableId = table.id;
                return;
            }
            selectedTableId = table.id;
            showAddItem = false;
        }
    }

    // P1-20: Close and free the ghost-occupied table
    async function handleFreeGhostTable() {
        const tbl = ghostTable;
        if (!tbl) return;
        ghostTableId = null;
        // Void empty order if present, then close table
        const order = tbl.currentOrderId
            ? allOrders.value.find(o => o.id === tbl.currentOrderId)
            : undefined;
        if (order) {
            await voidOrder(order.id, 'mistake');
        } else {
            await closeTable(tbl.id);
        }
    }

    function handleToggleMaintenance(table: Table) {
        if (table.status === 'maintenance') {
            setTableMaintenance(table.id, false);
        } else if (table.status === 'available') {
            setTableMaintenance(table.id, true);
        }
    }

    function handleTakeoutClick(order: Order) {
        selectedTableId = null;
        selectedTakeoutId = order.id;
        showAddItem = false;
    }

    async function confirmPax(pax: number) {
        if (paxModalTable) {
            const tableId = paxModalTable.id;
            paxModalTable = null; // clear before await to prevent double-click
            await openTable(tableId, pax);
            selectedTableId = tableId;
            // Only auto-open AddItemModal if the order has no items yet
            const table = allTables.value.find(t => t.id === tableId);
            const newOrder = table?.currentOrderId ? allOrders.value.find(o => o.id === table.currentOrderId) : null;
            if (!newOrder || newOrder.items.length === 0) {
                showAddItem = true;
            }
        }
    }

    function closeBill() {
        selectedTableId   = null;
        selectedTakeoutId = null;
        showAddItem = false;
    }

    function handleVoidConfirm(reason: 'mistake' | 'walkout' | 'write_off') {
        const order = currentActiveOrder;
        if (!order) return;
        voidOrder(order.id, reason);
        showVoidConfirm = false;
        closeBill();
    }

    function handleTransferComplete(newTableId: string) {
        selectedTableId = newTableId;
        showTransferModal = false;
    }

    function handlePackageChanged() {
        showPackageChange = false;
    }

    function handleSplitComplete() {
        showSplitBill = false;
        closeBill();
    }

    // P0-3: Cancel a 0-balance table (opened with pax but no orders)
    async function handleCancelTable() {
        if (!currentActiveOrder || !selectedTable) return;
        const activeItems = currentActiveOrder.items.filter(i => i.status !== 'cancelled');
        if (activeItems.length > 0) return; // Safety: only cancel truly empty tables
        await voidOrder(currentActiveOrder.id, 'mistake');
        closeBill();
    }

    function handleCheckoutSuccess(paidOrder: Order, change: number, methodLabel: string) {
        receiptOrder = paidOrder;
        receiptChange = change;
        receiptMethod = methodLabel;

        showReceipt = true;
        showCheckout = false;
        checkoutOrder = null;
        closeBill();
    }

    function openTakeoutModal() {
        showTakeoutModal = true;
    }

    // ─── Barcode Scanner ──────────────────────────────────────────────────────
    let barcodeBuffer = $state('');
    let barcodeTimeout: ReturnType<typeof setTimeout> | undefined;

    // Cleanup barcode timeout on component destroy
    $effect(() => {
        return () => {
            if (barcodeTimeout) clearTimeout(barcodeTimeout);
        };
    });

    function handleGlobalKeydown(e: KeyboardEvent) {
        // Only listen if no modals are open (inputs might be active)
        if (showCheckout || showVoidConfirm || showPackageChange || showSplitBill || showAddItem || showTransferModal) return;
        if (!currentActiveOrder) return;
        
        // If typing in input, ignore
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        if (e.key === 'Enter') {
            if (barcodeBuffer.length >= 3) {
                const matchedItem = menuItems.find((i: MenuItem) => i.isRetail && (i.id === barcodeBuffer || i.id === `ret-${barcodeBuffer}`));
                if (matchedItem) {
                    addItemToOrder(currentActiveOrder.id, matchedItem, 1);
                }
                barcodeBuffer = '';
            }
        } else if (e.key.length === 1) {
            // Only capture single characters (letters, numbers)
            // Limit buffer size to prevent memory issues with rapid keystrokes
            if (barcodeBuffer.length < 20) {
                barcodeBuffer += e.key;
            }
            if (barcodeTimeout) {
                clearTimeout(barcodeTimeout);
                barcodeTimeout = undefined;
            }
            barcodeTimeout = setTimeout(() => { 
                barcodeBuffer = ''; 
                barcodeTimeout = undefined;
            }, 300);
        }
    }
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<div class="flex h-full flex-col overflow-hidden bg-surface-secondary">
    <AlertBanner />

    {#if session.locationId === 'all'}
        <AllBranchesDashboard allTables={allTables.value} allOrders={allOrders.value} />
    {:else}
        <!-- P2-02: inert disables all interaction (clicks, focus, keyboard) on the floor when shift modal is blocking -->
        <div class="flex flex-1 overflow-hidden" inert={(!isWarehouseSession() && !shiftStarted) ? true : undefined}>
            <div class="flex flex-1 flex-col overflow-hidden min-h-0 p-6 gap-5">
                <!-- Header -->
                <div class="flex items-center justify-between shrink-0">
                    <div class="flex items-center gap-3">
                        <SidebarTrigger class="hidden md:flex h-9 w-9 text-gray-500" />
                        <h1 class="text-lg font-bold text-gray-900">POS</h1>
                        <span class="badge-orange">{occupied} occ</span>
                        <span class="badge-green">{free} free</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="relative">
                            <button
                                onclick={() => showLegend = !showLegend}
                                class="flex items-center justify-center rounded-lg border border-border bg-surface p-2 text-gray-500 hover:bg-gray-50 transition-colors"
                                style="min-height: 40px; min-width: 40px"
                                aria-label="Toggle color legend"
                            >
                                <Info class="h-4 w-4" />
                            </button>
                            {#if showLegend}
                                <div class="absolute right-0 top-full mt-1 z-20 pos-card p-4 shadow-lg min-w-[340px]">
                                    <!-- Illustrated table diagram -->
                                    <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Table Card Guide</p>
                                    <div class="flex gap-4 items-start mb-4">
                                        <svg width="130" height="110" viewBox="0 0 130 110" class="shrink-0">
                                            <!-- Table body -->
                                            <rect x="5" y="5" width="120" height="100" rx="10" fill="#ecfdf5" stroke="#10b981" stroke-width="2" />
                                            <!-- Package badge (top-left) -->
                                            <rect x="9" y="9" width="48" height="14" rx="7" fill="#7c3aed" opacity="0.15" />
                                            <text x="33" y="16" text-anchor="middle" dominant-baseline="middle" font-family="Inter, sans-serif" font-size="7" font-weight="800" fill="#7c3aed">Beef+Pork</text>
                                            <!-- Timer (top-right) -->
                                            <text x="119" y="18" text-anchor="end" dominant-baseline="middle" font-family="monospace" font-size="8" font-weight="700" fill="#10b981">25m</text>
                                            <!-- Table name (center) -->
                                            <text x="65" y="46" text-anchor="middle" dominant-baseline="middle" font-family="Inter, sans-serif" font-size="15" font-weight="800" fill="#111827">T1</text>
                                            <!-- Pax (below name) -->
                                            <text x="65" y="60" text-anchor="middle" dominant-baseline="middle" font-family="Inter, sans-serif" font-size="9" font-weight="600" fill="#6b7280">4 pax</text>
                                            <!-- Bill total (bottom-center) -->
                                            <text x="65" y="92" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="9" font-weight="700" fill="#111827">P1,996.00</text>
                                            <!-- Unserved badge (bottom-left) -->
                                            <circle cx="15" cy="95" r="8" fill="#f97316" opacity="0.9" />
                                            <text x="15" y="96" text-anchor="middle" dominant-baseline="middle" font-family="Inter, sans-serif" font-size="8" font-weight="800" fill="#ffffff">5</text>
                                            <!-- Refill badge (bottom-right) -->
                                            <rect x="99" y="88" width="20" height="12" rx="6" fill="#8b5cf6" opacity="0.9" />
                                            <text x="109" y="95" text-anchor="middle" dominant-baseline="middle" font-family="Inter, sans-serif" font-size="7" font-weight="800" fill="#ffffff">R3</text>
                                        </svg>
                                        <div class="flex flex-col gap-1.5 text-[11px] text-gray-600 pt-0.5">
                                            <span><b class="text-purple-600">Beef+Pork</b> — package type</span>
                                            <span><b class="text-emerald-600">25m</b> — time since seated</span>
                                            <span><b class="text-gray-900">T1</b> — table name</span>
                                            <span><b class="text-gray-500">4 pax</b> — guests seated</span>
                                            <span><b class="text-gray-900">P1,996</b> — running bill</span>
                                            <span><span class="inline-block h-3 w-3 rounded-full bg-orange-500 align-middle"></span> <b>5</b> — unserved items</span>
                                            <span><span class="inline-block h-3 w-5 rounded-full bg-purple-500 align-middle text-[8px] text-white font-bold text-center leading-3">R3</span> — refills (AYCE)</span>
                                        </div>
                                    </div>
                                    <!-- Color legend -->
                                    <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Border Colors</p>
                                    <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-semibold text-gray-600">
                                        <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-white border border-gray-300"></span>Available</span>
                                        <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-emerald-500"></span>Dining</span>
                                        <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-orange-500"></span>Ready / Bill</span>
                                        <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-red-500"></span>Overtime</span>
                                        {#if maintenance > 0}
                                            <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-gray-400"></span>Maintenance</span>
                                        {/if}
                                    </div>
                                    <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-3 mb-2">Package Fill</p>
                                    <div class="grid grid-cols-3 gap-x-3 gap-y-1.5 text-xs font-semibold text-gray-600">
                                        <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-pink-200 border border-pink-300"></span>Pork</span>
                                        <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-purple-200 border border-purple-300"></span>Beef</span>
                                        <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-amber-100 border border-amber-300"></span>Beef+Pork</span>
                                    </div>
                                    <!-- Badge meanings -->
                                    <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-3 mb-2">Badges</p>
                                    <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-600">
                                        <span class="flex items-center gap-1.5"><span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[8px] font-bold text-white">5</span>Unserved items</span>
                                        <span class="flex items-center gap-1.5"><span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">✓</span>All served</span>
                                        <span class="flex items-center gap-1.5"><span class="inline-flex h-4 w-6 items-center justify-center rounded-full bg-purple-500 text-[8px] font-bold text-white">R3</span>Refill count</span>
                                    </div>
                                </div>
                            {/if}
                        </div>
                        <button
                            onclick={openTakeoutModal}
                            class="flex items-center gap-2 rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-accent hover:bg-orange-100 transition-colors"
                            style="min-height: 40px"
                        >
                            📦 New Takeout
                        </button>
                        <button
                            onclick={() => showHistory = true}
                            class="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                            style="min-height: 40px"
                        >
                            🧾 History {#if closedOrdersTodayCount > 0}<span class="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">{closedOrdersTodayCount}</span>{/if}
                        </button>
                    </div>
                </div>

                <FloorPlan
                    {mainTables}
                    {orders}
                    {selectedTableId}
                    ontableclick={handleTableClick}
                    {tableRejectionMap}
                />

                <TakeoutQueue 
                    {takeoutOrders} 
                    {selectedTakeoutId}
                    onclick={handleTakeoutClick}
                    onadvancestatus={advanceTakeoutStatus}
                />
            </div>

            <OrderSidebar
                order={currentActiveOrder}
                table={selectedTable}
                onclose={closeBill}
                onadditem={() => showAddItem = true}
                onrefill={() => showRefill = true}
                oncheckout={() => {
                    if (currentActiveOrder?.packageId) {
                        showLeftoverPenalty = true;
                    } else {
                        checkoutOrder = currentActiveOrder ?? null;
                        showCheckout = true;
                    }
                }}
                onvoid={() => showVoidConfirm = true}
                ontransfer={() => showTransferModal = true}
                onchangepackage={() => showPackageChange = true}
                onsplit={() => showSplitBill = true}
                onchangepax={() => showPaxChange = true}
                onmerge={() => showMergeModal = true}
                oncanceltable={handleCancelTable}
                {pendingRejections}
                onacknowledgeRejection={(alertId) => acknowledgeAlert(alertId)}
                takeoutSeq={currentTakeoutSeq}
            />
        </div>
    {/if}
</div>

{#if showAddItem && currentActiveOrder}
    <AddItemModal 
        order={currentActiveOrder} 
        onclose={() => showAddItem = false}
        oncharged={handleCharged}
    />
{/if}

<!-- P1-1: Sent to Kitchen toast -->
{#if kitchenToastCount > 0}
    <div class="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 pointer-events-none">
        <div class="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-white shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
            <span class="text-status-green text-lg">✓</span>
            <span class="text-sm font-semibold">{kitchenToastCount} item{kitchenToastCount !== 1 ? 's' : ''} sent to kitchen</span>
        </div>
    </div>
{/if}

{#if showCheckout && checkoutOrder}
    <CheckoutModal
        order={checkoutOrder}
        table={selectedTable}
        onclose={() => { showCheckout = false; checkoutOrder = null; }}
        onsuccess={handleCheckoutSuccess}
    />
{/if}

<PaxModal 
    table={paxModalTable}
    onconfirm={confirmPax}
    oncancel={() => paxModalTable = null}
/>

<NewTakeoutModal
    isOpen={showTakeoutModal}
    onClose={() => showTakeoutModal = false}
    onConfirm={async (name) => {
        const orderId = await createTakeoutOrder(name);
        selectedTakeoutId = orderId;
        selectedTableId = null;
        showAddItem = true;
        showTakeoutModal = false;
    }}
/>

<ReceiptModal
    isOpen={showReceipt}
    order={receiptOrder}
    change={receiptChange}
    method={receiptMethod}
    onClose={() => { showReceipt = false; receiptOrder = null; }}
/>

<VoidModal
    isOpen={showVoidConfirm}
    onClose={() => showVoidConfirm = false}
    onConfirm={(reason) => handleVoidConfirm(reason)}
/>

<OrderHistoryModal
    isOpen={showHistory}
    orders={closedOrders}
    tables={allTables.value}
    onClose={() => showHistory = false}
    onViewOrder={(order) => {
        if (order.status === 'paid') {
            receiptOrder = order;
            const cashPayment = order.payments.find(p => p.method === 'cash');
            receiptChange = cashPayment ? cashPayment.amount - order.total : 0;
            const m = order.payments[order.payments.length - 1]?.method;
            receiptMethod = m === 'gcash' ? 'GCash' : m === 'maya' ? 'Maya' : m === 'card' ? 'Card' : 'Cash';
            showReceipt = true;
        } else {
            // If it's unpaid (orphaned), load it into the sidebar for checkout
            selectedTakeoutId = order.id; // Using takeout ID works even for orphaned dine-ins to force it into sidebar
            selectedTableId = null;
            showHistory = false;
        }
    }}
/>

{#if showTransferModal && selectedTable}
    <TransferTableModal
        fromTable={selectedTable}
        onclose={() => showTransferModal = false}
        ontransfer={handleTransferComplete}
    />
{/if}

{#if showPackageChange && currentActiveOrder}
    <PackageChangeModal
        order={currentActiveOrder}
        onclose={() => showPackageChange = false}
        onchange={handlePackageChanged}
    />
{/if}

{#if showSplitBill && currentActiveOrder}
    <SplitBillModal
        order={currentActiveOrder}
        onclose={() => showSplitBill = false}
        oncomplete={handleSplitComplete}
    />
{/if}

<PaxChangeModal
    isOpen={showPaxChange}
    order={currentActiveOrder ?? null}
    onClose={() => showPaxChange = false}
/>

<LeftoverPenaltyModal
    isOpen={showLeftoverPenalty}
    order={currentActiveOrder ?? null}
    onClose={() => showLeftoverPenalty = false}
    onPreCheckout={() => {
        showLeftoverPenalty = false;
        checkoutOrder = currentActiveOrder ?? null;
        showCheckout = true;
    }}
/>

<RefillPanel
    isOpen={showRefill}
    order={currentActiveOrder ?? null}
    onclose={() => showRefill = false}
/>

{#if showMergeModal && selectedTable}
    <MergeTablesModal
        primaryTable={selectedTable}
        onclose={() => showMergeModal = false}
        onmerge={(targetTableId) => {
            showMergeModal = false;
            selectedTableId = targetTableId;
        }}
    />
{/if}

{#if !isWarehouseSession() && session.locationId !== 'all' && !shiftStarted}
    <!-- P2-02: floor plan is already blocked by this overlay — pointer-events handled by fixed overlay z-order -->
    <ShiftStartModal onSkip={markShiftStartedLocally} />
{/if}

<!-- P1-20: Ghost-occupied table recovery prompt -->
{#if ghostTable}
    <div class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="pos-card w-[340px] flex flex-col gap-4 p-6">
            <div class="flex flex-col gap-1">
                <h3 class="font-bold text-gray-900">Empty Order Detected</h3>
                <p class="text-sm text-gray-500">
                    <strong>{ghostTable.label}</strong> shows as occupied but has no items on its bill.
                    Free this table to make it available for new guests.
                </p>
            </div>
            <div class="flex gap-3">
                <button
                    class="btn-ghost flex-1"
                    onclick={() => ghostTableId = null}
                >Cancel</button>
                <button
                    class="btn-danger flex-1"
                    onclick={handleFreeGhostTable}
                >Close &amp; Free Table</button>
            </div>
        </div>
    </div>
{/if}
