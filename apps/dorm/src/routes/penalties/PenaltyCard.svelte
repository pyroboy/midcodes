<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { formatCurrency } from '$lib/utils/format';
	import type { PenaltyBilling } from './types';

	let { penalty, onClose, onUpdate } = $props<{
		penalty: PenaltyBilling;
		onClose: () => void;
		onUpdate: (penalty: PenaltyBilling) => void;
	}>();

	function getStatusColor(status: string): string {
		switch (status) {
			case 'PAID':
				return 'bg-green-100 text-green-800';
			case 'PARTIAL':
				return 'bg-blue-100 text-blue-800';
			case 'PENDING':
				return 'bg-yellow-100 text-yellow-800';
			case 'OVERDUE':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getFormattedType(type: string, utilityType: string | null): string {
		if (type === 'UTILITY' && utilityType) {
			return `${type} (${utilityType})`;
		}
		return type;
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<Card class="w-full">
	<CardHeader class="flex flex-row items-start justify-between space-y-0">
		<div>
			<CardTitle class="text-xl">Penalty Details</CardTitle>
			<CardDescription>
				Billing ID: {penalty.id}
			</CardDescription>
		</div>
		<Button variant="outline" onclick={onClose}>Back to List</Button>
	</CardHeader>
	<CardContent>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Billing Information -->
			<div class="space-y-4">
				<h3 class="font-semibold text-lg">Billing Information</h3>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<p class="text-sm text-gray-500">Billing Type</p>
						<p>{getFormattedType(penalty.type, penalty.utility_type)}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">Status</p>
						<Badge variant="outline" class={getStatusColor(penalty.status)}>
							{penalty.status}
						</Badge>
					</div>
					<div>
						<p class="text-sm text-gray-500">Billing Date</p>
						<p>{formatDate(penalty.billing_date)}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">Due Date</p>
						<p>{formatDate(penalty.due_date)}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">Original Amount</p>
						<p>{formatCurrency(penalty.amount)}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">Penalty Amount</p>
						<p class="font-semibold text-red-600">{formatCurrency(penalty.penalty_amount)}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">Paid Amount</p>
						<p>{formatCurrency(penalty.paid_amount)}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">Remaining Balance</p>
						<p class="font-semibold">{formatCurrency(penalty.balance)}</p>
					</div>
				</div>

				{#if penalty.notes}
					<div>
						<p class="text-sm text-gray-500">Notes</p>
						<p class="mt-1 whitespace-pre-wrap">{penalty.notes}</p>
					</div>
				{/if}
			</div>

			<!-- Lease Information -->
			<div class="space-y-4">
				<h3 class="font-semibold text-lg">Lease Information</h3>

				{#if penalty.lease}
					<div class="grid grid-cols-2 gap-4">
						<div>
							<p class="text-sm text-gray-500">Lease Name</p>
							<p>{penalty.lease.name || 'N/A'}</p>
						</div>
						<div>
							<p class="text-sm text-gray-500">Lease ID</p>
							<p>{penalty.lease.id}</p>
						</div>

						{#if penalty.lease.rental_unit}
							<div>
								<p class="text-sm text-gray-500">Property</p>
								<p>{penalty.lease.rental_unit.properties?.name || 'N/A'}</p>
							</div>
							<div>
								<p class="text-sm text-gray-500">Unit</p>
								<p>
									{#if penalty.lease.rental_unit.floors}
										Floor {penalty.lease.rental_unit.floors.floor_number}
										{#if penalty.lease.rental_unit.floors.wing}
											Wing {penalty.lease.rental_unit.floors.wing}
										{/if}
									{/if}
									{penalty.lease.rental_unit.name} (Unit {penalty.lease.rental_unit.number})
								</p>
							</div>
						{/if}
					</div>

					{#if penalty.lease.lease_tenants && penalty.lease.lease_tenants.length > 0}
						<div>
							<p class="text-sm text-gray-500 mb-2">Tenants</p>
							<div class="space-y-2">
								{#each penalty.lease.lease_tenants as leaseTenant}
									{#if leaseTenant.tenants}
										<div class="p-3 bg-gray-50 rounded-md">
											<p class="font-medium">{leaseTenant.tenants.name}</p>
											<div class="grid grid-cols-2 gap-2 mt-1 text-sm">
												{#if leaseTenant.tenants.email}
													<p>{leaseTenant.tenants.email}</p>
												{/if}
												{#if leaseTenant.tenants.contact_number}
													<p>{leaseTenant.tenants.contact_number}</p>
												{/if}
											</div>
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{:else}
						<p>No tenant information available</p>
					{/if}
				{:else}
					<p>No lease information available</p>
				{/if}
			</div>
		</div>

		<div class="mt-6">
			<h3 class="font-semibold text-lg mb-2">Activity Timeline</h3>
			<div class="border-l-2 border-gray-200 pl-4 space-y-4">
				<div class="relative">
					<div class="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-green-500"></div>
					<p class="text-sm text-gray-500">{formatDate(penalty.created_at)}</p>
					<p>Penalty created</p>
				</div>
				{#if penalty.updated_at}
					<div class="relative">
						<div class="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-blue-500"></div>
						<p class="text-sm text-gray-500">{formatDate(penalty.updated_at)}</p>
						<p>Penalty updated</p>
					</div>
				{/if}
			</div>
		</div>
	</CardContent>
	<CardFooter>
		<Button onclick={() => onUpdate(penalty)} class="w-full">Update Penalty Amount</Button>
	</CardFooter>
</Card>
