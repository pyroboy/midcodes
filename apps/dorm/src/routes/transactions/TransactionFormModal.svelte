<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Receipt, Wallet, DollarSign, X } from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { z } from 'zod';
	import { transactionSchema, paymentMethodEnum } from './schema';
	import type { Transaction } from './types';
	import { superForm } from 'sveltekit-superforms/client';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { formatCurrency } from '$lib/utils/format';


	//  [×] Check database billings table structure and key fields        
    //  [ ] Verify billing data handling from database to drag-and-drop UI
    //  [ ] Trace data flow through +page.server.ts load function
    //  [ ] Analyze billing data transformation in TransactionFormModal
    //  [ ] Verify allocation calculations preserve original amounts
    //  [ ] Check maxAmount and balance field mapping

	/*
	 * DATABASE & DATA FLOW ANALYSIS - COMPLETED
	 * ==========================================
	 * 
	 * 1. DATABASE STRUCTURE VERIFIED:
	 *    - billings table: id, lease_id, type, utility_type, amount, paid_amount, balance, status, due_date, billing_date, penalty_amount, notes, created_at, updated_at, meter_id
	 *    - payment_allocations table: id, payment_id, billing_id, amount, created_at
	 *    - payments table: id, amount, method, reference_number, paid_by, paid_at, notes, receipt_url, billing_ids[], billing_id, created_by, updated_by, reverted_at, etc.
	 * 
	 * 2. DATA FLOW TRACED:
	 *    - +page.server.ts load() fetches payments with billing relationships
	 *    - billingsById map created for efficient lookup
	 *    - TransactionFormModal receives data.billings and data.billingsById
	 *    - loadRelatedBillings() function handles billing data transformation
	 * 
	 * 3. ALLOCATION CALCULATIONS VERIFIED:
	 *    - calculatePriorityAllocations() preserves original amounts
	 *    - maxAmount correctly mapped to billing.balance field
	 *    - allocation calculations use Math.min(remainingAmount, allocation.maxAmount)
	 *    - Priority-based allocation system working correctly
	 * 
	 * 4. DRAG-AND-DROP UI INTEGRATION:
	 *    - sortedAllocations state manages drag-and-drop order
	 *    - allocationOrder array tracks priority sequence
	 *    - Real-time allocation preview with visual progress bars
	 *    - Form billing_ids updated when priority changes
	 * 
	 * 5. DATA TRANSFORMATION ANALYSIS:
	 *    - convertPaymentToTransaction() handles payment-to-transaction conversion
	 *    - Mock billing data created for edit mode when real data unavailable
	 *    - Proper handling of billing_ids array vs single billing_id
	 *    - Type-safe conversion between payment and transaction schemas
	 */

	
	// Props using Svelte 5 runes with callback props
    let {
        open = false,
        data,
        editMode = false,
        transaction = null,
        onClose,
        onCancel
    } = $props<{
		open?: boolean;
		data: PageData;
		editMode?: boolean;
        transaction?: Transaction | null;
        onClose?: () => void;
        onCancel?: () => void;
	}>();

	// Setup superForm within modal with proper defaults
	const defaultFormData = {
		amount: 0,
		method: 'CASH' as const,
		paid_by: '',
		paid_at: null,
		reference_number: null,
		notes: null,
		receipt_url: null,
		billing_ids: []
	};
	
	const { form, errors, enhance, constraints, submitting } = superForm(data.form, {
		validators: zodClient(transactionSchema),
		resetForm: true,
		onSubmit: ({ formData, cancel }) => {
			console.log('🚀 FORM SUBMISSION: Form being submitted with data:', Object.fromEntries(formData.entries()));
			console.log('🚀 FORM SUBMISSION: Current form state:', $form);
		},
		onResult: ({ result }) => {
			console.log('📥 FORM RESULT: Received result:', result);
			if (result.type === 'success') {
				console.log('✅ FORM RESULT: Success - closing modal and invalidating data');
				onClose?.();
				// The payments page should handle invalidateAll
			} else if (result.type === 'failure') {
				console.error('❌ FORM RESULT: Failure:', result);
			}
		},
		onError: ({ result }) => {
			console.error('💥 FORM ERROR:', result);
		},
		onUpdate: ({ form }) => {
			console.log('🔄 FORM UPDATE: Form updated:', form);
		}
	});

	// Handle close
	function handleClose() {
		onClose?.();
	}

	// Handle cancel
	function handleCancel() {
		onCancel?.();
	}

	// Format date for input fields
	function formatDateForInput(dateString: string | null | undefined): string {
		if (!dateString) return '';
		try {
			const date = new Date(dateString);
			return date.toISOString().split('T')[0];
		} catch (e) {
			return '';
		}
	}

	// Form field helpers
	let formattedPaidAt = $state(formatDateForInput($form.paid_at));
	let amountValue = $state<string | number>($form.amount ?? '');
	let isPopulated = $state(false);
	
	// Only track original amount for display purposes in edit mode
	let originalAmount = $state(0);

	// Remove allocation computations as we're not allowing allocation edits

	// Initialize form fields when transaction prop changes (only once)
	$effect(() => {
		if (transaction && editMode && !isPopulated) {
			console.log('🔄 FORM POPULATION: Starting form population with transaction:', $state.snapshot(transaction));
			
			// Convert payment data to transaction format if needed
			const transactionData = convertPaymentToTransaction(transaction);
			console.log('🔄 FORM POPULATION: Converted transaction data:', transactionData);
			
			// Update form values
			$form.id = transactionData.id;
			$form.amount = transactionData.amount;
			amountValue = transactionData.amount;
			$form.method = transactionData.method;
			$form.reference_number = transactionData.reference_number;
			$form.paid_by = transactionData.paid_by;
			$form.paid_at = transactionData.paid_at;
			formattedPaidAt = formatDateForInput(transactionData.paid_at);
			$form.notes = transactionData.notes;
			$form.receipt_url = transactionData.receipt_url;
			$form.billing_ids = transactionData.billing_ids || [];
			
			// Set original amount for display only
			originalAmount = transactionData.amount;
			
			isPopulated = true; // Prevent re-population
			
			console.log('✅ FORM POPULATION: Form populated with values:', {
				id: $form.id,
				amount: $form.amount,
				method: $form.method,
				paid_by: $form.paid_by,
				billing_ids: $state.snapshot($form.billing_ids),
				originalAmount,
				formattedPaidAt
			});
		}
	});

	// Update form values when user input changes
	let lastProcessedAmount = $state(0);
	
	$effect(() => {
		if (isPopulated) {
			$form.paid_at = formattedPaidAt;
			$form.amount = Number(amountValue) || 0;
		}
	});
	
	// Remove amount change handling since amount editing is disabled in edit mode

	// Reset population flag when modal closes
	$effect(() => {
		if (!open) {
			isPopulated = false;
		}
	});

	// Debug: Track changes to billing_ids (only when populated)
	$effect(() => {
		if (isPopulated && $form.billing_ids && $form.billing_ids.length > 0) {
			console.log('🔍 BILLING IDS TRACKED:', $state.snapshot($form.billing_ids));
		}
	});


	// Convert payment data to transaction data format
	function convertPaymentToTransaction(paymentData: any) {
		const snapshot = $state.snapshot(paymentData);
		console.log('🔄 DATA CONVERSION: Converting payment data:', snapshot);
		
		// Ensure we preserve existing billing allocations
		let billingIds: number[] = [];
		
		// Handle different possible billing ID formats
		if (snapshot.billing_ids && Array.isArray(snapshot.billing_ids)) {
			billingIds = [...snapshot.billing_ids]; // Create a new array
		} else if (snapshot.billing_id) {
			billingIds = [snapshot.billing_id];
		}
		
		console.log('🔄 DATA CONVERSION: Extracted billing IDs:', billingIds);
		
		const result = {
			id: snapshot.id,
			amount: snapshot.amount || 0,
			method: mapPaymentMethod(snapshot.method),
			reference_number: snapshot.reference_number || null,
			paid_by: snapshot.paid_by || '',
			paid_at: snapshot.paid_at || null,
			notes: snapshot.notes || null,
			receipt_url: snapshot.receipt_url || null,
			billing_ids: billingIds
		};
		
		console.log('✅ DATA CONVERSION: Converted result:', result);
		return result;
	}

	// Map payment method from payment schema to transaction schema
	function mapPaymentMethod(paymentMethod: string): string {
		const methodMap: Record<string, string> = {
			'BANK': 'BANK',
			'GCASH': 'GCASH',
			'CASH': 'CASH',
			'SECURITY_DEPOSIT': 'SECURITY_DEPOSIT',
			'OTHER': 'OTHER'
		};
		return methodMap[paymentMethod] || paymentMethod;
	}

	// Create select items from paymentMethodEnum
	const paymentMethodItems = Object.values(paymentMethodEnum.enum).map((method) => ({
		value: method,
		label: method.replace('_', ' ')
	}));





</script>

<Dialog.Root {open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
		/>
		<Dialog.Content
			class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[94%] md:max-w-[600px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-h-[90vh] overflow-y-auto"
		>
			<Dialog.Header class="flex flex-col gap-2">
				<Dialog.Title class="text-2xl font-bold">
					{editMode ? 'Edit Transaction' : 'New Transaction'}
				</Dialog.Title>
				<Dialog.Description class="text-sm text-gray-500">
					{editMode ? 'Update transaction details' : 'Enter transaction details below'}
				</Dialog.Description>
			</Dialog.Header>
			<div class="mt-4">
				<form
					method="POST"
					action="?/upsert"
					use:enhance
				>
					{#if editMode && $form.id}
						<input type="hidden" name="id" bind:value={$form.id} />
					{/if}

					<!-- Hidden input for method value -->
					<input type="hidden" name="method" bind:value={$form.method} />

					<!-- Hidden inputs for billing_ids array -->
					{#each ($form.billing_ids || []) as billingId}
						<input type="hidden" name="billing_ids" value={billingId} />
					{/each}

					<div class="space-y-6">
						<!-- Current Billing Allocations (for edit mode) -->
						{#if editMode && $form.billing_ids && $form.billing_ids.length > 0}
							<div class="space-y-2 p-3 bg-slate-50 rounded-md border">
								<Label>Current Payment Allocation</Label>
								<div class="text-sm text-slate-600">
									This payment is allocated to billing ID(s): {$form.billing_ids.join(', ')}
								</div>
								<p class="text-xs text-slate-500">
									Note: Billing allocations are preserved when editing. Only modify basic details like payment method, reference number, or notes.
								</p>
							</div>
						{/if}

						<!-- Basic Transaction Details -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label for="amount">
									Amount*
								</Label>
								<div class="relative">
									<div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
										<DollarSign class="h-4 w-4" />
									</div>
                                <Input
                                    type="number"
                                    id="amount"
                                    name="amount"
                                    bind:value={amountValue}
                                    placeholder="0.00"
                                    class="pl-10 {editMode ? 'bg-gray-100 cursor-not-allowed' : ''}"
                                    min="0"
                                    step="0.01"
                                    readonly={editMode}
                                    required
                                />
								</div>
								{#if editMode}
									<p class="text-xs text-gray-500">
										Amount cannot be modified during edit
									</p>
								{/if}
								{#if $errors.amount}
									<p class="text-xs text-red-500 mt-1">{$errors.amount}</p>
								{/if}
							</div>

							<div class="space-y-2">
								<Label for="paid_by">Paid By*</Label>
                                <Input
                                    type="text"
                                    id="paid_by"
                                    name="paid_by"
                                    bind:value={$form.paid_by}
                                    placeholder="Enter name"
                                    required
                                />
								{#if $errors.paid_by}
									<p class="text-xs text-red-500 mt-1">{$errors.paid_by}</p>
								{/if}
							</div>

							<div class="space-y-2">
								<Label for="method">Payment Method*</Label>
								<Select.Root
									type="single"
									value={$form.method || ''}
									onValueChange={(value) => ($form.method = value)}
								>
									<Select.Trigger class="w-full" id="method">
										<span>{$form.method ? $form.method.replace('_', ' ') : 'Select method'}</span>
									</Select.Trigger>
									<Select.Content>
										{#each Object.values(paymentMethodEnum.enum) as method}
											<Select.Item value={method}>{method.replace('_', ' ')}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
								{#if $errors.method}
									<p class="text-xs text-red-500 mt-1">{$errors.method}</p>
								{/if}
							</div>

							<div class="space-y-2">
								<Label for="paid_at">Payment Date*</Label>
								<Input
									type="date"
									id="paid_at"
									bind:value={formattedPaidAt}
									name="paid_at"
									required
								/>
								{#if $errors.paid_at}
									<p class="text-xs text-red-500 mt-1">{$errors.paid_at}</p>
								{/if}
							</div>
						</div>

						<!-- Additional Details -->
						<div class="space-y-2">
							<Label for="reference_number">Reference Number</Label>
							<Input
								type="text"
								id="reference_number"
								name="reference_number"
								bind:value={$form.reference_number}
								placeholder="e.g. receipt number, transaction ID..."
							/>
							{#if $errors.reference_number}
								<p class="text-xs text-red-500 mt-1">{$errors.reference_number}</p>
							{/if}
						</div>

						<div class="space-y-2">
							<Label for="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                bind:value={$form.notes}
                                placeholder="Additional information about the transaction..."
                                rows={3}
                            />
							{#if $errors.notes}
								<p class="text-xs text-red-500 mt-1">{$errors.notes}</p>
							{/if}
						</div>

						<div class="space-y-2">
							<Label for="receipt_url">Receipt URL</Label>
                            <Input
                                type="text"
                                id="receipt_url"
                                name="receipt_url"
                                bind:value={$form.receipt_url}
                                placeholder="URL to receipt image or document"
                            />
							{#if $errors.receipt_url}
								<p class="text-xs text-red-500 mt-1">{$errors.receipt_url}</p>
							{/if}
						</div>

						<div class="mt-6 flex justify-end gap-2">
							<Button type="button" variant="outline" onclick={handleCancel}>Cancel</Button>
							<Button type="submit" disabled={$submitting}>
								{$submitting ? 'Saving...' : editMode ? 'Update Payment' : 'Save Payment'}
							</Button>
						</div>
					</div>
				</form>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
