<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import { formatCurrency, humanizeExpenseType } from '$lib/utils/format';
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

	// [P3-14] Capitalize helper
	function capitalize(s: string): string {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}

	// [P1-6] Get property name via Map for O(1) lookup
	let propMap = $derived.by(() => {
		const m = new Map<number, string>();
		if (properties) for (const p of properties) m.set(p.id, p.name);
		return m;
	});

	function getPropertyName(property_id: number) {
		return propMap.get(property_id) || 'Unknown';
	}

	// Define the MonthGroup interface for better typing
	interface MonthGroup {
		date: Date;
		operational: Expense[];
		capital: Expense[];
	}

	// State for filters — remember via localStorage (D1)
	const FILTER_KEY = 'dorm:expenses:filters';
	const currentYear = new Date().getFullYear();
	let years = $state(Array.from({ length: 5 }, (_, i) => currentYear - 2 + i));

	function loadSavedFilters() {
		try {
			const saved = localStorage.getItem(FILTER_KEY);
			if (saved) return JSON.parse(saved);
		} catch {}
		return null;
	}

	const saved = loadSavedFilters();
	let selectedYear = $state(saved?.year ?? currentYear.toString());
	let selectedMonth = $state<Month>(
		saved?.month && isValidMonth(saved.month) ? saved.month : months[new Date().getMonth()]
	);
	let selectedProperty = $state<number | null>(saved?.property ?? null);

	// Persist filter changes
	$effect(() => {
		try {
			localStorage.setItem(FILTER_KEY, JSON.stringify({
				year: selectedYear,
				month: selectedMonth,
				property: selectedProperty
			}));
		} catch {}
	});

	// Pagination (D2) — 20 items per page per category
	const PAGE_SIZE = 20;
	let currentPage = $state(1);

	// Reset page when filters change
	$effect(() => {
		// Read filter values to create dependency
		void selectedYear; void selectedMonth; void selectedProperty;
		currentPage = 1;
	});

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
	<!-- Filters — compact, no separate title -->
	<Card class="bg-white shadow-md">
		<CardContent class="p-4">
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
							<span>{capitalize(selectedMonth)}</span>
						</Select.Trigger>
						<Select.Content>
							{#each months as month}
								<Select.Item value={month}
									>{capitalize(month)}</Select.Item
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
					{capitalize(months[monthGroup.date.getMonth()])}
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
