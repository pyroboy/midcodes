<script lang="ts">
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { formatDate } from '$lib/utils/dateFormat';
	import {
		getInvoices,
		markInvoicePaid,
		voidInvoice,
		sendInvoice
	} from '$lib/remote/invoices.remote';
	import {
		FileText,
		Plus,
		Search,
		CheckCircle,
		Clock,
		XCircle,
		AlertCircle,
		Send,
		Ban,
		Eye
	} from '@lucide/svelte';

	const invoices = getInvoices();

	let searchQuery = $state('');
	let statusFilter = $state('all');
	let loading = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');

	const statusOptions = [
		{ value: 'all', label: 'All' },
		{ value: 'draft', label: 'Draft' },
		{ value: 'sent', label: 'Sent' },
		{ value: 'paid', label: 'Paid' },
		{ value: 'void', label: 'Void' },
		{ value: 'overdue', label: 'Overdue' }
	];

	let filteredInvoices = $derived.by(() => {
		const data = $state.snapshot(invoices) as unknown as any[];
		if (!data || !Array.isArray(data)) return [];

		return data.filter((inv) => {
			// Status filter
			if (statusFilter !== 'all' && inv.status !== statusFilter) {
				return false;
			}

			// Search filter
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				const matchesNumber = inv.invoice_number?.toLowerCase().includes(query);
				const matchesEmail = inv.user?.email?.toLowerCase().includes(query);
				if (!matchesNumber && !matchesEmail) {
					return false;
				}
			}

			return true;
		});
	});

	function getStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'paid':
				return 'default';
			case 'sent':
				return 'secondary';
			case 'void':
				return 'destructive';
			case 'draft':
			case 'overdue':
				return 'outline';
			default:
				return 'secondary';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'paid':
				return CheckCircle;
			case 'sent':
				return Clock;
			case 'void':
				return XCircle;
			case 'overdue':
				return AlertCircle;
			default:
				return FileText;
		}
	}

	function formatCurrency(amountCentavos: number): string {
		return `₱${(amountCentavos / 100).toFixed(2)}`;
	}

	function getInvoiceTypeLabel(type: string): string {
		switch (type) {
			case 'credit_purchase':
				return 'Credits';
			case 'feature_purchase':
				return 'Feature';
			case 'refund':
				return 'Refund';
			case 'correction':
				return 'Correction';
			case 'bonus':
				return 'Bonus';
			default:
				return type;
		}
	}

	function getTotalCredits(invoice: any): number {
		if (!invoice.invoice_items) return 0;
		return invoice.invoice_items.reduce(
			(sum: number, item: any) => sum + (item.credits_granted || 0),
			0
		);
	}

	async function handleSendInvoice(invoiceId: string) {
		loading = true;
		try {
			await sendInvoice(invoiceId);
			successMessage = 'Invoice sent successfully';
			await getInvoices().refresh();
		} catch (err: any) {
			errorMessage = err.message || 'Failed to send invoice';
		} finally {
			loading = false;
		}
	}

	async function handleMarkPaid(invoiceId: string) {
		loading = true;
		try {
			await markInvoicePaid({ invoice_id: invoiceId, payment_method: 'manual' });
			successMessage = 'Invoice marked as paid. Credits added to user.';
			await getInvoices().refresh();
		} catch (err: any) {
			errorMessage = err.message || 'Failed to mark invoice as paid';
		} finally {
			loading = false;
		}
	}

	async function handleVoidInvoice(invoiceId: string) {
		const reason = prompt('Enter reason for voiding this invoice:');
		if (!reason) return;

		loading = true;
		try {
			await voidInvoice({ invoice_id: invoiceId, reason });
			successMessage = 'Invoice voided successfully';
			await getInvoices().refresh();
		} catch (err: any) {
			errorMessage = err.message || 'Failed to void invoice';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (successMessage || errorMessage) {
			const timer = setTimeout(() => {
				successMessage = '';
				errorMessage = '';
			}, 5000);
			return () => clearTimeout(timer);
		}
	});
</script>

<svelte:head>
	<title>Invoices - Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div>
			<h1 class="text-2xl font-bold">Invoices</h1>
			<p class="text-muted-foreground">Manage credit invoices and payments</p>
		</div>
		<Button href="/admin/invoices/new">
			<Plus class="h-4 w-4 mr-2" />
			Create Invoice
		</Button>
	</div>

	<!-- Messages -->
	{#if successMessage}
		<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
			{successMessage}
		</div>
	{/if}

	{#if errorMessage}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
			{errorMessage}
		</div>
	{/if}

	<!-- Filters -->
	<Card>
		<CardContent class="pt-6">
			<div class="flex flex-col sm:flex-row gap-4">
				<div class="relative flex-1">
					<Search
						class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
					/>
					<Input
						placeholder="Search by invoice number or email..."
						class="pl-10"
						bind:value={searchQuery}
					/>
				</div>
				<div class="flex gap-2 flex-wrap">
					{#each statusOptions as option}
						<Button
							variant={statusFilter === option.value ? 'default' : 'outline'}
							size="sm"
							onclick={() => (statusFilter = option.value)}
						>
							{option.label}
						</Button>
					{/each}
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Invoice List -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<FileText class="h-5 w-5" />
				All Invoices
			</CardTitle>
			<CardDescription>
				{filteredInvoices.length} invoices found
			</CardDescription>
		</CardHeader>
		<CardContent>
			{#await invoices}
				<p class="text-muted-foreground">Loading invoices...</p>
			{:then}
				{#if filteredInvoices.length === 0}
					<EmptyState
						icon={FileText}
						title="No invoices found"
						description="Create your first invoice to start managing credits."
						action={{
							label: 'Create Invoice',
							href: '/admin/invoices/new'
						}}
						size="sm"
					/>
				{:else}
					<div class="space-y-3">
						{#each filteredInvoices as invoice}
							{@const StatusIcon = getStatusIcon(invoice.status)}
							<div
								class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
							>
								<div class="flex items-center gap-4 min-w-0">
									<div class="p-2 rounded-full bg-muted shrink-0">
										<StatusIcon class="h-4 w-4" />
									</div>
									<div class="min-w-0">
										<div class="flex items-center gap-2 flex-wrap">
											<span class="font-medium">{invoice.invoice_number}</span>
											<Badge variant={getStatusBadgeVariant(invoice.status)}>
												{invoice.status}
											</Badge>
											<Badge variant="outline">
												{getInvoiceTypeLabel(invoice.invoice_type)}
											</Badge>
										</div>
										<p class="text-sm text-muted-foreground truncate">
											{invoice.user?.email || 'Unknown user'}
										</p>
										<p class="text-xs text-muted-foreground">
											Created: {formatDate(invoice.created_at)}
										</p>
									</div>
								</div>
								<div class="flex items-center gap-4">
									<div class="text-right">
										<div class="font-semibold">
											{formatCurrency(invoice.total_amount)}
										</div>
										{#if getTotalCredits(invoice) > 0}
											<p class="text-xs text-muted-foreground">
												{getTotalCredits(invoice)} credits
											</p>
										{/if}
									</div>
									<div class="flex gap-1">
										<Button
											variant="ghost"
											size="sm"
											href="/admin/invoices/{invoice.id}"
											title="View details"
										>
											<Eye class="h-4 w-4" />
										</Button>
										{#if invoice.status === 'draft'}
											<Button
												variant="ghost"
												size="sm"
												onclick={() => handleSendInvoice(invoice.id)}
												disabled={loading}
												title="Send invoice"
											>
												<Send class="h-4 w-4" />
											</Button>
										{/if}
										{#if invoice.status === 'sent'}
											<Button
												variant="ghost"
												size="sm"
												onclick={() => handleMarkPaid(invoice.id)}
												disabled={loading}
												title="Mark as paid"
											>
												<CheckCircle class="h-4 w-4 text-green-600" />
											</Button>
										{/if}
										{#if invoice.status !== 'void' && invoice.status !== 'paid'}
											<Button
												variant="ghost"
												size="sm"
												onclick={() => handleVoidInvoice(invoice.id)}
												disabled={loading}
												title="Void invoice"
											>
												<Ban class="h-4 w-4 text-red-600" />
											</Button>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{/await}
		</CardContent>
	</Card>
</div>
