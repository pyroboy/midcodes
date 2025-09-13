<script lang="ts">
	import { onMount } from 'svelte';
	import { Building2, Receipt, PiggyBank, Wallet, Loader2, Users, Info } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { propertyStore } from '$lib/stores/property';
	import type {
		FloorData,
		FloorDataMap,
		Expense,
		MonthData,
		Property,
		Month,
		ProfitSharingCalculation
	} from './types';

	// Props
	let { year, month, propertyId } = $props<{
		year: string;
		month: string;
		propertyId: string | null;
	}>();

	// Global state
	let selectedProperty = $derived($propertyStore.selectedProperty);
	let properties = $derived($propertyStore.properties || []);

	// Component state
	let reportData: MonthData | null = $state(null);
	let isLoading = $state(false);

	// Load report data when property or date filters change
	async function loadReportData(propId: string, yr: string, mo: string) {
		if (!propId) return;
		
		isLoading = true;
		try {
			const params = new URLSearchParams({
				propertyId: propId,
				year: yr,
				month: mo
			});
			
			const response = await fetch(`/api/reports?${params}`);
			if (!response.ok) throw new Error('Failed to fetch report data');
			
			const data = await response.json();
			reportData = data.reportData;
		} catch (error) {
			console.error('Error loading report data:', error);
			reportData = null;
		} finally {
			isLoading = false;
		}
	}

	// Reactive effect to load data when dependencies change
	$effect(() => {
		if (propertyId && year && month) {
			loadReportData(propertyId, year, month);
		} else {
			reportData = null;
		}
	});

	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-PH', {
			style: 'currency',
			currency: 'PHP'
		}).format(amount);
	}

	// Format month
	function formatMonth(month: string): string {
		return month.charAt(0).toUpperCase() + month.slice(1);
	}

	// Format date
	function formatDate(dateString: string | undefined): string {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}

	// Format percentage
	function formatPercentage(value: number): string {
		return `${Math.round(value * 100)}%`;
	}

	// Get collection percentage
	function getCollectionPercentage(floor: FloorData): number {
		if (floor.income === 0) return 0;
		return floor.collected / floor.income;
	}

	// Available months for selection
	const months: Month[] = [
		'january',
		'february',
		'march',
		'april',
		'may',
		'june',
		'july',
		'august',
		'september',
		'october',
		'november',
		'december'
	];

	// Available years for selection (current year and 5 years back)
	const currentYear = new Date().getFullYear();
	const years = Array.from({ length: 6 }, (_, i) => (currentYear - i).toString());

	// Filter expenses by type
	function getExpensesByType(expenses: Expense[], type: string): Expense[] {
		return expenses.filter((expense) => expense.type === type);
	}

	// Calculate total for a specific expense type
	function calculateTotalByType(expenses: Expense[], type: string): number {
		return getExpensesByType(expenses, type).reduce(
			(sum, expense) => sum + Number(expense.amount),
			0
		);
	}

	// Calculate operational expenses
	function calculateOperationalExpenses(expenses: Expense[]): number {
		return calculateTotalByType(expenses, 'OPERATIONAL');
	}

	// Calculate capital expenses
	function calculateCapitalExpenses(expenses: Expense[]): number {
		return calculateTotalByType(expenses, 'CAPITAL');
	}

	// Calculate profit sharing with new rules:
	// - Both 40% and 60% share get reduced by operational expenses proportionally
	// - Only 60% share gets reduced by capital expenses
	function calculateProfitSharing(
		grossIncome: number,
		expenses: Expense[]
	): { fortyShare: number; sixtyShare: number } {
		const operationalExpenses = calculateOperationalExpenses(expenses);
		const capitalExpenses = calculateCapitalExpenses(expenses);

		// Net income after operational expenses
		const netAfterOperational = grossIncome - operationalExpenses;

		// Initial shares after operational expenses (proportional split)
		let fortyShare = netAfterOperational * 0.4;
		let sixtyShare = netAfterOperational * 0.6;

		// Only 60% share gets reduced by capital expenses
		sixtyShare = sixtyShare - capitalExpenses;

		return { fortyShare, sixtyShare };
	}

	// Get floors data as array sorted by floor number
	function getFloorsArray(): FloorData[] {
		if (!reportData?.floorData) return [];

		const floors = Object.values(reportData.floorData);

		// Type assertion for TypeScript - doesn't affect runtime
		const typedFloors = floors as FloorData[];

		return typedFloors.sort((a, b) => {
			// Safely access floorNumber property
			const aFloorNum = a?.floorNumber || 0;
			const bFloorNum = b?.floorNumber || 0;
			return aFloorNum - bFloorNum;
		});
	}

	// Handle filter changes
	function updateFilters(
		newYear: string | null = null,
		newMonth: string | null = null
	): void {
		const params = new URLSearchParams();

		// Always include current property if available
		if (propertyId) {
			params.set('propertyId', propertyId);
		}

		if (newYear !== null) {
			params.set('year', newYear);
		} else {
			params.set('year', year);
		}

		if (newMonth !== null) {
			params.set('month', newMonth);
		} else {
			params.set('month', month);
		}

		goto(`?${params.toString()}`);
	}

	// Get formatted month name
	// function formatMonth(monthName: string): string {
	//     return monthName.charAt(0).toUpperCase() + monthName.slice(1);
	// }
</script>

<div class="min-h-screen bg-gray-50 p-4 md:p-8">
	<div class="max-w-6xl mx-auto space-y-6">
		<div class="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-500">
			<div class="text-center space-y-4 mb-6">
				<h1 class="text-3xl md:text-4xl font-bold text-gray-800">Monthly Financial Report</h1>
				<div class="flex items-center justify-center gap-2 my-2">
					<span
						class="bg-blue-50 text-blue-800 text-lg font-medium px-4 py-1 rounded-lg border border-blue-200"
					>
						{formatMonth(month)}
						{year}
					</span>
				</div>

				{#if selectedProperty}
					<h2 class="text-xl text-blue-700 font-semibold">{selectedProperty.name}</h2>
				{:else}
					<p class="text-gray-500 mt-2">Track income, expenses, and profit distribution</p>
				{/if}
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">

				<!-- Year Selector -->
				<div class="w-full">
					<label for="year" class="block text-sm font-medium text-gray-700 mb-1">Year</label>
					<select
						id="year"
						class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
						value={year}
						onchange={(e: Event) => {
							const select = e.target as HTMLSelectElement;
							updateFilters(select.value, null);
						}}
					>
						{#each years as yearOption}
							<option value={yearOption}>{yearOption}</option>
						{/each}
					</select>
				</div>

				<!-- Month Selector -->
				<div class="w-full">
					<label for="month" class="block text-sm font-medium text-gray-700 mb-1">Month</label>
					<select
						id="month"
						class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
						value={month}
						onchange={(e: Event) => {
							const select = e.target as HTMLSelectElement;
							updateFilters(null, select.value);
						}}
					>
						{#each months as monthOption}
							<option value={monthOption}>{formatMonth(monthOption)}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>

		{#if !selectedProperty}
			<div class="bg-white p-8 rounded-xl shadow-md text-center">
				<Building2 class="h-16 w-16 mx-auto text-blue-500 mb-4" />
				<h2 class="text-2xl font-semibold text-gray-700 mb-4">Please Select a Property</h2>
				<p class="text-gray-600 max-w-md mx-auto">
					Use the property selector in the top navigation to choose a property and view the financial report for {formatMonth(
						month
					)}
					{year}.
				</p>
			</div>
		{:else if isLoading}
			<div class="flex justify-center items-center h-64 bg-white rounded-xl shadow-md">
				<Loader2 class="h-10 w-10 animate-spin text-blue-500" />
			</div>
		{:else if !reportData}
			<div class="bg-white p-8 rounded-xl shadow-md text-center">
				<Info class="h-16 w-16 mx-auto text-gray-500 mb-4" />
				<h2 class="text-2xl font-semibold text-gray-700 mb-4">No Report Data</h2>
				<p class="text-gray-600 max-w-md mx-auto">
					No report data available for {selectedProperty.name} in {formatMonth(month)} {year}.
				</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Summary Card -->
				<div
					class="bg-white rounded-xl overflow-hidden shadow-md md:col-span-2 border border-gray-200 hover:shadow-lg transition-shadow duration-200"
				>
					<div class="p-6">
						<h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
							<Wallet class="h-6 w-6 text-blue-600 mr-2" />
							Financial Summary
						</h2>
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							<div class="bg-green-50 rounded-lg p-4 border border-green-100">
								<div class="flex items-center mb-2">
									<Building2 class="h-5 w-5 text-green-600 mr-2" />
									<h3 class="text-sm font-medium text-green-700">Gross Income</h3>
								</div>
								<p class="text-2xl font-bold text-green-800">
									{formatCurrency(reportData.totals.grossIncome)}
								</p>
							</div>

							<div class="bg-red-50 rounded-lg p-4 border border-red-100">
								<div class="flex items-center mb-2">
									<Receipt class="h-5 w-5 text-red-600 mr-2" />
									<h3 class="text-sm font-medium text-red-700">Total Expenses</h3>
								</div>
								<p class="text-2xl font-bold text-red-800">
									{formatCurrency(
										calculateOperationalExpenses(reportData.expenses) +
											calculateCapitalExpenses(reportData.expenses)
									)}
								</p>
							</div>

							<div class="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
								<div class="flex items-center mb-2">
									<Wallet class="h-5 w-5 text-indigo-600 mr-2" />
									<h3 class="text-sm font-medium text-indigo-700">Net Income</h3>
								</div>
								<p class="text-2xl font-bold text-indigo-800">
									{formatCurrency(
										reportData.totals.grossIncome -
											(calculateOperationalExpenses(reportData.expenses) +
												calculateCapitalExpenses(reportData.expenses))
									)}
								</p>
							</div>

							<div class="bg-amber-50 rounded-lg p-4 border border-amber-100">
								<div class="flex items-center mb-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5 text-amber-600 mr-2"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<circle cx="12" cy="8" r="7"></circle>
										<path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"></path>
									</svg>
									<h3 class="text-sm font-medium text-amber-700">Total Collectibles</h3>
								</div>
								<div>
									<p class="text-2xl font-bold text-amber-800">
										{formatCurrency(reportData.totals.collectibles)}
									</p>
									{#if reportData.totals.lastCollectionDate}
										<p class="text-xs text-amber-600 mt-1">
											Last collection: {formatDate(reportData.totals.lastCollectionDate)}
										</p>
									{/if}
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Rental Income Section -->
				<div class="bg-white rounded-xl overflow-hidden shadow-md">
					<div class="border-b bg-gray-50 p-4">
						<h2 class="flex items-center gap-2 text-gray-800 font-semibold text-xl">
							<Building2 class="h-5 w-5 text-gray-600" />
							Rental Income
						</h2>
					</div>
					<div class="p-5">
						<div class="p-4 space-y-4">
							<!-- Dynamically display all floors -->
							{#each getFloorsArray() as floor}
								<div
									class="rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
								>
									<div
										class="px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200"
									>
										<div class="flex justify-between items-center">
											<div class="flex items-center">
												<span class="font-medium text-blue-800 mr-2">Floor {floor.floorNumber}</span
												>
												{#if floor.tenantCount !== undefined}
													<div class="flex items-center text-sm text-gray-500 ml-2">
														<Users class="h-4 w-4 mr-1" />
														<span>{floor.tenantCount} tenants</span>
													</div>
												{/if}
											</div>
										</div>
									</div>
									<div class="p-4 flex items-center">
										<!-- Left side: Total Billable -->
										<div class="flex-1">
											<div class="text-2xl font-bold text-gray-800">
												{formatCurrency(floor.income)}
											</div>
										</div>

										<!-- Right side: Collection Circle -->
										<div class="relative group">
											<div class="w-16 h-16 relative">
												<!-- Background circle -->
												<svg class="w-full h-full" viewBox="0 0 36 36">
													<circle
														cx="18"
														cy="18"
														r="15.9"
														fill="none"
														stroke-width="3"
														stroke="#f3f4f6"
													/>

													<!-- Progress circle -->
													{#if floor.income > 0}
														<circle
															cx="18"
															cy="18"
															r="15.9"
															fill="none"
															stroke-width="3"
															stroke="#10b981"
															stroke-dasharray={`${getCollectionPercentage(floor) * 100} 100`}
															stroke-dashoffset="25"
															stroke-linecap="round"
															transform="rotate(-90 18 18)"
														/>
													{/if}

													<!-- Percentage text -->
													<text
														x="18"
														y="18"
														text-anchor="middle"
														dominant-baseline="middle"
														font-size="8"
														font-weight="bold"
														fill="#4b5563"
													>
														{formatPercentage(getCollectionPercentage(floor))}
													</text>
												</svg>
											</div>

											<!-- Tooltip on hover -->
											<div
												class="absolute right-0 z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white border border-gray-200 rounded-lg shadow-xl p-3 w-64 top-full mt-1"
											>
												<div
													class="text-sm mb-2 font-semibold text-gray-700 flex items-center gap-1"
												>
													<Info class="h-4 w-4" />
													<span>Collection Details</span>
												</div>
												<div class="space-y-2">
													<div class="flex justify-between items-center">
														<span class="text-xs text-gray-600">Collected</span>
														<span class="text-xs font-medium text-green-600"
															>{formatCurrency(floor.collected)}</span
														>
													</div>
													<div class="flex justify-between items-center">
														<span class="text-xs text-gray-600">Collectible (Unpaid)</span>
														<span class="text-xs font-medium text-amber-600"
															>{formatCurrency(floor.collectible)}</span
														>
													</div>
													{#if floor.lastCollectionDate}
														<div class="flex justify-between items-center">
															<span class="text-xs text-gray-600">Last Collection</span>
															<span class="text-xs font-medium text-gray-600"
																>{formatDate(floor.lastCollectionDate)}</span
															>
														</div>
													{/if}
												</div>
											</div>
										</div>
									</div>
								</div>
							{/each}

							<!-- Total -->
							<div
								class="rounded-lg border border-gray-200 overflow-hidden col-span-1 md:col-span-2 xl:col-span-3"
							>
								<div
									class="px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 border-b border-gray-200"
								>
									<h3 class="font-semibold text-green-800">Property Totals</h3>
								</div>
								<div class="p-4">
									<div class="flex items-center justify-between">
										<div>
											<div class="text-2xl font-bold text-gray-800">
												{formatCurrency(reportData.totals.grossIncome)}
											</div>
										</div>
										<div class="flex gap-6 text-sm">
											<div>
												<div class="text-gray-500 mb-1">Collected</div>
												<div class="font-semibold text-green-600">
													{formatCurrency(reportData.totals.collected)}
												</div>
											</div>
											<div>
												<div class="text-gray-500 mb-1">Collectible</div>
												<div class="font-semibold text-amber-600">
													{formatCurrency(reportData.totals.collectibles)}
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Income Distribution Section (Merged Net Income and Profit Sharing) -->
				<div class="bg-white rounded-xl overflow-hidden shadow-md">
					<div class="border-b bg-gray-50 p-4">
						<h2 class="flex items-center gap-2 text-gray-800 font-semibold text-xl">
							<PiggyBank class="h-5 w-5 text-gray-600" />
							Income Distribution
						</h2>
					</div>
					<div class="p-5">
						{#if reportData}
							{@const profitSharing = calculateProfitSharing(
								reportData.totals.grossIncome,
								reportData.expenses
							)}
							<div class="space-y-4">
								<div class="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
									<span class="font-medium text-gray-700">Gross Income</span>
									<span class="font-semibold text-green-600"
										>{formatCurrency(reportData.totals.grossIncome)}</span
									>
								</div>
								<div class="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
									<span class="font-medium text-gray-700">Operational Expenses</span>
									<span class="font-semibold text-red-600"
										>- {formatCurrency(calculateOperationalExpenses(reportData.expenses))}</span
									>
								</div>
								<div class="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
									<span class="font-medium text-gray-700">Capital Expenses (60% share only)</span>
									<span class="font-semibold text-red-600"
										>- {formatCurrency(calculateCapitalExpenses(reportData.expenses))}</span
									>
								</div>
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
									<div
										class="flex justify-between items-center py-3 px-4 bg-indigo-100 rounded-lg font-bold"
									>
										<span class="text-indigo-800">40% Share</span>
										<span class="text-indigo-800">
											{formatCurrency(profitSharing.fortyShare)}
										</span>
									</div>
									<div
										class="flex justify-between items-center py-3 px-4 bg-blue-100 rounded-lg font-bold"
									>
										<span class="text-blue-800">60% Share</span>
										<span class="text-blue-800">
											{formatCurrency(profitSharing.sixtyShare)}
										</span>
									</div>
								</div>
								<div class="mb-4 px-4 py-3 bg-blue-50 rounded-lg text-sm text-gray-600">
									<p class="flex items-center">
										<span class="mr-2">ⓘ</span>
										<span
											>Profit sharing is calculated based on collected amounts with operational
											expenses deducted from both shares and capital expenses deducted from 60%
											share only. Collectibles will be included when collected.</span
										>
									</p>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Expenses Section (Combined) -->
				<div class="bg-white rounded-xl overflow-hidden shadow-md md:col-span-2">
					<div class="border-b bg-gray-50 p-4">
						<h2 class="flex items-center gap-2 text-gray-800 font-semibold text-xl">
							<Receipt class="h-5 w-5 text-gray-600" />
							Expenses
						</h2>
					</div>
					<div class="p-5">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<!-- Operational Expenses -->
							<div class="border-r-0 md:border-r border-gray-200 pr-0 md:pr-6">
								<h3 class="text-lg font-semibold mb-4 text-gray-700">Operational Expenses</h3>
								<div class="overflow-x-auto">
									<table class="min-w-full divide-y divide-gray-200">
										<thead>
											<tr>
												<th
													class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
													>Date</th
												>
												<th
													class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
													>Description</th
												>
												<th
													class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
													>Amount</th
												>
											</tr>
										</thead>
										<tbody class="divide-y divide-gray-200">
											{#if getExpensesByType(reportData.expenses, 'OPERATIONAL').length === 0}
												<tr>
													<td colspan="3" class="px-4 py-4 text-center text-sm text-gray-500"
														>No operational expenses recorded for this period</td
													>
												</tr>
											{:else}
												{#each getExpensesByType(reportData.expenses, 'OPERATIONAL') as expense}
													<tr>
														<td class="px-4 py-2 text-sm text-gray-500"
															>{formatDate(expense.created_at)}</td
														>
														<td class="px-4 py-2 text-sm text-gray-900">{expense.description}</td>
														<td class="px-4 py-2 text-sm font-medium"
															>{formatCurrency(expense.amount)}</td
														>
													</tr>
												{/each}
											{/if}
										</tbody>
										<tfoot>
											<tr class="bg-gray-50">
												<td colspan="2" class="px-4 py-3 text-right font-bold text-gray-800"
													>Total</td
												>
												<td class="px-4 py-3 font-bold"
													>{formatCurrency(
														calculateTotalByType(reportData.expenses, 'OPERATIONAL')
													)}</td
												>
											</tr>
										</tfoot>
									</table>
								</div>
							</div>

							<!-- Capital Expenses -->
							<div class="pl-0 md:pl-6">
								<h3 class="text-lg font-semibold mb-4 text-gray-700">Capital Expenses</h3>
								<div class="overflow-x-auto">
									<table class="min-w-full divide-y divide-gray-200">
										<thead>
											<tr>
												<th
													class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
													>Date</th
												>
												<th
													class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
													>Description</th
												>
												<th
													class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
													>Amount</th
												>
											</tr>
										</thead>
										<tbody class="divide-y divide-gray-200">
											{#if getExpensesByType(reportData.expenses, 'CAPITAL').length === 0}
												<tr>
													<td colspan="3" class="px-4 py-4 text-center text-sm text-gray-500"
														>No capital expenses recorded for this period</td
													>
												</tr>
											{:else}
												{#each getExpensesByType(reportData.expenses, 'CAPITAL') as expense}
													<tr>
														<td class="px-4 py-2 text-sm text-gray-500"
															>{formatDate(expense.created_at)}</td
														>
														<td class="px-4 py-2 text-sm text-gray-900">{expense.description}</td>
														<td class="px-4 py-2 text-sm font-medium"
															>{formatCurrency(expense.amount)}</td
														>
													</tr>
												{/each}
											{/if}
										</tbody>
										<tfoot>
											<tr class="bg-gray-50">
												<td colspan="2" class="px-4 py-3 text-right font-bold text-gray-800"
													>Total</td
												>
												<td class="px-4 py-3 font-bold"
													>{formatCurrency(
														calculateTotalByType(reportData.expenses, 'CAPITAL')
													)}</td
												>
											</tr>
										</tfoot>
									</table>
								</div>
								<div class="mt-3 px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
									<p class="flex items-center">
										<span class="mr-2">ⓘ</span>
										<span>Capital expenses are deducted from the 60% share only.</span>
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
