<script lang="ts">
	import { createEventDispatcher } from 'svelte';
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

	// Props using Svelte 5 runes
    let {
        open = false,
        data,
        editMode = false,
        transaction = null
    } = $props<{
		open?: boolean;
		data: PageData;
		editMode?: boolean;
        transaction?: Transaction | null;
	}>();

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		close: void;
		cancel: void;
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
	
	const { form, errors, enhance, constraints, submitting } = superForm(data.transactionForm || defaultFormData, {
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
				dispatch('close');
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
		dispatch('close');
	}

	// Handle cancel
	function handleCancel() {
		dispatch('cancel');
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
	
	// Advanced allocation management states
	let originalAmount = $state(0);
	let relatedBillings = $state<any[]>([]);
	let allocationPreview = $state<any[]>([]);
	let billingStatuses = $state<any[]>([]);
	let validationErrors = $state<string[]>([]);
	let amountChanged = $state(false);
	
	// Interactive allocation states
	let allocationStrategy = $state<'priority' | 'proportional' | 'manual'>('priority');
	let sortedAllocations = $state<any[]>([]);
	let totalAllocated = $state(0);
	let remainingToAllocate = $state(0);
	let allocationOrder = $state<number[]>([]);
	let showInteractiveMode = $state(false);

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
			
			// Set original amount for comparison
			originalAmount = transactionData.amount;
			
			// Load related billing information and initialize allocations
			loadRelatedBillings($form.billing_ids);
			
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
	
	// Handle amount changes separately to prevent infinite loops
	$effect(() => {
		if (isPopulated) {
			const newAmount = Number(amountValue) || 0;
			
			// Only process if amount actually changed
			if (newAmount !== lastProcessedAmount) {
				lastProcessedAmount = newAmount;
				
				if (newAmount !== originalAmount) {
					amountChanged = true;
					calculateAllocationPreview(newAmount);
					
					// Update interactive allocations without triggering infinite loop
					if (sortedAllocations.length > 0 && showInteractiveMode) {
						// Use a timeout to break the effect chain
						setTimeout(() => {
							recalculateAllocations();
						}, 0);
					}
				} else {
					amountChanged = false;
					allocationPreview = [];
					if (!showInteractiveMode) {
						validationErrors = [];
					}
				}
			}
		}
	});

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

	// Debug: Track interactive mode visibility conditions (throttled)
	let debugTimer: number | null = null;
	$effect(() => {
		if (debugTimer) clearTimeout(debugTimer);
		debugTimer = setTimeout(() => {
			console.log('🎯 INTERACTIVE MODE DEBUG:', {
				editMode,
				amountChanged,
				showInteractiveMode,
				sortedAllocationsLength: sortedAllocations.length,
				shouldShowInteractive: editMode && (amountChanged || showInteractiveMode) && sortedAllocations.length > 0
			});
		}, 100);
	});

	// Convert payment data to transaction data format
	function convertPaymentToTransaction(paymentData: any) {
		const snapshot = $state.snapshot(paymentData);
		console.log('🔄 DATA CONVERSION: Converting payment data:', snapshot);
		
		// Ensure we preserve existing billing allocations
		let billingIds = [];
		
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

	// Load related billing information for allocation management
	async function loadRelatedBillings(billingIds: number[]) {
		if (!billingIds || billingIds.length === 0) {
			relatedBillings = [];
			return;
		}

		try {
			console.log('🔍 BILLING LOAD: Loading billing details for IDs:', billingIds);
			console.log('🔍 BILLING LOAD: Available data.billings:', data?.billings?.length || 0);
			
			let foundBillings: any[] = [];
			
			// Try to find billing data from available sources
			if (data?.billings && data.billings.length > 0) {
				// First try to find in unpaid billings (for new payments)
				foundBillings = data.billings.filter(b => billingIds.includes(b.id));
				console.log('🔍 BILLING LOAD: Found in data.billings:', foundBillings.length);
			}
			
			// If no billings found from data source, create mock data for edit mode
			if (foundBillings.length === 0 && editMode) {
				console.log('🔍 BILLING LOAD: No billings found in data, creating mock data for edit mode');
				
				// Create mock billing data for edit mode based on payment data
				foundBillings = billingIds.map(id => ({
					id: id,
					type: 'RENT', // Default type
					utility_type: null,
					amount: originalAmount || 1000, // Use original amount or default
					paid_amount: 0,
					balance: originalAmount || 1000,
					status: 'PARTIAL', // Since we're editing an existing payment
					due_date: new Date().toISOString().split('T')[0],
					lease: {
						id: 1,
						name: `Lease for Payment #${transaction?.id || 'Unknown'}`,
						rental_unit: {
							id: 1,
							rental_unit_number: 'Unit-' + id,
							floor: {
								floor_number: '1',
								wing: 'A',
								property: {
									name: 'Property'
								}
							}
						}
					}
				}));
				
				console.log('🔍 BILLING LOAD: Created mock billings:', foundBillings);
			}
			
			relatedBillings = foundBillings;
			
			// Initialize sortable allocations with current amounts
			initializeSortedAllocations(foundBillings);
			
			console.log('✅ BILLING LOAD: Final related billings:', foundBillings.length);
		} catch (error) {
			console.error('❌ BILLING LOAD: Failed to load billing details:', error);
			relatedBillings = [];
		}
	}

	// Calculate allocation preview when amount changes
	function calculateAllocationPreview(newAmount: number) {
		validationErrors = [];
		
		if (!relatedBillings || relatedBillings.length === 0) {
			allocationPreview = [];
			return;
		}

		console.log('🧮 ALLOCATION CALC: Calculating preview for amount:', newAmount, 'from original:', originalAmount);

		try {
			// Calculate the difference
			const difference = newAmount - originalAmount;
			
			// Validation checks
			if (newAmount < 0) {
				validationErrors.push('Negative amounts will be processed as refunds');
			}
			
			if (newAmount === 0) {
				validationErrors.push('Zero amount will suggest payment deletion');
			}

			// Calculate new allocations (proportional distribution for now)
			const totalOriginalBalance = relatedBillings.reduce((sum, billing) => sum + (billing.balance || 0), 0);
			
			if (newAmount > totalOriginalBalance) {
				validationErrors.push(`Payment amount (${newAmount}) exceeds total outstanding balance (${totalOriginalBalance})`);
			}

			// Create allocation preview
			allocationPreview = relatedBillings.map(billing => {
				const originalAllocation = billing.balance || 0;
				const proportion = totalOriginalBalance > 0 ? originalAllocation / totalOriginalBalance : 0;
				const newAllocation = Math.min(newAmount * proportion, billing.balance || 0);
				
				// Calculate new status
				let newStatus = billing.status;
				const newBillingBalance = (billing.balance || 0) - newAllocation;
				
				if (newBillingBalance <= 0) {
					newStatus = 'PAID';
				} else if (newAllocation > 0) {
					newStatus = 'PARTIAL';
				} else {
					newStatus = 'PENDING';
				}

				return {
					...billing,
					originalAllocation,
					newAllocation: Math.round(newAllocation * 100) / 100, // Round to 2 decimal places
					newStatus,
					statusChanged: newStatus !== billing.status
				};
			});

			console.log('✅ ALLOCATION CALC: Preview calculated:', allocationPreview);
			
		} catch (error) {
			console.error('❌ ALLOCATION CALC: Error calculating preview:', error);
			validationErrors.push('Error calculating allocation preview');
		}
	}

	// Handle soft delete for zero amount payments
	async function handleSoftDelete() {
		const confirmed = confirm(
			'This will delete the payment and restore the original billing balances. This action cannot be undone. Continue?'
		);
		
		if (!confirmed) return;
		
		try {
			console.log('🗑️ SOFT DELETE: Initiating soft delete for payment:', $form.id);
			
			// Create form data for soft delete action
			const formData = new FormData();
			formData.append('payment_id', String($form.id));
			formData.append('reason', 'Payment amount changed to zero - soft deleted via edit');
			
			const response = await fetch('?/revert', {
				method: 'POST',
				body: formData
			});
			
			if (response.ok) {
				console.log('✅ SOFT DELETE: Payment soft deleted successfully');
				dispatch('close');
			} else {
				console.error('❌ SOFT DELETE: Failed to soft delete payment');
				alert('Failed to delete payment. Please try again.');
			}
		} catch (error) {
			console.error('❌ SOFT DELETE: Error:', error);
			alert('Error deleting payment. Please try again.');
		}
	}
	
	// Handle refund workflow for negative amounts
	async function handleRefund() {
		const confirmed = confirm(
			`This will process a refund of $${Math.abs(Number(amountValue))} and adjust billing allocations accordingly. Continue?`
		);
		
		if (!confirmed) return;
		
		try {
			console.log('💰 REFUND: Processing refund for amount:', amountValue);
			
			// For now, we'll treat this as a regular update but with special handling
			// In a full implementation, you might want a separate refund action
			alert('Refund functionality will be implemented in the next phase. For now, please use the revert payment option.');
			
		} catch (error) {
			console.error('❌ REFUND: Error:', error);
			alert('Error processing refund. Please try again.');
		}
	}

	// Initialize sorted allocations from billing data
	function initializeSortedAllocations(billings: any[]) {
		console.log('🎯 ALLOCATION INIT: Starting initialization with billings:', billings.length);
		
		if (!billings || billings.length === 0) {
			console.log('🎯 ALLOCATION INIT: No billings provided, clearing allocations');
			sortedAllocations = [];
			allocationOrder = [];
			return;
		}

		// Initialize allocation order (default priority by billing ID)
		allocationOrder = billings.map(b => b.id).sort((a, b) => a - b);
		console.log('🎯 ALLOCATION INIT: Allocation order:', allocationOrder);
		
		// Create initial sortable allocation items
		sortedAllocations = allocationOrder.map((billingId, index) => {
			const billing = billings.find(b => b.id === billingId);
			if (!billing) {
				console.log('🎯 ALLOCATION INIT: No billing found for ID:', billingId);
				return null;
			}
			
			const allocation = {
				...billing,
				priority: index + 1,
				allocatedAmount: 0, // Will be calculated based on strategy
				maxAmount: billing.balance || 0,
				isEditing: false
			};
			
			console.log('🎯 ALLOCATION INIT: Created allocation for billing', billingId, ':', allocation);
			return allocation;
		}).filter(Boolean);
		
		console.log('🎯 ALLOCATION INIT: Created sorted allocations:', sortedAllocations.length);
		
		// Calculate initial allocations based on current strategy
		recalculateAllocations();
		
		console.log('🎯 ALLOCATION INIT: Final sorted allocations after recalculation:', sortedAllocations.length);
	}

	// Recalculate allocations based on strategy and payment amount
	function recalculateAllocations() {
		const paymentAmount = Number(amountValue) || 0;
		
		switch (allocationStrategy) {
			case 'priority':
				calculatePriorityFillAllocations(paymentAmount);
				break;
			case 'proportional':
				calculateProportionalAllocations(paymentAmount);
				break;
			case 'manual':
				// In manual mode, don't auto-calculate - just validate
				validateManualAllocations();
				break;
		}
		
		updateTotalsAndValidation();
	}

	// Priority fill: Fill higher priority billings completely before moving to next
	function calculatePriorityFillAllocations(paymentAmount: number) {
		let remainingAmount = paymentAmount;
		
		sortedAllocations = sortedAllocations.map(allocation => {
			if (remainingAmount <= 0) {
				return { ...allocation, allocatedAmount: 0 };
			}
			
			const maxPossible = Math.min(remainingAmount, allocation.maxAmount);
			remainingAmount -= maxPossible;
			
			return {
				...allocation,
				allocatedAmount: Math.round(maxPossible * 100) / 100
			};
		});
	}

	// Proportional: Distribute based on billing balance ratios
	function calculateProportionalAllocations(paymentAmount: number) {
		const totalBalance = sortedAllocations.reduce((sum, allocation) => sum + allocation.maxAmount, 0);
		
		if (totalBalance === 0) {
			sortedAllocations = sortedAllocations.map(allocation => ({
				...allocation,
				allocatedAmount: 0
			}));
			return;
		}
		
		sortedAllocations = sortedAllocations.map(allocation => {
			const proportion = allocation.maxAmount / totalBalance;
			const proportionalAmount = Math.min(paymentAmount * proportion, allocation.maxAmount);
			
			return {
				...allocation,
				allocatedAmount: Math.round(proportionalAmount * 100) / 100
			};
		});
	}

	// Manual: Just validate current manual allocations
	function validateManualAllocations() {
		// Keep existing allocated amounts, just validate them
		sortedAllocations = sortedAllocations.map(allocation => ({
			...allocation,
			allocatedAmount: Math.min(allocation.allocatedAmount || 0, allocation.maxAmount)
		}));
	}

	// Update totals and validation messages
	function updateTotalsAndValidation() {
		const newTotalAllocated = sortedAllocations.reduce((sum, allocation) => sum + (allocation.allocatedAmount || 0), 0);
		const newRemainingToAllocate = Number(amountValue) - newTotalAllocated;
		
		// Only update if values actually changed
		if (newTotalAllocated !== totalAllocated || newRemainingToAllocate !== remainingToAllocate) {
			totalAllocated = newTotalAllocated;
			remainingToAllocate = newRemainingToAllocate;
			
			// Update validation errors
			const newValidationErrors = [];
			
			if (totalAllocated > Number(amountValue)) {
				newValidationErrors.push(`Total allocated (${formatCurrency(totalAllocated)}) exceeds payment amount (${formatCurrency(Number(amountValue))})`);
			}
			
			if (Number(amountValue) === 0) {
				newValidationErrors.push('Zero amount will suggest payment deletion');
			}
			
			if (Number(amountValue) < 0) {
				newValidationErrors.push('Negative amounts will be processed as refunds');
			}
			
			// Only update validation errors if they changed
			if (JSON.stringify(newValidationErrors) !== JSON.stringify(validationErrors)) {
				validationErrors = newValidationErrors;
			}
		}
	}

	// Handle individual allocation amount changes
	function updateAllocationAmount(allocationIndex: number, newAmount: string) {
		const amount = Math.max(0, Number(newAmount) || 0);
		const allocation = sortedAllocations[allocationIndex];
		
		// Clamp to maximum available
		const clampedAmount = Math.min(amount, allocation.maxAmount);
		
		sortedAllocations[allocationIndex] = {
			...allocation,
			allocatedAmount: Math.round(clampedAmount * 100) / 100
		};
		
		// If we're in manual mode, just update totals
		// In other modes, this would switch to manual mode
		if (allocationStrategy !== 'manual') {
			allocationStrategy = 'manual';
		}
		
		updateTotalsAndValidation();
	}

	// Toggle interactive allocation mode
	function toggleInteractiveMode() {
		showInteractiveMode = !showInteractiveMode;
		if (showInteractiveMode) {
			recalculateAllocations();
		}
	}

	// Drag and Drop functionality
	let draggedIndex = $state<number | null>(null);

	function handleDragStart(event: DragEvent, index: number) {
		draggedIndex = index;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/html', '');
		}
	}

	function handleDragOver(event: DragEvent, index: number) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDrop(event: DragEvent, dropIndex: number) {
		event.preventDefault();
		
		if (draggedIndex === null || draggedIndex === dropIndex) {
			draggedIndex = null;
			return;
		}

		// Reorder the allocations array
		const newAllocations = [...sortedAllocations];
		const [draggedItem] = newAllocations.splice(draggedIndex, 1);
		newAllocations.splice(dropIndex, 0, draggedItem);
		
		// Update priorities
		sortedAllocations = newAllocations.map((allocation, index) => ({
			...allocation,
			priority: index + 1
		}));
		
		// Update allocation order
		allocationOrder = sortedAllocations.map(a => a.id);
		
		// Recalculate allocations based on new priority order
		if (allocationStrategy === 'priority') {
			recalculateAllocations();
		}
		
		console.log('🔄 DRAG DROP: Reordered allocations, new order:', allocationOrder);
		
		draggedIndex = null;
	}

	function handleDragEnd() {
		draggedIndex = null;
	}
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
								{#if !amountChanged}
									<p class="text-xs text-slate-500">
										Note: Billing allocations are preserved when editing. Only modify basic details like payment method, reference number, or notes.
									</p>
								{/if}
							</div>
						{/if}

						<!-- Manual Interactive Mode Toggle (when no amount change) -->
						{#if editMode && !amountChanged && !showInteractiveMode && sortedAllocations.length > 0}
							<div class="p-3 bg-gray-50 rounded-md border text-center">
								<Label class="text-sm text-gray-600">Want to adjust payment allocation?</Label>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onclick={toggleInteractiveMode}
									class="mt-2 text-xs"
								>
									Enable Interactive Mode
								</Button>
							</div>
						{/if}

						<!-- Enhanced Interactive Allocation Management -->
						{#if editMode && (amountChanged || showInteractiveMode) && sortedAllocations.length > 0}
							<div class="space-y-4 p-4 bg-blue-50 rounded-md border border-blue-200">
								
								<!-- Header with Strategy Selector -->
								<div class="flex items-center justify-between">
									<Label class="text-blue-900">Interactive Allocation Management</Label>
									<div class="flex items-center gap-2">
										<Button
											type="button"
											size="sm"
											variant="outline"
											onclick={toggleInteractiveMode}
											class="text-xs"
										>
											{showInteractiveMode ? 'Simple View' : 'Advanced Mode'}
										</Button>
										<div class="text-sm font-medium text-blue-700">
											{formatCurrency(originalAmount)} → {formatCurrency(Number(amountValue))}
										</div>
									</div>
								</div>

								{#if showInteractiveMode}
									<!-- Allocation Strategy Selector -->
									<div class="flex items-center gap-4 p-3 bg-white rounded border">
										<Label class="text-sm font-medium">Strategy:</Label>
										<div class="flex gap-2">
											<button
												type="button"
												class="px-3 py-1 text-xs rounded {allocationStrategy === 'priority' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}"
												onclick={() => {
													allocationStrategy = 'priority';
													recalculateAllocations();
												}}
											>
												Priority Fill
											</button>
											<button
												type="button"
												class="px-3 py-1 text-xs rounded {allocationStrategy === 'proportional' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}"
												onclick={() => {
													allocationStrategy = 'proportional';
													recalculateAllocations();
												}}
											>
												Proportional
											</button>
											<button
												type="button"
												class="px-3 py-1 text-xs rounded {allocationStrategy === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}"
												onclick={() => {
													allocationStrategy = 'manual';
													updateTotalsAndValidation();
												}}
											>
												Manual
											</button>
										</div>
									</div>

									<!-- Allocation Summary Panel -->
									<div class="grid grid-cols-3 gap-4 p-3 bg-white rounded border text-center">
										<div>
											<div class="text-xs text-gray-500">Payment Amount</div>
											<div class="font-medium text-lg">{formatCurrency(Number(amountValue))}</div>
										</div>
										<div>
											<div class="text-xs text-gray-500">Total Allocated</div>
											<div class="font-medium text-lg {totalAllocated > Number(amountValue) ? 'text-red-600' : 'text-green-600'}">
												{formatCurrency(totalAllocated)}
											</div>
										</div>
										<div>
											<div class="text-xs text-gray-500">Remaining</div>
											<div class="font-medium text-lg {remainingToAllocate < 0 ? 'text-red-600' : remainingToAllocate > 0 ? 'text-blue-600' : 'text-green-600'}">
												{formatCurrency(remainingToAllocate)}
											</div>
										</div>
									</div>
								{/if}
								
								<!-- Interactive Allocation List -->
								<div class="space-y-2">
									{#each sortedAllocations as allocation, index}
										{@const currentStatus = allocation.status}
										{@const newStatus = allocation.allocatedAmount >= allocation.maxAmount ? 'PAID' : allocation.allocatedAmount > 0 ? 'PARTIAL' : 'PENDING'}
										<div 
											class="bg-white rounded p-3 border {showInteractiveMode ? 'border-l-4 border-l-blue-500' : ''} {draggedIndex === index ? 'opacity-50' : ''} transition-opacity"
											draggable={showInteractiveMode}
											ondragstart={(e) => handleDragStart(e, index)}
											ondragover={(e) => handleDragOver(e, index)}
											ondrop={(e) => handleDrop(e, index)}
											ondragend={handleDragEnd}
										>
											<div class="flex items-center gap-3">
												
												{#if showInteractiveMode}
													<!-- Drag Handle & Priority -->
													<div class="flex flex-col items-center">
														<div class="cursor-move text-gray-400 hover:text-gray-600 select-none" title="Drag to reorder priority">
															⋮⋮
														</div>
														<div class="text-xs bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
															{allocation.priority}
														</div>
													</div>
												{/if}
												
												<!-- Billing Info -->
												<div class="flex-1">
													<div class="font-medium text-sm">
														Billing #{allocation.id} - {allocation.type}
														{#if allocation.utility_type}({allocation.utility_type}){/if}
													</div>
													<div class="text-xs text-gray-600">
														{#if allocation.lease?.name}
															{allocation.lease.name} 
														{/if}
														{#if allocation.lease?.rental_unit?.rental_unit_number}
															- Unit {allocation.lease.rental_unit.rental_unit_number}
														{/if}
													</div>
												</div>
												
												<!-- Allocation Controls -->
												<div class="text-right space-y-1">
													{#if showInteractiveMode}
														<div class="flex items-center gap-2">
															<Input
																type="number"
																value={allocation.allocatedAmount || 0}
																max={allocation.maxAmount}
																min="0"
																step="0.01"
																class="w-24 text-right text-sm"
																oninput={(e) => updateAllocationAmount(index, e.target.value)}
															/>
															<span class="text-xs text-gray-500">
																/ {formatCurrency(allocation.maxAmount)}
															</span>
														</div>
													{:else}
														<div class="text-sm">
															<span class="font-medium">{formatCurrency(allocation.allocatedAmount || 0)}</span>
															<span class="text-xs text-gray-500">/ {formatCurrency(allocation.maxAmount)}</span>
														</div>
													{/if}
													
													<!-- Status Indicators -->
													<div class="flex items-center gap-2 justify-end">
														<span class="px-2 py-1 text-xs rounded {currentStatus === 'PAID' ? 'bg-green-100 text-green-800' : currentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}">
															{currentStatus}
														</span>
														{#if newStatus !== currentStatus}
															<span class="text-xs">→</span>
															<span class="px-2 py-1 text-xs rounded {newStatus === 'PAID' ? 'bg-green-100 text-green-800' : newStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}">
																{newStatus}
															</span>
														{/if}
													</div>
												</div>
											</div>
											
											{#if showInteractiveMode}
												<!-- Progress Bar -->
												<div class="mt-2">
													<div class="w-full bg-gray-200 rounded-full h-2">
														<div 
															class="h-2 rounded-full {(allocation.allocatedAmount || 0) >= allocation.maxAmount ? 'bg-green-500' : 'bg-blue-500'}"
															style="width: {Math.min(100, ((allocation.allocatedAmount || 0) / allocation.maxAmount) * 100)}%"
														></div>
													</div>
													<div class="text-xs text-gray-500 mt-1">
														{Math.round(((allocation.allocatedAmount || 0) / allocation.maxAmount) * 100)}% allocated
													</div>
												</div>
											{/if}
										</div>
									{/each}
								</div>
								
								{#if showInteractiveMode}
									<!-- Smart Action Buttons -->
									<div class="flex flex-wrap gap-2 pt-2 border-t">
										<Button
											type="button"
											size="sm"
											variant="outline"
											onclick={() => {
												allocationStrategy = 'priority';
												recalculateAllocations();
											}}
											class="text-xs"
										>
											Auto-Fill Priority
										</Button>
										<Button
											type="button"
											size="sm"
											variant="outline"
											onclick={() => {
												allocationStrategy = 'proportional';
												recalculateAllocations();
											}}
											class="text-xs"
										>
											Distribute Proportionally
										</Button>
										<Button
											type="button"
											size="sm"
											variant="outline"
											onclick={() => {
												sortedAllocations = sortedAllocations.map(a => ({ ...a, allocatedAmount: 0 }));
												allocationStrategy = 'manual';
												updateTotalsAndValidation();
											}}
											class="text-xs"
										>
											Clear All
										</Button>
									</div>
								{/if}
								
								<!-- Summary (always visible) -->
								<div class="text-sm text-blue-700 bg-blue-100 rounded p-2">
									<strong>Summary:</strong> 
									{#if showInteractiveMode}
										{formatCurrency(totalAllocated)} of {formatCurrency(Number(amountValue))} allocated
										{#if remainingToAllocate !== 0}
											({remainingToAllocate > 0 ? `${formatCurrency(remainingToAllocate)} remaining` : `${formatCurrency(Math.abs(remainingToAllocate))} over-allocated`})
										{/if}
									{:else if Number(amountValue) > originalAmount}
										Increasing payment by {formatCurrency(Number(amountValue) - originalAmount)}
									{:else if Number(amountValue) < originalAmount}
										Reducing payment by {formatCurrency(originalAmount - Number(amountValue))}
									{/if}
								</div>
							</div>
						{/if}

						<!-- Validation Errors -->
						{#if validationErrors.length > 0}
							<div class="space-y-2 p-3 bg-red-50 rounded-md border border-red-200">
								<Label class="text-red-900">Validation Warnings</Label>
								{#each validationErrors as error}
									<p class="text-sm text-red-700">• {error}</p>
								{/each}
							</div>
						{/if}

						<!-- Basic Transaction Details -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label for="amount">
									Amount* 
									{#if editMode && originalAmount > 0}
										<span class="text-sm font-normal text-gray-500">(Original: {formatCurrency(originalAmount)})</span>
									{/if}
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
                                    class="pl-10 {amountChanged ? 'border-blue-300 bg-blue-50' : ''}"
                                    min="0"
                                    step="0.01"
                                    required
                                />
								</div>
								{#if amountChanged}
									<div class="text-xs text-blue-600">
										{#if Number(amountValue) > originalAmount}
											↗ Increase of {formatCurrency(Number(amountValue) - originalAmount)}
										{:else if Number(amountValue) < originalAmount}
											↘ Decrease of {formatCurrency(originalAmount - Number(amountValue))}
										{/if}
									</div>
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
							
							<!-- Smart Action Buttons -->
							{#if editMode && Number(amountValue) === 0}
								<Button 
									type="button" 
									variant="destructive" 
									onclick={() => handleSoftDelete()}
									disabled={$submitting}
								>
									{$submitting ? 'Deleting...' : 'Delete Payment'}
								</Button>
							{:else if editMode && Number(amountValue) < 0}
								<Button 
									type="button" 
									variant="secondary" 
									onclick={() => handleRefund()}
									disabled={$submitting}
								>
									{$submitting ? 'Processing...' : 'Process Refund'}
								</Button>
							{:else}
								<Button type="submit" disabled={$submitting || validationErrors.some(e => e.includes('exceeds'))}>
									{$submitting ? 'Saving...' : editMode ? 'Update Payment' : 'Save Payment'}
								</Button>
							{/if}
						</div>
					</div>
				</form>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
