<script lang="ts">
	import { transactionSchema } from './schema';
	import { Button } from '$lib/components/ui/button';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms/client';
	import { defaults } from 'sveltekit-superforms';
	import type { Transaction } from './types';
	import TransactionList from './TransactionList.svelte';
	import TransactionFormModal from './TransactionFormModal.svelte';
	import TransactionDetailsModal from './TransactionDetailsModal.svelte';
	import { zodClient, zod } from 'sveltekit-superforms/adapters';
	import {
		paymentsStore,
		billingsStore,
		leasesStore,
		rentalUnitsStore,
		floorsStore,
		leaseTenantsStore,
		tenantsStore,
		paymentAllocationsStore
	} from '$lib/stores/collections.svelte';
	import { resyncCollection } from '$lib/db/replication';

	// ─── Form defaults (no server load, so we create client-side) ────
	const formDefaults = { form: defaults(zod(transactionSchema)) };

	// ─── Derive enriched transactions from RxDB stores ──────────────────
	let transactions: Transaction[] = $derived.by(() => {
		return [...paymentsStore.value]
			.sort((a: any, b: any) => {
				const aMs = a.updated_at ? new Date(a.updated_at).getTime() : 0;
				const bMs = b.updated_at ? new Date(b.updated_at).getTime() : 0;
				return bMs - aMs;
			})
			.filter((p: any) => !p.reverted_at) // Exclude reverted by default
			.map((payment: any) => {
				const billingIds = Array.isArray(payment.billing_ids) ? payment.billing_ids : [];

				// Find allocations for this payment
				const allocations = paymentAllocationsStore.value
					.filter((a: any) => String(a.payment_id) === String(payment.id))
					.map((a: any) => ({ billing_id: Number(a.billing_id), amount: parseFloat(a.amount) || 0 }));

				// Build billing details with lease info
				let leaseName: string | null = null;
				const leaseDetails = billingIds.map((billingId: number) => {
					const billing = billingsStore.value.find((b: any) => String(b.id) === String(billingId));
					if (!billing) return null;
					const lease = leasesStore.value.find((l: any) => String(l.id) === String(billing.lease_id));
					if (lease && !leaseName) leaseName = lease.name;
					const unit = lease ? rentalUnitsStore.value.find((u: any) => String(u.id) === String(lease.rental_unit_id)) : null;
					const floor = unit ? floorsStore.value.find((f: any) => String(f.id) === String(unit.floor_id)) : null;
					const allocation = allocations.find((a: any) => a.billing_id === Number(billing.id));

					// Lease tenants
					const ltDocs = lease ? leaseTenantsStore.value.filter((lt: any) => String(lt.lease_id) === String(lease.id)) : [];
					const tenantsList = ltDocs.map((lt: any) => {
						const tenant = tenantsStore.value.find((t: any) => String(t.id) === String(lt.tenant_id));
						return tenant ? { id: Number(tenant.id), name: tenant.name, email: tenant.email, phone: tenant.contact_number } : null;
					}).filter(Boolean);

					return {
						billing_id: Number(billing.id),
						billing_type: billing.type,
						utility_type: billing.utility_type,
						billing_amount: parseFloat(billing.amount) || 0,
						allocated_amount: allocation?.amount || 0,
						due_date: billing.due_date,
						lease: lease ? {
							id: Number(lease.id),
							name: lease.name,
							start_date: lease.start_date,
							end_date: lease.end_date,
							rent_amount: lease.rent_amount,
							security_deposit: lease.security_deposit,
							status: lease.status,
							rental_unit: unit ? {
								id: Number(unit.id),
								number: unit.number,
								floors: floor ? { floor_number: floor.floor_number, wing: floor.wing } : undefined
							} : undefined,
							lease_tenants: tenantsList.map((t: any) => ({ tenant: t }))
						} : null
					};
				}).filter(Boolean);

				// Unique leases
				const leaseMap = new Map();
				leaseDetails.forEach((d: any) => {
					if (d?.lease?.id && !leaseMap.has(d.lease.id)) leaseMap.set(d.lease.id, d.lease);
				});

				return {
					...payment,
					id: Number(payment.id),
					amount: parseFloat(payment.amount) || 0,
					billing_ids: billingIds,
					lease_name: leaseName,
					allocations,
					lease_details: leaseDetails,
					unique_leases: Array.from(leaseMap.values())
				};
			});
	});

	let isLoading = $derived(!paymentsStore.initialized);

	// Form for adding/editing transactions
	const { form, errors, enhance, constraints, submitting, reset } = superForm(defaults(zod(transactionSchema)), {
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
				resyncCollection('payments');
				resyncCollection('billings');
			}
		}
	});

	// Modal states
	let showFormModal = $state(false);
	let showDetailsModal = $state(false);

	// State for managing the selected transaction
	let selectedTransaction = $state<Transaction | null>(null);

	// Delete confirmation dialog state
	let showDeleteConfirm = $state(false);
	let transactionToDeleteId = $state<number | null>(null);
	let deleteReason = $state('');

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
	function handleDeleteTransaction(event: CustomEvent<number>) {
		transactionToDeleteId = event.detail;
		deleteReason = '';
		showDeleteConfirm = true;
	}

	async function confirmDeleteTransaction() {
		if (transactionToDeleteId === null) return;
		const transactionId = transactionToDeleteId;
		const reason = deleteReason;
		showDeleteConfirm = false;
		transactionToDeleteId = null;
		deleteReason = '';

		try {
			console.log('Sending delete request for transaction ID:', transactionId);

			// Use FormData instead of JSON
			const formData = new FormData();
			formData.append('id', transactionId.toString());
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
				resyncCollection('payments');
				resyncCollection('billings');
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
		console.log('Refreshing transactions via RxDB resync');
		await resyncCollection('payments');
		await resyncCollection('billings');
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
		{transactions}
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
			data={formDefaults}
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

<!-- Delete/Revert Transaction Dialog (with reason input) -->
<Dialog.Root bind:open={showDeleteConfirm}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Revert Transaction</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete (revert) this transaction? This will adjust related billings.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="delete-reason">Reason for reverting (optional)</Label>
				<Input id="delete-reason" bind:value={deleteReason} placeholder="Enter a reason..." />
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => { showDeleteConfirm = false; transactionToDeleteId = null; deleteReason = ''; }}>Cancel</Button>
			<Button variant="destructive" onclick={confirmDeleteTransaction}>Revert Transaction</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

