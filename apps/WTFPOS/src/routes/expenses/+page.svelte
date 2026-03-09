<script lang="ts">
    import {
        allExpenses,
        addExpense,
        deleteExpense,
        expenseCategories,
        expenseCategoryGroups,
        getCategoryBadgeClass,
        getCategoryGroup
    } from '$lib/stores/expenses.svelte';
    import { session } from '$lib/stores/session.svelte';
    import { formatPeso } from '$lib/utils';
    import { Loader2, RotateCcw } from 'lucide-svelte';
    import ManagerPinModal from '$lib/components/pos/ManagerPinModal.svelte';
    import PhotoCapture from '$lib/components/PhotoCapture.svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    // ─── Derived: branch-scoped expenses ─────────────────────────────────────
    const branchExpenses = $derived(
        session.locationId === 'all'
            ? allExpenses.value
            : allExpenses.value.filter(e => e.locationId === session.locationId)
    );

    // ─── Log filter state ─────────────────────────────────────────────────────
    type LogFilter = 'today' | 'week' | 'month' | 'all';
    let logFilter = $state<LogFilter>('today');

    // ─── Amount sort state ────────────────────────────────────────────────────
    let sortByAmount = $state<'asc' | 'desc' | null>(null);

    function toggleAmountSort() {
        if (sortByAmount === null) sortByAmount = 'desc';
        else if (sortByAmount === 'desc') sortByAmount = 'asc';
        else sortByAmount = null;
    }

    function isoDate(d: Date): string {
        return d.toISOString().slice(0, 10);
    }

    const today = $derived(isoDate(new Date()));

    function startOfWeek(): string {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay());
        return isoDate(d);
    }

    function startOfMonth(): string {
        const d = new Date();
        d.setDate(1);
        return isoDate(d);
    }

    // P0-3: Undo delete state — declared before filteredExpenses so derived can reference it
    let pendingUndoItem = $state<{ id: string; category: string; amount: number; description: string } | null>(null);
    let undoTimer = $state<ReturnType<typeof setTimeout> | null>(null);

    const filteredExpenses = $derived((() => {
        let list = branchExpenses.slice();
        // P0-3: Hide item pending undo so user sees immediate feedback
        if (pendingUndoItem) {
            list = list.filter(e => e.id !== pendingUndoItem!.id);
        }
        if (logFilter === 'today') {
            list = list.filter(e => (e.expenseDate ?? e.createdAt.slice(0, 10)) === today);
        } else if (logFilter === 'week') {
            const weekStart = startOfWeek();
            list = list.filter(e => (e.expenseDate ?? e.createdAt.slice(0, 10)) >= weekStart);
        } else if (logFilter === 'month') {
            const monthStart = startOfMonth();
            const nextMonthStart = (() => {
                const d = new Date();
                d.setDate(1);
                d.setMonth(d.getMonth() + 1);
                return isoDate(d);
            })();
            list = list.filter(e => {
                const dateStr = e.expenseDate ?? e.createdAt.slice(0, 10);
                return dateStr >= monthStart && dateStr < nextMonthStart;
            });
        }
        if (sortByAmount === 'desc') list = list.slice().sort((a, b) => b.amount - a.amount);
        else if (sortByAmount === 'asc') list = list.slice().sort((a, b) => a.amount - b.amount);
        return list;
    })());

    // P0-4: Derived total for the current filter view
    const filteredTotal = $derived(filteredExpenses.reduce((s, e) => s + e.amount, 0));

    // P2-7: Location label for branch context
    const locationLabel = $derived(
        session.locationId === 'all' ? 'All Branches' :
        session.locationId === 'tag' ? 'Alta Citta' :
        session.locationId === 'pgl' ? 'Alona Beach' :
        session.locationId
    );

    // ─── Header stats ─────────────────────────────────────────────────────────
    const allTimeTotal = $derived(branchExpenses.reduce((s, e) => s + e.amount, 0));

    // ─── Photo column visibility ───────────────────────────────────────────────
    const hasAnyPhotos = $derived(filteredExpenses.some(e => e.receiptPhoto));

    // ─── Category subtotals strip ─────────────────────────────────────────────
    const categorySubtotals = $derived((() => {
        const totals = new Map<string, number>();
        for (const exp of filteredExpenses) {
            const grp = getCategoryGroup(exp.category);
            totals.set(grp, (totals.get(grp) ?? 0) + exp.amount);
        }
        const groupOrder = ['Overhead', 'Procurement', 'Utilities', 'Operations', 'Other'];
        return groupOrder
            .filter(g => (totals.get(g) ?? 0) > 0)
            .map(g => ({ group: g, total: totals.get(g) ?? 0 }));
    })());

    // P2-5: Human-readable date formatter
    function formatShortDate(iso: string): string {
        const d = new Date(iso + 'T12:00:00');
        return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    }

    // ─── Form state ───────────────────────────────────────────────────────────
    function todayString() { return isoDate(new Date()); }

    const DEFAULT_CATEGORY = expenseCategories[0] ?? 'Miscellaneous';
    let lastUsedCategory = $state(DEFAULT_CATEGORY);

    let category = $state(DEFAULT_CATEGORY);
    let amount = $state('');
    let description = $state('');
    // P2-6: Remember last-used paid-by method
    let lastUsedPaidBy = $state('Petty Cash');
    let paidBy = $state('Petty Cash');
    let receiptPhotos = $state<string[]>([]);
    let expenseDate = $state(todayString());
    let errorMessage = $state('');
    let formError = $state('');
    let isSubmitting = $state(false);
    let successVisible = $state(false);
    let successTimer: ReturnType<typeof setTimeout> | null = null;

    let amountBlurred = $state(false);
    const amountPreview = $derived(
        amountBlurred && amount !== '' && parseFloat(amount) > 0
            ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(parseFloat(amount))
            : ''
    );

    const showMeterFields = $derived(
        category === 'Water' || category === 'Electricity' || category === 'Gas/LPG'
    );
    const isGasLpg = $derived(category === 'Gas/LPG');

    let meterPrev = $state('');
    let meterCurr = $state('');
    let meterRate = $state('');
    let gasKg = $state('');
    let gasRate = $state('');

    const computedMeterAmount = $derived((() => {
        if (category === 'Water' || category === 'Electricity') {
            const prev = parseFloat(meterPrev);
            const curr = parseFloat(meterCurr);
            const rate = parseFloat(meterRate);
            if (!isNaN(prev) && !isNaN(curr) && !isNaN(rate) && curr > prev && rate > 0) {
                return (curr - prev) * rate;
            }
        } else if (category === 'Gas/LPG') {
            const kg = parseFloat(gasKg);
            const rate = parseFloat(gasRate);
            if (!isNaN(kg) && !isNaN(rate) && kg > 0 && rate > 0) {
                return kg * rate;
            }
        }
        return null;
    })());

    $effect(() => {
        if (computedMeterAmount !== null) amount = computedMeterAmount.toFixed(2);
    });

    $effect(() => {
        if (!showMeterFields) {
            meterPrev = '';
            meterCurr = '';
            meterRate = '';
            gasKg = '';
            gasRate = '';
        }
    });

    const meterUnit = $derived(
        category === 'Water' ? 'cu.m' : category === 'Electricity' ? 'kWh' : 'kg'
    );

    let showLargeAmountConfirm = $state(false);
    let pendingLargeAmount = $state(0);

    let amountTouched = $state(false);
    let categoryTouched = $state(false);
    let descriptionTouched = $state(false);

    const amountError = $derived(
        amountTouched && (amount === '' || parseFloat(amount) <= 0)
            ? 'Amount must be greater than 0' : ''
    );
    const categoryError = $derived(
        categoryTouched && !category ? 'Category is required' : ''
    );
    const descriptionError = $derived(
        descriptionTouched && (!description || description.trim() === '')
            ? 'Description is required' : ''
    );

    const canSubmit = $derived(!isSubmitting && parseFloat(amount) > 0 && !!category);

    const descriptionPlaceholder = $derived((() => {
        switch (category) {
            case 'Water': return 'e.g., prev: 1245, curr: 1289 — 44 cu.m consumed';
            case 'Electricity': return 'e.g., prev: 8421, curr: 8510 — 89 kWh used';
            case 'Gas/LPG': return 'e.g., LPG 50kg tank refill — Tagbilaran Gas';
            case 'Wages (Actual)': return 'e.g., Maria Santos — Mon–Sat shift, 10am–8pm';
            case 'Meat Procurement': return 'e.g., Pork Bone-In 15kg — Metro Meat Co.';
            case 'Repairs & Maintenance': return 'e.g., Kitchen exhaust fan motor replacement';
            default: return 'e.g., Brief description of this expense';
        }
    })());

    const skipLargeAmountWarning = $derived(
        category === 'Wages (Actual)' ||
        category === 'Labor Allocation (Budget)' ||
        category === 'Employee Benefits' ||
        category === 'Meat Procurement'
    );

    let formEl: HTMLFormElement | undefined = $state();

    // ─── Issue 16: Pre-fill form from query params (procurement CTA from deliveries) ──
    onMount(() => {
        const params = page.url.searchParams;
        const qCategory = params.get('category');
        const qAmount = params.get('amount');
        const qDescription = params.get('description');

        if (qCategory && expenseCategories.includes(qCategory)) {
            category = qCategory;
        }
        if (qAmount) {
            const parsed = parseFloat(qAmount);
            if (!isNaN(parsed) && parsed > 0) {
                amount = String(parsed);
            }
        }
        if (qDescription) {
            description = qDescription;
        }
        // Clear params from URL without reload so refreshing does not re-trigger
        if (qCategory || qAmount || qDescription) {
            goto('/expenses', { replaceState: true, noScroll: true });
        }
    });

    // ─── Delete confirmation (Manager PIN) ───────────────────────────────────
    let pinModalOpen = $state(false);
    let pendingDeleteId = $state<string | null>(null);
    let pendingDeleteSnapshot = $state<{ category: string; amount: number; description: string } | null>(null);

    function requestDelete(exp: { id: string; category: string; amount: number; description: string }) {
        pendingDeleteId = exp.id;
        pendingDeleteSnapshot = { category: exp.category, amount: exp.amount, description: exp.description };
        pinModalOpen = true;
    }

    async function confirmDelete(_pin: string) {
        pinModalOpen = false;
        if (!pendingDeleteId) return;
        const deleteId = pendingDeleteId;
        const snapshot = pendingDeleteSnapshot;
        pendingDeleteId = null;
        pendingDeleteSnapshot = null;

        // P0-3: Show undo window — delay actual delete by 5 seconds
        pendingUndoItem = {
            id: deleteId,
            category: snapshot?.category ?? '',
            amount: snapshot?.amount ?? 0,
            description: snapshot?.description ?? ''
        };
        if (undoTimer) clearTimeout(undoTimer);
        undoTimer = setTimeout(async () => {
            await deleteExpense(deleteId, pendingUndoItem ?? undefined);
            pendingUndoItem = null;
            undoTimer = null;
        }, 5000);
    }

    function undoDelete() {
        if (undoTimer) clearTimeout(undoTimer);
        undoTimer = null;
        pendingUndoItem = null;
    }

    function cancelDelete() {
        pinModalOpen = false;
        pendingDeleteId = null;
        pendingDeleteSnapshot = null;
    }

    // ─── Submit ───────────────────────────────────────────────────────────────
    async function handleSubmit(e: Event) {
        e.preventDefault();
        amountTouched = true;
        categoryTouched = true;
        descriptionTouched = true;
        errorMessage = '';
        formError = '';

        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            errorMessage = 'Please enter a valid amount greater than 0';
            return;
        }
        if (!category) {
            errorMessage = 'Please select a category';
            return;
        }
        if (!description || description.trim() === '') return;

        if (numAmount > 10000 && !skipLargeAmountWarning) {
            pendingLargeAmount = numAmount;
            showLargeAmountConfirm = true;
            return;
        }

        await doSubmit(numAmount);
    }

    async function doSubmit(numAmount: number) {
        isSubmitting = true;
        formError = '';

        try {
            const photoUrl = receiptPhotos[0];
            const result = await addExpense(category, numAmount, description, paidBy, photoUrl, expenseDate);

            if (!result.success) {
                formError = 'Could not save expense. Please try again.';
                errorMessage = result.error || 'Failed to save expense';
                return;
            }

            lastUsedCategory = category;
            // P2-6: Remember last-used paid-by method before reset
            lastUsedPaidBy = paidBy;

            amount = '';
            description = '';
            receiptPhotos = [];
            category = lastUsedCategory;
            paidBy = lastUsedPaidBy; // P2-6: persist last paid-by instead of resetting
            expenseDate = todayString();
            amountTouched = false;
            categoryTouched = false;
            descriptionTouched = false;
            amountBlurred = false;
            formError = '';
            errorMessage = '';
            meterPrev = '';
            meterCurr = '';
            meterRate = '';
            gasKg = '';
            gasRate = '';

            successVisible = true;
            if (successTimer) clearTimeout(successTimer);
            successTimer = setTimeout(() => { successVisible = false; }, 3000);
        } catch (_err) {
            formError = 'Could not save expense. Please try again.';
            errorMessage = 'Could not save expense. Please try again.';
        } finally {
            isSubmitting = false;
        }
    }

    function confirmLargeAmount() {
        showLargeAmountConfirm = false;
        doSubmit(pendingLargeAmount);
    }

    function cancelLargeAmount() {
        showLargeAmountConfirm = false;
        pendingLargeAmount = 0;
    }

    // ─── Repeat last expense ─────────────────────────────────────────────────
    function repeatExpense(exp: { category: string; paidBy: string; description: string }) {
        category = exp.category;
        paidBy = exp.paidBy;
        description = exp.description;
        amount = '';
        amountTouched = false;
        categoryTouched = false;
        descriptionTouched = false;
        amountBlurred = false;
        meterPrev = '';
        meterCurr = '';
        meterRate = '';
        gasKg = '';
        gasRate = '';
        formEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
            const amountInput = formEl?.querySelector<HTMLInputElement>('input[type="number"]');
            amountInput?.focus();
        }, 300);
    }
</script>

<!-- Manager PIN Modal -->
<ManagerPinModal
    isOpen={pinModalOpen}
    title="Confirm Delete"
    description={pendingDeleteSnapshot
        ? `Delete: ${pendingDeleteSnapshot.category} — ${formatPeso(pendingDeleteSnapshot.amount)} — ${pendingDeleteSnapshot.description}\n\nEnter Manager PIN to confirm.\n\nDeleted entries are recorded in audit logs.`
        : 'Enter Manager PIN to delete this expense.\n\nDeleted entries are recorded in audit logs.'}
    confirmLabel="Delete"
    confirmClass="btn-danger"
    onClose={cancelDelete}
    onConfirm={confirmDelete}
/>

<!-- Large amount confirmation overlay -->
{#if showLargeAmountConfirm}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="pos-card w-[360px] flex flex-col gap-4">
            <h3 class="text-lg font-bold text-gray-900">Large Amount Warning</h3>
            <p class="text-sm text-gray-700">
                This is a large amount:
                <span class="font-bold text-status-red font-mono">{formatPeso(pendingLargeAmount)}</span>.
                Are you sure you want to record this expense?
            </p>
            <div class="flex gap-2">
                <button type="button" onclick={cancelLargeAmount} class="btn-ghost flex-1 min-h-[44px]">Cancel</button>
                <button type="button" onclick={confirmLargeAmount} class="btn-danger flex-1 min-h-[44px]">Yes, Record It</button>
            </div>
        </div>
    </div>
{/if}

<!-- P0-3: Undo delete toast — 5-second window to reverse a PIN-confirmed delete -->
{#if pendingUndoItem}
    <div class="fixed bottom-6 right-6 z-[80] flex items-center gap-3 rounded-xl bg-gray-900 px-4 py-3 text-white shadow-xl">
        <span class="text-sm font-medium">Expense deleted</span>
        <button
            type="button"
            onclick={undoDelete}
            class="rounded bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30 transition-colors min-h-[36px]"
        >Undo</button>
    </div>
{/if}

<div class="flex h-full flex-col p-6 gap-6">
    <!-- Header — P0-4: label and amount sync to logFilter; P2-7: branch label on secondary line -->
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Expenses</h1>
        <div class="text-right">
            <p class="text-sm font-semibold text-gray-500">
                {logFilter === 'today' ? "Today's Total" : logFilter === 'week' ? "This Week's Total" : logFilter === 'month' ? "This Month's Total" : 'All Time Total'}
            </p>
            <p class="text-xl font-bold text-status-red">{formatPeso(filteredTotal)}</p>
            <p class="text-xs text-gray-400 mt-0.5">{locationLabel} · All time: {formatPeso(allTimeTotal)}</p>
        </div>
    </div>

    <div class="grid grid-cols-[320px_1fr] gap-6 h-full min-h-0 pb-10">
        <!-- Input Form -->
        <form
            bind:this={formEl}
            onsubmit={handleSubmit}
            class="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 shadow-sm h-fit"
        >
            <h2 class="font-bold text-gray-900">Record Expense</h2>

            {#if successVisible}
                <div class="flex items-center gap-2 rounded-lg bg-status-green/10 border border-status-green/30 px-3 py-2 text-sm font-semibold text-status-green">
                    <span>✓</span> Expense recorded
                </div>
            {/if}

            <!-- Category -->
            <label class="flex flex-col gap-1.5">
                <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Category</span>
                <select
                    bind:value={category}
                    onblur={() => (categoryTouched = true)}
                    class="pos-input"
                    class:border-status-red={!!categoryError}
                >
                    {#if expenseCategoryGroups}
                        {#each expenseCategoryGroups as group}
                            <optgroup label={group.label}>
                                {#each group.options as opt}
                                    <option value={opt.value}>{opt.label}</option>
                                {/each}
                            </optgroup>
                        {/each}
                    {:else}
                        {#each expenseCategories as cat}
                            <option value={cat}>{cat}</option>
                        {/each}
                    {/if}
                </select>
                {#if categoryError}
                    <span class="text-xs text-status-red">{categoryError}</span>
                {/if}
            </label>

            {#if category === 'Petty Cash Replenishment'}
                <div class="flex items-start gap-2 rounded-lg border border-status-yellow/40 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                    <span class="mt-0.5 shrink-0">⚠</span>
                    <span>This records a fund movement, not a business expense — it will appear in expense totals.</span>
                </div>
            {/if}

            <!-- Utility meter reading fields -->
            {#if showMeterFields}
                <div class="flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <p class="text-xs font-semibold uppercase tracking-wide text-blue-600">
                        {isGasLpg ? 'Gas / LPG Delivery' : 'Meter Reading'}
                    </p>
                    {#if !isGasLpg}
                        <label class="flex flex-col gap-1">
                            <span class="text-xs text-blue-700">Previous Reading ({meterUnit})</span>
                            <input type="number" step="0.001" min="0" bind:value={meterPrev} class="pos-input" placeholder="0" />
                        </label>
                        <label class="flex flex-col gap-1">
                            <span class="text-xs text-blue-700">Current Reading ({meterUnit})</span>
                            <input type="number" step="0.001" min="0" bind:value={meterCurr} class="pos-input" placeholder="0" />
                        </label>
                        <label class="flex flex-col gap-1">
                            <span class="text-xs text-blue-700">Rate (₱/{meterUnit})</span>
                            <input type="number" step="0.0001" min="0" bind:value={meterRate} class="pos-input" placeholder="0.00" />
                        </label>
                        {#if computedMeterAmount !== null}
                            <p class="text-xs text-blue-700 font-semibold">
                                Computed: {formatPeso(computedMeterAmount)}
                                <span class="font-normal opacity-70">— reflected in Amount below (editable)</span>
                            </p>
                        {/if}
                    {:else}
                        <label class="flex flex-col gap-1">
                            <span class="text-xs text-blue-700">Kg Delivered</span>
                            <input type="number" step="0.001" min="0" bind:value={gasKg} class="pos-input" placeholder="0" />
                        </label>
                        <label class="flex flex-col gap-1">
                            <span class="text-xs text-blue-700">Rate (₱/kg)</span>
                            <input type="number" step="0.0001" min="0" bind:value={gasRate} class="pos-input" placeholder="0.00" />
                        </label>
                        {#if computedMeterAmount !== null}
                            <p class="text-xs text-blue-700 font-semibold">
                                Computed: {formatPeso(computedMeterAmount)}
                                <span class="font-normal opacity-70">— reflected in Amount below (editable)</span>
                            </p>
                        {/if}
                    {/if}
                </div>
            {/if}

            <!-- Amount -->
            <label class="flex flex-col gap-1.5">
                <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Amount (₱)</span>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    bind:value={amount}
                    onblur={() => { amountTouched = true; amountBlurred = true; }}
                    class="pos-input text-lg font-mono font-bold text-gray-900"
                    class:border-status-red={!!amountError}
                    placeholder="0.00"
                />
                {#if amountError}
                    <span class="text-xs text-status-red">{amountError}</span>
                {/if}
                {#if amountPreview}
                    <span class="text-xs text-gray-500 font-mono">= {amountPreview}</span>
                {/if}
            </label>

            <!-- Description -->
            <label class="flex flex-col gap-1.5">
                <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Description</span>
                <input
                    type="text"
                    bind:value={description}
                    maxlength="200"
                    onblur={() => (descriptionTouched = true)}
                    class="pos-input"
                    class:border-status-red={!!descriptionError}
                    placeholder={descriptionPlaceholder}
                />
                {#if descriptionError}
                    <span class="text-xs text-status-red">{descriptionError}</span>
                {/if}
                <span class="text-xs text-gray-400 text-right">{description.length}/200</span>
            </label>

            <!-- Date -->
            <label class="flex flex-col gap-1.5">
                <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Date</span>
                <input type="date" bind:value={expenseDate} class="pos-input" />
            </label>

            <!-- Paid By -->
            <label class="flex flex-col gap-1.5">
                <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Paid By</span>
                <select bind:value={paidBy} class="pos-input">
                    <option value="Petty Cash">Petty Cash</option>
                    <option value="Cash from Register">Cash from Register</option>
                    <option value="Company Card">Company Card</option>
                    <option value="GCash">GCash</option>
                    <option value="Maya">Maya</option>
                    <option value="Owner's Pocket">Owner's Pocket</option>
                </select>
            </label>

            <!-- Receipt Photo -->
            <PhotoCapture
                photos={receiptPhotos}
                onchange={(photos) => (receiptPhotos = photos)}
                max={1}
                label="Receipt Photo (Optional)"
            />

            {#if errorMessage}
                <div class="text-sm text-status-red bg-red-50 px-3 py-2 rounded-lg">
                    {errorMessage}
                </div>
            {/if}
            {#if formError}
                <p class="text-sm text-status-red">{formError}</p>
            {/if}

            <button
                type="submit"
                disabled={!canSubmit}
                class="btn-primary mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
                {#if isSubmitting}
                    <Loader2 class="h-4 w-4 animate-spin" /> Saving...
                {:else}
                    <span>➕</span> Record Expense
                {/if}
            </button>
        </form>

        <!-- Expense Log -->
        <div class="flex flex-col rounded-xl border border-border bg-white shadow-sm overflow-hidden h-[calc(100vh-160px)]">
            <!-- Log header with filter -->
            <div class="border-b border-border bg-gray-50 px-4 py-3 shrink-0 flex items-center justify-between gap-4">
                <h2 class="font-bold text-gray-900">
                    Expense Log
                    <span class="font-normal text-gray-400 text-sm">({filteredExpenses.length}{logFilter === 'today' ? ' today' : logFilter === 'week' ? ' this week' : logFilter === 'month' ? ' this month' : ' total'})</span>
                </h2>
                <div class="flex gap-1">
                    {#each ([['today', 'Today'], ['week', 'This Week'], ['month', 'This Month'], ['all', 'All Time']] as const) as [val, label]}
                        <button
                            type="button"
                            onclick={() => (logFilter = val)}
                            class="px-4 py-1 rounded-full text-xs font-semibold transition-colors min-h-[44px]"
                            class:bg-accent={logFilter === val}
                            class:text-white={logFilter === val}
                            class:bg-gray-100={logFilter !== val}
                            class:text-gray-600={logFilter !== val}
                        >
                            {label}
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Category subtotals strip -->
            {#if categorySubtotals.length > 0}
                <div class="border-b border-border bg-surface-secondary px-4 py-2 text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                    {#each categorySubtotals as sub, i}
                        <span>
                            <span class="font-semibold text-gray-600">{sub.group}</span>
                            {formatPeso(sub.total)}
                        </span>
                        {#if i < categorySubtotals.length - 1}
                            <span class="text-gray-300">·</span>
                        {/if}
                    {/each}
                </div>
            {/if}

            <div class="flex-1 overflow-y-auto">
                {#if filteredExpenses.length === 0}
                    <div class="flex h-full flex-col items-center justify-center text-gray-400">
                        <div class="mb-2 text-4xl">📝</div>
                        <p>No expenses for this period.</p>
                    </div>
                {:else}
                    <table class="w-full text-sm">
                        <thead class="sticky top-0 bg-white shadow-sm z-10">
                            <tr class="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-gray-400 [&>th]:px-4 [&>th]:py-3">
                                <th>Date</th>
                                <th>Time</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Source</th>
                                {#if hasAnyPhotos}
                                    <th>Photo</th>
                                {/if}
                                <th class="text-right">
                                    <button
                                        type="button"
                                        onclick={toggleAmountSort}
                                        class="inline-flex items-center gap-1 hover:text-gray-700 transition-colors cursor-pointer"
                                        title="Sort by amount"
                                    >
                                        Amount
                                        {#if sortByAmount === 'desc'}
                                            <span>▼</span>
                                        {:else if sortByAmount === 'asc'}
                                            <span>▲</span>
                                        {:else}
                                            <span class="opacity-30">⇅</span>
                                        {/if}
                                    </button>
                                </th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-border">
                            {#each filteredExpenses as exp (exp.id)}
                                <tr class="hover:bg-gray-50 transition-colors [&>td]:px-4 [&>td]:py-3">
                                    <!-- P2-5: Human-readable date (e.g. "Mar 9") -->
                                    <td class="whitespace-nowrap text-gray-500 text-xs">
                                        {formatShortDate(exp.expenseDate ?? exp.createdAt.slice(0, 10))}
                                    </td>
                                    <td class="whitespace-nowrap text-gray-500">
                                        {new Date(exp.createdAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td>
                                        <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {getCategoryBadgeClass(exp.category)}">
                                            {exp.category}
                                        </span>
                                    </td>
                                    <td class="text-gray-600 truncate max-w-xs" title={exp.description}>{exp.description}</td>
                                    <td class="text-gray-500">{exp.paidBy}</td>
                                    {#if hasAnyPhotos}
                                        <td class="text-center">
                                            {#if exp.receiptPhoto}
                                                <a href={exp.receiptPhoto} target="_blank" rel="noopener noreferrer" class="text-accent hover:underline text-lg" title="View Receipt">
                                                    📸
                                                </a>
                                            {:else}
                                                <span class="text-gray-300">-</span>
                                            {/if}
                                        </td>
                                    {/if}
                                    <td class="text-right font-mono font-bold text-status-red">
                                        {formatPeso(exp.amount)}
                                    </td>
                                    <!-- P1-6: Delete button — explicit red danger styling, separated from Repeat -->
                                    <td class="text-right">
                                        <div class="flex items-center justify-end gap-0">
                                            <button
                                                type="button"
                                                onclick={() => repeatExpense(exp)}
                                                title="Repeat this expense"
                                                class="flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] text-accent hover:text-accent-dark rounded transition-colors px-2"
                                            >
                                                <RotateCcw class="h-4 w-4" />
                                                <span class="hidden lg:inline text-xs">Repeat</span>
                                            </button>
                                            <!-- Visual separator -->
                                            <div class="w-px h-6 bg-gray-200 mx-1"></div>
                                            <!-- Delete — red, labeled, clearly distinct from Repeat -->
                                            <button
                                                type="button"
                                                onclick={() => requestDelete(exp)}
                                                title="Delete expense"
                                                class="flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] text-status-red hover:bg-red-50 rounded px-2 transition-colors"
                                            >
                                                <span class="text-sm font-bold leading-none">✕</span>
                                                <span class="hidden lg:inline text-xs font-semibold">Delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                        <!-- P2-4: Subtotal footer row showing filteredTotal -->
                        <tfoot>
                            <tr class="border-t-2 border-border bg-gray-50 font-semibold">
                                <td colspan={hasAnyPhotos ? 5 : 4} class="px-4 py-3 text-sm text-gray-600">
                                    {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
                                </td>
                                <td class="px-4 py-3 text-right font-mono font-bold text-status-red">
                                    {formatPeso(filteredTotal)}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                {/if}
            </div>
        </div>
    </div>
</div>
