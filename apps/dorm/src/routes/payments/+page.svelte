<script lang="ts">
	import PaymentForm from './PaymentForm.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Dialog from '$lib/components/ui/dialog';
	import type { PageData } from './$types';
	import type { z } from 'zod/v3';
	import { paymentSchema } from './formSchema';
	import {
		paymentsStore,
		billingsStore,
		leasesStore,
		rentalUnitsStore,
		floorsStore,
		propertiesStore,
		paymentAllocationsStore,
		leaseTenantsStore,
		tenantsStore
	} from '$lib/stores/collections.svelte';
	import SyncErrorBanner from '$lib/components/sync/SyncErrorBanner.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { formatCurrency, formatDate, getStatusClasses } from '$lib/utils/format';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { toast } from 'svelte-sonner';
	import { Label } from '$lib/components/ui/label';
	import { resyncCollection } from '$lib/db/replication';
	import {
		ChevronLeft,
		ChevronRight,
		ChevronDown,
		ChevronUp,
		CreditCard,
		Clock,
		DollarSign,
		Download,
		Filter,
		Hash,
		Receipt,
		Search,
		Wallet,
		Plus,
		AlertTriangle,
		ArrowUpDown,
		CalendarDays,
		Eye,
		User,
		X
	} from 'lucide-svelte';

	type Payment = z.infer<typeof paymentSchema> & {
		billing?: {
			id: number;
			type: string;
			utility_type?: string;
			status?: string;
			due_date?: string;
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

	// ─── Helper: format billing period ──────────────────────────
	function formatBillingPeriod(dateStr: string | null | undefined): string {
		if (!dateStr) return '';
		try {
			const d = new Date(dateStr);
			if (isNaN(d.getTime())) return '';
			return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
		} catch {
			return '';
		}
	}

	// ─── Helper: display paid_by (treats "Unknown" as falsy) ──────────
	function getDisplayPaidBy(payment: Payment): string | null {
		const paidBy = payment.paid_by && payment.paid_by !== 'Unknown' ? payment.paid_by : null;
		return paidBy || payment.billing?.lease?.name || null;
	}

	// ─── Helper: humanize method enums ──────────────────────────
	const METHOD_LABELS: Record<string, string> = {
		CASH: 'Cash',
		BANK: 'Bank',
		GCASH: 'GCash',
		OTHER: 'Other',
		SECURITY_DEPOSIT: 'Security Deposit'
	};

	// ─── Helper: humanize billing type enums ──────────────────────────
	function humanizeBillingType(type: string | undefined | null): string {
		if (!type) return 'Unknown';
		const map: Record<string, string> = {
			SECURITY_DEPOSIT: 'Security Deposit',
			RENT: 'Rent',
			UTILITY: 'Utility',
			PENALTY: 'Penalty',
			MAINTENANCE: 'Maintenance',
			SERVICE: 'Service'
		};
		return map[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	// ─── Helper: humanize utility type enums ──────────────────────────
	function humanizeUtilityType(type: string | undefined | null): string {
		if (!type) return '';
		const map: Record<string, string> = {
			ELECTRICITY: 'Electricity',
			WATER: 'Water',
			INTERNET: 'Internet'
		};
		return map[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	// ─── RxDB reactive stores (singletons from collections.svelte.ts) ──

	// Enriched payments with billing info (sorted by updated_at desc)
	let payments = $derived.by(() => {
		const billingMap = new Map<string, any>();
		for (const b of billingsStore.value) billingMap.set(String(b.id), b);

		const leaseMap = new Map<string, any>();
		for (const l of leasesStore.value) leaseMap.set(String(l.id), l);

		const unitMap = new Map<string, any>();
		for (const u of rentalUnitsStore.value) unitMap.set(String(u.id), u);

		const floorMap = new Map<string, any>();
		for (const f of floorsStore.value) floorMap.set(String(f.id), f);

		const propMap = new Map<string, any>();
		for (const p of propertiesStore.value) propMap.set(String(p.id), p);

		const sortedPayments = [...paymentsStore.value].sort((a: any, b: any) => {
			const aMs = a.updated_at ? new Date(a.updated_at).getTime() : 0;
			const bMs = b.updated_at ? new Date(b.updated_at).getTime() : 0;
			return bMs - aMs;
		});
		return sortedPayments.map((payment: any) => {
			const billingIds = Array.isArray(payment.billing_ids) ? payment.billing_ids : [];
			const primaryBillingId = billingIds[0];
			const primaryBilling = primaryBillingId
				? billingMap.get(String(primaryBillingId))
				: null;

			let billing = null;
			if (primaryBilling) {
				const lease = leaseMap.get(String(primaryBilling.lease_id));
				const unit = lease ? unitMap.get(String(lease.rental_unit_id)) : null;
				const floor = unit ? floorMap.get(String(unit.floor_id)) : null;
				const property = floor ? propMap.get(String(floor.property_id)) : null;

				billing = {
					id: Number(primaryBilling.id),
					type: primaryBilling.type,
					utility_type: primaryBilling.utility_type,
					status: primaryBilling.status,
					due_date: primaryBilling.due_date,
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
		const leaseMap = new Map<string, any>();
		for (const l of leasesStore.value) leaseMap.set(String(l.id), l);

		const unitMap = new Map<string, any>();
		for (const u of rentalUnitsStore.value) unitMap.set(String(u.id), u);

		const floorMap = new Map<string, any>();
		for (const f of floorsStore.value) floorMap.set(String(f.id), f);

		const propMap = new Map<string, any>();
		for (const p of propertiesStore.value) propMap.set(String(p.id), p);

		return billingsStore.value
			.filter((b: any) => ['PENDING', 'PARTIAL', 'OVERDUE'].includes(b.status))
			.map((b: any) => {
				const lease = leaseMap.get(String(b.lease_id));
				const unit = lease ? unitMap.get(String(lease.rental_unit_id)) : null;
				const floor = unit ? floorMap.get(String(unit.floor_id)) : null;
				const property = floor ? propMap.get(String(floor.property_id)) : null;
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

	// [04] SP-01: Replace showForm toggle with Dialog modal state
	let formDialogOpen = $state(false);
	let selectedPayment: Payment | undefined = $state(undefined);
	// [01] Detail modal state
	let detailDialogOpen = $state(false);
	let detailPayment: Payment | null = $state(null);

	let searchQuery = $state('');
	let debouncedSearch = $state('');
	let methodFilter = $state('');
	let statusFilter = $state('');
	// [03] Date range filter state
	let dateFrom = $state('');
	let dateTo = $state('');
	// [11] Sort controls
	let sortBy = $state('date_newest');
	let showDateFilter = $state(false);

	// 300ms search debounce to avoid filtering on every keystroke
	$effect(() => {
		const q = searchQuery;
		const timer = setTimeout(() => { debouncedSearch = q; }, 300);
		return () => clearTimeout(timer);
	});

	let filteredPayments = $derived.by(() => {
		let result = payments;
		if (debouncedSearch) {
			const q = debouncedSearch.toLowerCase();
			result = result.filter((p: any) =>
				(p.billing?.lease?.name ?? '').toLowerCase().includes(q) ||
				(p.billing?.lease?.rental_unit?.rental_unit_number ?? '').toLowerCase().includes(q) ||
				String(p.amount).includes(q) ||
				(p.method ?? '').toLowerCase().includes(q) ||
				(p.paid_by ?? '').toLowerCase().includes(q)
			);
		}
		if (methodFilter) {
			result = result.filter((p: any) => p.method === methodFilter);
		}
		if (statusFilter) {
			result = result.filter((p: any) => p.billing?.status === statusFilter);
		}
		// [03] Date range filter
		if (dateFrom) {
			const fromTs = new Date(dateFrom).getTime();
			result = result.filter((p: any) => {
				const paidTs = p.paid_at ? new Date(p.paid_at).getTime() : 0;
				return paidTs >= fromTs;
			});
		}
		if (dateTo) {
			// Include the entire "to" day
			const toTs = new Date(dateTo + 'T23:59:59').getTime();
			result = result.filter((p: any) => {
				const paidTs = p.paid_at ? new Date(p.paid_at).getTime() : 0;
				return paidTs <= toTs;
			});
		}
		// [11] Sort
		const sorted = [...result];
		switch (sortBy) {
			case 'date_oldest':
				sorted.sort((a, b) => {
					const aMs = a.paid_at ? new Date(a.paid_at).getTime() : 0;
					const bMs = b.paid_at ? new Date(b.paid_at).getTime() : 0;
					return aMs - bMs;
				});
				break;
			case 'amount_highest':
				sorted.sort((a, b) => b.amount - a.amount);
				break;
			case 'amount_lowest':
				sorted.sort((a, b) => a.amount - b.amount);
				break;
			case 'date_newest':
			default:
				sorted.sort((a, b) => {
					const aMs = a.paid_at ? new Date(a.paid_at).getTime() : 0;
					const bMs = b.paid_at ? new Date(b.paid_at).getTime() : 0;
					return bMs - aMs;
				});
				break;
		}
		return sorted;
	});

	const PAGE_SIZE = 24;
	let currentPage = $state(1);
	let totalPages = $derived(Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE)));
	let paginatedPayments = $derived(
		filteredPayments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
	);

	$effect(() => {
		searchQuery; methodFilter; statusFilter; dateFrom; dateTo; sortBy;
		currentPage = 1;
	});

	// Suppress status badges when all visible payments have the same status
	let allSameStatus = $derived.by(() => {
		const statuses = new Set(paginatedPayments.map((p: Payment) => p.billing?.status).filter(Boolean));
		return statuses.size <= 1;
	});

	// Auto-focus amount field when form dialog opens
	$effect(() => {
		if (formDialogOpen) {
			setTimeout(() => {
				document.querySelector<HTMLInputElement>('[data-payment-amount]')?.focus();
			}, 150);
		}
	});

	function handlePaymentAdded() {
		formDialogOpen = false;
		selectedPayment = undefined;
	}

	// [01] Card click → open detail modal
	function openDetail(payment: Payment) {
		detailPayment = payment;
		detailDialogOpen = true;
	}

	// Summary stats
	let stats = $derived.by(() => {
		let totalAmount = 0;
		let count = 0;
		const byMethod: Record<string, { count: number; total: number }> = {};

		for (const p of payments) {
			totalAmount += p.amount;
			count += 1;
			const method = p.method ?? 'OTHER';
			if (!byMethod[method]) byMethod[method] = { count: 0, total: 0 };
			byMethod[method].count += 1;
			byMethod[method].total += p.amount;
		}

		// Outstanding billings (from the billings derived which already filters PENDING/PARTIAL/OVERDUE)
		let outstandingAmount = 0;
		let outstandingCount = 0;
		for (const b of billings) {
			outstandingAmount += b.balance;
			outstandingCount += 1;
		}

		return { totalAmount, count, byMethod, outstandingAmount, outstandingCount };
	});

	// ─── Revert with reason state ──────────────────────────────
	let showRevertDialog = $state(false);
	let revertPaymentId = $state<number | null>(null);
	let revertReason = $state('');

	async function confirmRevert() {
		if (revertPaymentId === null) return;
		const id = revertPaymentId;
		const reason = revertReason;
		// Capture payment details for rich toast before clearing state
		const revertedPayment = payments.find((p) => p.id === id);
		showRevertDialog = false;
		revertPaymentId = null;
		revertReason = '';

		const formData = new FormData();
		formData.append('payment_id', String(id));
		if (reason) formData.append('reason', reason);

		try {
			const response = await fetch('?/revert', { method: 'POST', body: formData });
			if (response.ok) {
				const desc = revertedPayment
					? `${formatCurrency(revertedPayment.amount)} ${METHOD_LABELS[revertedPayment.method] ?? revertedPayment.method}${reason ? ` — Reason: ${reason}` : ''}`
					: undefined;
				toast.success('Payment reverted', { description: desc });
				resyncCollection('payments');
				resyncCollection('billings');
				resyncCollection('payment_allocations');
			} else {
				toast.error('Failed to revert payment');
			}
		} catch {
			toast.error('Error reverting payment');
		}
	}

	// ─── CSV Export ──────────────────────────────────────────────
	function handleExportCSV() {
		const data = filteredPayments;
		if (!data.length) {
			toast.error('No payments to export');
			return;
		}
		const headers = ['ID', 'Amount', 'Method', 'Paid By', 'Paid At', 'Reference', 'Notes', 'Receipt URL', 'Lease'];
		const rows = [
			headers.join(','),
			...data.map((p) => [
				p.id,
				p.amount,
				p.method,
				(p.paid_by ?? '').replace(/,/g, ' '),
				p.paid_at ?? '',
				p.reference_number ?? '',
				(p.notes ?? '').replace(/,/g, ' '),
				p.receipt_url ?? '',
				p.billing?.lease?.name ?? ''
			].join(','))
		];
		const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		toast.success(`${data.length} payment${data.length === 1 ? '' : 's'} exported`);
	}

	// ─── Allocation detail toggle in detail modal ──────────────
	let showAllocationDetail = $state(false);
	let showAuditInfo = $state(false);

	// Build rich allocation data for the detail modal
	function getDetailAllocations(payment: Payment) {
		const allocations = paymentAllocationsStore.value.filter(
			(a: any) => String(a.payment_id) === String(payment.id)
		);
		if (!allocations.length) return [];

		const billingMap = new Map<string, any>();
		for (const b of billingsStore.value) billingMap.set(String(b.id), b);
		const leaseMap = new Map<string, any>();
		for (const l of leasesStore.value) leaseMap.set(String(l.id), l);

		return allocations.map((a: any) => {
			const billing = billingMap.get(String(a.billing_id));
			const lease = billing ? leaseMap.get(String(billing.lease_id)) : null;
			return {
				billing_id: Number(a.billing_id),
				allocated_amount: parseFloat(a.amount) || 0,
				billing_type: billing?.type ?? 'Unknown',
				utility_type: billing?.utility_type ?? null,
				billing_amount: billing ? (parseFloat(billing.amount) || 0) : 0,
				due_date: billing?.due_date ?? null,
				lease_name: lease?.name ?? null
			};
		});
	}

	// [02] SP-02 helper: check if payment is orphaned (no billing)
	function isOrphaned(payment: Payment): boolean {
		return !payment.billing;
	}

	// [02] SP-02 helper: get display title for card
	function getCardTitle(payment: Payment): string {
		if (payment.billing?.lease?.name) return payment.billing.lease.name;
		if (payment.paid_by) return payment.paid_by;
		return `Payment #${payment.id}`;
	}
</script>

<div class="space-y-4">
	<SyncErrorBanner collections={['payments', 'billings', 'leases', 'rental_units', 'floors', 'properties', 'payment_allocations']} />

	<div class="flex justify-between items-center">
		<h1 class="text-2xl font-bold">Payments</h1>
		<div class="flex gap-2">
			{#if !isLoading && payments.length > 0}
				<Button variant="outline" class="hidden sm:inline-flex" onclick={handleExportCSV}>
					<Download class="w-4 h-4 mr-2" />
					Export
				</Button>
			{/if}
			{#if isAdminLevel || isAccountant || isFrontdesk || isResident}
				<Button
					class="hidden sm:inline-flex"
					onclick={() => {
						selectedPayment = undefined;
						formDialogOpen = true;
					}}
				>
					<Plus class="w-4 h-4 mr-2" />
					Create Payment
				</Button>
			{/if}
		</div>
	</div>

	<!-- Summary Stats -->
	{#if !isLoading && payments.length > 0}
		<!-- [08] Shorter stat labels on mobile -->
		<div class="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 sm:overflow-visible sm:pb-0">
			<Card.Root class="flex-shrink-0 min-w-[140px] sm:min-w-0">
				<Card.Content class="flex items-center gap-3 p-4">
					<div class="rounded-full bg-emerald-100 p-2 flex-shrink-0">
						<DollarSign class="h-5 w-5 text-emerald-600" />
					</div>
					<div class="min-w-0">
						<p class="text-sm font-medium text-muted-foreground truncate">
							<span class="sm:hidden">Collected</span>
							<span class="hidden sm:inline">Total Collected</span>
						</p>
						<p class="text-xl font-bold tabular-nums">{formatCurrency(stats.totalAmount)}</p>
					</div>
				</Card.Content>
			</Card.Root>
			<Card.Root class="flex-shrink-0 min-w-[140px] sm:min-w-0">
				<Card.Content class="flex items-center gap-3 p-4">
					<div class="rounded-full bg-blue-100 p-2 flex-shrink-0">
						<Hash class="h-5 w-5 text-blue-600" />
					</div>
					<div class="min-w-0">
						<p class="text-sm font-medium text-muted-foreground truncate">
							<span class="sm:hidden">Count</span>
							<span class="hidden sm:inline">Total Payments</span>
						</p>
						<p class="text-xl font-bold">{stats.count}</p>
					</div>
				</Card.Content>
			</Card.Root>
			<Card.Root class="flex-shrink-0 min-w-[140px] sm:min-w-0">
				<Card.Content class="flex items-center gap-3 p-4">
					<div class="rounded-full bg-amber-100 p-2 flex-shrink-0">
						<AlertTriangle class="h-5 w-5 text-amber-600" />
					</div>
					<div class="min-w-0">
						<p class="text-sm font-medium text-muted-foreground truncate">
							<span class="sm:hidden">Unpaid</span>
							<span class="hidden sm:inline">Outstanding</span>
						</p>
						<p class="text-xl font-bold tabular-nums">{formatCurrency(stats.outstandingAmount)}</p>
						<p class="text-xs text-muted-foreground">{stats.outstandingCount} billing{stats.outstandingCount !== 1 ? 's' : ''}</p>
					</div>
				</Card.Content>
			</Card.Root>
			{#if Object.keys(stats.byMethod).length > 0}
				{@const sortedMethods = Object.entries(stats.byMethod).sort((a, b) => b[1].total - a[1].total)}
				<Card.Root class="flex-shrink-0 min-w-[140px] sm:min-w-0">
					<Card.Content class="flex items-center gap-3 p-4">
						<div class="rounded-full bg-purple-100 p-2 flex-shrink-0">
							<Wallet class="h-5 w-5 text-purple-600" />
						</div>
						<div class="min-w-0">
							<p class="text-sm font-medium text-muted-foreground truncate">
								<span class="sm:hidden">Methods</span>
								<span class="hidden sm:inline">By Method</span>
							</p>
							<p class="text-xl font-bold tabular-nums">{formatCurrency(sortedMethods[0][1].total)}</p>
							<div class="text-xs text-muted-foreground">
								{#each sortedMethods as [m, d]}
									<span class="mr-2">{METHOD_LABELS[m] ?? m}: {d.count}</span>
								{/each}
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	{/if}

	<!-- Search, Filters, Sort & Date Range -->
	{#if !isLoading && payments.length > 0}
		<div class="flex flex-col gap-3">
			<!-- Row 1: Search + Method + Sort -->
			<div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
				<div class="relative flex-1">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search by lease, unit, payer, or amount..."
						class="pl-9"
						bind:value={searchQuery}
					/>
				</div>
				<Select.Root type="single" bind:value={methodFilter}>
					<Select.Trigger class="w-full sm:w-40">
						{methodFilter ? METHOD_LABELS[methodFilter] ?? methodFilter : 'All Methods'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">All Methods</Select.Item>
						<Select.Item value="CASH">Cash</Select.Item>
						<Select.Item value="BANK">Bank</Select.Item>
						<Select.Item value="GCASH">GCash</Select.Item>
						<Select.Item value="OTHER">Other</Select.Item>
					</Select.Content>
				</Select.Root>
				<Select.Root type="single" bind:value={statusFilter}>
					<Select.Trigger class="w-full sm:w-40">
						{statusFilter || 'All Statuses'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">All Statuses</Select.Item>
						<Select.Item value="PAID">Paid</Select.Item>
						<Select.Item value="PARTIAL">Partial</Select.Item>
						<Select.Item value="PENDING">Pending</Select.Item>
						<Select.Item value="OVERDUE">Overdue</Select.Item>
					</Select.Content>
				</Select.Root>
				<!-- [11] Sort dropdown -->
				<Select.Root type="single" bind:value={sortBy}>
					<Select.Trigger class="w-full sm:w-48">
						<ArrowUpDown class="w-4 h-4 mr-2 flex-shrink-0" />
						{sortBy === 'date_newest' ? 'Date (Newest)' :
						 sortBy === 'date_oldest' ? 'Date (Oldest)' :
						 sortBy === 'amount_highest' ? 'Amount (Highest)' :
						 sortBy === 'amount_lowest' ? 'Amount (Lowest)' : 'Sort'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="date_newest">Date (Newest)</Select.Item>
						<Select.Item value="date_oldest">Date (Oldest)</Select.Item>
						<Select.Item value="amount_highest">Amount (Highest)</Select.Item>
						<Select.Item value="amount_lowest">Amount (Lowest)</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
			<!-- [03] Row 2: Date range filter (toggle) -->
			<div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
				<Button
					variant="ghost"
					size="sm"
					onclick={() => { showDateFilter = !showDateFilter; }}
					class="self-start"
				>
					<CalendarDays class="w-4 h-4 mr-1" />
					{showDateFilter ? 'Hide dates' : 'Filter by date'}
				</Button>
				{#if showDateFilter}
					<div class="flex items-center gap-2 flex-1">
						<Input
							type="date"
							placeholder="From date"
							bind:value={dateFrom}
							class="flex-1"
						/>
						<span class="text-muted-foreground text-sm">to</span>
						<Input
							type="date"
							placeholder="To date"
							bind:value={dateTo}
							class="flex-1"
						/>
						{#if dateFrom || dateTo}
							<Button
								variant="ghost"
								size="sm"
								onclick={() => { dateFrom = ''; dateTo = ''; }}
								class="flex-shrink-0"
							>
								<X class="w-4 h-4" />
							</Button>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}

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
			{#each paginatedPayments as payment}
				<!-- [01] Clickable cards with cursor-pointer + detail modal -->
				<Card.Root
					class="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-150 {isOrphaned(payment) ? 'border-amber-300 bg-amber-50/30' : ''}"
					onclick={() => openDetail(payment)}
				>
					<Card.Header class="pb-2">
						<Card.Title class="flex justify-between items-start gap-2">
							<span class="truncate">{getCardTitle(payment)}</span>
							<div class="flex items-center gap-1.5 flex-shrink-0">
								<!-- [02] SP-02: Amber warning badge for orphaned payments -->
								{#if isOrphaned(payment)}
									<Badge class="bg-amber-100 text-amber-800 border-amber-300 text-xs">
										<AlertTriangle class="w-3 h-3 mr-1" />
										Unlinked
									</Badge>
								{:else if !allSameStatus}
									<Badge class={getStatusClasses(payment.billing?.status ?? '')}>
										{payment.billing?.status}
									</Badge>
								{/if}
							</div>
						</Card.Title>
						<Card.Description>
							<!-- [05] Humanized billing type labels with period -->
							{#if isOrphaned(payment)}
								<span class="text-amber-700">Unlinked Payment</span>
							{:else}
								{humanizeBillingType(payment.billing?.type)}{#if payment.billing?.utility_type}{' '}- {humanizeUtilityType(payment.billing.utility_type)}{/if}{#if formatBillingPeriod(payment.billing?.due_date)}{' '}({formatBillingPeriod(payment.billing?.due_date)}){/if}
							{/if}
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-2">
							<div class="flex justify-between items-baseline gap-2">
								<span class="text-muted-foreground flex-shrink-0">Amount:</span>
								<span class="font-medium text-right tabular-nums">{formatCurrency(payment.amount)}</span>
							</div>
							<div class="flex justify-between items-baseline gap-2">
								<span class="text-muted-foreground flex-shrink-0">Method:</span>
								<span class="font-medium text-right">{METHOD_LABELS[payment.method] ?? payment.method}</span>
							</div>
							<div class="flex justify-between items-baseline gap-2">
								<span class="text-muted-foreground flex-shrink-0">Date:</span>
								<span class="font-medium text-right break-words">
									{formatDate(payment.paid_at)}
								</span>
							</div>
							<!-- [07] Paid By: treat "Unknown" as falsy, fallback to lease tenant -->
							{#if getDisplayPaidBy(payment)}
								<div class="flex justify-between items-baseline gap-2">
									<span class="text-muted-foreground flex-shrink-0">Paid By:</span>
									<span class="font-medium text-right truncate">{getDisplayPaidBy(payment)}</span>
								</div>
							{/if}
							{#if payment.billing?.lease?.rental_unit}
								<div class="flex justify-between items-baseline gap-2">
									<span class="text-muted-foreground flex-shrink-0">Unit:</span>
									<span class="font-medium text-right break-words">
										{#if payment.billing.lease.rental_unit.floor}{payment.billing.lease.rental_unit.floor.floor_number}F - {/if}Room {payment.billing.lease.rental_unit.rental_unit_number}{#if payment.billing.lease.rental_unit.floor?.wing}{' '}({payment.billing.lease.rental_unit.floor.wing}){/if}
									</span>
								</div>
							{/if}
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
		<!-- [10] Bigger pagination buttons on mobile; pb-20 clears FAB on small screens -->
		{#if totalPages > 1}
			<div class="flex items-center justify-between pt-4 pb-20 sm:pb-0 border-t border-slate-200/60 mt-4">
				<p class="text-sm text-muted-foreground">
					Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredPayments.length)} of {filteredPayments.length}
				</p>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={currentPage <= 1}
						onclick={() => currentPage--}
						class="min-w-11 min-h-11 sm:min-w-9 sm:min-h-9"
					>
						<ChevronLeft class="w-4 h-4" />
					</Button>
					{#each Array(totalPages) as _, i (i)}
						{#if totalPages <= 7 || i === 0 || i === totalPages - 1 || Math.abs(i + 1 - currentPage) <= 1}
							<Button
								variant={currentPage === i + 1 ? 'default' : 'outline'}
								size="sm"
								onclick={() => currentPage = i + 1}
								class="min-w-11 min-h-11 sm:min-w-9 sm:min-h-9"
							>
								{i + 1}
							</Button>
						{:else if i === 1 && currentPage > 3}
							<span class="text-slate-400 px-1">...</span>
						{:else if i === totalPages - 2 && currentPage < totalPages - 2}
							<span class="text-slate-400 px-1">...</span>
						{/if}
					{/each}
					<Button
						variant="outline"
						size="sm"
						disabled={currentPage >= totalPages}
						onclick={() => currentPage++}
						class="min-w-11 min-h-11 sm:min-w-9 sm:min-h-9"
					>
						<ChevronRight class="w-4 h-4" />
					</Button>
				</div>
			</div>
		{/if}
	{:else}
		<EmptyState icon={CreditCard} title="No Payments" description="No payments have been recorded yet." />
	{/if}
</div>

<!-- [09] Mobile FAB — fixed bottom-right, only visible on small screens -->
{#if (isAdminLevel || isAccountant || isFrontdesk || isResident) && !isLoading}
	<button
		class="sm:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center"
		onclick={() => {
			selectedPayment = undefined;
			formDialogOpen = true;
		}}
		aria-label="Create Payment"
	>
		<Plus class="w-6 h-6" />
	</button>
{/if}

<!-- [04] SP-01: Create/Edit Payment Dialog Modal -->
<Dialog.Root bind:open={formDialogOpen}>
	<Dialog.Content class="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>{selectedPayment ? 'Edit' : 'Create'} Payment</Dialog.Title>
			<Dialog.Description>
				{selectedPayment ? 'Update the payment details below.' : 'Fill in the payment details below to record a new payment.'}
			</Dialog.Description>
		</Dialog.Header>
		<PaymentForm
			{data}
			billings={billings ?? []}
			editMode={!!selectedPayment}
			payment={selectedPayment}
			onPaymentAdded={handlePaymentAdded}
		/>
	</Dialog.Content>
</Dialog.Root>

<!-- [01] Payment Detail Dialog Modal -->
<Dialog.Root bind:open={detailDialogOpen}>
	<Dialog.Content class="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
		{#if detailPayment}
			<Dialog.Header>
				<Dialog.Title class="flex items-center gap-2">
					<Eye class="w-5 h-5 text-primary" />
					Payment Details
				</Dialog.Title>
				<Dialog.Description>
					{#if isOrphaned(detailPayment)}
						<Badge class="bg-amber-100 text-amber-800 border-amber-300">
							<AlertTriangle class="w-3 h-3 mr-1" />
							Unlinked Payment
						</Badge>
					{:else}
						{humanizeBillingType(detailPayment.billing?.type)}
						{#if detailPayment.billing?.utility_type}
							- {humanizeUtilityType(detailPayment.billing.utility_type)}
						{/if}
					{/if}
				</Dialog.Description>
			</Dialog.Header>
			<div class="space-y-4 pt-2">
				<!-- Title / Lease -->
				<div class="flex items-center gap-2 text-lg font-semibold">
					<User class="w-5 h-5 text-muted-foreground" />
					{getCardTitle(detailPayment)}
				</div>

				{#if isOrphaned(detailPayment)}
					<div class="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-2">
						<AlertTriangle class="w-4 h-4 mt-0.5 flex-shrink-0" />
						<span>This payment is not linked to any billing record. It may have been created before billing was set up, or the billing was deleted.</span>
					</div>
				{/if}

				<div class="space-y-3 text-sm">
					<div class="flex justify-between py-2 border-b">
						<span class="text-muted-foreground">Payment ID</span>
						<span class="font-mono">#{detailPayment.id}</span>
					</div>
					<div class="flex justify-between py-2 border-b">
						<span class="text-muted-foreground">Amount</span>
						<span class="font-semibold text-base tabular-nums">{formatCurrency(detailPayment.amount)}</span>
					</div>
					<div class="flex justify-between py-2 border-b">
						<span class="text-muted-foreground">Method</span>
						<Badge variant="outline">{METHOD_LABELS[detailPayment.method] ?? detailPayment.method}</Badge>
					</div>
					<div class="flex justify-between py-2 border-b">
						<span class="text-muted-foreground">Date Paid</span>
						<span>{formatDate(detailPayment.paid_at)}</span>
					</div>
					{#if getDisplayPaidBy(detailPayment)}
						<div class="flex justify-between py-2 border-b">
							<span class="text-muted-foreground">Paid By</span>
							<span class="font-medium">{getDisplayPaidBy(detailPayment)}</span>
						</div>
					{/if}
					{#if detailPayment.billing?.status}
						<div class="flex justify-between py-2 border-b">
							<span class="text-muted-foreground">Billing Status</span>
							<Badge class={getStatusClasses(detailPayment.billing.status)}>
								{detailPayment.billing.status}
							</Badge>
						</div>
					{/if}
					{#if detailPayment.billing?.lease?.rental_unit}
						<div class="flex justify-between py-2 border-b">
							<span class="text-muted-foreground">Unit</span>
							<span>
								{#if detailPayment.billing.lease.rental_unit.floor}{detailPayment.billing.lease.rental_unit.floor.floor_number}F - {/if}Room {detailPayment.billing.lease.rental_unit.rental_unit_number}{#if detailPayment.billing.lease.rental_unit.floor?.wing}{' '}({detailPayment.billing.lease.rental_unit.floor.wing}){/if}
							</span>
						</div>
					{/if}
					{#if detailPayment.billing?.lease?.rental_unit?.floor?.property}
						<div class="flex justify-between py-2 border-b">
							<span class="text-muted-foreground">Property</span>
							<span>{detailPayment.billing.lease.rental_unit.floor.property.name}</span>
						</div>
					{/if}
					{#if detailPayment.reference_number}
						<div class="flex justify-between py-2 border-b">
							<span class="text-muted-foreground">Reference #</span>
							<span class="font-mono text-sm">{detailPayment.reference_number}</span>
						</div>
					{/if}
					{#if detailPayment.receipt_url}
						<div class="flex justify-between py-2 border-b">
							<span class="text-muted-foreground">Receipt</span>
							<a href={detailPayment.receipt_url} target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
								View Receipt
							</a>
						</div>
					{/if}
					{#if detailPayment.notes}
						<div class="py-2 border-b">
							<span class="text-muted-foreground block mb-1">Notes</span>
							<span class="text-sm">{detailPayment.notes}</span>
						</div>
					{/if}
					<!-- Collapsible Allocation Breakdown -->
					{#if detailPayment && getDetailAllocations(detailPayment).length > 0}
					{@const detailAllocations = getDetailAllocations(detailPayment)}
						<div class="py-2 border-b">
							<button
								class="flex items-center justify-between w-full text-left hover:bg-muted/50 p-2 min-h-[44px] rounded-md transition-colors"
								onclick={() => showAllocationDetail = !showAllocationDetail}
							>
								<span class="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Receipt class="h-4 w-4" />
									Payment Allocation Details ({detailAllocations.length})
								</span>
								{#if showAllocationDetail}
									<ChevronUp class="h-4 w-4 text-muted-foreground" />
								{:else}
									<ChevronDown class="h-4 w-4 text-muted-foreground" />
								{/if}
							</button>
							{#if showAllocationDetail}
								<div class="space-y-2 mt-2 pl-2">
									{#each detailAllocations as alloc}
										<div class="flex items-center justify-between py-2 px-3 bg-muted/30 rounded text-sm">
											<div>
												<span class="font-medium">
													{alloc.billing_type}
													{#if alloc.utility_type}({alloc.utility_type}){/if}
												</span>
												{#if alloc.lease_name}
													<div class="text-xs text-muted-foreground">{alloc.lease_name}</div>
												{/if}
												{#if alloc.due_date}
													<div class="text-xs text-muted-foreground">Due: {formatDate(alloc.due_date)}</div>
												{/if}
											</div>
											<div class="text-right">
												<div class="font-semibold text-emerald-600 tabular-nums">
													{formatCurrency(alloc.allocated_amount)}
												</div>
												<div class="text-xs text-muted-foreground tabular-nums">
													of {formatCurrency(alloc.billing_amount)}
												</div>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/if}

					<!-- Collapsible Audit Information -->
					{#if detailPayment?.created_at || detailPayment?.updated_at}
						<div class="py-2 border-b">
							<button
								class="flex items-center justify-between w-full text-left hover:bg-muted/50 p-2 min-h-[44px] rounded-md transition-colors"
								onclick={() => showAuditInfo = !showAuditInfo}
							>
								<span class="text-sm font-medium text-muted-foreground flex items-center gap-2">
									<Clock class="h-4 w-4" />
									Audit Information
								</span>
								{#if showAuditInfo}
									<ChevronUp class="h-4 w-4 text-muted-foreground" />
								{:else}
									<ChevronDown class="h-4 w-4 text-muted-foreground" />
								{/if}
							</button>
							{#if showAuditInfo}
								<div class="pl-6 space-y-2 text-sm mt-2">
									{#if detailPayment.created_at}
										<div class="flex justify-between">
											<span class="text-muted-foreground">Created:</span>
											<span>{formatDate(detailPayment.created_at)}</span>
										</div>
									{/if}
									{#if detailPayment.updated_at}
										<div class="flex justify-between">
											<span class="text-muted-foreground">Updated:</span>
											<span>{formatDate(detailPayment.updated_at)}</span>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				</div>
				<!-- Action buttons for admin/accountant roles -->
				{#if isAdminLevel || isAccountant}
					<div class="flex justify-between pt-4 border-t mt-4">
						<Button
							variant="destructive"
							size="sm"
							class="min-h-[44px] sm:min-h-0"
							onclick={() => {
								revertPaymentId = detailPayment?.id ?? null;
								revertReason = '';
								detailDialogOpen = false;
								showRevertDialog = true;
							}}
						>
							Revert
						</Button>
						<Button
							variant="outline"
							class="min-h-[44px] sm:min-h-0"
							onclick={() => {
								selectedPayment = detailPayment ? { ...detailPayment } as any : undefined;
								detailDialogOpen = false;
								formDialogOpen = true;
							}}
						>
							Edit Payment
						</Button>
					</div>
				{/if}
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<!-- Revert with Reason Dialog -->
<Dialog.Root bind:open={showRevertDialog}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Revert Payment</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to revert this payment? This will adjust related billings.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="revert-reason">Reason for reverting (optional)</Label>
				<Input id="revert-reason" bind:value={revertReason} placeholder="Enter a reason..." />
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => { showRevertDialog = false; revertPaymentId = null; revertReason = ''; }}>Cancel</Button>
			<Button variant="destructive" onclick={confirmRevert}>Revert Payment</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

{#if !isAdminLevel && !isAccountant && !isFrontdesk && !isResident}
	<div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
		<p class="text-yellow-800">
			You are viewing this page in read-only mode. Contact an administrator if you need to make
			changes.
		</p>
	</div>
{/if}
