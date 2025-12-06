<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { formatDate } from '$lib/utils/dateFormat';
	import {
		History,
		CreditCard,
		FileText,
		Sparkles,
		ArrowLeft,
		ArrowRight,
		Wallet,
		TrendingDown,
		TrendingUp,
		RefreshCw
	} from '@lucide/svelte';

	let { data } = $props();

	const filterOptions = [
		{ value: 'all', label: 'All' },
		{ value: 'usage', label: 'Usage' },
		{ value: 'purchase', label: 'Purchases' },
		{ value: 'refund', label: 'Refunds' },
		{ value: 'bonus', label: 'Bonuses' }
	];

	function handleFilterChange(type: string) {
		const url = new URL($page.url);
		url.searchParams.set('type', type);
		url.searchParams.set('page', '1');
		goto(url.toString());
	}

	function handlePageChange(newPage: number) {
		const url = new URL($page.url);
		url.searchParams.set('page', newPage.toString());
		goto(url.toString());
	}

	function getTransactionIcon(type: string) {
		switch (type) {
			case 'usage':
				return TrendingDown;
			case 'purchase':
				return TrendingUp;
			case 'refund':
				return RefreshCw;
			case 'bonus':
				return Sparkles;
			default:
				return CreditCard;
		}
	}

	function getTransactionBadgeVariant(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (type) {
			case 'usage':
				return 'destructive';
			case 'purchase':
				return 'default';
			case 'refund':
				return 'secondary';
			case 'bonus':
				return 'outline';
			default:
				return 'secondary';
		}
	}
</script>

<svelte:head>
	<title>Credit History - ID Generator</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<div class="mb-8">
		<h1 class="text-3xl font-bold">Credit History</h1>
		<p class="text-muted-foreground mt-2">Track your credit usage and transactions</p>
	</div>

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Current Balance</CardDescription>
				<CardTitle class="text-2xl flex items-center gap-2">
					<Wallet class="h-5 w-5 text-primary" />
					{data.summary.currentBalance}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-xs text-muted-foreground">
					{data.summary.unlimitedTemplates ? 'Unlimited templates' : `${2 - data.summary.templateCount} free templates left`}
				</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Cards Generated</CardDescription>
				<CardTitle class="text-2xl flex items-center gap-2">
					<CreditCard class="h-5 w-5 text-blue-500" />
					{data.summary.cardGenerationCount}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-xs text-muted-foreground">
					{data.summary.cardsThisMonth} this month
				</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Credits Used (Month)</CardDescription>
				<CardTitle class="text-2xl flex items-center gap-2">
					<TrendingDown class="h-5 w-5 text-red-500" />
					{data.summary.creditsUsedThisMonth}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-xs text-muted-foreground">
					{data.summary.templatesThisMonth} templates created
				</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardDescription>Credits Purchased (Month)</CardDescription>
				<CardTitle class="text-2xl flex items-center gap-2">
					<TrendingUp class="h-5 w-5 text-green-500" />
					{data.summary.creditsPurchasedThisMonth}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-xs text-muted-foreground">
					From invoices and purchases
				</p>
			</CardContent>
		</Card>
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap gap-2 mb-6">
		{#each filterOptions as option}
			<Button
				variant={data.filterType === option.value ? 'default' : 'outline'}
				size="sm"
				onclick={() => handleFilterChange(option.value)}
			>
				{option.label}
			</Button>
		{/each}
	</div>

	<!-- Transactions List -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<History class="h-5 w-5" />
				Transaction History
			</CardTitle>
			<CardDescription>
				{data.totalCount} total transactions
			</CardDescription>
		</CardHeader>
		<CardContent>
			{#if data.transactions.length === 0}
				<EmptyState
					icon={History}
					title="No transactions yet"
					description="Your credit usage history will appear here as you use the platform."
					size="sm"
				/>
			{:else}
				<div class="space-y-3">
					{#each data.transactions as tx}
						{@const Icon = getTransactionIcon(tx.transaction_type)}
						<div class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
							<div class="flex items-center gap-4">
								<div class="p-2 rounded-full bg-muted">
									<Icon class="h-4 w-4" />
								</div>
								<div>
									<div class="flex items-center gap-2">
										<span class="font-medium">{tx.description || 'Transaction'}</span>
										<Badge variant={getTransactionBadgeVariant(tx.transaction_type)}>
											{tx.transaction_type}
										</Badge>
									</div>
									<p class="text-sm text-muted-foreground">
										{formatDate(tx.created_at)}
										{#if tx.usage_type}
											<span class="ml-2 text-xs">({tx.usage_type.replace('_', ' ')})</span>
										{/if}
									</p>
								</div>
							</div>
							<div class="text-right">
								<div class="font-semibold {tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}">
									{tx.amount >= 0 ? '+' : ''}{tx.amount}
								</div>
								<p class="text-xs text-muted-foreground">
									Balance: {tx.credits_after}
								</p>
							</div>
						</div>
					{/each}
				</div>

				<!-- Pagination -->
				{#if data.totalPages > 1}
					<div class="flex items-center justify-between mt-6 pt-4 border-t">
						<p class="text-sm text-muted-foreground">
							Page {data.currentPage} of {data.totalPages}
						</p>
						<div class="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={data.currentPage <= 1}
								onclick={() => handlePageChange(data.currentPage - 1)}
							>
								<ArrowLeft class="h-4 w-4 mr-1" />
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={data.currentPage >= data.totalPages}
								onclick={() => handlePageChange(data.currentPage + 1)}
							>
								Next
								<ArrowRight class="h-4 w-4 ml-1" />
							</Button>
						</div>
					</div>
				{/if}
			{/if}
		</CardContent>
	</Card>
</div>
