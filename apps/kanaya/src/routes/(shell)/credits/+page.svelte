<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		Coins,
		TrendingUp,
		CreditCard,
		ArrowUpRight,
		ArrowDownRight
	} from '@lucide/svelte';

	let { data } = $props();

	function formatDate(date: string | Date) {
		return new Date(date).toLocaleDateString('en-PH', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatAmount(amount: number, type: string) {
		if (type === 'usage') return `- ${amount} credits`;
		return `+ ${amount} credits`;
	}

	function getBadgeVariant(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (type) {
			case 'purchase':
				return 'default';
			case 'refund':
				return 'secondary';
			default:
				return 'outline';
		}
	}

	function getBadgeClass(type: string): string {
		switch (type) {
			case 'purchase':
				return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
			case 'refund':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
			default:
				return '';
		}
	}
</script>

<svelte:head>
	<title>Credits | Kanaya</title>
	<meta name="description" content="Manage your Kanaya credits, view transaction history, and purchase more credits." />
</svelte:head>

<div class="container mx-auto max-w-5xl px-4 py-8 lg:py-12">
	<!-- Page Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Credits</h1>
		<p class="mt-1 text-muted-foreground">Manage your credit balance and view transaction history</p>
	</div>

	<!-- Stat Cards -->
	<div class="mb-8 grid gap-4 sm:grid-cols-3">
		<Card>
			<CardHeader class="flex flex-row items-center justify-between pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Credit Balance</CardTitle>
				<Coins class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-3xl font-bold text-foreground">{data.credits.toLocaleString()}</div>
				<p class="mt-1 text-xs text-muted-foreground">Available credits</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Monthly Usage</CardTitle>
				<TrendingUp class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-3xl font-bold text-foreground">{data.monthlyUsage.toLocaleString()}</div>
				<p class="mt-1 text-xs text-muted-foreground">Cards generated this month</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Total Generations</CardTitle>
				<CreditCard class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-3xl font-bold text-foreground">
					{data.totalGenerations.toLocaleString()}
				</div>
				<p class="mt-1 text-xs text-muted-foreground">All-time cards generated</p>
			</CardContent>
		</Card>
	</div>

	<!-- Buy Credits -->
	<div class="mb-8">
		<Button href="/pricing">
			<Coins class="mr-2 h-4 w-4" />
			Buy Credits
		</Button>
	</div>

	<!-- Transaction History -->
	<Card>
		<CardHeader>
			<CardTitle class="text-lg">Transaction History</CardTitle>
		</CardHeader>
		<CardContent>
			{#if data.transactions.length === 0}
				<div class="flex flex-col items-center justify-center py-12 text-center">
					<Coins class="mb-3 h-10 w-10 text-muted-foreground/40" />
					<p class="text-muted-foreground">No transactions yet</p>
					<p class="mt-1 text-sm text-muted-foreground/70">
						Purchase credits to start generating ID cards
					</p>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b text-left text-muted-foreground">
								<th class="pb-3 pr-4 font-medium">Date</th>
								<th class="pb-3 pr-4 font-medium">Type</th>
								<th class="pb-3 pr-4 font-medium text-right">Amount</th>
								<th class="pb-3 pr-4 font-medium text-right">Balance After</th>
								<th class="pb-3 font-medium">Description</th>
							</tr>
						</thead>
						<tbody class="divide-y">
							{#each data.transactions as tx}
								<tr class="text-foreground">
									<td class="py-3 pr-4 whitespace-nowrap text-muted-foreground">
										{tx.createdAt ? formatDate(tx.createdAt) : '—'}
									</td>
									<td class="py-3 pr-4">
										<Badge
											variant={getBadgeVariant(tx.transactionType)}
											class={getBadgeClass(tx.transactionType)}
										>
											{tx.transactionType}
										</Badge>
									</td>
									<td class="py-3 pr-4 text-right font-mono whitespace-nowrap">
										{#if tx.transactionType === 'usage'}
											<span class="flex items-center justify-end gap-1 text-red-600 dark:text-red-400">
												<ArrowDownRight class="h-3 w-3" />
												{formatAmount(tx.amount, tx.transactionType)}
											</span>
										{:else}
											<span class="flex items-center justify-end gap-1 text-green-600 dark:text-green-400">
												<ArrowUpRight class="h-3 w-3" />
												{formatAmount(tx.amount, tx.transactionType)}
											</span>
										{/if}
									</td>
									<td class="py-3 pr-4 text-right font-mono">
										{tx.creditsAfter}
									</td>
									<td class="py-3 text-muted-foreground max-w-[200px] truncate" title={tx.description}>
										{tx.description || '--'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
