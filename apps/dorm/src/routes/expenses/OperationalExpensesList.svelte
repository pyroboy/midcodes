<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Receipt, Pencil, Trash2 } from 'lucide-svelte';
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

	// Calculate total expenses
	let totalExpenses = $derived.by(() => {
		let total = 0;
		for (const expense of expenses) {
			total += parseFloat(String(expense.amount)) || 0;
		}
		return total;
	});
</script>

<Card class="shadow-lg border-l-4 border-l-green-400">
	<CardHeader class="border-b bg-gray-50">
		<CardTitle class="flex items-center gap-2 text-gray-700">
			<Receipt class="h-5 w-5" />
			{title}
		</CardTitle>
	</CardHeader>
	<CardContent class="p-4 space-y-4">
		{#if expenses.length === 0}
			<p class="text-gray-500 text-center py-2">No operational expenses</p>
		{:else}
			<div class="space-y-2">
				{#each expenses as expense (expense.id)}
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
							<p class="text-base font-bold text-green-700 whitespace-nowrap">
								{formatCurrency(parseFloat(String(expense.amount)) || 0)}
							</p>
							<div class="flex items-center gap-1 shrink-0">
								<Button
									variant="ghost"
									size="icon"
									class="h-8 w-8 text-muted-foreground hover:text-primary"
									onclick={() => dispatch('edit', expense)}
									aria-label="Edit expense"
								>
									<Pencil class="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="h-8 w-8 text-muted-foreground hover:text-red-600"
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

				<div class="mt-2 flex justify-end items-center p-2 border-t">
					<p class="font-bold">
						Total: <span class="text-green-700">{formatCurrency(totalExpenses)}</span>
					</p>
				</div>
			</div>
		{/if}
	</CardContent>
</Card>
