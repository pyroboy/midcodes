<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { Button } from '$lib/components/ui/button';
	import { Receipt, Calendar, DollarSign, CreditCard, FileText, User, Home, Users, MapPin, ChevronDown, ChevronUp, Building2, Clock } from 'lucide-svelte';
	import type { TransactionWithProfiles } from './types';
	import { formatCurrency } from '$lib/utils/format';

	// Props
	interface Props {
		open: boolean;
		transaction: TransactionWithProfiles | null;
	}

	let { open = false, transaction = null }: Props = $props();

	// State for collapsible sections
	let showBillingBreakdown = $state(false);
	let showAuditInfo = $state(false);

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		close: void;
		edit: TransactionWithProfiles;
	}>();

	// Handle close
	function handleClose() {
		dispatch('close');
	}

	// Handle edit
	function handleEdit() {
		if (transaction) {
			dispatch('edit', transaction);
		}
	}


	// Format date
	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Format time
	function formatTime(dateString: string | null | undefined): string {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Format datetime
	function formatDateTime(dateString: string | null | undefined): string {
		if (!dateString) return 'N/A';
		return `${formatDate(dateString)} at ${formatTime(dateString)}`;
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
			<Dialog.Header class="flex justify-between items-start">
				<div>
					<Dialog.Title class="text-2xl font-bold">Transaction Details</Dialog.Title>
					<Dialog.Description class="text-sm text-gray-500 mt-1">
						Transaction #{transaction?.id}
					</Dialog.Description>
				</div>
				<Button variant="outline" onclick={handleEdit} class="mt-1">Edit</Button>
			</Dialog.Header>

			{#if transaction}
				<!-- Single Consolidated Card -->
				<Card class="shadow-sm border-gray-100">
					<CardContent class="p-6">
						<!-- Transaction Header with Prominent Amount -->
						<div class="flex items-center justify-between mb-6">
							<div class="flex items-center gap-4">
								<div class="p-3 bg-green-100 rounded-lg">
									<DollarSign class="h-6 w-6 text-green-600" />
								</div>
								<div>
									<p class="text-sm text-gray-500">Payment Amount</p>
									<p class="text-2xl font-bold text-gray-900">{formatCurrency(transaction.amount || 0)}</p>
								</div>
							</div>
							<div class="text-right">
								<div class="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
									Completed
								</div>
								<p class="text-sm text-gray-500 mt-1">{formatDate(transaction.paid_at)}</p>
							</div>
						</div>

						<Separator class="my-6" />

						<!-- Payment & Lease Information -->
						<div class="space-y-4">
							<!-- Payment Details Grid -->
							<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div class="flex items-center gap-2">
									<CreditCard class="h-4 w-4 text-gray-400" />
									<div>
										<p class="text-xs text-gray-500">Method</p>
										<p class="text-sm font-medium">{transaction.method?.replace('_', ' ') || 'N/A'}</p>
									</div>
								</div>

								<div class="flex items-center gap-2">
									<User class="h-4 w-4 text-gray-400" />
									<div>
										<p class="text-xs text-gray-500">Paid By</p>
										<p class="text-sm font-medium">{transaction.paid_by || 'N/A'}</p>
									</div>
								</div>

								{#if transaction.reference_number}
									<div class="flex items-center gap-2">
										<FileText class="h-4 w-4 text-gray-400" />
										<div>
											<p class="text-xs text-gray-500">Reference</p>
											<p class="text-sm font-medium">{transaction.reference_number}</p>
										</div>
									</div>
								{/if}

								{#if transaction.receipt_url}
									<div class="flex items-center gap-2">
										<Receipt class="h-4 w-4 text-blue-500" />
										<div>
											<p class="text-xs text-gray-500">Receipt</p>
											<a
												href={transaction.receipt_url}
												target="_blank"
												rel="noopener noreferrer"
												class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
											>
												View
											</a>
										</div>
									</div>
								{/if}
							</div>

								</div>

							{#if transaction.notes}
								<div class="bg-gray-50 p-3 rounded-md">
									<p class="text-xs text-gray-500 mb-1">Notes</p>
									<p class="text-sm text-gray-700">{transaction.notes}</p>
								</div>
							{/if}

							<!-- Lease Information -->
							{#if transaction?.unique_leases && transaction.unique_leases.length > 0}
								<div class="space-y-3">
									<h3 class="text-sm font-medium text-gray-700 flex items-center gap-2">
										<Building2 class="h-4 w-4" />
										Property & Lease Information
									</h3>
									{#each transaction.unique_leases as lease}
										<div class="border-l-3 border-blue-200 pl-4 py-2">
											<div class="flex items-center justify-between mb-2">
												<h4 class="font-medium text-gray-900">{lease.name}</h4>
												<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
													{lease.status?.toLowerCase() || 'active'}
												</span>
											</div>
											{#if lease.rental_unit}
												<div class="flex items-center gap-1 text-sm text-gray-600 mb-1">
													<MapPin class="h-3 w-3" />
													Unit {lease.rental_unit.rental_unit_number}
													{#if lease.rental_unit.floor}
														• Floor {lease.rental_unit.floor.floor_number}
														{#if lease.rental_unit.floor.wing}
															({lease.rental_unit.floor.wing})
														{/if}
													{/if}
												</div>
											{/if}
											{#if lease.tenants && lease.tenants.length > 0}
												<div class="flex items-center gap-1 text-sm text-gray-600">
													<Users class="h-3 w-3" />
													{lease.tenants.map(t => t.name).join(', ')}
												</div>
											{/if}
										</div>
									{/each}
								</div>
							{:else if transaction?.lease_name}
								<div class="space-y-2">
									<h3 class="text-sm font-medium text-gray-700 flex items-center gap-2">
										<Building2 class="h-4 w-4" />
										Lease Information
									</h3>
									<p class="text-sm text-gray-600">{transaction.lease_name}</p>
								</div>
							{/if}


							<!-- Collapsible Billing Breakdown -->
							{#if transaction?.lease_details && transaction.lease_details.length > 0}
								<Separator class="my-4" />
								<div class="space-y-3">
									<button
										class="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 rounded-md transition-colors"
										onclick={() => showBillingBreakdown = !showBillingBreakdown}
									>
										<h3 class="text-sm font-medium text-gray-700 flex items-center gap-2">
											<Receipt class="h-4 w-4" />
											Payment Allocation Details
										</h3>
										{#if showBillingBreakdown}
											<ChevronUp class="h-4 w-4 text-gray-400" />
										{:else}
											<ChevronDown class="h-4 w-4 text-gray-400" />
										{/if}
									</button>

									{#if showBillingBreakdown}
										<div class="space-y-3 pl-4">
											{#each (transaction.unique_leases || []) as lease}
												{@const leaseAllocations = (transaction.lease_details || []).filter(detail => detail.lease.id === lease.id)}
												{#if leaseAllocations.length > 0}
													<div class="border-l-2 border-gray-200 pl-4">
														<h4 class="font-medium text-sm text-gray-900 mb-2">{lease.name}</h4>
														<div class="space-y-2">
															{#each leaseAllocations as allocation}
																<div class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded text-sm">
																	<div>
																		<span class="font-medium">
																			{allocation.billing_type}
																			{#if allocation.utility_type}
																				({allocation.utility_type})
																			{/if}
																		</span>
																		<div class="text-xs text-gray-500">Due: {formatDate(allocation.due_date)}</div>
																	</div>
																	<div class="text-right">
																		<div class="font-semibold text-green-600">
																			{formatCurrency(allocation.allocated_amount)}
																		</div>
																		<div class="text-xs text-gray-500">
																			of {formatCurrency(allocation.billing_amount)}
																		</div>
																	</div>
																</div>
															{/each}
															{#if leaseAllocations.length > 0}
																{@const leaseTotal = leaseAllocations.reduce((sum, alloc) => sum + alloc.allocated_amount, 0)}
																<div class="border-t border-gray-200 pt-2 mt-2 flex justify-between font-semibold text-sm">
																	<span>Lease Total</span>
																	<span class="text-green-700">{formatCurrency(leaseTotal)}</span>
																</div>
															{/if}
														</div>
													</div>
												{/if}
											{/each}
										</div>
									{/if}
								</div>
							{/if}

							<!-- Collapsible Audit Information -->
							<Separator class="my-4" />
							<div class="space-y-3">
								<button
									class="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 rounded-md transition-colors"
									onclick={() => showAuditInfo = !showAuditInfo}
								>
									<h3 class="text-sm font-medium text-gray-700 flex items-center gap-2">
										<Clock class="h-4 w-4" />
										Audit Information
									</h3>
									{#if showAuditInfo}
										<ChevronUp class="h-4 w-4 text-gray-400" />
									{:else}
										<ChevronDown class="h-4 w-4 text-gray-400" />
									{/if}
								</button>

								{#if showAuditInfo}
									<div class="pl-6 space-y-2 text-sm">
										<div class="flex justify-between">
											<span class="text-gray-500">Created:</span>
											<span class="text-gray-700">{formatDateTime(transaction.created_at || '')} by {transaction.created_by_profile?.full_name || 'Unknown'}</span>
										</div>
										{#if transaction.updated_at}
											<div class="flex justify-between">
												<span class="text-gray-500">Updated:</span>
												<span class="text-gray-700">{formatDateTime(transaction.updated_at)} by {transaction.updated_by_profile?.full_name || 'Unknown'}</span>
											</div>
										{/if}
									</div>
								{/if}
							</div>
						</CardContent>
					</Card>

			{/if}

			<Dialog.Footer class="flex justify-end">
				<Button variant="secondary" onclick={handleClose}>Close</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
