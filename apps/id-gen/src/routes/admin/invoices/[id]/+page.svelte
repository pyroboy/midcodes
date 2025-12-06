<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { formatDate } from '$lib/utils/dateFormat';
	import {
		getInvoiceById,
		markInvoicePaid,
		voidInvoice,
		sendInvoice
	} from '$lib/remote/invoices.remote';
	import {
		FileText,
		ArrowLeft,
		User,
		Calendar,
		CreditCard,
		Send,
		CheckCircle,
		Ban,
		Clock,
		XCircle,
		AlertCircle,
		Package,
		Coins
	} from '@lucide/svelte';

	const invoiceId = $page.params.id;
	const invoice = getInvoiceById({ invoiceId });

	let loading = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');

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

	function getTotalCredits(invoiceData: any): number {
		if (!invoiceData?.invoice_items) return 0;
		return invoiceData.invoice_items.reduce(
			(sum: number, item: any) => sum + (item.credits_granted || 0),
			0
		);
	}

	async function handleSendInvoice() {
		loading = true;
		try {
			await sendInvoice(invoiceId);
			successMessage = 'Invoice sent successfully';
			await getInvoiceById({ invoiceId }).refresh();
		} catch (err: any) {
			errorMessage = err.message || 'Failed to send invoice';
		} finally {
			loading = false;
		}
	}

	async function handleMarkPaid() {
		const paymentRef = prompt('Enter payment reference (optional):');
		loading = true;
		try {
			const result = await markInvoicePaid({
				invoice_id: invoiceId,
				payment_reference: paymentRef || undefined
			});
			successMessage = `Invoice marked as paid. ${result.creditsAdded} credits added to user.`;
			await getInvoiceById({ invoiceId }).refresh();
		} catch (err: any) {
			errorMessage = err.message || 'Failed to mark invoice as paid';
		} finally {
			loading = false;
		}
	}

	async function handleVoidInvoice() {
		const reason = prompt('Enter reason for voiding this invoice:');
		if (!reason) return;

		loading = true;
		try {
			const result = await voidInvoice({ invoice_id: invoiceId, reason });
			if (result.creditsReversed > 0) {
				successMessage = `Invoice voided. ${result.creditsReversed} credits reversed from user.`;
			} else {
				successMessage = 'Invoice voided successfully';
			}
			await getInvoiceById({ invoiceId }).refresh();
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
	<title>Invoice Details - Admin</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="sm" href="/admin/invoices">
			<ArrowLeft class="h-4 w-4 mr-2" />
			Back
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

	{#await invoice}
		<Card>
			<CardContent class="py-12 text-center text-muted-foreground">Loading invoice...</CardContent>
		</Card>
	{:then invoiceData}
		{@const inv = invoiceData as any}
		{@const StatusIcon = getStatusIcon(inv.status)}
		{@const totalCredits = getTotalCredits(inv)}

		<!-- Invoice Header -->
		<Card>
			<CardHeader>
				<div class="flex items-start justify-between">
					<div>
						<CardTitle class="flex items-center gap-2 text-2xl">
							<FileText class="h-6 w-6" />
							{invoiceData.invoice_number}
						</CardTitle>
						<CardDescription class="mt-2">
							<Badge variant={getStatusBadgeVariant(invoiceData.status)} class="mr-2">
								<StatusIcon class="h-3 w-3 mr-1" />
								{invoiceData.status.toUpperCase()}
							</Badge>
							<Badge variant="outline">
								{getInvoiceTypeLabel(invoiceData.invoice_type)}
							</Badge>
						</CardDescription>
					</div>
					<div class="text-right">
						<div class="text-3xl font-bold">
							{formatCurrency(invoiceData.total_amount)}
						</div>
						{#if totalCredits > 0}
							<div class="text-sm text-muted-foreground flex items-center justify-end gap-1">
								<Coins class="h-4 w-4" />
								{totalCredits} credits
							</div>
						{/if}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div class="flex gap-2">
					{#if invoiceData.status === 'draft'}
						<Button onclick={handleSendInvoice} disabled={loading}>
							<Send class="h-4 w-4 mr-2" />
							Send Invoice
						</Button>
					{/if}
					{#if invoiceData.status === 'sent'}
						<Button onclick={handleMarkPaid} disabled={loading}>
							<CheckCircle class="h-4 w-4 mr-2" />
							Mark as Paid
						</Button>
					{/if}
					{#if invoiceData.status !== 'void' && invoiceData.status !== 'paid'}
						<Button variant="destructive" onclick={handleVoidInvoice} disabled={loading}>
							<Ban class="h-4 w-4 mr-2" />
							Void Invoice
						</Button>
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Customer & Dates -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-lg">
						<User class="h-5 w-5" />
						Customer
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-2">
						<div>
							<span class="text-sm text-muted-foreground">Email</span>
							<p class="font-medium">{invoiceData.user?.email || 'Unknown'}</p>
						</div>
						{#if invoiceData.user?.credits_balance !== undefined}
							<div>
								<span class="text-sm text-muted-foreground">Current Credit Balance</span>
								<p class="font-medium">{invoiceData.user.credits_balance} credits</p>
							</div>
						{/if}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-lg">
						<Calendar class="h-5 w-5" />
						Dates
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-2">
						<div>
							<span class="text-sm text-muted-foreground">Created</span>
							<p class="font-medium">{formatDate(invoiceData.created_at)}</p>
						</div>
						{#if invoiceData.issue_date}
							<div>
								<span class="text-sm text-muted-foreground">Issued</span>
								<p class="font-medium">{formatDate(invoiceData.issue_date)}</p>
							</div>
						{/if}
						{#if invoiceData.due_date}
							<div>
								<span class="text-sm text-muted-foreground">Due Date</span>
								<p class="font-medium">{formatDate(invoiceData.due_date)}</p>
							</div>
						{/if}
						{#if invoiceData.paid_at}
							<div>
								<span class="text-sm text-muted-foreground">Paid</span>
								<p class="font-medium text-green-600">{formatDate(invoiceData.paid_at)}</p>
							</div>
						{/if}
						{#if invoiceData.voided_at}
							<div>
								<span class="text-sm text-muted-foreground">Voided</span>
								<p class="font-medium text-red-600">{formatDate(invoiceData.voided_at)}</p>
							</div>
						{/if}
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Invoice Items -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Package class="h-5 w-5" />
					Invoice Items
				</CardTitle>
				<CardDescription>
					{invoiceData.invoice_items?.length || 0} items
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="space-y-3">
					{#each invoiceData.invoice_items || [] as item}
						<div class="flex items-center justify-between p-4 border rounded-lg">
							<div>
								<div class="font-medium">{item.description}</div>
								<div class="text-sm text-muted-foreground">
									{item.quantity} × {formatCurrency(item.unit_price)}
									{#if item.credits_granted > 0}
										<span class="ml-2 text-blue-600">+{item.credits_granted} credits</span>
									{/if}
								</div>
							</div>
							<div class="text-right">
								<div class="font-semibold">{formatCurrency(item.total_price)}</div>
								<Badge variant="outline" class="text-xs">
									{item.item_type}
								</Badge>
							</div>
						</div>
					{/each}

					<!-- Totals -->
					<div class="border-t pt-4 mt-4 space-y-2">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Subtotal</span>
							<span>{formatCurrency(invoiceData.subtotal)}</span>
						</div>
						{#if invoiceData.discount_amount > 0}
							<div class="flex justify-between text-green-600">
								<span>Discount</span>
								<span>-{formatCurrency(invoiceData.discount_amount)}</span>
							</div>
						{/if}
						{#if invoiceData.tax_amount > 0}
							<div class="flex justify-between">
								<span class="text-muted-foreground">Tax</span>
								<span>{formatCurrency(invoiceData.tax_amount)}</span>
							</div>
						{/if}
						<div class="flex justify-between font-bold text-lg border-t pt-2">
							<span>Total</span>
							<span>{formatCurrency(invoiceData.total_amount)}</span>
						</div>
						{#if invoiceData.status === 'paid'}
							<div class="flex justify-between text-green-600">
								<span>Amount Paid</span>
								<span>{formatCurrency(invoiceData.amount_paid)}</span>
							</div>
						{/if}
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Payment Info (if paid) -->
		{#if invoiceData.status === 'paid' && (invoiceData.payment_method || invoiceData.payment_reference)}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<CreditCard class="h-5 w-5" />
						Payment Information
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-2 gap-4">
						{#if invoiceData.payment_method}
							<div>
								<span class="text-sm text-muted-foreground">Payment Method</span>
								<p class="font-medium">{invoiceData.payment_method}</p>
							</div>
						{/if}
						{#if invoiceData.payment_reference}
							<div>
								<span class="text-sm text-muted-foreground">Reference</span>
								<p class="font-medium">{invoiceData.payment_reference}</p>
							</div>
						{/if}
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Notes -->
		{#if invoiceData.notes || invoiceData.internal_notes}
			<Card>
				<CardHeader>
					<CardTitle>Notes</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					{#if invoiceData.notes}
						<div>
							<span class="text-sm text-muted-foreground">Customer Notes</span>
							<p class="mt-1 whitespace-pre-wrap">{invoiceData.notes}</p>
						</div>
					{/if}
					{#if invoiceData.internal_notes}
						<div>
							<span class="text-sm text-muted-foreground">Internal Notes (Admin Only)</span>
							<p class="mt-1 whitespace-pre-wrap text-yellow-700 bg-yellow-50 p-3 rounded-md">
								{invoiceData.internal_notes}
							</p>
						</div>
					{/if}
				</CardContent>
			</Card>
		{/if}
	{:catch error}
		<Card>
			<CardContent class="py-12 text-center">
				<p class="text-red-600">Failed to load invoice: {error.message}</p>
				<Button href="/admin/invoices" class="mt-4">Back to Invoices</Button>
			</CardContent>
		</Card>
	{/await}
</div>
