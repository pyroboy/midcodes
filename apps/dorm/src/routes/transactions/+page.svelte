<script lang="ts">
	import { browser } from '$app/environment';
	import { transactionSchema } from './schema';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms/client';
	import type { PageData } from './$types';
	import type { Transaction } from './types';
	import TransactionList from './TransactionList.svelte';
	import TransactionFormModal from './TransactionFormModal.svelte';
	import TransactionDetailsModal from './TransactionDetailsModal.svelte';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { invalidate, invalidateAll } from '$app/navigation';
	import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';

	let { data } = $props<{ data: PageData }>();

	// Debug logging
	console.log('Page data:', data);

	// Form for adding/editing transactions
	const { form, errors, enhance, constraints, submitting, reset } = superForm(data.form, {
		validators: zodClient(transactionSchema),
		resetForm: true,
		onUpdate: ({ form }) => {
			console.log('Form updated', form);
		},
		onError: ({ result }) => {
			console.error('Form error', result.error);
			toast.error('Error saving transaction');
		},
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success(selectedTransaction ? 'Transaction updated' : 'Transaction added');
				selectedTransaction = null;
				showFormModal = false;
				invalidateAll();
			}
		}
	});

	// Modal states
	let showFormModal = $state(false);
	let showDetailsModal = $state(false);

	// State for managing the selected transaction
	let selectedTransaction = $state<Transaction | null>(null);

	// Handle edit transaction
	function handleEditTransaction(event: CustomEvent<Transaction>) {
		const transaction = event.detail;
		selectedTransaction = transaction;

		// Reset the form with the transaction data
		reset({
			data: {
				id: transaction.id,
				amount: transaction.amount,
				method: transaction.method,
				reference_number: transaction.reference_number,
				paid_by: transaction.paid_by,
				paid_at: transaction.paid_at,
				notes: transaction.notes,
				receipt_url: transaction.receipt_url,
				billing_ids: transaction.billing_ids
			}
		});

		showFormModal = true;
	}

	// Handle view transaction details
	function handleViewDetails(event: CustomEvent<Transaction>) {
		selectedTransaction = event.detail;
		showDetailsModal = true;
	}

	// Handle edit from details modal
	function handleEditFromDetails() {
		if (selectedTransaction) {
			// Reset the form with the transaction data
			reset({
				data: {
					id: selectedTransaction.id,
					amount: selectedTransaction.amount,
					method: selectedTransaction.method,
					reference_number: selectedTransaction.reference_number,
					paid_by: selectedTransaction.paid_by,
					paid_at: selectedTransaction.paid_at,
					notes: selectedTransaction.notes,
					receipt_url: selectedTransaction.receipt_url,
					billing_ids: selectedTransaction.billing_ids
				}
			});

			showDetailsModal = false;
			showFormModal = true;
		}
	}

	// Handle delete transaction
	async function handleDeleteTransaction(event: CustomEvent<number>) {
		const transactionId = event.detail;
		console.log('Delete transaction request for ID:', transactionId);

		if (!confirm('Are you sure you want to delete (revert) this transaction? This will adjust related billings.')) {
			return;
		}

		try {
			console.log('Sending delete request for transaction ID:', transactionId);

			// Use FormData instead of JSON
			const formData = new FormData();
			formData.append('id', transactionId.toString());
			const reason = prompt('Enter a reason for reverting this transaction (optional):') ?? '';
			formData.append('reason', reason);

			const response = await fetch(`?/delete`, {
				method: 'POST',
				body: formData
			});

			console.log('Delete response status:', response.status);

			// Carefully parse the response - it might not always be JSON
			let responseData;
			try {
				const text = await response.text();
				console.log('Delete response raw text:', text);
				responseData = text ? JSON.parse(text) : {};
			} catch (parseError) {
				console.error('Error parsing response:', parseError);
				responseData = {};
			}

			console.log('Delete response data:', responseData);

			if (response.ok) {
				toast.success('Transaction deleted');
				invalidateAll();
			} else {
				toast.error(`Error deleting transaction: ${responseData.message || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error deleting transaction', error);
			toast.error('Error deleting transaction');
		}
	}

	// Handle add new transaction
	function handleAddTransaction() {
		selectedTransaction = null;
		reset();
		showFormModal = true;
	}

	// Handle export data
	function handleExportData(event: CustomEvent<Transaction[]>) {
		const transactions = event.detail;

		if (!transactions || transactions.length === 0) {
			toast.error('No transactions to export');
			return;
		}

		try {
			// Convert transactions data to CSV
			const headers = [
				'ID',
				'Amount',
				'Method',
				'Reference Number',
				'Paid By',
				'Paid At',
				'Notes',
				'Receipt URL'
			];

			const csvRows = [
				headers.join(','),
				...transactions.map((tx) =>
					[
						tx.id,
						tx.amount,
						tx.method,
						tx.reference_number || '',
						tx.paid_by,
						tx.paid_at || '',
						(tx.notes || '').replace(/,/g, ' '), // Replace commas in notes to avoid CSV issues
						tx.receipt_url || ''
					].join(',')
				)
			];

			const csvString = csvRows.join('\n');

			// Create a blob and download link
			const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
			const link = document.createElement('a');

			const url = URL.createObjectURL(blob);
			link.setAttribute('href', url);
			link.setAttribute(
				'download',
				`transactions_export_${new Date().toISOString().split('T')[0]}.csv`
			);
			link.style.visibility = 'hidden';

			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			toast.success('Transactions exported successfully');
		} catch (error) {
			console.error('Error exporting transactions', error);
			toast.error('Error exporting transactions');
		}
	}

	// Handle refresh event
	async function handleRefresh(event: CustomEvent) {
		const filters = event.detail;
		console.log('Refreshing with filters:', filters);

		// Create query params from filters
		const params = new URLSearchParams();
		if (filters.method) params.set('method', filters.method);
		if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
		if (filters.dateTo) params.set('dateTo', filters.dateTo);
		if (filters.searchTerm) params.set('searchTerm', filters.searchTerm);

		// Invalidate and navigate
		await invalidate('transactions:refresh');

		// Only update URL if we have filters
		if (params.toString()) {
			const url = `?${params.toString()}`;
			history.pushState(null, '', url);
		}
	}

	// Handle close modals
	function handleCloseFormModal() {
		showFormModal = false;
	}

	function handleCloseDetailsModal() {
		showDetailsModal = false;
	}
</script>

<div class="container mx-auto py-6">
	<!-- Page Header -->
	<div class="flex justify-between items-center mb-6 border-b pb-4">
		<h1 class="text-3xl font-bold">Transaction Management</h1>
	</div>

	<!-- Hidden form for POST actions -->
	<form id="transaction-form" method="POST" action="?/upsert" use:enhance>
		<input type="hidden" name="id" value={$form.id} />
		<input type="hidden" name="amount" value={$form.amount} />
		<input type="hidden" name="method" value={$form.method} />
		<input type="hidden" name="reference_number" value={$form.reference_number} />
		<input type="hidden" name="paid_by" value={$form.paid_by} />
		<input type="hidden" name="paid_at" value={$form.paid_at} />
		<input type="hidden" name="notes" value={$form.notes} />
		<input type="hidden" name="receipt_url" value={$form.receipt_url} />
		<input
			type="hidden"
			name="billing_ids"
			value={$form.billing_ids ? JSON.stringify($form.billing_ids) : '[]'}
		/>
	</form>

	<!-- Transaction List -->
	<TransactionList
		transactions={data.transactions}
		on:edit={handleEditTransaction}
		on:delete={handleDeleteTransaction}
		on:add={handleAddTransaction}
		on:refresh={handleRefresh}
		on:viewDetails={handleViewDetails}
		on:exportData={handleExportData}
	/>

	<!-- Modals -->
	{#if showFormModal}
		<TransactionFormModal
			open={showFormModal}
			{data}
			editMode={!!selectedTransaction}
			transaction={selectedTransaction}
			onClose={handleCloseFormModal}
			onCancel={handleCloseFormModal}
		/> 
	{/if}

	{#if showDetailsModal && selectedTransaction}
		<TransactionDetailsModal
			open={showDetailsModal}
			transaction={selectedTransaction}
			on:close={handleCloseDetailsModal}
			on:edit={handleEditFromDetails}
		/>
	{/if}
</div>

{#if browser && import.meta.env.DEV}
	<SuperDebug data={$form} />
{/if}
