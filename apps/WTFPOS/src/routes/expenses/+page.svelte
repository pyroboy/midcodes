<script lang="ts">
    import {
        allExpenses,
        addExpense,
        deleteExpense,
        expenseCategoryGroups,
        getCategoryBadgeClass,
        getCategoryGroup,
        getCategoryIcon,
        getGroupBorderColor,
        PAID_BY_OPTIONS,
        allTemplates,
        addTemplate,
        deleteTemplate,
    } from '$lib/stores/expenses.svelte';
    import type { ExpenseTemplate } from '$lib/stores/expenses.svelte';
    import { session, ELEVATED_ROLES } from '$lib/stores/session.svelte';
    import { formatPeso, cn } from '$lib/utils';
    import { Loader2, RotateCcw, ChevronLeft, Plus, X, Bookmark } from 'lucide-svelte';
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

    // ─── Templates for current location ──────────────────────────────────────
    const branchTemplates = $derived(
        allTemplates.value.filter(t =>
            t.isActive &&
            (session.locationId === 'all' || t.locationId === session.locationId)
        )
    );

    const isElevated = $derived(ELEVATED_ROLES.includes(session.role as any));

    // ─── Log filter state ─────────────────────────────────────────────────────
    type LogFilter = 'today' | 'week' | 'month' | 'all';
    let logFilter = $state<LogFilter>('today');
    let sortByAmount = $state<'asc' | 'desc' | null>(null);

    function toggleAmountSort() {
        if (sortByAmount === null) sortByAmount = 'desc';
        else if (sortByAmount === 'desc') sortByAmount = 'asc';
        else sortByAmount = null;
    }

    function isoDate(d: Date): string { return d.toISOString().slice(0, 10); }
    const today = $derived(isoDate(new Date()));

    function startOfWeek(): string {
        const d = new Date(); d.setDate(d.getDate() - d.getDay()); return isoDate(d);
    }
    function startOfMonth(): string {
        const d = new Date(); d.setDate(1); return isoDate(d);
    }

    // Undo delete state
    let pendingUndoItem = $state<{ id: string; category: string; amount: number; description: string } | null>(null);
    let undoTimer = $state<ReturnType<typeof setTimeout> | null>(null);

    const filteredExpenses = $derived((() => {
        let list = branchExpenses.slice();
        if (pendingUndoItem) list = list.filter(e => e.id !== pendingUndoItem!.id);
        if (logFilter === 'today') {
            list = list.filter(e => (e.expenseDate ?? e.createdAt.slice(0, 10)) === today);
        } else if (logFilter === 'week') {
            const weekStart = startOfWeek();
            list = list.filter(e => (e.expenseDate ?? e.createdAt.slice(0, 10)) >= weekStart);
        } else if (logFilter === 'month') {
            const monthStart = startOfMonth();
            const nextMonthStart = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + 1); return isoDate(d); })();
            list = list.filter(e => { const ds = e.expenseDate ?? e.createdAt.slice(0, 10); return ds >= monthStart && ds < nextMonthStart; });
        }
        if (sortByAmount === 'desc') list = list.slice().sort((a, b) => b.amount - a.amount);
        else if (sortByAmount === 'asc') list = list.slice().sort((a, b) => a.amount - b.amount);
        return list;
    })());

    const filteredTotal = $derived(filteredExpenses.reduce((s, e) => s + e.amount, 0));
    const locationLabel = $derived(
        session.locationId === 'all' ? 'All Branches' :
        session.locationId === 'tag' ? 'Alta Citta' :
        session.locationId === 'pgl' ? 'Alona Beach' :
        session.locationId
    );

    const categorySubtotals = $derived((() => {
        const totals = new Map<string, number>();
        for (const exp of filteredExpenses) {
            const grp = getCategoryGroup(exp.category);
            totals.set(grp, (totals.get(grp) ?? 0) + exp.amount);
        }
        const groupOrder = ['Staff & Labor', 'Procurement', 'Utilities', 'Operations'];
        return groupOrder
            .filter(g => (totals.get(g) ?? 0) > 0)
            .map(g => ({ group: g, total: totals.get(g) ?? 0 }));
    })());

    function formatShortDate(iso: string): string {
        const d = new Date(iso + 'T12:00:00');
        return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    }

    const hasAnyPhotos = $derived(filteredExpenses.some(e => e.receiptPhoto));

    // ─── Step-based form state ─────────────────────────────────────────────────
    type Step = 1 | 2 | 3;
    let step = $state<Step>(1);
    let category = $state('');
    let amount = $state('');
    let description = $state('');
    let paidBy = $state<string>('Cash from Register');
    let receiptPhotos = $state<string[]>([]);
    let expenseDate = $state(isoDate(new Date()));
    let isSubmitting = $state(false);
    let successVisible = $state(false);
    let successTimer: ReturnType<typeof setTimeout> | null = null;
    let formError = $state('');

    // Meter fields for utilities
    let meterPrev = $state('');
    let meterCurr = $state('');
    let meterRate = $state('');
    let gasKg = $state('');
    let gasRate = $state('');

    const showMeterFields = $derived(category === 'Water' || category === 'Electricity' || category === 'Gas / LPG');
    const isGasLpg = $derived(category === 'Gas / LPG');

    const computedMeterAmount = $derived((() => {
        if (category === 'Water' || category === 'Electricity') {
            const prev = parseFloat(meterPrev), curr = parseFloat(meterCurr), rate = parseFloat(meterRate);
            if (!isNaN(prev) && !isNaN(curr) && !isNaN(rate) && curr > prev && rate > 0) return (curr - prev) * rate;
        } else if (category === 'Gas / LPG') {
            const kg = parseFloat(gasKg), rate = parseFloat(gasRate);
            if (!isNaN(kg) && !isNaN(rate) && kg > 0 && rate > 0) return kg * rate;
        }
        return null;
    })());

    $effect(() => { if (computedMeterAmount !== null) amount = computedMeterAmount.toFixed(2); });
    $effect(() => { if (!showMeterFields) { meterPrev = ''; meterCurr = ''; meterRate = ''; gasKg = ''; gasRate = ''; } });

    const meterUnit = $derived(category === 'Water' ? 'cu.m' : category === 'Electricity' ? 'kWh' : 'kg');

    const descriptionPlaceholder = $derived((() => {
        switch (category) {
            case 'Water': return 'e.g., Water bill — March meter reading';
            case 'Electricity': return 'e.g., Electricity bill — BECO March';
            case 'Gas / LPG': return 'e.g., LPG 50kg tank refill — Tagbilaran Gas';
            case 'Daily Wages': return 'e.g., Maria Santos — Mon–Sat shift';
            case 'Meat & Protein': return 'e.g., Pork Bone-In 15kg — Metro Meat Co.';
            case 'Repairs & Maintenance': return 'e.g., Kitchen exhaust fan motor replacement';
            case 'Rent': return 'e.g., March rent — Alta Citta space';
            default: return 'Brief description of this expense';
        }
    })());

    const skipLargeAmountWarning = $derived(
        category === 'Daily Wages' || category === 'Benefits (SSS/PhilHealth)' || category === 'Meat & Protein' || category === 'Rent'
    );

    let showLargeAmountConfirm = $state(false);
    let pendingLargeAmount = $state(0);

    // ─── Template management ──────────────────────────────────────────────────
    let showTemplateForm = $state(false);
    let templateName = $state('');
    let templateAmount = $state('');

    function selectCategory(cat: string) {
        category = cat;
        step = 2;
    }

    function applyTemplate(tpl: ExpenseTemplate) {
        category = tpl.category;
        description = tpl.description;
        amount = String(tpl.defaultAmount);
        paidBy = tpl.paidBy;
        step = 3;
    }

    function resetForm() {
        step = 1;
        category = '';
        amount = '';
        description = '';
        paidBy = 'Cash from Register';
        receiptPhotos = [];
        expenseDate = isoDate(new Date());
        formError = '';
        meterPrev = ''; meterCurr = ''; meterRate = ''; gasKg = ''; gasRate = '';
        showLargeAmountConfirm = false;
        showTemplateForm = false;
    }

    function goToReview() {
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) { formError = 'Enter a valid amount'; return; }
        if (!description.trim()) { formError = 'Add a description'; return; }
        formError = '';

        if (numAmount > 10000 && !skipLargeAmountWarning) {
            pendingLargeAmount = numAmount;
            showLargeAmountConfirm = true;
            return;
        }
        step = 3;
    }

    function confirmLargeAmount() {
        showLargeAmountConfirm = false;
        step = 3;
    }

    async function handleSubmit() {
        isSubmitting = true;
        formError = '';

        try {
            const numAmount = parseFloat(amount);
            const photoUrl = receiptPhotos[0];
            const result = await addExpense(category, numAmount, description, paidBy, photoUrl, expenseDate);

            if (!result.success) {
                formError = result.error || 'Failed to save expense';
                return;
            }

            successVisible = true;
            if (successTimer) clearTimeout(successTimer);
            successTimer = setTimeout(() => { successVisible = false; }, 3000);
            resetForm();
        } catch (_err) {
            formError = 'Could not save expense. Please try again.';
        } finally {
            isSubmitting = false;
        }
    }

    async function saveAsTemplate() {
        if (!templateName.trim() || !category) return;
        const numAmount = parseFloat(templateAmount || amount || '0');
        await addTemplate({
            locationId: session.locationId === 'all' ? 'tag' : session.locationId,
            category,
            description: templateName.trim(),
            defaultAmount: numAmount,
            paidBy,
            recurrence: 'adhoc',
            isActive: true,
            createdBy: session.userName || 'Staff',
        });
        showTemplateForm = false;
        templateName = '';
        templateAmount = '';
    }

    // ─── Pre-fill from query params ──────────────────────────────────────────
    onMount(() => {
        const params = page.url.searchParams;
        const qCategory = params.get('category');
        const qAmount = params.get('amount');
        const qDescription = params.get('description');

        if (qCategory) { category = qCategory; step = 2; }
        if (qAmount) { const p = parseFloat(qAmount); if (!isNaN(p) && p > 0) amount = String(p); }
        if (qDescription) description = qDescription;
        if (qCategory || qAmount || qDescription) goto('/expenses', { replaceState: true, noScroll: true });
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

        pendingUndoItem = { id: deleteId, category: snapshot?.category ?? '', amount: snapshot?.amount ?? 0, description: snapshot?.description ?? '' };
        if (undoTimer) clearTimeout(undoTimer);
        undoTimer = setTimeout(async () => { await deleteExpense(deleteId); pendingUndoItem = null; undoTimer = null; }, 5000);
    }

    function undoDelete() { if (undoTimer) clearTimeout(undoTimer); undoTimer = null; pendingUndoItem = null; }

    function repeatExpense(exp: { category: string; paidBy: string; description: string }) {
        category = exp.category;
        paidBy = exp.paidBy;
        description = exp.description;
        amount = '';
        step = 2;
    }

    // ─── Log section toggle ──────────────────────────────────────────────────
    let logExpanded = $state(true);
</script>

<!-- Manager PIN Modal -->
<ManagerPinModal
    isOpen={pinModalOpen}
    title="Confirm Delete"
    description={pendingDeleteSnapshot
        ? `Delete: ${pendingDeleteSnapshot.category} — ${formatPeso(pendingDeleteSnapshot.amount)}\n\nEnter Manager PIN to confirm.`
        : 'Enter Manager PIN to delete this expense.'}
    confirmLabel="Delete"
    confirmClass="btn-danger"
    onClose={() => { pinModalOpen = false; pendingDeleteId = null; pendingDeleteSnapshot = null; }}
    onConfirm={confirmDelete}
/>

<!-- Large amount confirmation -->
{#if showLargeAmountConfirm}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="pos-card w-full max-w-[360px] mx-4 flex flex-col gap-4">
            <h3 class="text-lg font-bold text-gray-900">Large Amount</h3>
            <p class="text-sm text-gray-700">
                <span class="font-bold text-status-red font-mono">{formatPeso(parseFloat(amount))}</span> — are you sure?
            </p>
            <div class="flex gap-2">
                <button type="button" onclick={() => (showLargeAmountConfirm = false)} class="btn-ghost flex-1 min-h-[44px]">Cancel</button>
                <button type="button" onclick={confirmLargeAmount} class="btn-danger flex-1 min-h-[44px]">Yes, Continue</button>
            </div>
        </div>
    </div>
{/if}

<!-- Undo delete toast -->
{#if pendingUndoItem}
    <div class="fixed bottom-6 right-6 z-[80] flex items-center gap-3 rounded-xl bg-gray-900 px-4 py-3 text-white shadow-xl fixed-safe-bottom fixed-safe-right">
        <span class="text-sm font-medium">Expense deleted</span>
        <button type="button" onclick={undoDelete} class="rounded bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30 transition-colors min-h-[36px]">Undo</button>
    </div>
{/if}

<div class="flex h-full flex-col p-6 gap-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Expenses</h1>
        <div class="text-right">
            <p class="text-sm font-semibold text-gray-500">
                {logFilter === 'today' ? "Today's Total" : logFilter === 'week' ? "This Week" : logFilter === 'month' ? "This Month" : 'All Time'}
            </p>
            <p class="text-xl font-bold text-status-red">{formatPeso(filteredTotal)}</p>
            <p class="text-xs text-gray-400 mt-0.5">{locationLabel}</p>
        </div>
    </div>

    <!-- Quick Templates Strip -->
    {#if branchTemplates.length > 0}
        <div class="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <span class="text-xs font-semibold uppercase tracking-wide text-gray-400 shrink-0">Quick:</span>
            {#each branchTemplates as tpl (tpl.id)}
                <button
                    onclick={() => applyTemplate(tpl)}
                    class="flex items-center gap-2 shrink-0 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-accent-light hover:border-accent/30 transition-colors min-h-[44px]"
                >
                    <span>{getCategoryIcon(tpl.category)}</span>
                    <span>{tpl.description}</span>
                    <span class="font-mono text-xs text-gray-400">{formatPeso(tpl.defaultAmount)}</span>
                </button>
            {/each}
        </div>
    {/if}

    <!-- Success toast -->
    {#if successVisible}
        <div class="flex items-center gap-2 rounded-xl bg-status-green/10 border border-status-green/30 px-4 py-3 text-sm font-semibold text-status-green">
            <span>&#10003;</span> Expense recorded successfully
        </div>
    {/if}

    <!-- Step Flow -->
    <div class="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <!-- Step indicator -->
        <div class="flex items-center gap-1 px-5 pt-4 pb-2">
            {#each [1, 2, 3] as s}
                <div class={cn(
                    'flex items-center gap-1.5',
                    s <= step ? 'text-accent' : 'text-gray-300'
                )}>
                    <div class={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                        s === step ? 'bg-accent text-white' : s < step ? 'bg-accent/20 text-accent' : 'bg-gray-100 text-gray-400'
                    )}>{s}</div>
                    <span class="text-xs font-medium hidden sm:inline">
                        {s === 1 ? 'Category' : s === 2 ? 'Details' : 'Confirm'}
                    </span>
                </div>
                {#if s < 3}
                    <div class={cn('flex-1 h-px mx-2', s < step ? 'bg-accent/40' : 'bg-gray-200')}></div>
                {/if}
            {/each}
        </div>

        <div class="p-5">
            <!-- STEP 1: Category Selection -->
            {#if step === 1}
                <div class="flex flex-col gap-4">
                    <h2 class="font-bold text-gray-900">What type of expense?</h2>
                    <div class="flex flex-col gap-5">
                        {#each expenseCategoryGroups as group}
                            <div>
                                <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">{group.label}</p>
                                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {#each group.options as opt}
                                        <button
                                            onclick={() => selectCategory(opt.value)}
                                            class={cn(
                                                'flex items-center gap-3 rounded-xl border-l-4 border border-border bg-white px-4 py-3 text-left transition-all hover:shadow-md hover:border-accent/30 min-h-[60px]',
                                                getGroupBorderColor(group.label),
                                                category === opt.value && 'ring-2 ring-accent/40 border-accent/30 bg-accent-light'
                                            )}
                                        >
                                            <span class="text-xl">{opt.icon}</span>
                                            <span class="text-sm font-medium text-gray-800">{opt.label}</span>
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>

            <!-- STEP 2: Amount + Details -->
            {:else if step === 2}
                <div class="flex flex-col gap-5 max-w-lg mx-auto">
                    <div class="flex items-center gap-3">
                        <button onclick={() => (step = 1)} class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                            <ChevronLeft class="w-5 h-5" />
                        </button>
                        <div class="flex items-center gap-2">
                            <span class="text-xl">{getCategoryIcon(category)}</span>
                            <h2 class="font-bold text-gray-900">{category}</h2>
                        </div>
                    </div>

                    <!-- Utility meter fields -->
                    {#if showMeterFields}
                        <div class="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                            <p class="text-xs font-semibold uppercase tracking-wide text-blue-600">
                                {isGasLpg ? 'Gas / LPG Delivery' : 'Meter Reading'}
                            </p>
                            {#if !isGasLpg}
                                <div class="grid grid-cols-3 gap-3">
                                    <label class="flex flex-col gap-1">
                                        <span class="text-xs text-blue-700">Previous ({meterUnit})</span>
                                        <input type="number" step="0.001" min="0" bind:value={meterPrev} class="pos-input" placeholder="0" />
                                    </label>
                                    <label class="flex flex-col gap-1">
                                        <span class="text-xs text-blue-700">Current ({meterUnit})</span>
                                        <input type="number" step="0.001" min="0" bind:value={meterCurr} class="pos-input" placeholder="0" />
                                    </label>
                                    <label class="flex flex-col gap-1">
                                        <span class="text-xs text-blue-700">Rate (₱/{meterUnit})</span>
                                        <input type="number" step="0.0001" min="0" bind:value={meterRate} class="pos-input" placeholder="0.00" />
                                    </label>
                                </div>
                            {:else}
                                <div class="grid grid-cols-2 gap-3">
                                    <label class="flex flex-col gap-1">
                                        <span class="text-xs text-blue-700">Kg Delivered</span>
                                        <input type="number" step="0.001" min="0" bind:value={gasKg} class="pos-input" placeholder="0" />
                                    </label>
                                    <label class="flex flex-col gap-1">
                                        <span class="text-xs text-blue-700">Rate (₱/kg)</span>
                                        <input type="number" step="0.0001" min="0" bind:value={gasRate} class="pos-input" placeholder="0.00" />
                                    </label>
                                </div>
                            {/if}
                            {#if computedMeterAmount !== null}
                                <p class="text-xs text-blue-700 font-semibold">
                                    Computed: {formatPeso(computedMeterAmount)}
                                </p>
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
                            class="pos-input text-2xl font-mono font-bold text-gray-900 text-center py-4"
                            placeholder="0.00"
                        />
                    </label>

                    <!-- Description -->
                    <label class="flex flex-col gap-1.5">
                        <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Description</span>
                        <input
                            type="text"
                            bind:value={description}
                            maxlength="200"
                            class="pos-input"
                            placeholder={descriptionPlaceholder}
                        />
                        <span class="text-xs text-gray-400 text-right">{description.length}/200</span>
                    </label>

                    <!-- Date -->
                    <label class="flex flex-col gap-1.5">
                        <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Date</span>
                        <input type="date" bind:value={expenseDate} class="pos-input" />
                    </label>

                    <!-- Paid By — horizontal pill buttons -->
                    <div class="flex flex-col gap-1.5">
                        <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Paid By</span>
                        <div class="flex flex-wrap gap-2">
                            {#each PAID_BY_OPTIONS as method}
                                <button
                                    type="button"
                                    onclick={() => (paidBy = method)}
                                    class={cn(
                                        'rounded-lg border px-3 py-2 text-sm font-medium transition-colors min-h-[44px]',
                                        paidBy === method
                                            ? 'border-accent bg-accent-light text-accent'
                                            : 'border-border bg-white text-gray-600 hover:bg-gray-50'
                                    )}
                                >
                                    {method}
                                </button>
                            {/each}
                        </div>
                    </div>

                    {#if formError}
                        <p class="text-sm text-status-red bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
                    {/if}

                    <button
                        type="button"
                        onclick={goToReview}
                        class="btn-primary mt-1 min-h-[48px] text-base"
                    >
                        Review &amp; Submit
                    </button>
                </div>

            <!-- STEP 3: Review & Confirm -->
            {:else if step === 3}
                <div class="flex flex-col gap-5 max-w-lg mx-auto">
                    <div class="flex items-center gap-3">
                        <button onclick={() => (step = 2)} class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                            <ChevronLeft class="w-5 h-5" />
                        </button>
                        <h2 class="font-bold text-gray-900">Review Expense</h2>
                    </div>

                    <!-- Summary card -->
                    <div class="rounded-xl border border-border bg-surface-secondary p-5 flex flex-col gap-3">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">{getCategoryIcon(category)}</span>
                            <span class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium {getCategoryBadgeClass(category)}">
                                {category}
                            </span>
                        </div>
                        <p class="text-3xl font-bold font-mono text-gray-900 text-center py-2">
                            {formatPeso(parseFloat(amount) || 0)}
                        </p>
                        {#if description}
                            <p class="text-sm text-gray-600 text-center">{description}</p>
                        {/if}
                        <div class="flex items-center justify-center gap-4 text-xs text-gray-400">
                            <span>{expenseDate}</span>
                            <span>·</span>
                            <span>{paidBy}</span>
                        </div>
                    </div>

                    <!-- Receipt photo -->
                    <PhotoCapture
                        photos={receiptPhotos}
                        onchange={(photos) => (receiptPhotos = photos)}
                        max={1}
                        label="Receipt Photo (Optional)"
                    />

                    {#if formError}
                        <p class="text-sm text-status-red bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
                    {/if}

                    <div class="flex gap-3">
                        <button type="button" onclick={() => (step = 2)} class="btn-ghost flex-1 min-h-[48px]">
                            Edit
                        </button>
                        <button
                            type="button"
                            onclick={handleSubmit}
                            disabled={isSubmitting}
                            class="btn-primary flex-1 min-h-[48px] flex items-center justify-center gap-2"
                        >
                            {#if isSubmitting}
                                <Loader2 class="h-4 w-4 animate-spin" /> Saving...
                            {:else}
                                Record Expense
                            {/if}
                        </button>
                    </div>

                    <!-- Save as template (manager+) -->
                    {#if isElevated}
                        {#if !showTemplateForm}
                            <button
                                type="button"
                                onclick={() => { showTemplateForm = true; templateName = description; templateAmount = amount; }}
                                class="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-accent transition-colors min-h-[44px]"
                            >
                                <Bookmark class="w-3.5 h-3.5" />
                                Save as Quick Template
                            </button>
                        {:else}
                            <div class="flex flex-col gap-2 rounded-lg border border-border bg-surface-secondary p-3">
                                <p class="text-xs font-semibold text-gray-500">Template Name</p>
                                <input type="text" bind:value={templateName} class="pos-input text-sm" placeholder="e.g., LPG Refill" />
                                <div class="flex gap-2">
                                    <button onclick={() => (showTemplateForm = false)} class="btn-ghost flex-1 text-xs min-h-[40px]">Cancel</button>
                                    <button onclick={saveAsTemplate} class="btn-primary flex-1 text-xs min-h-[40px]">Save Template</button>
                                </div>
                            </div>
                        {/if}
                    {/if}
                </div>
            {/if}
        </div>
    </div>

    <!-- Expense Log -->
    <div class="flex flex-col rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div class="border-b border-border bg-gray-50 px-4 py-3 shrink-0 flex items-center justify-between gap-4">
            <button
                type="button"
                onclick={() => (logExpanded = !logExpanded)}
                class="font-bold text-gray-900 flex items-center gap-2"
            >
                <span class={cn('transition-transform text-gray-400', logExpanded ? 'rotate-0' : '-rotate-90')}>&#9660;</span>
                Expense Log
                <span class="font-normal text-gray-400 text-sm">({filteredExpenses.length})</span>
            </button>
            <div class="flex gap-1">
                {#each ([['today', 'Today'], ['week', 'Week'], ['month', 'Month'], ['all', 'All']] as const) as [val, label]}
                    <button
                        type="button"
                        onclick={() => (logFilter = val)}
                        class={cn(
                            'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors min-h-[36px]',
                            logFilter === val ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600'
                        )}
                    >
                        {label}
                    </button>
                {/each}
            </div>
        </div>

        {#if logExpanded}
            <!-- Category subtotals -->
            {#if categorySubtotals.length > 0}
                <div class="border-b border-border bg-surface-secondary px-4 py-2 text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                    {#each categorySubtotals as sub, i}
                        <span>
                            <span class="font-semibold text-gray-600">{sub.group}</span>
                            {formatPeso(sub.total)}
                        </span>
                        {#if i < categorySubtotals.length - 1}
                            <span class="text-gray-300">&middot;</span>
                        {/if}
                    {/each}
                </div>
            {/if}

            <div class="flex-1 overflow-y-auto max-h-[50vh]">
                {#if filteredExpenses.length === 0}
                    <div class="flex h-40 flex-col items-center justify-center text-gray-400">
                        <p>No expenses for this period.</p>
                    </div>
                {:else}
                    <table class="w-full text-sm">
                        <thead class="sticky top-0 bg-white shadow-sm z-10">
                            <tr class="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-gray-400 [&>th]:px-4 [&>th]:py-3">
                                <th>Date</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Source</th>
                                {#if hasAnyPhotos}<th>Photo</th>{/if}
                                <th class="text-right">
                                    <button type="button" onclick={toggleAmountSort} class="inline-flex items-center gap-1 hover:text-gray-700 cursor-pointer">
                                        Amount
                                        {#if sortByAmount === 'desc'}<span>&#9660;</span>{:else if sortByAmount === 'asc'}<span>&#9650;</span>{:else}<span class="opacity-30">&#8693;</span>{/if}
                                    </button>
                                </th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-border">
                            {#each filteredExpenses as exp (exp.id)}
                                <tr class="hover:bg-gray-50 transition-colors [&>td]:px-4 [&>td]:py-3">
                                    <td class="whitespace-nowrap text-gray-500 text-xs">{formatShortDate(exp.expenseDate ?? exp.createdAt.slice(0, 10))}</td>
                                    <td>
                                        <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {getCategoryBadgeClass(exp.category)}">
                                            {getCategoryIcon(exp.category)} {exp.category}
                                        </span>
                                    </td>
                                    <td class="text-gray-600 truncate max-w-xs" title={exp.description}>{exp.description}</td>
                                    <td class="text-gray-500">{exp.paidBy}</td>
                                    {#if hasAnyPhotos}
                                        <td class="text-center">
                                            {#if exp.receiptPhoto}
                                                <a href={exp.receiptPhoto} target="_blank" rel="noopener noreferrer" class="text-accent hover:underline text-lg" title="View Receipt">&#128248;</a>
                                            {:else}
                                                <span class="text-gray-300">-</span>
                                            {/if}
                                        </td>
                                    {/if}
                                    <td class="text-right font-mono font-bold text-status-red">{formatPeso(exp.amount)}</td>
                                    <td class="text-right">
                                        <div class="flex items-center justify-end gap-0">
                                            <button type="button" onclick={() => repeatExpense(exp)} title="Repeat" class="flex items-center justify-center min-h-[44px] min-w-[44px] text-accent hover:text-accent-dark rounded transition-colors">
                                                <RotateCcw class="h-4 w-4" />
                                            </button>
                                            <div class="w-px h-5 bg-gray-200 mx-0.5"></div>
                                            <button type="button" onclick={() => requestDelete(exp)} title="Delete" class="flex items-center justify-center min-h-[44px] min-w-[44px] text-status-red hover:bg-red-50 rounded transition-colors">
                                                <X class="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                        <tfoot>
                            <tr class="border-t-2 border-border bg-gray-50 font-semibold">
                                <td colspan={hasAnyPhotos ? 4 : 3} class="px-4 py-3 text-sm text-gray-600">
                                    {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
                                </td>
                                <td class="px-4 py-3 text-right font-mono font-bold text-status-red">{formatPeso(filteredTotal)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                {/if}
            </div>
        {/if}
    </div>
</div>
