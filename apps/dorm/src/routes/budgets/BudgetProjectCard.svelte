<script lang="ts">
	import { Card, CardContent, CardHeader, CardFooter } from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Edit, Trash2, Plus, Calendar, Building, Tag } from 'lucide-svelte';
	import type { BudgetWithStats, BudgetItem } from './types';
	import {
		Tooltip,
		TooltipContent,
		TooltipProvider,
		TooltipTrigger
	} from '$lib/components/ui/tooltip';

	// Props using Svelte 5 $props rune
	let { budget, formatCurrency, getStatusColor, onEdit, onDelete, onAddItem } = $props<{
		budget: BudgetWithStats;
		formatCurrency: (amount: number) => string;
		getStatusColor: (status: string) => string;
		onEdit: () => void;
		onDelete: () => void;
		onAddItem: () => void;
	}>();

	// Compute allocation percentage for progress bar
	let allocationPercentage = $derived(
		budget.planned_amount > 0
			? Math.min(Math.round(((budget.allocatedAmount || 0) / budget.planned_amount) * 100), 100)
			: 0
	);

	// Get progress bar color based on budget status
	function getProgressColor(budget: BudgetWithStats): string {
		if ((budget.remainingAmount ?? 0) < 0) {
			return 'bg-red-500';
		}

		switch (budget.status) {
			case 'COMPLETED':
				return 'bg-green-500';
			case 'ONGOING':
				return 'bg-yellow-500';
			default:
				return 'bg-blue-500';
		}
	}

	// Safe formatCurrency function that handles NaN values
	function safeFormatCurrency(amount: number | null | undefined): string {
		// Check if amount is a valid number
		if (amount === null || amount === undefined || isNaN(amount)) {
			return '₱0.00'; // Return a default value instead of NaN
		}

		return formatCurrency(amount);
	}

	// Safe function to get numeric value or default
	function safeNumberValue(value: any, defaultValue: number = 0): number {
		if (value === null || value === undefined) return defaultValue;
		const parsedValue = parseFloat(value);
		return isNaN(parsedValue) ? defaultValue : parsedValue;
	}
</script>

<Card
	class="bg-white shadow-sm border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
>
	<!-- Single Row Header -->
	<div class="px-4 py-3 border-b bg-white flex items-center">
		<div class="flex-1 flex items-center gap-3">
			<h3 class="text-base font-semibold text-gray-800">{budget.project_name}</h3>
			<Badge class={`${getStatusColor(budget.status)}`}>
				{budget.status}
			</Badge>
		</div>

		<div class="flex items-center gap-4 text-xs text-gray-500">
			<div class="flex items-center gap-1">
				<Building class="h-3 w-3" />
				<span>{budget.property?.name || 'Unknown'}</span>
			</div>

			<div class="flex items-center gap-1">
				<Tag class="h-3 w-3" />
				<span>{budget.project_category}</span>
			</div>
		</div>

		<div class="flex items-center gap-1 ml-4">
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>
						<Button
							onclick={onEdit}
							variant="ghost"
							size="icon"
							class="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
						>
							<Edit class="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Edit project</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>
						<Button
							onclick={onDelete}
							variant="ghost"
							size="icon"
							class="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-50"
						>
							<Trash2 class="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Delete project</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	</div>

	<CardContent class="px-4 py-3">
		{#if budget.project_description}
			<p class="text-xs text-gray-600 mb-3 bg-gray-50 p-2 rounded-md italic">
				{budget.project_description}
			</p>
		{/if}

		<!-- Compact Budget Information -->
		<div class="grid grid-cols-3 gap-2 mb-3">
			<div class="bg-gray-50 p-2 rounded-md border border-gray-100">
				<div class="text-xs text-gray-500 mb-0.5">Planned</div>
				<div class="text-sm font-bold text-gray-800">
					{safeFormatCurrency(budget.planned_amount)}
				</div>
			</div>

			<div class="bg-gray-50 p-2 rounded-md border border-gray-100">
				<div class="text-xs text-gray-500 mb-0.5">Allocated</div>
				<div class="text-sm font-medium">{safeFormatCurrency(budget.allocatedAmount)}</div>
			</div>

			<div class="bg-gray-50 p-2 rounded-md border border-gray-100">
				<div class="text-xs text-gray-500 mb-0.5">Remaining</div>
				<div
					class="text-sm font-bold"
					class:text-green-600={budget.remainingAmount >= 0}
					class:text-red-600={budget.remainingAmount < 0}
				>
					{safeFormatCurrency(budget.remainingAmount)}
				</div>
			</div>
		</div>

		<div class="mb-3">
			<Progress value={allocationPercentage} class={`h-1.5 ${getProgressColor(budget)}`} />
			<div class="flex justify-between text-xs mt-0.5">
				<span>{allocationPercentage}% allocated</span>
				{#if (budget.remainingAmount ?? 0) < 0}
					<span class="text-red-600">Over budget</span>
				{/if}
			</div>
		</div>

		<!-- Budget Items Table with Compact Header -->
		<div class="mt-2">
			<div class="flex justify-between items-center mb-2">
				<h4 class="text-xs font-medium text-gray-700">Budget Items</h4>
				<Button
					onclick={onAddItem}
					variant="outline"
					size="sm"
					class="h-6 py-0 px-2 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
				>
					<Plus class="h-3 w-3 mr-1" />
					Add Item
				</Button>
			</div>

			{#if !budget.budget_items?.length}
				<div
					class="text-center py-2 px-3 bg-gray-50 rounded-md border border-dashed border-gray-200"
				>
					<p class="text-gray-500 text-xs">No budget items added yet</p>
				</div>
			{:else}
				<div class="overflow-hidden rounded-md border border-gray-200 text-xs">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th
									scope="col"
									class="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>Item</th
								>
								<th
									scope="col"
									class="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
									>Type</th
								>
								<th
									scope="col"
									class="px-3 py-1.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
									>Cost</th
								>
								<th
									scope="col"
									class="px-3 py-1.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
									>Qty</th
								>
								<th
									scope="col"
									class="px-3 py-1.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
									>Total</th
								>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each budget.budget_items as item, i}
								<!-- Check if item has valid data -->
								{@const cost = safeNumberValue(item.cost, 0)}
								{@const quantity = safeNumberValue(item.quantity, 0)}
								{@const total = cost * quantity}

								<tr class="hover:bg-gray-50">
									<td class="px-3 py-1.5 text-xs text-gray-900">{item.name || '—'}</td>
									<td class="px-3 py-1.5 text-xs text-gray-500">
										{#if item.type}
											<span
												class="inline-block px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
											>
												{item.type}
											</span>
										{:else}
											<span class="text-gray-400">—</span>
										{/if}
									</td>
									<td class="px-3 py-1.5 text-xs text-gray-500 text-right"
										>{safeFormatCurrency(cost)}</td
									>
									<td class="px-3 py-1.5 text-xs text-gray-500 text-right">{quantity || '—'}</td>
									<td class="px-3 py-1.5 text-xs font-medium text-gray-900 text-right">
										{safeFormatCurrency(total)}
									</td>
								</tr>
							{/each}
							<!-- Summary row -->
							<tr class="bg-gray-50 font-medium">
								<td colspan="4" class="px-3 py-1.5 text-xs text-gray-700 text-right"
									>Total Allocated:</td
								>
								<td class="px-3 py-1.5 text-xs font-bold text-gray-900 text-right">
									{safeFormatCurrency(budget.allocatedAmount || 0)}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</CardContent>

	<CardFooter
		class="px-4 py-2 bg-gray-50 border-t text-xxs text-gray-500 flex justify-between items-center"
	>
		<div class="flex gap-3">
			<span class="flex items-center gap-1">
				<Calendar class="h-3 w-3 text-gray-400" />
				Start: {budget.start_date || 'Not set'}
			</span>
			{#if budget.end_date}
				<span class="flex items-center gap-1">
					<Calendar class="h-3 w-3 text-gray-400" />
					End: {budget.end_date}
				</span>
			{/if}
		</div>
		<div>
			Last updated: {new Date(budget.updated_at).toLocaleDateString()}
		</div>
	</CardFooter>
</Card>
