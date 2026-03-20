<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Pencil } from 'lucide-svelte';
	import type { Lease } from '$lib/types/lease';
	import { resyncCollection } from '$lib/db/replication';
	import { formatLeaseStatus } from '$lib/utils/format';
	import LeaseOverviewTab from './LeaseOverviewTab.svelte';
	import LeaseBillingTab from './LeaseBillingTab.svelte';
	import LeaseHistoryTab from './LeaseHistoryTab.svelte';

	interface Props {
		lease: Lease;
		open: boolean;
		onOpenChange: (open: boolean) => void;
		tenants?: any[];
	}

	let { lease, open, onOpenChange, tenants = [] }: Props = $props();

	let isEditingName = $state(false);
	let editedName = $state('');

	// Computed values for header stats - only calculate when modal is open
	let overdueBillings = $derived.by(() => {
		if (!open) return [];
		const today = new Date();
		return (lease.billings || []).filter((billing) => {
			const dueDate = new Date(billing.due_date);
			const totalDue = billing.amount + (billing.penalty_amount || 0);
			const isFullyPaid = billing.paid_amount >= totalDue;
			return !isFullyPaid && dueDate < today;
		});
	});

	let paymentStats = $derived.by(() => {
		if (!open) return { totalBillings: 0, paidBillings: 0 };
		const billings = lease.billings || [];
		const totalBillings = billings.length;
		const paidBillings = billings.filter((b) => {
			const totalDue = b.amount + (b.penalty_amount || 0);
			return b.paid_amount >= totalDue;
		}).length;

		return {
			totalBillings,
			paidBillings
		};
	});

	function handleLeaseNameDoubleClick() {
		isEditingName = true;
		editedName = lease.name || `Lease #${lease.id}`;
	}

	async function handleNameSubmit() {
		try {
			const formData = new FormData();
			formData.append('id', lease.id.toString());
			formData.append('name', editedName);

			const response = await fetch('?/updateName', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error('Failed to update lease name');
			}
			lease.name = editedName;
			isEditingName = false;
			await resyncCollection('leases');
		} catch (error) {
			console.error('Error updating lease name:', error);
			isEditingName = false;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleNameSubmit();
		} else if (event.key === 'Escape') {
			isEditingName = false;
		}
	}

	async function handleModalClose() {
		onOpenChange(false);
		// Remove the invalidateAll call here as it's not necessary for just closing the modal
		// and can cause performance issues
	}

</script>

<Dialog.Root {open} {onOpenChange}>
	<Dialog.Content class="max-w-5xl max-h-[95vh] overflow-hidden p-0 bg-white">
		<!-- Header -->
		<div class="bg-white border-b border-gray-200 p-6">
			<div class="flex items-start justify-between">
				<div class="flex-1">
					{#if isEditingName}
						<Input
							type="text"
							bind:value={editedName}
							class="text-2xl font-bold bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
							onblur={handleNameSubmit}
							onkeydown={handleKeyDown}
							autofocus
						/>
					{:else}
						<div class="group flex items-center gap-3">
							<button
								class="text-2xl font-bold cursor-pointer hover:text-gray-600 transition-colors bg-transparent border-none p-0 text-left text-gray-900"
								ondblclick={handleLeaseNameDoubleClick}
							>
								{lease.name || `Lease #${lease.id}`}
							</button>
							<button
								class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-gray-100 rounded-lg"
								onclick={(e) => {
									e.stopPropagation();
									handleLeaseNameDoubleClick();
								}}
							>
								<Pencil class="w-4 h-4 text-gray-500" />
							</button>
						</div>
					{/if}

					<div class="flex items-center gap-4 mt-3">
						<div class="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-md">
							{formatLeaseStatus(lease.status?.toString() || '')}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Content -->
		<div class="overflow-y-auto h-[calc(95vh-200px)] p-6">
			{#if open}
				<!-- Top Row: Overview (Left) and Billing (Right) -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
					<!-- Overview Column -->

					<div class="bg-gray-50 rounded-lg p-4">
						<LeaseOverviewTab {lease} {tenants} />
					</div>

					<!-- Billing Column -->
					<div class="space-y-4">
						{#if overdueBillings.length > 0}
							<div class="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
								<span class="bg-red-600 text-white text-xs font-medium px-1.5 py-0.5 rounded-full">
									{overdueBillings.length}
								</span>
								<span class="text-sm text-red-700 font-medium">
									overdue {overdueBillings.length === 1 ? 'billing' : 'billings'}
								</span>
							</div>
						{/if}
						<div class="bg-gray-50 rounded-lg p-4">
							<LeaseBillingTab {lease} />
						</div>
					</div>
				</div>

				<!-- Bottom Row: History (Full Width) -->

				<div class="bg-gray-50 rounded-lg p-4">
					<LeaseHistoryTab {lease} />
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
