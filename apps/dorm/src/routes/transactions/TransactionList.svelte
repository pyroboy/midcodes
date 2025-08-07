<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import {
		Download,
		Edit,
		Eye,
		FileText,
		Filter,
		Plus,
		RefreshCw,
		Trash2,
		Receipt
	} from 'lucide-svelte';
	import type { Transaction, PaymentMethod } from './types';
	import type { PageData } from './$types';
	import { paymentMethodEnum } from './schema';

	// Props
	interface Props {
		transactions: Transaction[] | null;
	}

	let { transactions = [] }: Props = $props();

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		edit: Transaction;
		delete: number;
		add: any;
		refresh: any;
		viewDetails: Transaction;
		exportData: any;
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

	// Method badge color
	function getMethodColor(method: string): string {
		switch (method) {
			case 'CASH':
				return 'bg-green-100 text-green-800';
			case 'BANK_TRANSFER':
				return 'bg-blue-100 text-blue-800';
			case 'CREDIT_CARD':
				return 'bg-purple-100 text-purple-800';
			case 'DEBIT_CARD':
				return 'bg-indigo-100 text-indigo-800';
			case 'CHEQUE':
				return 'bg-yellow-100 text-yellow-800';
			case 'MOBILE_PAYMENT':
				return 'bg-teal-100 text-teal-800';
			case 'ONLINE_PAYMENT':
				return 'bg-cyan-100 text-cyan-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	// State for filters
	let searchTerm = $state('');
	let selectedMethod = $state<string | undefined>(undefined);
	let dateFrom = $state('');
	let dateTo = $state('');
	let showFilters = $state(false);

	// Filter transactions
	function getFilteredTransactions() {
		if (!transactions) return [];

		return transactions.filter((transaction) => {
			// Method filter
			if (selectedMethod && transaction.method !== selectedMethod) {
				return false;
			}

			// Date range filter
			if (dateFrom) {
				const fromDate = new Date(dateFrom);
				const txDate = new Date(transaction.paid_at || '');
				if (txDate < fromDate) return false;
			}

			if (dateTo) {
				const toDate = new Date(dateTo);
				toDate.setHours(23, 59, 59, 999); // End of the day
				const txDate = new Date(transaction.paid_at || '');
				if (txDate > toDate) return false;
			}

			// Search term filter
			if (searchTerm) {
				const term = searchTerm.toLowerCase();
				const paidBy = (transaction.paid_by || '').toLowerCase();
				const refNum = (transaction.reference_number || '').toLowerCase();
				const notes = (transaction.notes || '').toLowerCase();

				if (!paidBy.includes(term) && !refNum.includes(term) && !notes.includes(term)) {
					return false;
				}
			}

			return true;
		});
	}

	// Apply filters
	function applyFilters() {
		showFilters = false;
		dispatch('refresh', {
			method: selectedMethod,
			dateFrom,
			dateTo,
			searchTerm
		});
	}

	// Reset filters
	function resetFilters() {
		selectedMethod = undefined;
		dateFrom = '';
		dateTo = '';
		searchTerm = '';
		dispatch('refresh', {});
	}

	// Handle add transaction
	function handleAddTransaction() {
		dispatch('add', {});
	}

	// Handle edit transaction
	function handleEditTransaction(transaction: Transaction) {
		dispatch('edit', transaction);
	}

	// Handle delete transaction
	function handleDeleteTransaction(id: number) {
		if (confirm('Are you sure you want to delete this transaction?')) {
			dispatch('delete', id);
		}
	}

	// Handle view transaction details
	function handleViewDetails(transaction: Transaction) {
		dispatch('viewDetails', transaction);
	}

	// Handle export data
	function handleExportData() {
		dispatch('exportData', getFilteredTransactions());
	}

	// Handle refresh
	function handleRefresh() {
		dispatch('refresh', {});
	}
</script>

<div class="space-y-6">
	<!-- Action Bar -->
	<div class="flex flex-col sm:flex-row justify-between gap-4">
		<!-- Search -->
		<div class="flex-1 flex gap-2">
			<div class="relative flex-1">
				<Input
					type="text"
					placeholder="Search by name, reference number..."
					bind:value={searchTerm}
					class="pr-10 w-full"
				/>
				<button
					onclick={() => (searchTerm = '')}
					class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
					aria-label="Clear search"
				>
					{#if searchTerm}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"
							></line></svg
						>
					{/if}
				</button>
			</div>
			<Button variant="outline" onclick={() => applyFilters()}>Search</Button>
		</div>

		<!-- Action Buttons -->
		<div class="flex gap-2">
			<Button
				variant="outline"
				onclick={() => (showFilters = !showFilters)}
				class="flex items-center gap-1"
			>
				<Filter class="w-4 h-4" />
				<span>Filters</span>
			</Button>
			<Button variant="outline" onclick={handleExportData} class="flex items-center gap-1">
				<Download class="w-4 h-4" />
				<span>Export</span>
			</Button>
			<Button onclick={handleAddTransaction} class="flex items-center gap-1">
				<Plus class="w-4 h-4" />
				<span>Add</span>
			</Button>
			<Button
				variant="ghost"
				onclick={handleRefresh}
				class="flex items-center gap-1"
				title="Refresh"
			>
				<RefreshCw class="w-4 h-4" />
			</Button>
		</div>
	</div>

	<!-- Filters -->
	{#if showFilters}
		<Card class="bg-slate-50 border shadow">
			<CardContent class="p-4">
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div class="space-y-2">
						<Label for="method-filter">Payment Method</Label>
						<Select.Root
							type="single"
							value={selectedMethod}
							onValueChange={(value) => (selectedMethod = value)}
						>
							<Select.Trigger id="method-filter" class="w-full">
								<span>{selectedMethod ? selectedMethod.replace('_', ' ') : 'All Methods'}</span>
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="">All Methods</Select.Item>
								{#each Object.values(paymentMethodEnum.enum) as method}
									<Select.Item value={method}>{method.replace('_', ' ')}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-2">
						<Label for="date-from">Date From</Label>
						<Input type="date" id="date-from" bind:value={dateFrom} />
					</div>

					<div class="space-y-2">
						<Label for="date-to">Date To</Label>
						<Input type="date" id="date-to" bind:value={dateTo} />
					</div>
				</div>

				<div class="flex justify-end gap-2 mt-4">
					<Button variant="outline" onclick={resetFilters}>Reset</Button>
					<Button onclick={applyFilters}>Apply Filters</Button>
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Transactions Table -->
	<Card class="bg-white shadow">
		<CardHeader class="border-b pb-3">
			<CardTitle class="text-xl">Transaction History</CardTitle>
		</CardHeader>
		<CardContent class="p-0">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="bg-gray-50 border-b">
							<th
								class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>ID</th
							>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>Date</th
							>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>Amount</th
							>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>Paid By</th
							>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>Method</th
							>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>Lease</th
							>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>Reference</th
							>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>Receipt</th
							>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>Actions</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200">
						{#each getFilteredTransactions() as transaction (transaction.id)}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900"
									>{transaction.id}</td
								>
								<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500"
									>{formatDate(transaction.paid_at)}</td
								>
								<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium"
									>{formatCurrency(transaction.amount)}</td
								>
								<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500"
									>{transaction.paid_by}</td
								>
								<td class="px-4 py-3 whitespace-nowrap text-sm">
									<Badge class={getMethodColor(transaction.method)}>
										{transaction.method.replace('_', ' ')}
									</Badge>
								</td>
								<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
									{transaction.lease_name || 'N/A'}
								</td>
								<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500"
									>{transaction.reference_number || 'N/A'}</td
								>
								<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
									{#if transaction.receipt_url}
										<a
											href={transaction.receipt_url}
											target="_blank"
											rel="noopener noreferrer"
											class="text-blue-600 hover:underline flex items-center"
										>
											<Receipt class="h-4 w-4 mr-1" />
											View
										</a>
									{:else}
										<span class="text-gray-400">No receipt</span>
									{/if}
								</td>
								<td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
									<div class="flex gap-2">
										<Button
											variant="ghost"
											size="icon"
											onclick={() => handleViewDetails(transaction)}
											title="View Details"
										>
											<Eye class="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onclick={() => handleEditTransaction(transaction)}
											title="Edit"
										>
											<Edit class="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onclick={() => handleDeleteTransaction(transaction.id || 0)}
											title="Delete"
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</td>
							</tr>
						{/each}

						{#if !getFilteredTransactions().length}
							<tr>
								<td colspan="9" class="px-4 py-12 text-center text-gray-500">
									<div class="flex flex-col items-center justify-center gap-2">
										<FileText class="h-12 w-12 text-gray-300" />
										<p>No transactions found</p>
										<p class="text-sm text-gray-400">
											Try adjusting your filters or add a new transaction
										</p>
									</div>
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</CardContent>
	</Card>
</div>
