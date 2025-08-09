<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import Button from '$lib/components/ui/button/button.svelte';
	import PaymentModal from './PaymentModal.svelte';
	import RentManagerModal from './RentManagerModal.svelte';
	import SecurityDepositModal from './SecurityDepositModal.svelte';
	import LeaseFormModal from './LeaseFormModal.svelte';
	import LeaseDetailsModal from './LeaseDetailsModal.svelte';
	import { invalidateAll } from '$app/navigation';
	import { createEventDispatcher } from 'svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Popover from '$lib/components/ui/popover';
	import { leaseStatusEnum } from './formSchema';
	import {
		Pencil,
		Trash2,
		CreditCard,
		Home,
		Shield,
		ChevronDown,
		DollarSign,
		AlertTriangle,
		Printer,
		AlertCircle,
		Clock,
		CheckCircle,
		MoreVertical
	} from 'lucide-svelte';
	import type { Lease, Billing } from '$lib/types/lease';
	import { printLeaseInvoice } from '$lib/utils/print';
	import { getLeaseDisplayStatus } from '$lib/utils/lease-status';
	import { formatCurrency, formatDate } from '$lib/utils/format';

	interface Props {
		lease: Lease & { balanceStatus?: any };
		tenants?: any[];
		rentalUnits?: any[];
		onLeaseClick: (lease: Lease) => void;
		onDelete: (event: Event, lease: Lease) => void;
		onStatusChange: (id: string, status: string) => void;
		onDataChange?: () => Promise<void>;
	}

	let {
		lease,
		tenants = [],
		rentalUnits = [],
		onLeaseClick,
		onDelete,
		onStatusChange,
		onDataChange
	}: Props = $props();

	import { getStatusVariant } from '$lib/utils/format';
	import { onMount } from 'svelte';

	let showPaymentModal = $state(false);
	let showRentManager = $state(false);
	let showSecurityDepositManager = $state(false);
	let showEditModal = $state(false);
	let showDetailsModal = $state(false);
	let showActionsPopover = $state(false);
	let isMobile = $state(false);

	// Mobile detection and scroll handling
	onMount(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth < 768;
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		// Close popover on scroll when on mobile
		const handleScroll = () => {
			if (isMobile && showActionsPopover) {
				showActionsPopover = false;
			}
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		document.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			window.removeEventListener('resize', checkMobile);
			window.removeEventListener('scroll', handleScroll);
			document.removeEventListener('scroll', handleScroll);
		};
	});

	async function handlePaymentModalClose() {
		showPaymentModal = false;
		// Only invalidate if payment was actually made
		// await invalidateAll();
	}
	async function handleRentManagerClose() {
		showRentManager = false;
		// Only invalidate if changes were actually made
		// await invalidateAll();
	}
	async function handleSecurityDepositManagerClose() {
		showSecurityDepositManager = false;
		// Only invalidate if changes were actually made
		// await invalidateAll();
	}

	async function handleEditModalClose() {
		showEditModal = false;
		// Only invalidate if changes were actually made
		// await invalidateAll();
	}

	async function handleDetailsModalClose() {
		showDetailsModal = false;
		// No need to invalidate for just viewing details
		// await invalidateAll();
	}

	const dispatch = createEventDispatcher<{
		delete: { id: string };
		statusChange: { id: string; status: string };
	}>();

	// Calculate total penalty only for unpaid billings
	let totalPenalty = $derived.by(() => {
		return (
			lease.billings?.reduce((acc, b) => {
				const totalDue = b.amount + (b.penalty_amount || 0);
				const isFullyPaid = b.paid_amount >= totalDue;
				// Only include penalty if billing is not fully paid
				return acc + (isFullyPaid ? 0 : b.penalty_amount || 0);
			}, 0) || 0
		);
	});

	// Get the most recent billing date when all billings are paid
	let lastPaidDate = $derived.by(() => {
		if (!lease.billings || lease.billings.length === 0) return null;

		// Check if all billings are fully paid
		const allPaid = lease.billings.every((b) => {
			const totalDue = b.amount + (b.penalty_amount || 0);
			return b.paid_amount >= totalDue;
		});

		if (!allPaid) return null;

		// Find the most recent billing date from fully paid billings
		const paidBillings = lease.billings
			.filter((b) => {
				const totalDue = b.amount + (b.penalty_amount || 0);
				return b.paid_amount >= totalDue;
			})
			.map((b) => new Date(b.billing_date))
			.sort((a, b) => b.getTime() - a.getTime());

		return paidBillings.length > 0 ? paidBillings[0] : null;
	});

	async function handleStatusChange(newStatus: string) {
		try {
			const formData = new FormData();
			formData.append('id', lease.id.toString());
			formData.append('status', newStatus);

			const response = await fetch('?/updateStatus', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.status === 200) {
				onStatusChange(lease.id.toString(), newStatus);
				if (onDataChange) {
					await onDataChange();
				} else {
					await invalidateAll();
				}
			} else {
				throw new Error(result.message || 'Failed to update status');
			}
		} catch (error) {
			console.error('Error updating lease status:', error);
			alert(
				'Failed to update status: ' + (error instanceof Error ? error.message : 'Unknown error')
			);
		}
	}
</script>
<Card.Root
	class="group hover:shadow-lg transition-all duration-300 w-full border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-xl overflow-hidden cursor-pointer"
	onclick={() => (showDetailsModal = true)}
>
	<Card.Content
		class="py-2 px-4 sm:px-6 border-t border-b border-slate-200/40 hover:bg-slate-50/50 transition-colors duration-200"
	>
		<!-- Mobile Layout: 3 Rows -->
		<div class="lg:hidden flex flex-col gap-0.5">
			<!-- Row 1: Lease Name (left) and Balance Amount (right) -->
			<div class="flex items-center justify-between">
				<!-- Lease Name -->
				<div class="flex-1 min-w-0">
					<span class="text-sm sm:text-base font-bold truncate text-slate-800 transition-colors leading-tight block">
						{lease.name || `Lease #${lease.id}`}
					</span>
				</div>
				
				<!-- Balance Amount -->
				<div class="flex-shrink-0">
					{#if !lease.billings || lease.billings.length === 0}
						<div class="text-sm italic text-slate-400 font-light">No Billings Yet</div>
					{:else if lease.balanceStatus}
						<div class="text-sm text-slate-600 text-right">
							{#if lease.balanceStatus.overdueBalance > 0}
								<span class="text-red-600">₱{lease.balanceStatus.overdueBalance.toLocaleString()}</span>
							{:else if lease.balanceStatus.partialBalance > 0}
								<span class="text-amber-600">₱{lease.balanceStatus.partialBalance.toLocaleString()}</span>
							{:else if lease.balanceStatus.pendingBalance > 0}
								<span class="text-orange-600">₱{lease.balanceStatus.pendingBalance.toLocaleString()}</span>
							{:else}
								<span class="text-green-600">Paid</span>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<!-- Row 2: Profile Pictures (left) and Balance Status/Dates (right) -->
			<div class="flex items-center justify-between">
				<!-- Profile Pictures -->
				<div class="flex-shrink-0">
					{#if lease.lease_tenants && lease.lease_tenants.length > 0}
						<div class="flex items-center">
							{#each lease.lease_tenants.slice(0, 3) as leaseTenant, index}
								{@const tenantData = leaseTenant}
								{@const matchedTenant = tenants.find((t) => t.name === tenantData.name)}
								{@const profileUrl =
									(tenantData as any).profile_picture_url || matchedTenant?.profile_picture_url}
								<div
									class="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-sm flex-shrink-0 {index > 0 ? '-ml-2 sm:-ml-2.5' : ''}"
									style="z-index: {lease.lease_tenants.length - index}"
								>
									{#if profileUrl}
										<img
											src={profileUrl}
											alt="{tenantData.name}'s profile picture"
											class="w-full h-full rounded-full object-cover"
										/>
									{:else}
										<div
											class="w-full h-full bg-slate-100 rounded-full flex items-center justify-center"
										>
											<span class="text-slate-600 font-medium text-xs">
												{tenantData.name
													.split(' ')
													.map((n) => n[0])
													.join('')
													.toUpperCase()}
											</span>
										</div>
									{/if}
								</div>
							{/each}
							{#if lease.lease_tenants.length > 3}
								<div
									class="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-sm flex-shrink-0 bg-slate-200 flex items-center justify-center -ml-2 sm:-ml-2.5"
									style="z-index: 0"
								>
									<span class="text-slate-600 font-medium text-xs">
										+{lease.lease_tenants.length - 3}
									</span>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Balance Status/Dates -->
				<div class="flex-1 min-w-0 text-right">
					{#if lease.billings && lease.billings.length > 0 && lease.balanceStatus}
						<!-- Status Context -->
						{#if lease.balanceStatus.hasOverdue}
							<div class="text-xs text-red-600">
								{lease.balanceStatus.daysOverdue} days overdue
							</div>
						{:else if lease.balanceStatus.hasPending && lease.balanceStatus.nextDueDate}
							<div class="text-xs text-orange-600">
								Due: {formatDate(lease.balanceStatus.nextDueDate)}
							</div>
						{:else if lease.balanceStatus.overdueBalance === 0 && lease.balanceStatus.partialBalance === 0 && lease.balanceStatus.pendingBalance === 0 && lastPaidDate}
							<div class="text-xs text-slate-500">
								Last billing: {formatDate(lastPaidDate.toISOString())}
							</div>
						{/if}

						{#if totalPenalty > 0}
							<div class="text-xs text-red-500 mt-0.5">
								+{formatCurrency(totalPenalty)} penalty
							</div>
						{/if}
					{/if}
				</div>
			</div>
		</div>

		<!-- Desktop Layout: Single Row -->
		<div class="hidden lg:flex lg:items-center w-full gap-4">
			<!-- Name -->
			<div class="flex-shrink-0 min-w-0 w-48">
				<span class="text-base font-bold truncate text-slate-800 transition-colors leading-tight block">
					{lease.name || `Lease #${lease.id}`}
				</span>
			</div>

			<!-- Profile Pictures -->
			<div class="flex-shrink-0">
				{#if lease.lease_tenants && lease.lease_tenants.length > 0}
					<div class="flex items-center">
						{#each lease.lease_tenants.slice(0, 3) as leaseTenant, index}
							{@const tenantData = leaseTenant}
							{@const matchedTenant = tenants.find((t) => t.name === tenantData.name)}
							{@const profileUrl =
								(tenantData as any).profile_picture_url || matchedTenant?.profile_picture_url}
							<div
								class="w-10 h-10 rounded-full border-2 border-white shadow-sm flex-shrink-0 {index > 0 ? '-ml-2.5' : ''}"
								style="z-index: {lease.lease_tenants.length - index}"
							>
								{#if profileUrl}
									<img
										src={profileUrl}
										alt="{tenantData.name}'s profile picture"
										class="w-full h-full rounded-full object-cover"
									/>
								{:else}
									<div
										class="w-full h-full bg-slate-100 rounded-full flex items-center justify-center"
									>
										<span class="text-slate-600 font-medium text-xs">
											{tenantData.name
												.split(' ')
												.map((n) => n[0])
												.join('')
												.toUpperCase()}
										</span>
									</div>
								{/if}
							</div>
						{/each}
						{#if lease.lease_tenants.length > 3}
							<div
								class="w-10 h-10 rounded-full border-2 border-white shadow-sm flex-shrink-0 bg-slate-200 flex items-center justify-center -ml-2.5"
								style="z-index: 0"
							>
								<span class="text-slate-600 font-medium text-xs">
									+{lease.lease_tenants.length - 3}
								</span>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Balance Display -->
			<div class="flex-1 min-w-0 text-center">
				{#if !lease.billings || lease.billings.length === 0}
					<div class="text-sm italic text-slate-400 font-light">No Billings Yet</div>
				{:else if lease.balanceStatus}
					<div class="text-base text-slate-600">
						{#if lease.balanceStatus.overdueBalance > 0}
							<span class="text-red-600">₱{lease.balanceStatus.overdueBalance.toLocaleString()}</span>
						{:else if lease.balanceStatus.partialBalance > 0}
							<span class="text-amber-600">₱{lease.balanceStatus.partialBalance.toLocaleString()}</span>
						{:else if lease.balanceStatus.pendingBalance > 0}
							<span class="text-orange-600">₱{lease.balanceStatus.pendingBalance.toLocaleString()}</span>
						{:else}
							<span class="text-green-600">Paid</span>
						{/if}
					</div>
					<!-- Status Context -->
					{#if lease.balanceStatus.hasOverdue}
						<div class="text-xs text-red-600">
							{lease.balanceStatus.daysOverdue} days overdue
						</div>
					{:else if lease.balanceStatus.hasPending && lease.balanceStatus.nextDueDate}
						<div class="text-xs text-orange-600">
							Due: {formatDate(lease.balanceStatus.nextDueDate)}
						</div>
					{:else if lease.balanceStatus.overdueBalance === 0 && lease.balanceStatus.partialBalance === 0 && lease.balanceStatus.pendingBalance === 0 && lastPaidDate}
						<div class="text-xs text-slate-500">
							Last: {formatDate(lastPaidDate.toISOString())}
						</div>
					{/if}
					{#if totalPenalty > 0}
						<div class="text-xs text-red-500">
							+{formatCurrency(totalPenalty)} penalty
						</div>
					{/if}
				{/if}
			</div>

			<!-- Status Dropdown -->
			<div class="flex-shrink-0">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<div
							class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm cursor-pointer hover:bg-slate-200 active:bg-slate-300 transition-colors font-medium text-nowrap touch-manipulation h-9"
						>
							{lease.status?.toString() || 'INACTIVE'}
							<ChevronDown class="w-3 h-3" />
						</div>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-44">
						<DropdownMenu.Group>
							<DropdownMenu.GroupHeading class="px-3 py-2 text-xs font-semibold">
								Change Status
							</DropdownMenu.GroupHeading>
							<DropdownMenu.Separator class="my-1" />
							<DropdownMenu.RadioGroup value={lease.status}>
								{#each leaseStatusEnum.options as status}
									<DropdownMenu.RadioItem
										value={status}
										onSelect={() => handleStatusChange(status)}
										class="px-3 py-2 text-sm"
									>
										{status}
									</DropdownMenu.RadioItem>
								{/each}
							</DropdownMenu.RadioGroup>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>

			<!-- Action Buttons -->
			<div class="flex items-center gap-2 flex-shrink-0">
				<!-- Three-dots Popover -->
				<Popover.Root bind:open={showActionsPopover}>
					<Popover.Trigger
						class="h-9 w-9 hover:bg-slate-50 hover:text-slate-600 transition-colors rounded-md flex items-center justify-center border border-slate-200 hover:border-slate-300"
						onclick={(e) => {
							e.stopPropagation();
						}}
					>
						<MoreVertical class="w-4 h-4" />
					</Popover.Trigger>
					<Popover.Content 
						class="w-auto p-3" 
						side="top" 
						align="center"
						sideOffset={8}
					>
						<div class="flex items-center gap-2 justify-center">
							<!-- Edit Button -->
							<div class="group/tooltip">
								<Button
									size="icon"
									variant="ghost"
									onclick={(e) => {
										e.stopPropagation();
										showActionsPopover = false;
										showEditModal = true;
									}}
									class="h-10 w-10 hover:bg-blue-50 hover:text-blue-600 transition-colors group/edit relative flex-shrink-0"
								>
									<Pencil
										class="w-4 h-4 group-hover/edit:scale-110 transition-transform"
									/>
									<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
										Edit Lease
									</div>
								</Button>
							</div>

							<!-- Rent Manager Button -->
							<div class="group/tooltip">
								<Button
									size="icon"
									variant="ghost"
									onclick={(e) => {
										e.stopPropagation();
										showActionsPopover = false;
										showRentManager = true;
									}}
									class="h-10 w-10 hover:bg-purple-50 hover:text-purple-600 transition-colors group/rent relative flex-shrink-0"
								>
									<Home
										class="w-4 h-4 group-hover/rent:scale-110 transition-transform"
									/>
									<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
										Modify Rents
									</div>
								</Button>
							</div>

							<!-- Security Deposit Button -->
							<div class="group/tooltip">
								<Button
									size="icon"
									variant="ghost"
									onclick={(e) => {
										e.stopPropagation();
										showActionsPopover = false;
										showSecurityDepositManager = true;
									}}
									class="h-10 w-10 hover:bg-orange-50 hover:text-orange-600 transition-colors group/security relative flex-shrink-0"
								>
									<Shield
										class="w-4 h-4 group-hover/security:scale-110 transition-transform"
									/>
									<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
										Modify Security Deposit
									</div>
								</Button>
							</div>

							<!-- Print Button -->
							<div class="group/tooltip">
								<Button
									size="icon"
									variant="ghost"
									onclick={(e) => {
										e.stopPropagation();
										showActionsPopover = false;
										printLeaseInvoice(lease);
									}}
									class="h-10 w-10 hover:bg-gray-50 hover:text-gray-600 transition-colors group/print relative flex-shrink-0"
								>
									<Printer
										class="w-4 h-4 group-hover/print:scale-110 transition-transform"
									/>
									<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
										Print Statement
									</div>
								</Button>
							</div>

							<!-- Delete Button -->
							<div class="group/tooltip">
								<Button
									size="icon"
									variant="ghost"
									onclick={(e) => {
										e.stopPropagation();
										showActionsPopover = false;
										onDelete(e, lease);
									}}
									class="h-10 w-10 hover:bg-red-50 hover:text-red-600 transition-colors group/delete relative flex-shrink-0"
								>
									<Trash2
										class="w-4 h-4 group-hover/delete:scale-110 transition-transform"
									/>
									<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
										Delete Lease
									</div>
								</Button>
							</div>
						</div>
					</Popover.Content>
				</Popover.Root>

				<!-- Make Payment Button -->
				<Button
					onclick={(e) => {
						e.stopPropagation();
						showPaymentModal = true;
					}}
					class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm font-medium transition-colors h-9"
				>
					<CreditCard class="w-4 h-4 mr-2" />
					Make Payment
				</Button>
			</div>
		</div>

		<!-- Mobile: Row 3 Status and Actions -->
		<div class="lg:hidden flex items-center justify-between gap-1.5 sm:gap-2 flex-wrap w-full mt-1">
				<!-- Status Dropdown -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<div
							class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-slate-100 text-slate-700 text-xs sm:text-sm cursor-pointer hover:bg-slate-200 active:bg-slate-300 transition-colors font-medium text-nowrap touch-manipulation h-8 sm:h-9"
						>
							{lease.status?.toString() || 'INACTIVE'}
							<ChevronDown class="w-3 h-3" />
						</div>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-44">
						<DropdownMenu.Group>
							<DropdownMenu.GroupHeading class="px-3 py-2 text-xs font-semibold">
								Change Status
							</DropdownMenu.GroupHeading>
							<DropdownMenu.Separator class="my-1" />
							<DropdownMenu.RadioGroup value={lease.status}>
								{#each leaseStatusEnum.options as status}
									<DropdownMenu.RadioItem
										value={status}
										onSelect={() => handleStatusChange(status)}
										class="px-3 py-2 text-sm"
									>
										{status}
									</DropdownMenu.RadioItem>
								{/each}
							</DropdownMenu.RadioGroup>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>

				<!-- Action Buttons Container -->
				<div class="flex items-center gap-1.5 sm:gap-2">
					<!-- Three-dots Popover with Action Buttons -->
					<Popover.Root bind:open={showActionsPopover}>
						<Popover.Trigger
							class="h-8 w-8 sm:h-9 sm:w-9 hover:bg-slate-50 hover:text-slate-600 transition-colors rounded-md flex items-center justify-center border border-slate-200 hover:border-slate-300"
							onclick={(e) => {
								e.stopPropagation();
							}}
						>
							<MoreVertical class="w-4 h-4" />
						</Popover.Trigger>
					<Popover.Content 
						class="w-auto p-3 max-md:fixed max-md:left-1/2 max-md:-translate-x-1/2 max-md:top-1/2 max-md:-translate-y-1/2 max-md:z-50 max-md:w-fit max-md:min-w-max max-md:bg-white max-md:shadow-lg max-md:border max-md:rounded-lg" 
						side="top" 
						align="center"
						sideOffset={8}
					>
						<div class="flex items-center gap-2 justify-center max-md:gap-3">
							<!-- Edit Button -->
							<div class="group/tooltip">
								<Button
									size="icon"
									variant="ghost"
									onclick={(e) => {
										e.stopPropagation();
										showActionsPopover = false;
										showEditModal = true;
									}}
									class="h-10 w-10 max-md:h-12 max-md:w-12 hover:bg-blue-50 hover:text-blue-600 transition-colors group/edit relative flex-shrink-0"
								>
									<Pencil
										class="w-4 h-4 max-md:w-5 max-md:h-5 group-hover/edit:scale-110 transition-transform"
									/>
									<!-- Desktop-only tooltip -->
									<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 hidden md:block">
										Edit Lease
									</div>
								</Button>
							</div>

							<!-- Rent Manager Button -->
							<div class="group/tooltip">
								<Button
									size="icon"
									variant="ghost"
									onclick={(e) => {
										e.stopPropagation();
										showActionsPopover = false;
										showRentManager = true;
									}}
									class="h-10 w-10 max-md:h-12 max-md:w-12 hover:bg-purple-50 hover:text-purple-600 transition-colors group/rent relative flex-shrink-0"
								>
									<Home
										class="w-4 h-4 max-md:w-5 max-md:h-5 group-hover/rent:scale-110 transition-transform"
									/>
									<!-- Desktop-only tooltip -->
									<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 hidden md:block">
										Modify Rents
									</div>
								</Button>
							</div>

							<!-- Security Deposit Button -->
							<div class="group/tooltip">
								<Button
									size="icon"
									variant="ghost"
									onclick={(e) => {
										e.stopPropagation();
										showActionsPopover = false;
										showSecurityDepositManager = true;
									}}
									class="h-10 w-10 max-md:h-12 max-md:w-12 hover:bg-orange-50 hover:text-orange-600 transition-colors group/security relative flex-shrink-0"
								>
									<Shield
										class="w-4 h-4 max-md:w-5 max-md:h-5 group-hover/security:scale-110 transition-transform"
									/>
									<!-- Desktop-only tooltip -->
									<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 hidden md:block">
										Modify Security Deposit
									</div>
								</Button>
							</div>

							<!-- Print Button -->
							<div class="group/tooltip">
								<Button
									size="icon"
									variant="ghost"
									onclick={(e) => {
										e.stopPropagation();
										showActionsPopover = false;
										printLeaseInvoice(lease);
									}}
									class="h-10 w-10 max-md:h-12 max-md:w-12 hover:bg-gray-50 hover:text-gray-600 transition-colors group/print relative flex-shrink-0"
								>
									<Printer
										class="w-4 h-4 max-md:w-5 max-md:h-5 group-hover/print:scale-110 transition-transform"
									/>
									<!-- Desktop-only tooltip -->
									<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 hidden md:block">
										Print Statement
									</div>
								</Button>
							</div>

							<!-- Delete Button -->
							<div class="group/tooltip">
								<Button
									size="icon"
									variant="ghost"
									onclick={(e) => {
										e.stopPropagation();
										showActionsPopover = false;
										onDelete(e, lease);
									}}
									class="h-10 w-10 max-md:h-12 max-md:w-12 hover:bg-red-50 hover:text-red-600 transition-colors group/delete relative flex-shrink-0"
								>
									<Trash2
										class="w-4 h-4 max-md:w-5 max-md:h-5 group-hover/delete:scale-110 transition-transform"
									/>
									<!-- Desktop-only tooltip -->
									<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 hidden md:block">
										Delete Lease
									</div>
								</Button>
							</div>
						</div>
					</Popover.Content>
					</Popover.Root>

					<!-- Prominent Make Payment Button -->
					<Button
						onclick={(e) => {
							e.stopPropagation();
							showPaymentModal = true;
						}}
						class="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 sm:py-2 text-sm font-medium transition-colors h-8 sm:h-9"
					>
						<CreditCard class="w-4 h-4 mr-2" />
						Make Payment
					</Button>
				</div>
		</div>
	</Card.Content>
</Card.Root>

<!-- Modals remain unchanged -->
<PaymentModal
	lease={{ ...lease, id: lease.id.toString() }}
	isOpen={showPaymentModal}
	onOpenChange={handlePaymentModalClose}
	{onDataChange}
/>

{#if showRentManager}
	<RentManagerModal {lease} open={showRentManager} onOpenChange={handleRentManagerClose} {onDataChange} />
{/if}

{#if showSecurityDepositManager}
	<SecurityDepositModal
		{lease}
		open={showSecurityDepositManager}
		onOpenChange={handleSecurityDepositManagerClose}
		{onDataChange}
	/>
{/if}

{#if showEditModal}
	<LeaseFormModal
		editMode
		{lease}
		{tenants}
		{rentalUnits}
		open={showEditModal}
		onOpenChange={handleEditModalClose}
		{onDataChange}
	/>
{/if}

{#if showDetailsModal}
	<LeaseDetailsModal
		{lease}
		{tenants}
		open={showDetailsModal}
		onOpenChange={handleDetailsModalClose}
	/>
{/if}

<style>
	:global(.card) {
		border: none !important;
		margin-bottom: 0 !important;
		backdrop-filter: blur(10px);
	}
</style>