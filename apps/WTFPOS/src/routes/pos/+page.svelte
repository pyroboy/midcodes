<script lang="ts">
    import { tables as allTables, orders as allOrders, openTable, updateTableTimers, menuItems as menuItemsStore, addItemToOrder, createTakeoutOrder, advanceTakeoutStatus, setTableMaintenance, voidOrder } from '$lib/stores/pos.svelte';
    import { getPendingRejectionsForTable, acknowledgeAlert, type KitchenAlert } from '$lib/stores/alert.svelte';
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
    import { session } from '$lib/stores/session.svelte';

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

    // ─── Receipt State ────────────────────────────────────────────────────────
    let showReceipt = $state(false);
    let receiptOrder = $state<Order | null>(null);
    let receiptChange = $state(0);
    let receiptMethod = $state('');

    // ─── Closed/Orphaned Orders for History ──────────────────────────────────
    const closedOrders = $derived(
        orders.filter(o => 
            o.status === 'paid' || 
            o.status === 'cancelled' ||
            (o.orderType === 'takeout' && o.takeoutStatus === 'picked_up') ||
            (o.orderType === 'dine-in' && !tables.some(t => t.currentOrderId === o.id))
        ).sort((a, b) => (b.closedAt ?? b.createdAt).localeCompare(a.closedAt ?? a.createdAt))
    );

    // ─── Handlers ─────────────────────────────────────────────────────────────
    function handleTableClick(table: Table) {
        selectedTakeoutId = null;
        if (table.status === 'maintenance') return; // Can't interact with maintenance tables
        if (table.status === 'available') {
            paxModalTable = table;
        } else {
            selectedTableId = table.id;
            showAddItem = false;
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

    function confirmPax(pax: number) {
        if (paxModalTable) {
            openTable(paxModalTable.id, pax);
            selectedTableId = paxModalTable.id;
            showAddItem = true;
            paxModalTable = null;
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

    function handleCheckoutSuccess(paidOrder: Order) {
        receiptOrder = paidOrder;
        const cashPayment = paidOrder.payments.find(p => p.method === 'cash');
        receiptChange = cashPayment ? cashPayment.amount - paidOrder.total : 0;

        // Determine payment method from actual payments
        const primaryPayment = paidOrder.payments[paidOrder.payments.length - 1];
        receiptMethod = primaryPayment ? 
            primaryPayment.method === 'gcash' ? 'GCash' :
            primaryPayment.method === 'maya' ? 'Maya' :
            primaryPayment.method === 'card' ? 'Card' : 'Cash' 
            : 'Cash';
            
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
        <div class="flex flex-1 overflow-hidden">
            <div class="flex flex-1 flex-col overflow-y-auto p-6 gap-5">
                <!-- Header -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <h1 class="text-lg font-bold text-gray-900">POS</h1>
                        <span class="badge-orange">{occupied} occ</span>
                        <span class="badge-green">{free} free</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="flex items-center gap-3 text-xs font-semibold text-gray-600">
                            <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-white border border-gray-300"></span>Available</span>
                            <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-emerald-500"></span>Dining (Green)</span>
                            <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-orange-500"></span>Ready / Bill (Orange)</span>
                            {#if maintenance > 0}
                                <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-gray-400"></span>🔧 Maint ({maintenance})</span>
                            {/if}
                            <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-pink-200 border border-pink-300"></span>Pork</span>
                            <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-purple-200 border border-purple-300"></span>Beef</span>
                            <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-gradient-to-r from-pink-200 to-purple-200 border border-purple-300"></span>P&amp;B</span>
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
                            🧾 History {#if closedOrders.length > 0}<span class="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">{closedOrders.length}</span>{/if}
                        </button>
                    </div>
                </div>

                <FloorPlan 
                    {mainTables} 
                    {orders}
                    {selectedTableId} 
                    ontableclick={handleTableClick} 
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
                {pendingRejections}
                onacknowledgeRejection={(alertId) => acknowledgeAlert(alertId)}
            />
        </div>
    {/if}
</div>

{#if showAddItem && currentActiveOrder}
    <AddItemModal 
        order={currentActiveOrder} 
        onclose={() => showAddItem = false}
    />
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
