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
	import { getStatusClasses } from '$lib/utils/format';

	// Props using Svelte 5 $props rune
	let { budget, formatCurrency, onEdit, onDelete, onAddItem } = $props<{
		budget: BudgetWithStats;
		formatCurrency: (amount: number) => string;
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
	class="bg-white shadow-sm border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
>
	<!-- Single Row Header - stacks on mobile -->
	<div class="px-4 py-3 border-b bg-white">
		<div class="flex flex-col sm:flex-row sm:items-center gap-2">
			<div class="flex-1 flex items-center gap-2 min-w-0">
				<h3 class="text-base font-semibold text-foreground truncate">{budget.project_name}</h3>
				<Badge class={`${getStatusClasses(budget.status)} flex-shrink-0`}>
					{budget.status}
				</Badge>
			</div>

			<div class="flex items-center justify-between sm:justify-end gap-3">
				<div class="flex items-center gap-3 text-xs text-muted-foreground">
					<div class="flex items-center gap-1">
						<Building class="h-3 w-3" />
						<span>{budget.property?.name || 'Unknown'}</span>
					</div>
					<div class="flex items-center gap-1">
						<Tag class="h-3 w-3" />
						<span>{budget.project_category}</span>
					</div>
				</div>

				<div class="flex items-center gap-1">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger>
								<Button
									onclick={onEdit}
									variant="ghost"
									size="icon"
									class="h-9 w-9 sm:h-7 sm:w-7 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
								>
									<Edit class="h-4 w-4 sm:h-3.5 sm:w-3.5" />
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
									class="h-9 w-9 sm:h-7 sm:w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50"
								>
									<Trash2 class="h-4 w-4 sm:h-3.5 sm:w-3.5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Delete project</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>
		</div>
	</div>

	<CardContent class="px-4 py-3">
		{#if budget.project_description}
			<p class="text-xs text-muted-foreground mb-3 bg-muted/50 p-2 rounded-md italic">
				{budget.project_description}
			</p>
		{/if}

		<!-- Compact Budget Information -->
		<div class="grid grid-cols-3 gap-2 mb-3">
			<div class="bg-muted/50 p-2 rounded-md border border-border">
				<div class="text-xs text-muted-foreground mb-0.5">Planned</div>
				<div class="text-sm font-bold text-foreground">
					{safeFormatCurrency(budget.planned_amount)}
				</div>
			</div>

			<div class="bg-muted/50 p-2 rounded-md border border-border">
				<div class="text-xs text-muted-foreground mb-0.5">Allocated</div>
				<div class="text-sm font-medium">{safeFormatCurrency(budget.allocatedAmount)}</div>
			</div>

			<div class="bg-muted/50 p-2 rounded-md border border-border">
				<div class="text-xs text-muted-foreground mb-0.5">Remaining</div>
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
					<Badge variant="destructive" class="text-xs px-1.5 py-0">
						Over by {safeFormatCurrency(Math.abs(budget.remainingAmount))}
					</Badge>
				{/if}
			</div>
		</div>

		<!-- Budget Items Table with Compact Header -->
		<div class="mt-2">
			<div class="flex justify-between items-center mb-2">
				<h4 class="text-xs font-medium text-foreground">Budget Items</h4>
				<Button
					onclick={onAddItem}
					variant="outline"
					size="sm"
					class="h-8 sm:h-6 py-0 px-2 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
				>
					<Plus class="h-3 w-3 mr-1" />
					Add Item
				</Button>
			</div>

			{#if !budget.budget_items?.length}
				<div
					class="text-center py-2 px-3 bg-muted/50 rounded-md border border-dashed border-border"
				>
					<p class="text-muted-foreground text-xs">No budget items added yet</p>
				</div>
			{:else}
				<!-- Mobile card view for budget items -->
				<div class="sm:hidden space-y-2">
					{#each budget.budget_items as item, i}
						{@const cost = safeNumberValue(item.cost, 0)}
						{@const quantity = safeNumberValue(item.quantity, 0)}
						{@const total = cost * quantity}
						<div class="p-3 bg-muted/30 rounded-lg border">
							<div class="flex items-center justify-between mb-1">
								<span class="text-sm font-medium">{item.name || '—'}</span>
								{#if item.type}
									<span class="px-1.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">{item.type}</span>
								{/if}
							</div>
							<div class="flex items-center justify-between text-xs text-muted-foreground">
								<span>{safeFormatCurrency(cost)} × {quantity}</span>
								<span class="font-medium text-foreground">{safeFormatCurrency(total)}</span>
							</div>
						</div>
					{/each}
					<!-- Summary -->
					<div class="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg text-sm font-medium">
						<span>Total Allocated</span>
						<span>{safeFormatCurrency(budget.allocatedAmount || 0)}</span>
					</div>
				</div>

				<!-- Desktop table view -->
				<div class="hidden sm:block overflow-hidden rounded-md border border-border text-xs">
					<table class="min-w-full divide-y divide-border">
						<thead class="bg-muted/50">
							<tr>
								<th
									scope="col"
									class="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
									>Item</th
								>
								<th
									scope="col"
									class="px-3 py-1.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
									>Type</th
								>
								<th
									scope="col"
									class="px-3 py-1.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
									>Cost</th
								>
								<th
									scope="col"
									class="px-3 py-1.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
									>Qty</th
								>
								<th
									scope="col"
									class="px-3 py-1.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
									>Total</th
								>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-border">
							{#each budget.budget_items as item, i}
								<!-- Check if item has valid data -->
								{@const cost = safeNumberValue(item.cost, 0)}
								{@const quantity = safeNumberValue(item.quantity, 0)}
								{@const total = cost * quantity}

								<tr class="hover:bg-muted/50">
									<td class="px-3 py-1.5 text-xs text-foreground">{item.name || '—'}</td>
									<td class="px-3 py-1.5 text-xs text-muted-foreground">
										{#if item.type}
											<span
												class="inline-block px-1.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground"
											>
												{item.type}
											</span>
										{:else}
											<span class="text-muted-foreground">—</span>
										{/if}
									</td>
									<td class="px-3 py-1.5 text-xs text-muted-foreground text-right"
										>{safeFormatCurrency(cost)}</td
									>
									<td class="px-3 py-1.5 text-xs text-muted-foreground text-right">{quantity || '—'}</td>
									<td class="px-3 py-1.5 text-xs font-medium text-foreground text-right">
										{safeFormatCurrency(total)}
									</td>
								</tr>
							{/each}
							<!-- Summary row -->
							<tr class="bg-muted/50 font-medium">
								<td colspan="4" class="px-3 py-1.5 text-xs text-foreground text-right"
									>Total Allocated:</td
								>
								<td class="px-3 py-1.5 text-xs font-bold text-foreground text-right">
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
		class="px-4 py-2 bg-muted/50 border-t text-xxs text-muted-foreground flex justify-between items-center"
	>
		<div class="flex gap-3">
			<span class="flex items-center gap-1">
				<Calendar class="h-3 w-3 text-muted-foreground" />
				Start: {budget.start_date || 'Not set'}
			</span>
			{#if budget.end_date}
				<span class="flex items-center gap-1">
					<Calendar class="h-3 w-3 text-muted-foreground" />
					End: {budget.end_date}
				</span>
			{/if}
		</div>
		<div>
			Last updated: {new Date(budget.updated_at).toLocaleDateString()}
		</div>
	</CardFooter>
</Card>
