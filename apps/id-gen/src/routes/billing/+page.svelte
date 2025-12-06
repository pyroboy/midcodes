<script lang="ts">
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { formatDate } from '$lib/utils/dateFormat';
	import {
		Receipt,
		CreditCard,
		FileText,
		Wallet,
		CheckCircle,
		Clock,
		XCircle,
		AlertCircle,
		ExternalLink
	} from '@lucide/svelte';

	let { data } = $props();

	let activeTab = $state<'invoices' | 'payments'>('invoices');

	function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'paid':
				return 'default';
			case 'sent':
			case 'pending':
				return 'secondary';
			case 'void':
			case 'failed':
			case 'expired':
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
			case 'pending':
				return Clock;
			case 'void':
			case 'failed':
			case 'expired':
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
				return 'Credit Purchase';
			case 'feature_purchase':
				return 'Feature Purchase';
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
		return invoice.invoice_items.reduce((sum: number, item: any) => sum + (item.credits_granted || 0), 0);
	}
</script>

<svelte:head>
	<title>Billing - ID Generator</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<div class="mb-8">
		<h1 class="text-3xl font-bold">Billing</h1>
		<p class="text-muted-foreground mt-2">View your invoices and payment history</p>
	</div>

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Current Balance</CardDescription>
				<CardTitle class="text-2xl flex items-center gap-2">
					<Wallet class="h-5 w-5 text-primary" />
					{data.profile.credits_balance} credits
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Button href="/pricing" variant="outline" size="sm">
					Buy More Credits
				</Button>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Total Spent</CardDescription>
				<CardTitle class="text-2xl flex items-center gap-2">
					<CreditCard class="h-5 w-5 text-green-500" />
					₱{data.totalSpent.toFixed(2)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-xs text-muted-foreground">
					Across all invoices and payments
				</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Active Features</CardDescription>
				<CardTitle class="text-lg">
					{#if data.profile.unlimited_templates || data.profile.remove_watermarks}
						<div class="flex flex-wrap gap-1">
							{#if data.profile.unlimited_templates}
								<Badge variant="default">Unlimited Templates</Badge>
							{/if}
							{#if data.profile.remove_watermarks}
								<Badge variant="default">No Watermarks</Badge>
							{/if}
						</div>
					{:else}
						<span class="text-muted-foreground text-sm">No premium features</span>
					{/if}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Button href="/pricing" variant="outline" size="sm">
					Upgrade
				</Button>
			</CardContent>
		</Card>
	</div>

	<!-- Tab Navigation -->
	<div class="flex gap-2 mb-6 border-b">
		<button
			class="px-4 py-2 font-medium text-sm border-b-2 transition-colors {activeTab === 'invoices'
				? 'border-primary text-primary'
				: 'border-transparent text-muted-foreground hover:text-foreground'}"
			onclick={() => (activeTab = 'invoices')}
		>
			<FileText class="h-4 w-4 inline mr-2" />
			Invoices ({data.invoices.length})
		</button>
		<button
			class="px-4 py-2 font-medium text-sm border-b-2 transition-colors {activeTab === 'payments'
				? 'border-primary text-primary'
				: 'border-transparent text-muted-foreground hover:text-foreground'}"
			onclick={() => (activeTab = 'payments')}
		>
			<Receipt class="h-4 w-4 inline mr-2" />
			Payments ({data.payments.length})
		</button>
	</div>

	<!-- Invoices Tab -->
	{#if activeTab === 'invoices'}
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<FileText class="h-5 w-5" />
					Invoices
				</CardTitle>
				<CardDescription>
					Invoices issued for your account
				</CardDescription>
			</CardHeader>
			<CardContent>
				{#if data.invoices.length === 0}
					<EmptyState
						icon={FileText}
						title="No invoices yet"
						description="Invoices will appear here when you make purchases or receive credits."
						size="sm"
					/>
				{:else}
					<div class="space-y-3">
						{#each data.invoices as invoice}
							{@const StatusIcon = getStatusIcon(invoice.status)}
							<div class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
								<div class="flex items-center gap-4">
									<div class="p-2 rounded-full bg-muted">
										<StatusIcon class="h-4 w-4" />
									</div>
									<div>
										<div class="flex items-center gap-2">
											<span class="font-medium">{invoice.invoice_number}</span>
											<Badge variant={getStatusBadgeVariant(invoice.status)}>
												{invoice.status}
											</Badge>
											<Badge variant="outline">
												{getInvoiceTypeLabel(invoice.invoice_type)}
											</Badge>
										</div>
										<p class="text-sm text-muted-foreground">
											{formatDate(invoice.created_at)}
											{#if invoice.paid_at}
												<span class="ml-2">Paid: {formatDate(invoice.paid_at)}</span>
											{/if}
										</p>
										{#if invoice.notes}
											<p class="text-xs text-muted-foreground mt-1">{invoice.notes}</p>
										{/if}
									</div>
								</div>
								<div class="text-right">
									<div class="font-semibold">
										{formatCurrency(invoice.total_amount)}
									</div>
									{#if getTotalCredits(invoice) > 0}
										<p class="text-xs text-muted-foreground">
											+{getTotalCredits(invoice)} credits
										</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>
	{/if}

	<!-- Payments Tab -->
	{#if activeTab === 'payments'}
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Receipt class="h-5 w-5" />
					Payment Records
				</CardTitle>
				<CardDescription>
					Online payments processed through PayMongo
				</CardDescription>
			</CardHeader>
			<CardContent>
				{#if data.payments.length === 0}
					<EmptyState
						icon={Receipt}
						title="No payments yet"
						description="Payment records will appear here when you make online purchases."
						size="sm"
						action={{
							label: 'Buy Credits',
							href: '/pricing'
						}}
					/>
				{:else}
					<div class="space-y-3">
						{#each data.payments as payment}
							{@const StatusIcon = getStatusIcon(payment.status)}
							<div class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
								<div class="flex items-center gap-4">
									<div class="p-2 rounded-full bg-muted">
										<StatusIcon class="h-4 w-4" />
									</div>
									<div>
										<div class="flex items-center gap-2">
											<span class="font-medium">
												{payment.kind === 'credit' ? 'Credit Purchase' : 'Feature Purchase'}
											</span>
											<Badge variant={getStatusBadgeVariant(payment.status)}>
												{payment.status}
											</Badge>
											{#if payment.method}
												<Badge variant="outline">
													{payment.method}
												</Badge>
											{/if}
										</div>
										<p class="text-sm text-muted-foreground">
											{formatDate(payment.created_at)}
											{#if payment.paid_at}
												<span class="ml-2">Completed: {formatDate(payment.paid_at)}</span>
											{/if}
										</p>
										{#if payment.provider_payment_id}
											<p class="text-xs text-muted-foreground font-mono">
												Ref: {payment.provider_payment_id}
											</p>
										{/if}
									</div>
								</div>
								<div class="text-right">
									<div class="font-semibold">
										₱{(payment.amount_php || 0).toFixed(2)}
									</div>
									{#if payment.sku_id}
										<p class="text-xs text-muted-foreground">
											{payment.sku_id}
										</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>
	{/if}
</div>
