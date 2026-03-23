<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Receipt, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { formatCurrency, humanizeExpenseType } from '$lib/utils/format';
	import type { Expense } from './types';
	import type { Property } from './types';

	// Props
	interface Props {
		expenses: Expense[];
		properties: Property[];
		selectedPropertyId: number | null;
		title?: string;
	}

	let {
		expenses = [],
		properties = [],
		selectedPropertyId = null,
		title = 'Operational Expenses'
	}: Props = $props();

	// Create event dispatcher
	const dispatch = createEventDispatcher<{
		delete: number;
		edit: Expense;
	}>();

	// Pagination
	const PAGE_SIZE = 20;
	let currentPage = $state(1);
	let totalPages = $derived(Math.max(1, Math.ceil(expenses.length / PAGE_SIZE)));
	let paginatedExpenses = $derived(expenses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));

	// Reset page when expenses change
	$effect(() => {
		void expenses.length;
		currentPage = 1;
	});

	// Calculate total expenses (all, not just paginated)
	let totalExpenses = $derived.by(() => {
		let total = 0;
		for (const expense of expenses) {
			total += parseFloat(String(expense.amount)) || 0;
		}
		return total;
	});
</script>

<Card class="shadow-lg border-l-4 border-l-green-400">
	<CardHeader class="border-b bg-gray-50 py-3">
		<CardTitle class="flex items-center gap-2 text-gray-700 text-base">
			<Receipt class="h-5 w-5" />
			{title}
			{#if expenses.length > 0}
				<span class="text-xs font-normal text-muted-foreground ml-auto tabular-nums">{expenses.length}</span>
			{/if}
		</CardTitle>
	</CardHeader>
	<CardContent class="p-4 space-y-4">
		{#if expenses.length === 0}
			<p class="text-gray-500 text-center py-2">No operational expenses</p>
		{:else}
			<div class="space-y-2">
				{#each paginatedExpenses as expense (expense.id)}
					<div class="border rounded-lg p-3 bg-white">
						<div class="flex justify-between items-center gap-2">
							<div class="flex-1 min-w-0">
								<h3 class="font-medium truncate">{expense.description}</h3>
								<p class="text-xs text-muted-foreground">
									{humanizeExpenseType(expense.type)}
									{#if expense.expense_date}
										&middot; {expense.expense_date}
									{/if}
								</p>
							</div>
							<p class="text-base font-bold text-green-700 whitespace-nowrap tabular-nums">
								{formatCurrency(parseFloat(String(expense.amount)) || 0)}
							</p>
							<div class="flex items-center gap-1 shrink-0">
								<Button
									variant="ghost"
									size="icon"
									class="h-9 w-9 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-muted-foreground hover:text-primary"
									onclick={() => dispatch('edit', expense)}
									aria-label="Edit expense"
								>
									<Pencil class="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="h-9 w-9 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-muted-foreground hover:text-red-600"
									onclick={() => {
										if (expense.id !== undefined) {
											dispatch('delete', expense.id);
										}
									}}
									aria-label="Delete expense"
								>
									<Trash2 class="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				{/each}

				<div class="mt-2 flex justify-between items-center p-2 border-t">
					{#if totalPages > 1}
						<div class="flex items-center gap-1">
							<Button variant="ghost" size="icon" class="h-8 w-8" disabled={currentPage <= 1} onclick={() => currentPage--}>
								<ChevronLeft class="h-4 w-4" />
							</Button>
							<span class="text-xs text-muted-foreground tabular-nums">{currentPage}/{totalPages}</span>
							<Button variant="ghost" size="icon" class="h-8 w-8" disabled={currentPage >= totalPages} onclick={() => currentPage++}>
								<ChevronRight class="h-4 w-4" />
							</Button>
						</div>
					{:else}
						<div></div>
					{/if}
					<p class="font-bold text-sm">
						Total: <span class="text-green-700 tabular-nums">{formatCurrency(totalExpenses)}</span>
					</p>
				</div>
			</div>
		{/if}
	</CardContent>
</Card>
