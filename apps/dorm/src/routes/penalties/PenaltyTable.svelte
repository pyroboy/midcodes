<script lang="ts">
	import {
		Table,
		TableBody,
		TableCaption,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import type { PenaltyBilling } from './types';

	let { penalties, onPenaltyClick } = $props<{
		penalties: PenaltyBilling[];
		onPenaltyClick: (penalty: PenaltyBilling) => void;
	}>();

	// Function to determine the status of a billing
	function getBillingStatus(penalty: PenaltyBilling): { status: string; color: string } {
		const now = new Date();
		const dueDate = new Date(penalty.due_date);

		// If it has a penalty amount, it's already penalized
		if (penalty.penalty_amount > 0) {
			return { status: 'Penalized', color: 'bg-red-100 text-red-800' };
		}

		// If it's overdue
		if (dueDate < now) {
			return { status: 'Overdue', color: 'bg-red-100 text-red-800' };
		}

		// If due date is within 3 days
		const threeDaysFromNow = new Date();
		threeDaysFromNow.setDate(now.getDate() + 3);
		if (dueDate <= threeDaysFromNow) {
			return { status: 'Due Soon', color: 'bg-yellow-100 text-yellow-800' };
		}

		// Otherwise it's just a normal billing
		return { status: 'Upcoming', color: 'bg-green-100 text-green-800' };
	}

	// Function to get payment status
	function getPaymentStatus(penalty: PenaltyBilling): { status: string; color: string } {
		if (penalty.paid_amount >= penalty.amount + penalty.penalty_amount) {
			return { status: 'Paid', color: 'bg-green-100 text-green-800' };
		}

		if (penalty.paid_amount > 0) {
			return { status: 'Partial', color: 'bg-yellow-100 text-yellow-800' };
		}

		return { status: 'Unpaid', color: 'bg-red-100 text-red-800' };
	}

	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-PH', {
			style: 'currency',
			currency: 'PHP'
		}).format(amount);
	}

	// Format date
	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="w-full">
	<Table>
		<TableCaption>List of billings with penalty status</TableCaption>
		<TableHeader>
			<TableRow>
				<TableHead>Lease</TableHead>
				<TableHead>Tenant(s)</TableHead>
				<TableHead>Billing Date</TableHead>
				<TableHead>Due Date</TableHead>
				<TableHead>Amount</TableHead>
				<TableHead>Penalty</TableHead>
				<TableHead>Status</TableHead>
				<TableHead>Payment</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#if penalties && penalties.length > 0}
				{#each penalties as penalty}
					<TableRow onclick={() => onPenaltyClick(penalty)} class="cursor-pointer hover:bg-gray-50">
						<TableCell class="font-medium">
							{#if penalty.lease?.name}
								{penalty.lease.name}
							{:else}
								<span class="text-gray-400">N/A</span>
							{/if}
						</TableCell>
						<TableCell>
							{#if penalty.lease?.lease_tenants && penalty.lease.lease_tenants.length > 0}
								<div class="flex flex-col space-y-1">
									{#each penalty.lease.lease_tenants as leaseTenant, i}
										{#if i < 2 && leaseTenant.tenants}
											<span>{leaseTenant.tenants.name}</span>
										{:else if i === 2}
											<span class="text-sm text-gray-500"
												>+{penalty.lease.lease_tenants.length - 2} more</span
											>
										{/if}
									{/each}
								</div>
							{:else}
								<span class="text-gray-400">No tenants</span>
							{/if}
						</TableCell>
						<TableCell>{formatDate(penalty.billing_date)}</TableCell>
						<TableCell>{formatDate(penalty.due_date)}</TableCell>
						<TableCell>{formatCurrency(penalty.amount)}</TableCell>
						<TableCell>
							{#if penalty.penalty_amount > 0}
								<span class="font-medium text-red-600"
									>{formatCurrency(penalty.penalty_amount)}</span
								>
							{:else}
								<span class="text-gray-400">-</span>
							{/if}
						</TableCell>
						<TableCell>
							{#if penalty}
								{@const status = getBillingStatus(penalty)}
								<Badge class={status.color}>{status.status}</Badge>
							{/if}
						</TableCell>
						<TableCell>
							{#if penalty}
								{@const paymentStatus = getPaymentStatus(penalty)}
								<Badge class={paymentStatus.color}>{paymentStatus.status}</Badge>
							{/if}
						</TableCell>
					</TableRow>
				{/each}
			{:else}
				<TableRow>
					<TableCell colspan={8} class="text-center py-8 text-gray-500">
						No penalty billings found
					</TableCell>
				</TableRow>
			{/if}
		</TableBody>
	</Table>
</div>
