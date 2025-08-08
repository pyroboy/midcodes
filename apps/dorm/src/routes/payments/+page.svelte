<script lang="ts">
	import PaymentForm from './PaymentForm.svelte';
	import TransactionFormModal from '../transactions/TransactionFormModal.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageData } from './$types';
	import type { z } from 'zod';
	import { paymentSchema } from './formSchema';
	import { invalidateAll } from '$app/navigation';

	type Payment = z.infer<typeof paymentSchema> & {
		billing?: {
			id: number;
			type: string;
			utility_type?: string;
			lease?: {
				id: number;
				name: string;
				rental_unit?: {
					id: number;
					rental_unit_number: string;
					floor?: {
						floor_number: string;
						wing?: string;
						property?: {
							name: string;
						};
					};
				};
			};
		};
	};

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let showForm = $state(false);
	let selectedPayment: Payment | undefined = $state(undefined);
	let showTransactionModal = $state(false);

	// Debug effect
	$effect(() => {
		console.log('Modal state changed:', { 
			showTransactionModal, 
			selectedPayment: selectedPayment?.id, 
			shouldShow: showTransactionModal && selectedPayment 
		});
	});

	function handlePaymentClick(payment: Payment) {
		console.log('🖱️ PAYMENT CLICK: handlePaymentClick called with:', payment);
		console.log('🔐 PAYMENT CLICK: User permissions:', { 
			isAdminLevel: data.isAdminLevel, 
			isAccountant: data.isAccountant, 
			isFrontdesk: data.isFrontdesk 
		});
		
		if (data.isAdminLevel || data.isAccountant || data.isFrontdesk) {
			selectedPayment = payment;
			showTransactionModal = true;
			console.log('✅ PAYMENT CLICK: Modal should open:', { selectedPayment, showTransactionModal });
		} else {
			console.log('❌ PAYMENT CLICK: User does not have permission to edit payments');
		}
	}

	function handlePaymentAdded() {
		showForm = false;
		selectedPayment = undefined;
	}

	async function handleTransactionModalClose() {
		console.log('🔒 MODAL CLOSE: Transaction modal closing, invalidating data...');
		showTransactionModal = false;
		selectedPayment = undefined;
		
		// Invalidate data to refresh the payments list
		console.log('🔄 MODAL CLOSE: Calling invalidateAll to refresh data...');
		await invalidateAll();
		console.log('✅ MODAL CLOSE: Data invalidation complete');
	}

	async function revertPayment(paymentId: number) {
		const reason = prompt('Enter a reason for reverting this payment (optional):') ?? '';
		const confirmRevert = confirm('Are you sure you want to revert this payment? This will adjust affected billings.');
		if (!confirmRevert) return;

		const form = new FormData();
		form.append('payment_id', String(paymentId));
		form.append('reason', reason);

		const res = await fetch('?/revert', {
			method: 'POST',
			body: form
		});
		if (res.ok) {
			// Simple reload to reflect new states
			location.reload();
		} else {
			const data = await res.json().catch(() => ({}));
			alert(data?.error || 'Failed to revert payment');
		}
	}

	function getStatusVariant(status: string): 'default' | 'destructive' | 'outline' | 'secondary' {
		switch (status) {
			case 'PAID':
				return 'default';
			case 'PENDING':
				return 'secondary';
			case 'PARTIAL':
				return 'outline';
			case 'OVERDUE':
				return 'destructive';
			default:
				return 'outline';
		}
	}
</script>

<div class="space-y-4">
	{#if !showForm}
		<div class="flex justify-between items-center">
			<h1 class="text-2xl font-bold">Payments</h1>
			{#if data.isAdminLevel || data.isAccountant || data.isFrontdesk || data.isResident}
				<Button
					onclick={() => {
						showForm = true;
						selectedPayment = undefined;
					}}
				>
					Create Payment
				</Button>
			{/if}
		</div>

		{#if data.payments}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each data.payments as payment}
					<Card.Root class="cursor-pointer" onclick={() => handlePaymentClick(payment)}>
						<Card.Header>
							<Card.Title class="flex justify-between items-center">
								{payment.billing?.lease?.name ?? 'Unknown'}
								<Badge variant={getStatusVariant(payment.billing?.status)}>
									{payment.billing?.status}
								</Badge>
							</Card.Title>
							<Card.Description>
								{payment.billing?.type}
								{#if payment.billing?.utility_type}
									- {payment.billing.utility_type}
								{/if}
							</Card.Description>
						</Card.Header>
						<Card.Content>
							<div class="space-y-2">
								<div class="flex justify-between">
									<span class="text-muted-foreground">Amount:</span>
									<span class="font-medium">${payment.amount}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-muted-foreground">Method:</span>
									<span class="font-medium">{payment.method}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-muted-foreground">Date:</span>
									<span class="font-medium">
										{new Date(payment.paid_at).toLocaleDateString()}
									</span>
								</div>
								{#if payment.billing?.rental_unit}
									<div class="flex justify-between">
										<span class="text-muted-foreground">Rental_unit:</span>
										<span class="font-medium">
											{payment.billing.rental_unit.rental_unit_number}
											{#if payment.billing.rental_unit.floor}
												- Floor {payment.billing.rental_unit.floor.floor_number}
												{#if payment.billing.rental_unit.floor.wing}
													Wing {payment.billing.rental_unit.floor.wing}
												{/if}
											{/if}
										</span>
									</div>
								{/if}
							</div>
						</Card.Content>
						{#if data.isAdminLevel || data.isAccountant}
							<div class="flex gap-2 p-4 pt-0">
								<Button variant="outline" onclick={(e) => { e.stopPropagation(); handlePaymentClick(payment); }}>Edit</Button>
								<Button variant="destructive" onclick={(e) => { e.stopPropagation(); revertPayment(payment.id as unknown as number); }}>Revert</Button>
							</div>
						{/if}
					</Card.Root>
				{/each}
			</div>
		{:else}
			<div class="text-center py-8 text-muted-foreground">No payments found</div>
		{/if}
	{:else}
		<div class="flex justify-between items-center">
			<h1 class="text-2xl font-bold">{selectedPayment ? 'Edit' : 'Create'} Payment</h1>
			<Button
				variant="outline"
				onclick={() => {
					showForm = false;
					selectedPayment = undefined;
				}}
			>
				Cancel
			</Button>
		</div>

		<PaymentForm
			{data}
			billings={data.billings ?? []}
			editMode={!!selectedPayment}
			payment={selectedPayment}
			on:paymentAdded={handlePaymentAdded}
		/>
	{/if}
</div>

{#if !data.isAdminLevel && !data.isAccountant && !data.isFrontdesk && !data.isResident}
	<div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
		<p class="text-yellow-800">
			You are viewing this page in read-only mode. Contact an administrator if you need to make
			changes.
		</p>
	</div>
{/if}

<!-- Transaction Modal for Editing Payments -->
{#if showTransactionModal && selectedPayment}
	<TransactionFormModal
		open={showTransactionModal}
		data={data}
		editMode={true}
		transaction={selectedPayment}
		on:close={handleTransactionModalClose}
		on:cancel={handleTransactionModalClose}
	/>
{/if}
