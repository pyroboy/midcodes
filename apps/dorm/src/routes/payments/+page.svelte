<script lang="ts">
	import PaymentForm from './PaymentForm.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import type { PageData } from './$types';
	import type { z } from 'zod/v3';
	import { paymentSchema } from './formSchema';
	import {
		paymentsStore,
		billingsStore,
		leasesStore,
		rentalUnitsStore,
		floorsStore,
		propertiesStore
	} from '$lib/stores/collections.svelte';

	type Payment = z.infer<typeof paymentSchema> & {
		billing?: {
			id: number;
			type: string;
			utility_type?: string;
			status?: string;
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

	// ─── RxDB reactive stores (singletons from collections.svelte.ts) ──

	// Enriched payments with billing info (sorted by updated_at desc)
	let payments = $derived.by(() => {
		const sortedPayments = [...paymentsStore.value].sort((a: any, b: any) => {
			const aMs = a.updated_at ? new Date(a.updated_at).getTime() : 0;
			const bMs = b.updated_at ? new Date(b.updated_at).getTime() : 0;
			return bMs - aMs;
		});
		return sortedPayments.map((payment: any) => {
			const billingIds = Array.isArray(payment.billing_ids) ? payment.billing_ids : [];
			const primaryBillingId = billingIds[0];
			const primaryBilling = primaryBillingId
				? billingsStore.value.find((b: any) => String(b.id) === String(primaryBillingId))
				: null;

			let billing = null;
			if (primaryBilling) {
				const lease = leasesStore.value.find((l: any) => String(l.id) === String(primaryBilling.lease_id));
				const unit = lease ? rentalUnitsStore.value.find((u: any) => String(u.id) === String(lease.rental_unit_id)) : null;
				const floor = unit ? floorsStore.value.find((f: any) => String(f.id) === String(unit.floor_id)) : null;
				const property = floor ? propertiesStore.value.find((p: any) => String(p.id) === String(floor.property_id)) : null;

				billing = {
					id: Number(primaryBilling.id),
					type: primaryBilling.type,
					utility_type: primaryBilling.utility_type,
					status: primaryBilling.status,
					lease: lease ? {
						id: Number(lease.id),
						name: lease.name,
						rental_unit: unit ? {
							id: Number(unit.id),
							rental_unit_number: unit.number,
							floor: floor ? {
								floor_number: floor.floor_number,
								wing: floor.wing,
								property: property ? { name: property.name } : undefined
							} : undefined
						} : undefined
					} : null
				};
			}

			return {
				...payment,
				id: Number(payment.id),
				amount: parseFloat(payment.amount) || 0,
				billing
			} as Payment;
		});
	});

	// Unpaid billings for the payment form
	let billings = $derived.by(() => {
		return billingsStore.value
			.filter((b: any) => ['PENDING', 'PARTIAL', 'OVERDUE'].includes(b.status))
			.map((b: any) => {
				const lease = leasesStore.value.find((l: any) => String(l.id) === String(b.lease_id));
				const unit = lease ? rentalUnitsStore.value.find((u: any) => String(u.id) === String(lease.rental_unit_id)) : null;
				const floor = unit ? floorsStore.value.find((f: any) => String(f.id) === String(unit.floor_id)) : null;
				const property = floor ? propertiesStore.value.find((p: any) => String(p.id) === String(floor.property_id)) : null;
				return {
					...b,
					id: Number(b.id),
					amount: parseFloat(b.amount) || 0,
					paidAmount: parseFloat(b.paid_amount) || 0,
					balance: parseFloat(b.balance) || 0,
					lease: lease ? {
						id: Number(lease.id),
						name: lease.name,
						rental_unit: unit ? {
							id: Number(unit.id),
							rental_unit_number: unit.number,
							floor: floor ? {
								floor_number: floor.floor_number,
								wing: floor.wing,
								property: property ? { name: property.name } : undefined
							} : undefined
						} : undefined
					} : null
				};
			})
			.sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
	});

	// Role flags come from server data (not RxDB)
	let { userRole, isAdminLevel, isAccountant, isFrontdesk, isResident } = $derived(data);
	let isLoading = $derived(!paymentsStore.initialized);

	let showForm = $state(false);
	let selectedPayment: Payment | undefined = $state(undefined);

	function handlePaymentAdded() {
		showForm = false;
		selectedPayment = undefined;
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
			{#if isAdminLevel || isAccountant || isFrontdesk || isResident}
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

		{#if isLoading}
			<!-- Skeleton loaders -->
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each Array(6) as _, i (i)}
					<Card.Root>
						<Card.Header>
							<Skeleton class="h-6 w-32 mb-2" />
							<Skeleton class="h-4 w-24" />
						</Card.Header>
						<Card.Content>
							<div class="space-y-2">
								<div class="flex justify-between">
									<Skeleton class="h-4 w-16" />
									<Skeleton class="h-4 w-20" />
								</div>
								<div class="flex justify-between">
									<Skeleton class="h-4 w-16" />
									<Skeleton class="h-4 w-20" />
								</div>
								<div class="flex justify-between">
									<Skeleton class="h-4 w-16" />
									<Skeleton class="h-4 w-24" />
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{:else if payments && payments.length > 0}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each payments as payment}
					<Card.Root>
						<Card.Header>
							<Card.Title class="flex justify-between items-center">
								{payment.billing?.lease?.name ?? 'Unknown'}
								<Badge variant={getStatusVariant(payment.billing?.status ?? '')}>
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
								{#if payment.billing?.lease?.rental_unit}
									<div class="flex justify-between">
										<span class="text-muted-foreground">Rental_unit:</span>
										<span class="font-medium">
											{payment.billing.lease.rental_unit.rental_unit_number}
											{#if payment.billing.lease.rental_unit.floor}
												- Floor {payment.billing.lease.rental_unit.floor.floor_number}
												{#if payment.billing.lease.rental_unit.floor.wing}
													Wing {payment.billing.lease.rental_unit.floor.wing}
												{/if}
											{/if}
										</span>
									</div>
								{/if}
							</div>
						</Card.Content>
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
			billings={billings ?? []}
			editMode={!!selectedPayment}
			payment={selectedPayment}
			on:paymentAdded={handlePaymentAdded}
		/>
	{/if}
</div>

{#if !isAdminLevel && !isAccountant && !isFrontdesk && !isResident}
	<div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
		<p class="text-yellow-800">
			You are viewing this page in read-only mode. Contact an administrator if you need to make
			changes.
		</p>
	</div>
{/if}
