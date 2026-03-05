<script lang="ts">
    import { X, Receipt } from 'lucide-svelte';
    import { allExpenses, addExpense, deleteExpense, expenseCategories } from '$lib/stores/expenses.svelte';
    import { session } from '$lib/stores/session.svelte';
    import { formatPeso } from '$lib/utils';

    let { isOpen = false, onClose }: { isOpen?: boolean; onClose: () => void } = $props();

    const branchExpenses = $derived(
        session.locationId === 'all' ? allExpenses.value : allExpenses.value.filter(e => e.locationId === session.locationId)
    );

    let category = $state(expenseCategories[0]);
    let amount = $state('');
    let description = $state('');
    let paidBy = $state('Petty Cash');
    let receiptPhoto = $state<File | null>(null);

    function handleSubmit(e: Event) {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) return;

        let photoUrl: string | undefined = undefined;
        if (receiptPhoto) {
            photoUrl = URL.createObjectURL(receiptPhoto);
        }

        addExpense(category, numAmount, description, paidBy, photoUrl);
        
        // Reset form
        amount = '';
        description = '';
        receiptPhoto = null;
        
        const fileInput = document.getElementById('receipt-upload-modal') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }

    function handleClose() {
        // Reset form on close
        amount = '';
        description = '';
        receiptPhoto = null;
        category = expenseCategories[0];
        paidBy = 'Petty Cash';
        onClose();
    }
</script>

{#if isOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div class="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-xl border border-border flex flex-col animate-in zoom-in-95 duration-200">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-status-red-light text-status-red flex items-center justify-center">
                        <Receipt class="w-5 h-5" />
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-gray-900">Expenses</h2>
                        <p class="text-sm text-gray-500">Record and track business expenses</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="text-right">
                        <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Recorded</p>
                        <p class="text-lg font-bold text-status-red font-mono">{formatPeso(branchExpenses.reduce((s, e) => s + e.amount, 0))}</p>
                    </div>
                    <button class="text-gray-400 hover:text-gray-900 transition-colors p-1" onclick={handleClose}>
                        <X class="w-6 h-6" />
                    </button>
                </div>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-hidden p-6 min-h-0">
                <div class="grid grid-cols-[320px_1fr] gap-6 h-full">
                    <!-- Input Form -->
                    <form onsubmit={handleSubmit} class="flex flex-col gap-4 rounded-xl border border-border bg-gray-50 p-5 h-fit">
                        <h3 class="font-bold text-gray-900">Record Expense</h3>
                        
                        <label class="flex flex-col gap-1.5">
                            <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Category</span>
                            <select bind:value={category} class="pos-input bg-white">
                                {#each expenseCategories as cat}
                                    <option value={cat}>{cat}</option>
                                {/each}
                            </select>
                        </label>

                        <label class="flex flex-col gap-1.5">
                            <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Amount (₱)</span>
                            <input type="number" step="0.01" min="0" bind:value={amount} required class="pos-input text-lg font-mono font-bold text-status-red bg-white" placeholder="0.00" />
                        </label>

                        <label class="flex flex-col gap-1.5">
                            <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Description</span>
                            <input type="text" bind:value={description} required class="pos-input bg-white" placeholder="e.g., Unbox wet wipes" />
                        </label>

                        <label class="flex flex-col gap-1.5">
                            <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Paid By</span>
                            <select bind:value={paidBy} class="pos-input bg-white">
                                <option value="Petty Cash">Petty Cash</option>
                                <option value="Cash from Register">Cash from Register</option>
                                <option value="Company Card">Company Card</option>
                                <option value="Owner's Pocket">Owner's Pocket</option>
                            </select>
                        </label>

                        <label class="flex flex-col gap-1.5">
                            <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Receipt Photo (Optional)</span>
                            <input 
                                id="receipt-upload-modal"
                                type="file" 
                                accept="image/*" 
                                capture="environment"
                                onchange={(e) => {
                                    const target = e.target as HTMLInputElement;
                                    receiptPhoto = target.files?.[0] || null;
                                }}
                                class="pos-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 bg-white" 
                            />
                        </label>

                        <button type="submit" class="btn-primary mt-2 flex items-center justify-center gap-2">
                            <span>➕</span> Record Expense
                        </button>
                    </form>

                    <!-- Expense Log -->
                    <div class="flex flex-col rounded-xl border border-border bg-white shadow-sm overflow-hidden">
                        <div class="border-b border-border bg-gray-50 px-4 py-3 shrink-0">
                            <h3 class="font-bold text-gray-900">Expense Log</h3>
                        </div>
                        <div class="flex-1 overflow-y-auto">
                            {#if branchExpenses.length === 0}
                                <div class="flex h-full flex-col items-center justify-center text-gray-400">
                                    <div class="mb-2 text-4xl">📝</div>
                                    <p>No expenses recorded yet.</p>
                                </div>
                            {:else}
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
        </div>
    </div>
{/if}
