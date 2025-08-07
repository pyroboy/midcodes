<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { X } from 'lucide-svelte';
	import type { Expense } from './types';

	// Props
	interface Props {
		expense: Expense;
		variant?: 'operational' | 'capital';
	}

	let { expense, variant = 'operational' }: Props = $props();

	// Create a dispatcher for events
	const dispatch = createEventDispatcher<{
		delete: number;
	}>();

	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-PH', {
			style: 'currency',
			currency: 'PHP'
		}).format(amount);
	}

	// Format date
	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="border rounded-lg p-3 bg-white">
	<div class="flex justify-between items-center">
		<div class="flex items-center gap-4">
			<Button
				variant="ghost"
				size="icon"
				onclick={() => {
					console.log('Delete button clicked for expense ID:', expense.id);
					if (expense.id !== undefined) {
						dispatch('delete', expense.id);
					} else {
						console.error('Cannot delete expense without ID');
					}
				}}
				class="h-8 w-8 text-red-500 hover:text-red-700"
			>
				<X class="h-4 w-4" />
			</Button>

			<h3 class="font-medium">{expense.description}</h3>

			<div class="text-sm text-gray-500">
				<span>Date: {formatDate(expense.expense_date)}</span>
			</div>
		</div>

		<p class="text-lg font-bold {variant === 'capital' ? 'text-blue-700' : 'text-green-700'}">
			{formatCurrency(expense.amount)}
		</p>
	</div>
</div>
