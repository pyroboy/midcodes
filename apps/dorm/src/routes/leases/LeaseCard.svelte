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
	import { formatCurrency, formatDate, formatLeaseStatus } from '$lib/utils/format';
	import { getSecurityDepositStatus } from '$lib/utils/lease';
	import { featureFlags } from '$lib/stores/featureFlags';
	import { getUtilityDisplayStatus } from '$lib/utils/lease-status';
	import { getJustPaidMap } from './just-paid.svelte';

	interface Props {
		lease: Lease & { balanceStatus?: any };
		tenants?: any[];
		rentalUnits?: any[];
		tenantNameMap?: Map<string, any>;
		onLeaseClick: (lease: Lease) => void;
		onDelete: (event: Event, lease: Lease) => void;
		onStatusChange: (id: string, status: string) => void;
		onDataChange?: () => Promise<void>;
		batchMode?: boolean;
		isSelected?: boolean;
		onBatchToggle?: () => void;
	}

	let {
		lease,
		tenants = [],
		rentalUnits = [],
		tenantNameMap = new Map(),
		onLeaseClick,
		onDelete,
		onStatusChange,
		onDataChange,
		batchMode = false,
		isSelected = false,
		onBatchToggle
	}: Props = $props();

	import { getStatusVariant } from '$lib/utils/format';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	let showPaymentModal = $state(false);
	let showRentManager = $state(false);
	let showSecurityDepositManager = $state(false);
	let showEditModal = $state(false);
	let showDetailsModal = $state(false);
	let showDesktopActions = $state(false);
	let showMobileActions = $state(false);
	let isMobile = $state(false);

	// Use matchMedia instead of N resize listeners — single shared query
	onMount(() => {
		const mq = window.matchMedia('(max-width: 767px)');
		isMobile = mq.matches;
		const handler = (e: MediaQueryListEvent) => { isMobile = e.matches; };
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
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

	// Get the most recent billing date when all billings are paid (single pass)
	let lastPaidDate = $derived.by(() => {
		const billings = lease.billings;
		if (!billings || billings.length === 0) return null;

		let latestMs = 0;
		for (let i = 0; i < billings.length; i++) {
			const b = billings[i];
			const totalDue = b.amount + (b.penalty_amount || 0);
			if (b.paid_amount < totalDue) return null; // Not all paid → early exit
			const ms = new Date(b.billing_date).getTime();
			if (ms > latestMs) latestMs = ms;
		}
		return latestMs > 0 ? new Date(latestMs) : null;
	});

	// [11] Security deposit status — show consistently when a deposit billing exists
	let securityDepositStatus = $derived.by(() => {
		if (!$featureFlags.showSecurityDepositIndicator) {
			return { show: false };
		}

		const status = getSecurityDepositStatus(lease);

		// Only hide if there are truly no security deposit billings
		if (!status.hasSecurityDeposit) {
			return { show: false };
		}

		// Determine color and tooltip based on status
		let tooltip: string;

		switch (status.status) {
			case 'fully-paid':
				tooltip = `Security Deposit Fully Paid (${formatCurrency(status.totalPaid)} available)`;
				break;
			case 'partially-used':
				tooltip = `Security Deposit Partially Used (${formatCurrency(status.availableAmount)} of ${formatCurrency(status.totalPaid)} available)`;
				break;
			case 'fully-used':
				tooltip = `Security Deposit Fully Used (${formatCurrency(status.totalPaid)} used)`;
				break;
			case 'unpaid':
				tooltip = `Security Deposit Unpaid`;
				break;
			default:
				return { show: false };
		}

		return {
			show: true,
			tooltip,
			status: status.status
		};
	});

	// Utility billing status
	let utilityStatus = $derived.by(() => {
		if (!lease.balanceStatus) return null;
		return getUtilityDisplayStatus(lease.balanceStatus);
	});

	// #2: Total due for "Pay ₱X" button label
	let totalDue = $derived.by(() => {
		if (!lease.billings?.length) return 0;
		return lease.billings.reduce((sum: number, b: any) => {
			if (b.status === 'PAID') return sum;
			return sum + (b.amount + (b.penalty_amount || 0) - (b.paid_amount || 0));
		}, 0);
	});

	// #5: "Just paid" transient badge
	let justPaid = $derived(getJustPaidMap().get(String(lease.id)));

	// [04] + [10]: Unified payment status color for left border and status dot
	// P2-5: Severity gradient — more tiers so "wall of red" differentiates urgency
	let paymentStatusColor = $derived.by(() => {
		const bs = lease.balanceStatus;
		if (!bs) return { border: 'border-l-slate-200', dot: 'bg-slate-300', label: 'No data', severity: 0 };
		if (bs.hasOverdue) {
			const days = bs.daysOverdue || 0;
			if (days >= 180) {
				return { border: 'border-l-red-800', dot: 'bg-red-700 animate-pulse', label: `${days}d overdue`, severity: 4 };
			}
			if (days >= 90) {
				return { border: 'border-l-red-600', dot: 'bg-red-600', label: `${days}d overdue`, severity: 3 };
			}
			if (days >= 30) {
				return { border: 'border-l-red-400', dot: 'bg-red-400', label: `${days}d overdue`, severity: 2 };
			}
			return { border: 'border-l-amber-500', dot: 'bg-amber-500', label: `${days}d overdue`, severity: 1 };
		}
		if (bs.hasPartial) {
			return { border: 'border-l-amber-400', dot: 'bg-amber-400', label: 'Partial', severity: 0 };
		}
		if (bs.hasPending) {
			return { border: 'border-l-orange-400', dot: 'bg-orange-400', label: 'Pending', severity: 0 };
		}
		return { border: 'border-l-green-500', dot: 'bg-green-500', label: 'Paid', severity: 0 };
	});

	// [09]: Lease expiry info
	let leaseExpiryInfo = $derived.by(() => {
		if (!lease.end_date) return null;
		const endDate = new Date(lease.end_date);
		const now = new Date();
		const diffMs = endDate.getTime() - now.getTime();
		const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
		if (diffDays < 0) {
			return { text: 'Expired', class: 'text-red-600 font-medium', urgent: true };
		}
		if (diffDays <= 30) {
			return { text: `Expires in ${diffDays}d`, class: 'text-amber-600 font-medium', urgent: true };
		}
		return { text: formatDate(lease.end_date), class: 'text-slate-500', urgent: false };
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
			toast.error(
				'Failed to update status: ' + (error instanceof Error ? error.message : 'Unknown error')
			);
		}
	}
</script>
<Card.Root
	class="group hover:shadow-lg transition-all duration-300 w-full border-0 backdrop-blur-sm rounded-xl overflow-hidden cursor-pointer border-l-4 {paymentStatusColor.border} {batchMode && isSelected ? 'ring-2 ring-primary bg-primary/5' : batchMode ? 'bg-white/50 hover:bg-white/70' : 'bg-white/70 hover:bg-white/90'}"
	onclick={() => {
		if (batchMode && onBatchToggle) {
			onBatchToggle();
		} else {
			showDetailsModal = true;
		}
	}}
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
					<div class="flex items-center gap-1.5">
						{#if batchMode}
							<input type="checkbox" checked={isSelected} class="h-5 w-5 flex-shrink-0 accent-primary" tabindex="-1" onclick={(e) => { e.stopPropagation(); onBatchToggle?.(); }} />
						{:else}
							<!-- [10] Status dot reflecting payment status -->
							<span class="w-2 h-2 rounded-full flex-shrink-0 {paymentStatusColor.dot}" title={paymentStatusColor.label}></span>
						{/if}
						<span class="text-sm sm:text-base font-bold truncate text-slate-800 transition-colors leading-tight block">
							{lease.name || `Lease #${lease.id}`}
						</span>
						{#if justPaid}
							<span class="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium animate-pulse flex-shrink-0">
								Paid {formatCurrency(justPaid.amount)}
							</span>
						{/if}
					</div>
					<!-- [09] Lease expiry + [11] Security deposit badges -->
					<div class="flex items-center gap-1.5 mt-0.5 ml-3.5">
						{#if leaseExpiryInfo}
							<span class="text-[10px] {leaseExpiryInfo.class}">
								{leaseExpiryInfo.urgent ? leaseExpiryInfo.text : `Ends ${leaseExpiryInfo.text}`}
							</span>
						{/if}
						{#if securityDepositStatus.show}
							<span class="text-[10px] text-slate-500" title={securityDepositStatus.tooltip}>
								<Shield class="w-2.5 h-2.5 inline-block -mt-px {securityDepositStatus.status === 'fully-paid' ? 'text-green-500' : securityDepositStatus.status === 'partially-used' ? 'text-orange-500' : securityDepositStatus.status === 'unpaid' ? 'text-slate-400' : 'text-red-500'}" />
								SD
							</span>
						{/if}
					</div>
				</div>
				
				<!-- Balance Amount -->
				<div class="flex-shrink-0">
					{#if !lease.billings || lease.billings.length === 0}
						<div class="text-sm italic text-slate-400 font-light">No Billings Yet</div>
					{:else if lease.balanceStatus}
						<div class="text-sm text-slate-600 text-right">
							{#if lease.balanceStatus.overdueBalance > 0}
								<span class="text-red-600">Rent: ₱{lease.balanceStatus.overdueBalance.toLocaleString()}</span>
							{:else if lease.balanceStatus.partialBalance > 0}
								<span class="text-amber-600">Rent: ₱{lease.balanceStatus.partialBalance.toLocaleString()}</span>
							{:else if lease.balanceStatus.pendingBalance > 0}
								<span class="text-orange-600">Rent: ₱{lease.balanceStatus.pendingBalance.toLocaleString()}</span>
							{:else}
								<span class="text-green-600">Rent: Paid</span>
							{/if}
							{#if utilityStatus}
								<div class="mt-1">
									<span class="{utilityStatus.textColor} text-xs">
										Utilities: ₱{utilityStatus.amount.toLocaleString()}
									</span>
								</div>
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
								{@const tenantData = leaseTenant.tenant ?? leaseTenant}
								{@const matchedTenant = tenantNameMap.get(tenantData?.name)}
								{@const profileUrl =
									(tenantData as any).profile_picture_url || matchedTenant?.profile_picture_url}
								<div
									class="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white shadow-sm flex-shrink-0 {index > 0 ? '-ml-3 sm:-ml-3.5' : ''}"
									style="z-index: {lease.lease_tenants.length - index}"
								>
									{#if profileUrl}
										<img
											src={profileUrl}
											alt="{tenantData?.name ?? 'Tenant'}'s profile picture"
											class="w-full h-full rounded-full object-cover"
										/>
									{:else}
										<div
											class="w-full h-full bg-slate-100 rounded-full flex items-center justify-center"
										>
											<span class="text-slate-600 font-medium text-xs">
												{(tenantData?.name ?? '')
													.split(' ')
													.map((n: string) => n[0])
													.join('')
													.toUpperCase()}
											</span>
										</div>
									{/if}
								</div>
							{/each}
							{#if lease.lease_tenants.length > 3}
								<div
									class="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white shadow-sm flex-shrink-0 bg-slate-200 flex items-center justify-center -ml-3 sm:-ml-3.5"
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
			<div class="flex-shrink-0 min-w-0 w-56">
				<div class="flex items-center gap-1.5">
					{#if batchMode}
						<input type="checkbox" checked={isSelected} class="h-5 w-5 flex-shrink-0 accent-primary" tabindex="-1" onclick={(e) => { e.stopPropagation(); onBatchToggle?.(); }} />
					{:else}
						<!-- [10] Status dot reflecting payment status -->
						<span class="w-2.5 h-2.5 rounded-full flex-shrink-0 {paymentStatusColor.dot}" title={paymentStatusColor.label}></span>
					{/if}
					<span class="text-base font-bold truncate text-slate-800 transition-colors leading-tight block">
						{lease.name || `Lease #${lease.id}`}
					</span>
					{#if justPaid}
						<span class="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium animate-pulse flex-shrink-0">
							Paid {formatCurrency(justPaid.amount)}
						</span>
					{/if}
				</div>
				<!-- [09] Lease expiry + [11] Security deposit badges -->
				<div class="flex items-center gap-2 mt-0.5 ml-4">
					{#if leaseExpiryInfo}
						<span class="text-xs {leaseExpiryInfo.class}">
							{leaseExpiryInfo.urgent ? leaseExpiryInfo.text : `Ends ${leaseExpiryInfo.text}`}
						</span>
					{/if}
					{#if securityDepositStatus.show}
						<span class="text-xs text-slate-500" title={securityDepositStatus.tooltip}>
							<Shield class="w-3 h-3 inline-block -mt-px {securityDepositStatus.status === 'fully-paid' ? 'text-green-500' : securityDepositStatus.status === 'partially-used' ? 'text-orange-500' : securityDepositStatus.status === 'unpaid' ? 'text-slate-400' : 'text-red-500'}" />
							SD
						</span>
					{/if}
				</div>
			</div>

			<!-- Profile Pictures -->
			<div class="flex-shrink-0">
				{#if lease.lease_tenants && lease.lease_tenants.length > 0}
					<div class="flex items-center">
						{#each lease.lease_tenants.slice(0, 3) as leaseTenant, index}
							{@const tenantData = leaseTenant.tenant ?? leaseTenant}
							{@const matchedTenant = tenantNameMap.get(tenantData?.name)}
							{@const profileUrl =
								(tenantData as any).profile_picture_url || matchedTenant?.profile_picture_url}
							<div
								class="w-14 h-14 rounded-full border-2 border-white shadow-sm flex-shrink-0 {index > 0 ? '-ml-3.5' : ''}"
								style="z-index: {lease.lease_tenants.length - index}"
							>
								{#if profileUrl}
									<img
										src={profileUrl}
										alt="{tenantData?.name ?? 'Tenant'}'s profile picture"
										class="w-full h-full rounded-full object-cover"
									/>
								{:else}
									<div
										class="w-full h-full bg-slate-100 rounded-full flex items-center justify-center"
									>
										<span class="text-slate-600 font-medium text-xs">
											{(tenantData?.name ?? '')
												.split(' ')
												.map((n: string) => n[0])
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
							<span class="text-red-600">Rent: ₱{lease.balanceStatus.overdueBalance.toLocaleString()}</span>
						{:else if lease.balanceStatus.partialBalance > 0}
							<span class="text-amber-600">Rent: ₱{lease.balanceStatus.partialBalance.toLocaleString()}</span>
						{:else if lease.balanceStatus.pendingBalance > 0}
							<span class="text-orange-600">Rent: ₱{lease.balanceStatus.pendingBalance.toLocaleString()}</span>
						{:else}
							<span class="text-green-600">Rent: Paid</span>
						{/if}
						{#if utilityStatus}
							<span class="ml-2 {utilityStatus.textColor}">
								| Utilities: ₱{utilityStatus.amount.toLocaleString()}
							</span>
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

			<!-- Status Dropdown — hidden in batch mode -->
			{#if !batchMode}
			<div class="flex-shrink-0">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<div
							class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm cursor-pointer hover:bg-slate-200 active:bg-slate-300 transition-colors font-medium text-nowrap touch-manipulation h-9"
						>
							{formatLeaseStatus(lease.status?.toString() || 'INACTIVE')}
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
										{formatLeaseStatus(status)}
									</DropdownMenu.RadioItem>
								{/each}
							</DropdownMenu.RadioGroup>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>

			<!-- Action Buttons — visually separated from card click area -->
			<div class="flex items-center gap-2 flex-shrink-0 pl-3 border-l border-slate-200/60">
				<!-- Three-dots Popover (Desktop) -->
				<Popover.Root bind:open={showDesktopActions}>
					<Popover.Trigger
						class="h-9 w-9 hover:bg-slate-50 hover:text-slate-600 transition-colors rounded-md flex items-center justify-center border border-slate-200 hover:border-slate-300"
						onclick={(e) => {
							e.stopPropagation();
						}}
					>
						<MoreVertical class="w-4 h-4" />
					</Popover.Trigger>
					<Popover.Content
						class="w-48 p-1"
						side="top"
						align="end"
						sideOffset={8}
					>
						<div class="flex flex-col">
							<Button
								variant="ghost"
								onclick={(e) => {
									e.stopPropagation();
									showDesktopActions = false;
									showEditModal = true;
								}}
								class="h-9 w-full justify-start gap-2 px-3 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm font-normal"
							>
								<Pencil class="w-4 h-4 flex-shrink-0" />
								Edit Lease
							</Button>
							<Button
								variant="ghost"
								onclick={(e) => {
									e.stopPropagation();
									showDesktopActions = false;
									showRentManager = true;
								}}
								class="h-9 w-full justify-start gap-2 px-3 hover:bg-purple-50 hover:text-purple-600 transition-colors text-sm font-normal"
							>
								<Home class="w-4 h-4 flex-shrink-0" />
								Modify Rents
							</Button>
							<Button
								variant="ghost"
								onclick={(e) => {
									e.stopPropagation();
									showDesktopActions = false;
									showSecurityDepositManager = true;
								}}
								class="h-9 w-full justify-start gap-2 px-3 hover:bg-orange-50 hover:text-orange-600 transition-colors text-sm font-normal"
							>
								<Shield class="w-4 h-4 flex-shrink-0" />
								Security Deposit
							</Button>
							<Button
								variant="ghost"
								onclick={(e) => {
									e.stopPropagation();
									showDesktopActions = false;
									printLeaseInvoice(lease);
								}}
								class="h-9 w-full justify-start gap-2 px-3 hover:bg-gray-50 hover:text-gray-600 transition-colors text-sm font-normal"
							>
								<Printer class="w-4 h-4 flex-shrink-0" />
								Print Statement
							</Button>
							<div class="h-px bg-slate-200 my-1"></div>
							<Button
								variant="ghost"
								onclick={(e) => {
									e.stopPropagation();
									showDesktopActions = false;
									onDelete(e, lease);
								}}
								class="h-9 w-full justify-start gap-2 px-3 hover:bg-red-50 hover:text-red-600 text-red-600 transition-colors text-sm font-normal"
							>
								<Trash2 class="w-4 h-4 flex-shrink-0" />
								Delete Lease
							</Button>
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
					{totalDue > 0 ? `Pay ${formatCurrency(totalDue)}` : 'Make Payment'}
				</Button>
			</div>
			{/if}
		</div>

		<!-- Mobile: Row 3 Status and Actions — hidden in batch mode -->
		{#if !batchMode}
		<div class="lg:hidden flex items-center justify-between gap-2 flex-wrap w-full mt-1">
				<!-- Status Dropdown -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<div
							class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs sm:text-sm cursor-pointer hover:bg-slate-200 active:bg-slate-300 transition-colors font-medium text-nowrap touch-manipulation min-h-[44px]"
						>
							{formatLeaseStatus(lease.status?.toString() || 'INACTIVE')}
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
										{formatLeaseStatus(status)}
									</DropdownMenu.RadioItem>
								{/each}
							</DropdownMenu.RadioGroup>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>

				<!-- Action Buttons Container — visually separated -->
				<div class="flex items-center gap-2 pl-2 border-l border-slate-200/60">
					<!-- Three-dots Popover with Action Buttons (Mobile) -->
					<Popover.Root bind:open={showMobileActions}>
						<Popover.Trigger
							class="h-11 w-11 hover:bg-slate-50 hover:text-slate-600 transition-colors rounded-md flex items-center justify-center border border-slate-200 hover:border-slate-300 touch-manipulation"
							onclick={(e) => {
								e.stopPropagation();
							}}
						>
							<MoreVertical class="w-4 h-4" />
						</Popover.Trigger>
					<Popover.Content
						class="w-52 p-1"
						side="top"
						align="end"
						sideOffset={8}
					>
						<div class="flex flex-col">
							<Button
								variant="ghost"
								onclick={(e) => {
									e.stopPropagation();
									showMobileActions = false;
									showEditModal = true;
								}}
								class="min-h-[44px] w-full justify-start gap-3 px-3 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm font-normal"
							>
								<Pencil class="w-4 h-4 flex-shrink-0" />
								Edit Lease
							</Button>
							<Button
								variant="ghost"
								onclick={(e) => {
									e.stopPropagation();
									showMobileActions = false;
									showRentManager = true;
								}}
								class="min-h-[44px] w-full justify-start gap-3 px-3 hover:bg-purple-50 hover:text-purple-600 transition-colors text-sm font-normal"
							>
								<Home class="w-4 h-4 flex-shrink-0" />
								Modify Rents
							</Button>
							<Button
								variant="ghost"
								onclick={(e) => {
									e.stopPropagation();
									showMobileActions = false;
									showSecurityDepositManager = true;
								}}
								class="min-h-[44px] w-full justify-start gap-3 px-3 hover:bg-orange-50 hover:text-orange-600 transition-colors text-sm font-normal"
							>
								<Shield class="w-4 h-4 flex-shrink-0" />
								Security Deposit
							</Button>
							<Button
								variant="ghost"
								onclick={(e) => {
									e.stopPropagation();
									showMobileActions = false;
									printLeaseInvoice(lease);
								}}
								class="min-h-[44px] w-full justify-start gap-3 px-3 hover:bg-gray-50 hover:text-gray-600 transition-colors text-sm font-normal"
							>
								<Printer class="w-4 h-4 flex-shrink-0" />
								Print Statement
							</Button>
							<div class="h-px bg-slate-200 my-1"></div>
							<Button
								variant="ghost"
								onclick={(e) => {
									e.stopPropagation();
									showMobileActions = false;
									onDelete(e, lease);
								}}
								class="min-h-[44px] w-full justify-start gap-3 px-3 hover:bg-red-50 hover:text-red-600 text-red-600 transition-colors text-sm font-normal"
							>
								<Trash2 class="w-4 h-4 flex-shrink-0" />
								Delete Lease
							</Button>
						</div>
					</Popover.Content>
					</Popover.Root>

					<!-- Prominent Make Payment Button -->
					<Button
						onclick={(e) => {
							e.stopPropagation();
							showPaymentModal = true;
						}}
						class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm font-medium transition-colors min-h-[44px] touch-manipulation"
					>
						<CreditCard class="w-4 h-4 mr-2" />
						{totalDue > 0 ? `Pay ${formatCurrency(totalDue)}` : 'Make Payment'}
					</Button>
				</div>
		</div>
		{/if}
	</Card.Content>
</Card.Root>

<!-- Modals — conditionally rendered to avoid N modal instances in DOM -->
{#if showPaymentModal}
<PaymentModal
	lease={{ ...lease, id: lease.id.toString() }}
	isOpen={showPaymentModal}
	onOpenChange={handlePaymentModalClose}
	{onDataChange}
/>
{/if}

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