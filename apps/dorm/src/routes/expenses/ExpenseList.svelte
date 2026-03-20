<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import { Edit, Trash2, Receipt, Wallet, Plus } from 'lucide-svelte';
	import { formatCurrency, formatDate, humanizeExpenseType } from '$lib/utils/format';
	import type { Expense } from './types';
	import type { Property } from './types';
	import { months } from './schema';
	import CapitalExpensesList from './CapitalExpensesList.svelte';
	import OperationalExpensesList from './OperationalExpensesList.svelte';

	// Type for months
	type Month = (typeof months)[number];

	// Helper function to check if a string is a valid month
	function isValidMonth(value: string): value is Month {
		return months.includes(value as Month);
	}

	// Helper function to determine if an expense type is operational or capital
	function isOperationalExpenseType(type: string): boolean {
		const operationalTypes = [
			'OPERATIONAL',
			'MAINTENANCE',
			'UTILITIES',
			'SUPPLIES',
			'SALARY',
			'OTHERS'
		];
		return type !== 'CAPITAL' && operationalTypes.includes(type);
	}

	// Props
	interface Props {
		expenses: Expense[] | null;
		properties: Property[];
	}

	let { expenses = [], properties }: Props = $props();

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		edit: Expense;
		delete: number;
		refresh: any;
	}>();

	// Get property name from property_id
	function getPropertyName(property_id: number) {
		if (!properties) return 'Unknown';
		const property = properties.find((p) => p.id === property_id);
		return property ? property.name : 'Unknown';
	}

	// Define the MonthGroup interface for better typing
	interface MonthGroup {
		date: Date;
		operational: Expense[];
		capital: Expense[];
	}

	// State for filters
	const currentYear = new Date().getFullYear();
	let years = $state(Array.from({ length: 5 }, (_, i) => currentYear - 2 + i));
	let selectedYear = $state(currentYear.toString());
	let selectedMonth = $state<Month>(months[new Date().getMonth()]);
	let selectedProperty = $state<number | null>(null);

	// Group expenses by month and type
	function groupExpensesByMonthAndType(): MonthGroup[] {
		const grouped: Record<string, MonthGroup> = {};

		// Initialize with the selected year/month regardless of whether there are expenses
		const monthIndex = months.indexOf(selectedMonth);
		const key = `${selectedYear}-${monthIndex}`;
		grouped[key] = {
			date: new Date(parseInt(selectedYear), monthIndex, 1),
			operational: [],
			capital: []
		};

		if (!expenses || expenses.length === 0) {
			return Object.values(grouped);
		}

		// Filter expenses based on current selections
		const filteredExpenses = expenses.filter((expense) => {
			if (!expense.expense_date) return false;

			const expenseDate = new Date(expense.expense_date);
			const expenseYear = expenseDate.getFullYear().toString();
			const expenseMonth = months[expenseDate.getMonth()];

			const propertyMatch = !selectedProperty || expense.property_id === selectedProperty;

			if (selectedYear && selectedMonth) {
				return expenseYear === selectedYear && expenseMonth === selectedMonth && propertyMatch;
			}

			if (selectedYear) {
				return expenseYear === selectedYear && propertyMatch;
			}

			return propertyMatch;
		});

		// Group the filtered expenses
		filteredExpenses.forEach((expense) => {
			if (!expense.expense_date) return;

			const expenseDate = new Date(expense.expense_date);
			const year = expenseDate.getFullYear();
			const month = expenseDate.getMonth();
			const expenseKey = `${year}-${month}`;

			if (!grouped[expenseKey]) {
				grouped[expenseKey] = {
					date: new Date(year, month, 1),
					operational: [],
					capital: []
				};
			}

			if (isOperationalExpenseType(expense.type)) {
				grouped[expenseKey].operational.push(expense);
			} else if (expense.type === 'CAPITAL') {
				grouped[expenseKey].capital.push(expense);
			}
		});

		// Sort groups by date (newest first)
		return Object.values(grouped).sort((a, b) => b.date.getTime() - a.date.getTime());
	}

	const groupedExpenses = $derived.by(() => groupExpensesByMonthAndType());
</script>

<div class="space-y-6">
	<!-- Filters -->
	<Card class="bg-white shadow-md">
		<CardHeader class="pb-2">
			<CardTitle>Expense Filters</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
				<div>
					<Label for="property">Property</Label>
					<Select.Root
						type="single"
						value={selectedProperty?.toString() || ''}
						onValueChange={(value) => (selectedProperty = value ? parseInt(value) : null)}
					>
						<Select.Trigger class="w-full">
							<span>{selectedProperty ? getPropertyName(selectedProperty) : 'All Properties'}</span>
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">All Properties</Select.Item>
							{#if properties && properties.length > 0}
								{#each properties as property}
									<Select.Item value={property.id.toString()}>{property.name}</Select.Item>
								{/each}
							{:else}
								<Select.Item value="" disabled>No properties available</Select.Item>
							{/if}
						</Select.Content>
					</Select.Root>
				</div>

				<div>
					<Label for="year">Year</Label>
					<Select.Root
						type="single"
						value={selectedYear}
						onValueChange={(value) => (selectedYear = value || currentYear.toString())}
					>
						<Select.Trigger class="w-full">
							<span>{selectedYear}</span>
						</Select.Trigger>
						<Select.Content>
							{#each years as year}
								<Select.Item value={year.toString()}>{year}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div>
					<Label for="month">Month</Label>
					<Select.Root
						type="single"
						value={selectedMonth}
						onValueChange={(value) => {
							if (isValidMonth(value)) {
								selectedMonth = value;
							} else {
								selectedMonth = months[new Date().getMonth()];
							}
						}}
					>
						<Select.Trigger class="w-full">
							<span>{selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1)}</span>
						</Select.Trigger>
						<Select.Content>
							{#each months as month}
								<Select.Item value={month}
									>{month.charAt(0).toUpperCase() + month.slice(1)}</Select.Item
								>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="flex items-end">
					<Button
						variant="outline"
						size="sm"
						class="w-full"
						onclick={() => {
							selectedProperty = null;
							selectedYear = currentYear.toString();
							selectedMonth = months[new Date().getMonth()];
							dispatch('refresh', {
								property_id: selectedProperty,
								year: selectedYear,
								month: selectedMonth
							});
						}}
					>
						Reset & Refresh
					</Button>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Expenses List -->
	<div class="space-y-8">
		{#each Object.values(groupedExpenses) as monthGroup (monthGroup.date.toISOString())}
			<div class="space-y-4 mb-8">
				<h3 class="text-xl font-semibold border-b pb-2">
					{months[monthGroup.date.getMonth()].charAt(0).toUpperCase() +
						months[monthGroup.date.getMonth()].slice(1)}
					{monthGroup.date.getFullYear()}
				</h3>

				<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<OperationalExpensesList
						expenses={monthGroup.operational}
						{properties}
						selectedPropertyId={selectedProperty}
						on:edit={(e) => dispatch('edit', e.detail)}
						on:delete={(e) => dispatch('delete', e.detail)}
					/>

					<CapitalExpensesList
						expenses={monthGroup.capital}
						{properties}
						selectedPropertyId={selectedProperty}
						on:edit={(e) => dispatch('edit', e.detail)}
						on:delete={(e) => dispatch('delete', e.detail)}
					/>
				</div>
			</div>
		{/each}
	</div>
</div>
