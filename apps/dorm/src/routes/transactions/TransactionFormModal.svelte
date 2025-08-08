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
	
	// Simplified allocation management states
	let originalAmount = $state(0);
	let relatedBillings = $state<any[]>([]);
	let sortedAllocations = $state<any[]>([]);
	let allocationOrder = $state<number[]>([]);
	let validationErrors = $state<string[]>([]);
	let amountChanged = $state(false);

	// Computed allocation summary values
	let totalAllocated = $derived(sortedAllocations.reduce((sum, a) => sum + (a.allocatedAmount || 0), 0));
	let remainingAmount = $derived(Number(amountValue) - totalAllocated);

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
	
	// Handle amount changes - automatically recalculate priority allocations
	$effect(() => {
		if (isPopulated) {
			const newAmount = Number(amountValue) || 0;
			
			// Only process if amount actually changed
			if (newAmount !== lastProcessedAmount) {
				lastProcessedAmount = newAmount;
				
				if (newAmount !== originalAmount) {
					amountChanged = true;
					// Automatically calculate priority-based allocations
					if (sortedAllocations.length > 0) {
						setTimeout(() => {
							calculatePriorityAllocations(newAmount);
						}, 0);
					}
				} else {
					amountChanged = false;
					validationErrors = [];
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
				foundBillings = data.billings.filter((b: any) => billingIds.includes(b.id));
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
				allocatedAmount: billing.balance || 0, // Show current balance as potential allocation
				maxAmount: billing.balance || 0
			};
			
			console.log('🎯 ALLOCATION INIT: Created allocation for billing', billingId, ':', allocation);
			return allocation;
		}).filter(Boolean);
		
		console.log('🎯 ALLOCATION INIT: Created sorted allocations:', sortedAllocations.length);
		
		// Calculate initial priority-based allocations
		if (originalAmount > 0) {
			calculatePriorityAllocations(originalAmount);
		}
		
		console.log('🎯 ALLOCATION INIT: Final sorted allocations after calculation:', sortedAllocations.length);
	}

	// Calculate priority-based allocations (simplified)
	function calculatePriorityAllocations(paymentAmount: number) {
		let remainingAmount = paymentAmount;
		
		// Update validation
		const newValidationErrors = [];
		if (paymentAmount <= 0) {
			newValidationErrors.push(paymentAmount === 0 ? 'Zero amount payments are not allowed' : 'Negative amounts are not supported');
		}
		
		// Calculate allocations based on priority order
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
		
		// Update validation errors
		validationErrors = newValidationErrors;
		
		console.log('✅ PRIORITY ALLOCATION: Calculated for amount:', paymentAmount);
	}

	// Drag and Drop functionality for priority reordering
	let draggedIndex = $state<number | null>(null);

	function handleDragStart(event: DragEvent, index: number) {
		draggedIndex = index;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/html', '');
		}
		console.log('🚀 DRAG START: Started dragging allocation at index:', index);
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

		console.log('🎯 DRAG DROP: Moving from index', draggedIndex, 'to index', dropIndex);

		// Reorder the allocations array
		const newAllocations = [...sortedAllocations];
		const [draggedItem] = newAllocations.splice(draggedIndex, 1);
		newAllocations.splice(dropIndex, 0, draggedItem);
		
		// Update priorities
		sortedAllocations = newAllocations.map((allocation, index) => ({
			...allocation,
			priority: index + 1
		}));
		
		// Update allocation order array
		allocationOrder = sortedAllocations.map(a => a.id);
		
		// Update form billing_ids to match new priority order
		$form.billing_ids = [...allocationOrder];
		
		// Automatically recalculate allocations based on new priority order
		const currentAmount = Number(amountValue) || originalAmount;
		if (currentAmount > 0) {
			calculatePriorityAllocations(currentAmount);
		}
		
		console.log('✅ DRAG DROP: Reordered allocations, new order:', allocationOrder);
		console.log('✅ DRAG DROP: Updated form billing_ids:', $form.billing_ids);
		
		draggedIndex = null;
	}

	function handleDragEnd() {
		draggedIndex = null;
		console.log('🏁 DRAG END: Drag operation completed');
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

						<!-- Simplified Drag-and-Drop Allocation Manager -->
						{#if editMode && sortedAllocations.length > 0}
							<div class="space-y-4 p-4 bg-slate-50 rounded-md border">
								<div class="flex items-center justify-between">
									<Label class="text-slate-900">Billing Allocation Priority</Label>
									<div class="text-sm text-slate-600">
										Drag to reorder • Payment: {formatCurrency(Number(amountValue))}
									</div>
								</div>
								
								<!-- Simple Drag-and-Drop List with Real-time Allocation Display -->
								<div class="space-y-2">
									{#each sortedAllocations as allocation, index}
										<div 
											class="bg-white rounded-lg p-4 border-2 {draggedIndex === index ? 'opacity-50 border-blue-300 shadow-lg' : 'border-slate-200'} hover:border-slate-300 transition-all cursor-move"
											draggable="true"
											role="listitem"
											ondragstart={(e) => handleDragStart(e, index)}
											ondragover={(e) => handleDragOver(e, index)}
											ondrop={(e) => handleDrop(e, index)}
											ondragend={handleDragEnd}
										>
											<div class="flex items-start gap-4">
												<!-- Priority Badge & Drag Handle -->
												<div class="flex flex-col items-center">
													<div class="text-gray-400 text-lg select-none mb-1" title="Drag to reorder priority">
														⋮⋮
													</div>
													<div class="text-sm bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
														{allocation.priority}
													</div>
												</div>
												
												<!-- Billing Info -->
												<div class="flex-1">
													<div class="flex items-start justify-between">
														<div>
															<div class="font-semibold text-base text-slate-900">
																Billing #{allocation.id} - {allocation.type}
																{#if allocation.utility_type}({allocation.utility_type}){/if}
															</div>
															<div class="text-sm text-slate-600">
																{#if allocation.lease?.name}
																	{allocation.lease.name}
																{/if}
																{#if allocation.lease?.rental_unit?.rental_unit_number}
																	- Unit {allocation.lease.rental_unit.rental_unit_number}
																{/if}
															</div>
														</div>
														
														<!-- Real-time Allocation Display -->
														<div class="text-right">
															<div class="text-lg font-bold {allocation.allocatedAmount > 0 ? 'text-green-700' : 'text-slate-400'}">
																{formatCurrency(allocation.allocatedAmount || 0)}
															</div>
															<div class="text-xs text-slate-500 mb-2">
																of {formatCurrency(allocation.maxAmount)} due
															</div>
															<!-- Enhanced Visual allocation bar -->
															<div class="w-20 bg-slate-200 rounded-full h-2">
																<div 
																	class="h-2 rounded-full transition-all duration-500 ease-out {allocation.allocatedAmount >= allocation.maxAmount ? 'bg-green-500' : allocation.allocatedAmount > 0 ? 'bg-blue-500' : 'bg-slate-300'}"
																	style="width: {Math.min(100, ((allocation.allocatedAmount || 0) / allocation.maxAmount) * 100)}%"
																></div>
															</div>
															<div class="text-xs {allocation.allocatedAmount >= allocation.maxAmount ? 'text-green-600 font-medium' : allocation.allocatedAmount > 0 ? 'text-blue-600' : 'text-slate-500'} mt-1">
																{Math.round(((allocation.allocatedAmount || 0) / allocation.maxAmount) * 100)}%
																{#if allocation.allocatedAmount >= allocation.maxAmount}
																	✓ Fully Paid
																{:else if allocation.allocatedAmount > 0}
																	Paid
																{:else}
																	Unpaid
																{/if}
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
									{/each}
								</div>
								
								<!-- Real-time Allocation Summary -->
								<div class="border-t pt-4 mt-4 bg-white rounded-lg p-4">
									<div class="flex items-center justify-between text-base mb-2">
										<span class="font-semibold text-slate-700">Payment Total:</span>
										<span class="font-bold text-blue-700 text-lg">{formatCurrency(Number(amountValue))}</span>
									</div>
									<div class="flex items-center justify-between text-sm">
										<span class="text-slate-600">Amount Allocated:</span>
										<span class="font-semibold {totalAllocated > 0 ? 'text-green-600' : 'text-slate-500'}">{formatCurrency(totalAllocated)}</span>
									</div>
									{#if remainingAmount !== 0}
										<div class="flex items-center justify-between text-sm mt-1">
											<span class="text-slate-600">
												{#if remainingAmount > 0}
													Remaining:
												{:else}
													Over-allocated:
												{/if}
											</span>
											<span class="font-semibold {remainingAmount > 0 ? 'text-orange-600' : 'text-red-600'}">{formatCurrency(Math.abs(remainingAmount))}</span>
										</div>
									{/if}
									{#if amountChanged}
										<div class="text-sm text-blue-600 mt-3 p-3 bg-blue-50 rounded-lg">
											<div class="font-semibold flex items-center gap-2">
												💡 Live Allocation Preview:
												{#if Number(amountValue) > originalAmount}
													<span class="text-green-600">+{formatCurrency(Number(amountValue) - originalAmount)}</span>
												{:else if Number(amountValue) < originalAmount}
													<span class="text-red-600">-{formatCurrency(originalAmount - Number(amountValue))}</span>
												{/if}
											</div>
											<div class="text-xs mt-1">
												Payment allocated by priority order (higher priority first). Drag items to change priority.
											</div>
										</div>
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
							<Button type="submit" disabled={$submitting || validationErrors.length > 0}>
								{$submitting ? 'Saving...' : editMode ? 'Update Payment' : 'Save Payment'}
							</Button>
						</div>
					</div>
				</form>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
