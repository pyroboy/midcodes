<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter,
		DialogDescription
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { toast } from 'svelte-sonner';
	import type { Lease, Billing } from '$lib/types/lease';
	import { invalidateAll } from '$app/navigation';
	import { Trash2, Plus } from 'lucide-svelte';
	import DatePicker from '$lib/components/ui/date-picker.svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import type { SuperForm } from 'sveltekit-superforms';
	import { securityDepositSchema } from './securityDepositSchema';

	type SecurityDepositForm = z.infer<typeof securityDepositSchema>;

	let { lease, open, onOpenChange } = $props<{
		lease: Lease;
		open: boolean;
		onOpenChange: (open: boolean) => void;
	}>();

	let securityDeposits = $state<Billing[]>([]);
	let isLoading = $state(false);
	let editingDeposit = $state<Partial<Billing> | null>(null);
	let showAddForm = $state(false);

	// Initialize Superform with default form data
	const initialFormData: SecurityDepositForm = {
		action: 'create',
		lease_id: lease.id || 0, // Fallback to 0 if lease.id is not available yet
		type: 'SECURITY_DEPOSIT',
		amount: 0,
		due_date: '',
		billing_date: '',
		notes: 'Security Deposit'
	};

	const { form, errors, enhance, reset, submitting } = superForm(initialFormData, {
		validators: zodClient(securityDepositSchema),
		validationMethod: 'onblur', // Change to onblur to avoid premature validation
		dataType: 'json',
		resetForm: true,
		onSubmit: () => {
			console.log('🔄 Security deposit form submission started');

			// Ensure lease_id is set before submission
			if (!$form.lease_id || $form.lease_id !== lease.id) {
				console.log('⚠️ Setting lease_id before submission');
				$form.lease_id = lease.id;
			}
		},
		onResult: async ({ result }: { result: any }) => {
			if (result.type === 'success') {
				await invalidateAll();
				reset();
				toast.success(result.data?.message || 'Security deposit operation completed successfully');
				showAddForm = false;
				editingDeposit = null;
				// Reload deposits after successful operation
				setTimeout(() => {
					loadSecurityDeposits();
				}, 100);
			} else if (result.type === 'failure') {
				toast.error(result.data?.message || 'Failed to process security deposit operation');
			}
		},
		onError: ({ result }: { result: any }) => {
			toast.error(result.error?.message || 'An error occurred');
		}
	});

	// Track if form has been initialized for current lease
	let initializedForLease = $state<number | null>(null);

	// Initialize form when modal opens/closes
	$effect(() => {
		if (open && lease.id) {
			// Only initialize if we haven't initialized for this lease yet
			if (initializedForLease !== lease.id) {
				reset();
				$form.lease_id = lease.id;
				$form.type = 'SECURITY_DEPOSIT';
				initializedForLease = lease.id;
			}
			loadSecurityDeposits();
		} else if (!open) {
			// Reset state when modal closes
			securityDeposits = [];
			editingDeposit = null;
			showAddForm = false;
			initializedForLease = null;
			reset();
		}
	});

	const loadSecurityDeposits = () => {
		// Filter existing billings for security deposits (type 'SECURITY_DEPOSIT')
		if (!open) return;
		securityDeposits = lease.billings?.filter((b: Billing) => b.type === 'SECURITY_DEPOSIT') || [];
	};

	const startEdit = (deposit: Billing) => {
		editingDeposit = deposit;
		$form.action = 'update';
		$form.lease_id = lease.id;
		$form.billing_id = deposit.id;
		$form.type = 'SECURITY_DEPOSIT';
		$form.amount = deposit.amount;
		$form.due_date = deposit.due_date.split('T')[0];
		$form.billing_date = deposit.billing_date.split('T')[0];
		$form.notes = deposit.notes || 'Security Deposit';
		showAddForm = true;
	};

	const startAdd = () => {
		editingDeposit = null;
		reset();
		// Ensure lease_id and type are set
		$form.lease_id = lease.id;
		$form.type = 'SECURITY_DEPOSIT';
		$form.action = 'create';
		// Set current date values
		$form.due_date = new Date().toISOString().split('T')[0];
		$form.billing_date = new Date().toISOString().split('T')[0];
		showAddForm = true;
	};

	const deleteBilling = async (billingId: number) => {
		if (!confirm('Are you sure you want to delete this security deposit billing?')) {
			return;
		}

		// Set form data for deletion
		$form.action = 'delete';
		$form.billing_id = billingId;
		$form.lease_id = lease.id;
		$form.type = 'SECURITY_DEPOSIT';
		$form.amount = 0;
		$form.due_date = '';
		$form.billing_date = '';
		$form.notes = '';

		// Submit the form
		const formElement = document.getElementById('security-deposit-delete-form') as HTMLFormElement;
		if (formElement) {
			formElement.requestSubmit();
		}
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-PH', {
			style: 'currency',
			currency: 'PHP'
		}).format(amount || 0);
	};

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const getStatusBadgeClass = (status: string) => {
		switch (status) {
			case 'PAID':
				return 'bg-green-100 text-green-800';
			case 'PENDING':
				return 'bg-yellow-100 text-yellow-800';
			case 'OVERDUE':
				return 'bg-red-100 text-red-800';
			case 'PARTIAL':
				return 'bg-blue-100 text-blue-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	// Calculate security deposit usage (when security deposit money is used for other billings)
	let securityDepositUsage = $derived(() => {
		const usage: any[] = [];
		const allBillings = lease.billings || [];

		allBillings.forEach((billing: any) => {
			if (billing.type !== 'SECURITY_DEPOSIT' && billing.allocations) {
				billing.allocations.forEach((allocation: any) => {
					if (allocation.payment.method === 'SECURITY_DEPOSIT') {
						usage.push({
							billing: billing,
							amount: allocation.amount,
							date: allocation.payment.paid_at,
							method: allocation.payment.method,
							billingType: billing.type
						});
					}
				});
			}
		});

		return usage;
	});

	// Calculate security deposit totals
	let totalBilledSecurityDeposit = $derived(() => {
		return securityDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);
	});

	let availableDeposit = $derived(() => {
		return securityDeposits.reduce((sum, deposit) => sum + deposit.paid_amount, 0);
	});

	let unpaidSecurityDeposit = $derived(() => {
		return securityDeposits.reduce((sum, deposit) => sum + deposit.balance, 0);
	});

	// Calculate amount used from security deposit for other billings
	let amountUsed = $derived(() => {
		// Calculate from all billings that have security deposit payments
		const allBillings = lease.billings || [];
		let totalUsed = 0;

		allBillings.forEach((billing: any) => {
			if (billing.type !== 'SECURITY_DEPOSIT' && billing.allocations) {
				billing.allocations.forEach((allocation: any) => {
					if (allocation.payment.method === 'SECURITY_DEPOSIT') {
						totalUsed += allocation.amount;
					}
				});
			}
		});

		return totalUsed;
	});
</script>

<!-- Hidden form for delete operations -->
<form
	id="security-deposit-delete-form"
	method="POST"
	action="?/manageSecurityDepositBillings"
	use:enhance
	style="display: none;"
>
	<input type="hidden" name="action" value={$form.action} />
	<input type="hidden" name="lease_id" value={lease.id} />
	<input type="hidden" name="billing_id" value={$form.billing_id} />
	<input type="hidden" name="type" value={$form.type} />
	<input type="hidden" name="amount" value={$form.amount} />
	<input type="hidden" name="due_date" value={$form.due_date} />
	<input type="hidden" name="billing_date" value={$form.billing_date} />
	<input type="hidden" name="notes" value={$form.notes} />
</form>

<Dialog {open} {onOpenChange}>
	<DialogContent class="max-w-3xl max-h-[80vh] overflow-y-auto">
		<DialogHeader class="pb-3">
			<DialogTitle class="text-lg">Security Deposit Manager - {lease.name}</DialogTitle>
			<DialogDescription class="text-sm">
				Manage security deposit billings for this lease
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4">
			<!-- Add New Button -->
			<div class="flex justify-between items-center">
				<h3 class="text-sm font-medium">Security Deposit Billings</h3>
				<Button variant="outline" size="sm" onclick={startAdd} disabled={$submitting}>
					<Plus class="w-4 h-4 mr-2" />
					Add Security Deposit
				</Button>
			</div>

			<!-- Security Deposit Summary -->
			{#if securityDeposits.length > 0}
				<div class="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
					<h4 class="font-medium text-blue-900 mb-2">Security Deposit Summary</h4>
					<div class="grid grid-cols-4 gap-4 text-sm">
						<div>
							<span class="text-blue-700">Total Billed Security Deposit:</span>
							<div class="font-medium">{formatCurrency(totalBilledSecurityDeposit())}</div>
						</div>
						<div>
							<span class="text-blue-700">Available Deposit:</span>
							<div class="font-medium">{formatCurrency(availableDeposit() - amountUsed())}</div>
						</div>
						<div>
							<span class="text-blue-700">Unpaid Security Deposit:</span>
							<div class="font-medium">{formatCurrency(unpaidSecurityDeposit())}</div>
						</div>
						<div>
							<span class="text-blue-700">Amount Used:</span>
							<div class="font-medium">{formatCurrency(amountUsed())}</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Security Deposit Usage History -->
			{#if securityDepositUsage().length > 0}
				<div class="mb-4">
					<h4 class="font-medium mb-2">Usage History</h4>
					<div class="space-y-2 max-h-40 overflow-y-auto">
						{#each securityDepositUsage() as usage}
							<div class="p-2 border rounded bg-white">
								<div class="flex items-center justify-between text-sm">
									<div>
										<span class="font-medium">{formatCurrency(usage.amount)}</span>
										<span class="text-gray-600">for {usage.billingType}</span>
									</div>
									<div class="flex items-center gap-2">
										<span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
											>Security Deposit</span
										>
										<span class="text-gray-500">{formatDate(usage.date)}</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Existing Security Deposits List -->
			<div class="space-y-2 max-h-60 overflow-y-auto">
				{#if securityDeposits.length === 0}
					<div class="text-center py-8 text-gray-500">
						<p>No security deposit billings found</p>
						<p class="text-xs">Click "Add Security Deposit" to create one</p>
					</div>
				{:else}
					{#each securityDeposits as deposit}
						<div class="border rounded-lg p-3 bg-gray-50">
							<div class="flex justify-between items-start">
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<span class="font-medium">{formatCurrency(deposit.amount)}</span>
										<span
											class={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(deposit.status)}`}
										>
											{deposit.status}
										</span>
									</div>
									<div class="text-sm text-gray-600 space-y-1">
										<div>Billing Date: {formatDate(deposit.billing_date)}</div>
										<div>Due Date: {formatDate(deposit.due_date)}</div>
										{#if deposit.notes}
											<div>Notes: {deposit.notes}</div>
										{/if}
										<div>Balance: {formatCurrency(deposit.balance)}</div>
										{#if deposit.paid_amount > 0}
											<div class="text-green-600">Paid: {formatCurrency(deposit.paid_amount)}</div>
										{/if}
										{#if deposit.balance > 0}
											<div class="text-red-600">Unpaid: {formatCurrency(deposit.balance)}</div>
										{/if}
									</div>
								</div>
								<div class="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onclick={() => startEdit(deposit)}
										disabled={$submitting}
									>
										Edit
									</Button>
									<Button
										variant="outline"
										size="sm"
										onclick={() => deleteBilling(deposit.id)}
										disabled={$submitting}
										class="text-red-600 hover:text-red-700"
									>
										<Trash2 class="w-4 h-4" />
									</Button>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Add/Edit Form -->
			{#if showAddForm}
				<div class="border-t pt-4">
					<h4 class="text-sm font-medium mb-3">
						{editingDeposit ? 'Edit Security Deposit' : 'Add New Security Deposit'}
					</h4>

					<form method="POST" action="?/manageSecurityDepositBillings" use:enhance>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<Label for="amount">Amount</Label>
								<Input
									id="amount"
									name="amount"
									type="number"
									step="0.01"
									bind:value={$form.amount}
									placeholder="Enter amount"
									disabled={$submitting}
									class={$errors.amount ? 'border-red-500' : ''}
								/>
								{#if $errors.amount}
									<p class="text-red-500 text-xs mt-1">{$errors.amount}</p>
								{/if}
							</div>

							<div>
								<DatePicker
									bind:value={$form.billing_date}
									label="Billing Date"
									placeholder="Select billing date"
									required={true}
									id="billing_date"
									name="billing_date"
									disabled={$submitting}
								/>
								{#if $errors.billing_date}
									<p class="text-red-500 text-xs mt-1">{$errors.billing_date}</p>
								{/if}
							</div>

							<div>
								<DatePicker
									bind:value={$form.due_date}
									label="Due Date"
									placeholder="Select due date"
									required={true}
									id="due_date"
									name="due_date"
									disabled={$submitting}
								/>
								{#if $errors.due_date}
									<p class="text-red-500 text-xs mt-1">{$errors.due_date}</p>
								{/if}
							</div>

							<div>
								<Label for="notes">Notes</Label>
								<Input
									id="notes"
									name="notes"
									bind:value={$form.notes}
									placeholder="Security Deposit"
									disabled={$submitting}
									class={$errors.notes ? 'border-red-500' : ''}
								/>
								{#if $errors.notes}
									<p class="text-red-500 text-xs mt-1">{$errors.notes}</p>
								{/if}
							</div>
						</div>

						<!-- Hidden fields -->
						<input type="hidden" name="action" value={$form.action} />
						<input type="hidden" name="lease_id" value={lease.id} />
						{#if $form.billing_id}
							<input type="hidden" name="billing_id" value={$form.billing_id} />
						{/if}
						<input type="hidden" name="type" value={$form.type} />

						<div class="flex justify-end gap-2 mt-4">
							<Button
								type="button"
								variant="outline"
								onclick={() => {
									showAddForm = false;
									editingDeposit = null;
									reset();
								}}
								disabled={$submitting}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={$submitting}>
								{$submitting ? 'Saving...' : editingDeposit ? 'Update' : 'Add'}
							</Button>
						</div>
					</form>
				</div>
			{/if}
		</div>
	</DialogContent>
</Dialog>
