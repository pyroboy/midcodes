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
	import { Receipt, Calendar, DollarSign, CreditCard, FileText, User, Home } from 'lucide-svelte';
	import type { TransactionWithProfiles } from './types';

	// Props
	interface Props {
		open: boolean;
		transaction: TransactionWithProfiles | null;
	}

	let { open = false, transaction = null }: Props = $props();

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
				<div class="space-y-6">
					<!-- Basic transaction info -->
					<Card class="shadow-sm border-gray-100">
						<CardHeader class="pb-2">
							<CardTitle class="text-lg font-medium">Payment Information</CardTitle>
						</CardHeader>
						<CardContent class="space-y-4 pt-0">
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div class="flex items-start gap-2">
									<div class="p-2 bg-gray-100 rounded-md">
										<DollarSign class="h-4 w-4 text-gray-700" />
									</div>
									<div>
										<p class="text-sm text-gray-500">Amount</p>
										<p class="font-medium">{formatCurrency(transaction.amount || 0)}</p>
									</div>
								</div>

								<div class="flex items-start gap-2">
									<div class="p-2 bg-gray-100 rounded-md">
										<CreditCard class="h-4 w-4 text-gray-700" />
									</div>
									<div>
										<p class="text-sm text-gray-500">Payment Method</p>
										<p class="font-medium">{transaction.method?.replace('_', ' ') || 'N/A'}</p>
									</div>
								</div>

								<div class="flex items-start gap-2">
									<div class="p-2 bg-gray-100 rounded-md">
										<User class="h-4 w-4 text-gray-700" />
									</div>
									<div>
										<p class="text-sm text-gray-500">Paid By</p>
										<p class="font-medium">{transaction.paid_by || 'N/A'}</p>
									</div>
								</div>

								<div class="flex items-start gap-2">
									<div class="p-2 bg-gray-100 rounded-md">
										<Calendar class="h-4 w-4 text-gray-700" />
									</div>
									<div>
										<p class="text-sm text-gray-500">Paid At</p>
										<p class="font-medium">{formatDate(transaction.paid_at)}</p>
									</div>
								</div>

								<div class="flex items-start gap-2">
									<div class="p-2 bg-gray-100 rounded-md">
										<Home class="h-4 w-4 text-gray-700" />
									</div>
									<div>
										<p class="text-sm text-gray-500">Lease</p>
										<p class="font-medium">{transaction?.lease_name || 'N/A'}</p>
									</div>
								</div>
							</div>

							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-1">
									<p class="text-xs text-gray-500 flex items-center gap-1">
										<User class="h-3 w-3" />
										Paid By
									</p>
									<p class="font-medium">{transaction.paid_by}</p>
								</div>
								<div class="space-y-1">
									<p class="text-xs text-gray-500 flex items-center gap-1">
										<CreditCard class="h-3 w-3" />
										Payment Method
									</p>
									<p class="font-medium">{transaction.method.replace('_', ' ')}</p>
								</div>
							</div>

							{#if transaction.reference_number}
								<div class="space-y-1">
									<p class="text-xs text-gray-500 flex items-center gap-1">
										<FileText class="h-3 w-3" />
										Reference Number
									</p>
									<p class="font-medium">{transaction.reference_number}</p>
								</div>
							{/if}

							{#if transaction.notes}
								<div class="space-y-1">
									<p class="text-xs text-gray-500">Notes</p>
									<p class="text-sm text-gray-700 bg-gray-50 p-2 rounded">{transaction.notes}</p>
								</div>
							{/if}
						</CardContent>
					</Card>

					<!-- Receipt info -->
					{#if transaction.receipt_url}
						<Card class="shadow-sm border-gray-100">
							<CardHeader class="pb-2">
								<CardTitle class="text-lg font-medium">Receipt</CardTitle>
							</CardHeader>
							<CardContent class="pt-0">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<Receipt class="h-4 w-4 text-blue-500" />
										<span class="text-sm">Receipt available</span>
									</div>
									<a
										href={transaction.receipt_url}
										target="_blank"
										rel="noopener noreferrer"
										class="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
									>
										View Receipt
									</a>
								</div>
							</CardContent>
						</Card>
					{/if}

					<!-- Audit info -->
					<Card class="shadow-sm border-gray-100">
						<CardHeader class="pb-2">
							<CardTitle class="text-lg font-medium">Audit Information</CardTitle>
						</CardHeader>
						<CardContent class="space-y-4 pt-0">
							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-1">
									<p class="text-xs text-gray-500">Created At</p>
									<p class="text-sm">{formatDateTime(transaction.created_at)}</p>
								</div>
								<div class="space-y-1">
									<p class="text-xs text-gray-500">Created By</p>
									<p class="text-sm">
										{transaction.created_by_profile?.full_name || 'Unknown'}
									</p>
								</div>
							</div>

							{#if transaction.updated_at}
								<div class="grid grid-cols-2 gap-4">
									<div class="space-y-1">
										<p class="text-xs text-gray-500">Last Updated</p>
										<p class="text-sm">{formatDateTime(transaction.updated_at)}</p>
									</div>
									<div class="space-y-1">
										<p class="text-xs text-gray-500">Updated By</p>
										<p class="text-sm">
											{transaction.updated_by_profile?.full_name || 'Unknown'}
										</p>
									</div>
								</div>
							{/if}
						</CardContent>
					</Card>

					<!-- Billing info -->
					{#if transaction.billing_ids && transaction.billing_ids.length > 0}
						<Card class="shadow-sm border-gray-100">
							<CardHeader class="pb-2">
								<CardTitle class="text-lg font-medium">Linked Billings</CardTitle>
							</CardHeader>
							<CardContent class="pt-0">
								<ul class="list-disc pl-5 space-y-1">
									{#each transaction.billing_ids as billingId}
										<li class="text-sm">Billing #{billingId}</li>
									{/each}
								</ul>
							</CardContent>
						</Card>
					{/if}
				</div>
			{/if}

			<Dialog.Footer class="flex justify-end">
				<Button variant="secondary" onclick={handleClose}>Close</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
