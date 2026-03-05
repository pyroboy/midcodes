<script lang="ts">
    import { allExpenses, addExpense, deleteExpense, expenseCategories } from '$lib/stores/expenses.svelte';
    import { session } from '$lib/stores/session.svelte';
    import { formatPeso } from '$lib/utils';

    const branchExpenses = $derived(
        session.locationId === 'all' ? allExpenses.value : allExpenses.value.filter(e => e.locationId === session.locationId)
    );

    let category = $state(expenseCategories[0]);
    let amount = $state('');
    let description = $state('');
    let paidBy = $state('Petty Cash');
    let receiptPhoto = $state<File | null>(null);
    let errorMessage = $state('');
    let isSubmitting = $state(false);

    // Convert File to Base64 data URL for persistent storage
    async function fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function handleSubmit(e: Event) {
        e.preventDefault();
        errorMessage = '';
        
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            errorMessage = 'Please enter a valid amount greater than 0';
            return;
        }

        isSubmitting = true;
        
        try {
            let photoUrl: string | undefined = undefined;
            if (receiptPhoto) {
                // Convert to Base64 for persistent storage (blob URLs don't persist)
                photoUrl = await fileToBase64(receiptPhoto);
            }

            const result = await addExpense(category, numAmount, description, paidBy, photoUrl);
            
            if (!result.success) {
                errorMessage = result.error || 'Failed to save expense';
                isSubmitting = false;
                return;
            }
            
            // Reset form on success
            amount = '';
            description = '';
            receiptPhoto = null;
            
            const fileInput = document.getElementById('receipt-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (err) {
            errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="flex h-full flex-col p-6 gap-6">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Expenses</h1>
        <div class="text-right">
            <p class="text-sm font-semibold text-gray-500">Total Recorded (All Time)</p>
            <p class="text-xl font-bold text-status-red">{formatPeso(branchExpenses.reduce((s, e) => s + e.amount, 0))}</p>
        </div>
    </div>

    <div class="grid grid-cols-[320px_1fr] gap-6 h-full min-h-0 pb-10">
        <!-- Input Form -->
        <form onsubmit={handleSubmit} class="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 shadow-sm h-fit">
            <h2 class="font-bold text-gray-900">Record Expense</h2>
            
            <label class="flex flex-col gap-1.5">
                <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Category</span>
                <select bind:value={category} class="pos-input">
                    {#each expenseCategories as cat}
                        <option value={cat}>{cat}</option>
                    {/each}
                </select>
            </label>

            <label class="flex flex-col gap-1.5">
                <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Amount (₱)</span>
                <input type="number" step="0.01" min="0" bind:value={amount} required class="pos-input text-lg font-mono font-bold text-status-red" placeholder="0.00" />
            </label>

            <label class="flex flex-col gap-1.5">
                <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Description</span>
                <input type="text" bind:value={description} required class="pos-input" placeholder="e.g., Unbox wet wipes" />
            </label>

            <label class="flex flex-col gap-1.5">
                <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Paid By</span>
                <select bind:value={paidBy} class="pos-input">
                    <option value="Petty Cash">Petty Cash</option>
                    <option value="Cash from Register">Cash from Register</option>
                    <option value="Company Card">Company Card</option>
                    <option value="Owner's Pocket">Owner's Pocket</option>
                </select>
            </label>

            <label class="flex flex-col gap-1.5">
                <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Receipt Photo (Optional)</span>
                <input 
                    id="receipt-upload"
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    onchange={(e) => {
                        const target = e.target as HTMLInputElement;
                        receiptPhoto = target.files?.[0] || null;
                    }}
                    class="pos-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" 
                />
            </label>

            {#if errorMessage}
                <div class="text-sm text-status-red bg-status-red-light px-3 py-2 rounded-lg">
                    {errorMessage}
                </div>
            {/if}

            <button type="submit" disabled={isSubmitting} class="btn-primary mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {#if isSubmitting}
                    <span class="animate-spin">⏳</span> Saving...
                {:else}
                    <span>➕</span> Record Expense
                {/if}
            </button>
        </form>

        <!-- List -->
        <div class="flex flex-col rounded-xl border border-border bg-white shadow-sm overflow-hidden h-[calc(100vh-160px)]">
            <div class="border-b border-border bg-gray-50 px-4 py-3 shrink-0">
                <h2 class="font-bold text-gray-900">Expense Log</h2>
            </div>
            <div class="flex-1 overflow-y-auto">
                {#if branchExpenses.length === 0}
                    <div class="flex h-full flex-col items-center justify-center text-gray-400">
                        <div class="mb-2 text-4xl">📝</div>
                        <p>No expenses recorded yet.</p>
                    </div>
                {:else}
                    {#if branchExpenses.some(e => e.receiptPhoto?.startsWith('blob:'))}
                        {console.warn('[EXPENSE_DEBUG] Found blob URLs in expenses that may be invalid:', branchExpenses.filter(e => e.receiptPhoto?.startsWith('blob:')).map(e => ({ id: e.id, url: e.receiptPhoto?.substring(0, 50) + '...' })))}
                    {/if}
                    <table class="w-full text-sm">
                        <thead class="sticky top-0 bg-white shadow-sm z-10">
                            <tr class="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-gray-400 [&>th]:px-4 [&>th]:py-3">
                                <th>Time</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Source</th>
                                <th>Photo</th>
                                <th class="text-right">Amount</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-border">
                            {#each branchExpenses as exp (exp.id)}
                                <tr class="hover:bg-gray-50 transition-colors [&>td]:px-4 [&>td]:py-3">
                                    <td class="whitespace-nowrap text-gray-500">
                                        {new Date(exp.createdAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td class="font-medium text-gray-900">{exp.category}</td>
                                    <td class="text-gray-600">{exp.description}</td>
                                    <td class="text-gray-500">{exp.paidBy}</td>
                                    <td class="text-center">
                                        {#if exp.receiptPhoto}
                                            <a href={exp.receiptPhoto} target="_blank" rel="noopener noreferrer" class="text-accent hover:underline text-lg" title="View Receipt">
                                                📸
                                            </a>
                                        {:else}
                                            <span class="text-gray-300">-</span>
                                        {/if}
                                    </td>
                                    <td class="text-right font-mono font-bold text-status-red">
                                        {formatPeso(exp.amount)}
                                    </td>
                                    <td class="text-right">
                                        <button onclick={() => deleteExpense(exp.id)} class="text-gray-400 hover:text-status-red p-1 rounded font-bold">✕</button>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                {/if}
            </div>
        </div>
    </div>
</div>
