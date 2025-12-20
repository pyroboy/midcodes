<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { paymentFlags } from '$lib/stores/featureFlags';
	import DashboardStatsCard from '$lib/components/DashboardStatsCard.svelte';
	import { formatDate } from '$lib/utils/dateFormat';

	// Import remote functions
	import { getUserCredits, getDashboardStats, getCreditHistory } from './data.remote';

	function getTransactionTypeColor(type: string): string {
		switch (type) {
			case 'purchase':
				return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
			case 'usage':
				return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
			case 'refund':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
			case 'bonus':
				return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
		}
	}

	function getTransactionTypeIcon(type: string): string {
		switch (type) {
			case 'purchase':
				return 'M12 6v6m0 0v6m0-6h6m-6 0H6';
			case 'usage':
				return 'M20 12H4';
			case 'refund':
				return 'M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V9a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2z';
			case 'bonus':
				return 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z';
			default:
				return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1';
		}
	}

	interface Transaction {
		transaction_type: string;
		description: string;
		amount: number;
		credits_after: number;
		created_at: string;
		reference_id?: string;
	}
</script>

<svelte:head>
	<title>My Account - ID Generator</title>
	<meta
		name="description"
		content="Manage your accounts, view credits balance, and track your transaction history."
	/>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<!-- Account Overview -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Account</h1>
		<p class="text-gray-600 dark:text-gray-300">
			Manage your credits, premium features, and view your transaction history.
		</p>
	</div>

	<!-- Dashboard Stats -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
		{#await getDashboardStats()}
			<!-- Stats Skeleton -->
			{#each Array(4) as _}
				<div class="bg-card border border-border rounded-xl p-4 animate-pulse">
					<div class="h-4 w-24 bg-muted rounded mb-2"></div>
					<div class="h-8 w-16 bg-muted rounded"></div>
				</div>
			{/each}
		{:then stats}
			<DashboardStatsCard
				title="Total IDs Created"
				value={stats.totalCards}
				icon="id-card"
				href="/all-ids"
			/>
			<DashboardStatsCard
				title="Templates Available"
				value={stats.totalTemplates}
				icon="layout-template"
				href="/templates"
			/>
			<DashboardStatsCard
				title="Recent Activity"
				value={stats.recentCardsCount}
				icon="trending-up"
			/>
			<DashboardStatsCard title="This Week" value={stats.weeklyCards} icon="calendar" />
		{:catch error}
			<div class="col-span-4 text-red-500">Error loading stats</div>
		{/await}
	</div>

	<!-- Credits & Features -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
		{#await getUserCredits()}
			<!-- Credits Skeleton -->
			{#each Array(3) as _, i}
				<Card
					class="animate-pulse {i === 0
						? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20'
						: i === 1
							? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
							: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20'}"
				>
					<CardContent class="p-6">
						<div class="h-4 w-24 bg-muted/50 rounded mb-2"></div>
						<div class="h-10 w-20 bg-muted/50 rounded"></div>
					</CardContent>
				</Card>
			{/each}
		{:then userCredits}
			<!-- Credits Balance -->
			<Card
				class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800"
			>
				<CardContent class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-blue-600 dark:text-blue-400">Credits Balance</p>
							<p class="text-3xl font-bold text-blue-900 dark:text-blue-100">
								{userCredits?.credits_balance || 0}
							</p>
						</div>
						<div
							class="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6 text-blue-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
								/>
							</svg>
						</div>
					</div>
					<p class="text-sm text-blue-700 dark:text-blue-300 mt-2">Available for card generation</p>
				</CardContent>
			</Card>

			<!-- Cards Generated -->
			<Card
				class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800"
			>
				<CardContent class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-green-600 dark:text-green-400">Cards Generated</p>
							<p class="text-3xl font-bold text-green-900 dark:text-green-100">
								{userCredits?.card_generation_count || 0}
							</p>
						</div>
						<div
							class="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6 text-green-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-4 0V4a2 2 0 014 0v2"
								/>
							</svg>
						</div>
					</div>
					<p class="text-sm text-green-700 dark:text-green-300 mt-2">
						{(userCredits?.card_generation_count || 0) < 10
							? `${10 - (userCredits?.card_generation_count || 0)} free left`
							: 'Using paid credits'}
					</p>
				</CardContent>
			</Card>

			<!-- Templates Created -->
			<Card
				class="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800"
			>
				<CardContent class="p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-purple-600 dark:text-purple-400">
								Templates Created
							</p>
							<p class="text-3xl font-bold text-purple-900 dark:text-purple-100">
								{userCredits?.template_count || 0}
							</p>
						</div>
						<div
							class="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6 text-purple-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
								/>
							</svg>
						</div>
					</div>
					<p class="text-sm text-purple-700 dark:text-purple-300 mt-2">
						{userCredits?.unlimited_templates
							? 'Unlimited templates'
							: `${Math.max(0, 2 - (userCredits?.template_count || 0))} free left`}
					</p>
				</CardContent>
			</Card>
		{:catch error}
			<div class="col-span-3 text-red-500">Error loading credits</div>
		{/await}
	</div>

	<!-- Premium Features & Quick Actions -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
		<!-- Premium Features Status -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
						/>
					</svg>
					Premium Features
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				{#await getUserCredits()}
					<div class="space-y-3">
						{#each Array(2) as _}
							<div
								class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse"
							>
								<div class="flex items-center gap-3">
									<div class="w-8 h-8 bg-muted rounded-full"></div>
									<div>
										<div class="h-4 w-32 bg-muted rounded mb-1"></div>
										<div class="h-3 w-24 bg-muted rounded"></div>
									</div>
								</div>
								<div class="h-6 w-16 bg-muted rounded"></div>
							</div>
						{/each}
					</div>
				{:then userCredits}
					<!-- Unlimited Templates -->
					<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
						<div class="flex items-center gap-3">
							<div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-primary"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
									/>
								</svg>
							</div>
							<div>
								<p class="font-medium">Unlimited Templates</p>
								<p class="text-sm text-gray-600 dark:text-gray-400">
									Create unlimited custom templates
								</p>
							</div>
						</div>
						<div>
							{#if userCredits?.unlimited_templates}
								<Badge class="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
									>Active</Badge
								>
							{:else if !$paymentFlags.paymentsEnabled}
								<div class="text-xs text-gray-500 dark:text-gray-400 text-center max-w-32">
									Contact admin
								</div>
							{:else}
								<Button href="/pricing" size="sm" variant="outline">Upgrade</Button>
							{/if}
						</div>
					</div>

					<!-- Remove Watermarks -->
					<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
						<div class="flex items-center gap-3">
							<div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-primary"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
							</div>
							<div>
								<p class="font-medium">Remove Watermarks</p>
								<p class="text-sm text-gray-600 dark:text-gray-400">Clean, professional output</p>
							</div>
						</div>
						<div>
							{#if userCredits?.remove_watermarks}
								<Badge class="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
									>Active</Badge
								>
							{:else if !$paymentFlags.paymentsEnabled}
								<div class="text-xs text-gray-500 dark:text-gray-400 text-center max-w-32">
									Contact admin
								</div>
							{:else}
								<Button href="/pricing" size="sm" variant="outline">Upgrade</Button>
							{/if}
						</div>
					</div>
				{:catch}
					<div class="text-red-500">Error loading features</div>
				{/await}
			</CardContent>
		</Card>

		<!-- Quick Actions -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
					Quick Actions
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-3">
				{#if !$paymentFlags.paymentsEnabled}
					<div
						class="w-full px-3 py-2 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md"
					>
						Credits: Contact admin for provisioning
					</div>
				{:else}
					<Button href="/pricing" class="w-full" variant="default">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 mr-2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
							/>
						</svg>
						Buy Credits
					</Button>
				{/if}

				<Button href="/templates" class="w-full" variant="outline">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 mr-2"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					Browse Templates
				</Button>

				<Button href="/all-ids" class="w-full" variant="outline">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 mr-2"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-4 0V4a2 2 0 014 0v2"
						/>
					</svg>
					View My IDs
				</Button>
			</CardContent>
		</Card>
	</div>

	<!-- Transaction History -->
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<CardTitle class="flex items-center gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
					Transaction History
				</CardTitle>
				<p class="text-sm text-gray-500 dark:text-gray-400">Last 30 transactions</p>
			</div>
		</CardHeader>
		<CardContent>
			{#await getCreditHistory()}
				<!-- History Skeleton -->
				<div class="space-y-3">
					{#each Array(5) as _}
						<div
							class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse"
						>
							<div class="flex items-center gap-3">
								<div class="h-6 w-16 bg-muted rounded"></div>
								<div>
									<div class="h-4 w-32 bg-muted rounded mb-1"></div>
									<div class="h-3 w-24 bg-muted rounded"></div>
								</div>
							</div>
							<div class="h-4 w-12 bg-muted rounded"></div>
						</div>
					{/each}
				</div>
			{:then creditHistory}
				{#if creditHistory.length > 0}
					<!-- Desktop Table -->
					<div class="hidden md:block overflow-x-auto">
						<table class="w-full">
							<thead>
								<tr class="border-b border-gray-200 dark:border-gray-700">
									<th
										class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
										>Type</th
									>
									<th
										class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
										>Description</th
									>
									<th
										class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
										>Amount</th
									>
									<th
										class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
										>Balance</th
									>
									<th
										class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
										>Date</th
									>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
								{#each creditHistory as unknown as Transaction[] as transaction}
									<tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
										<td class="px-4 py-4 whitespace-nowrap">
											<Badge
												class="{getTransactionTypeColor(
													transaction.transaction_type
												)} flex items-center gap-1 w-fit"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-3 w-3"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d={getTransactionTypeIcon(transaction.transaction_type)}
													/>
												</svg>
												{transaction.transaction_type}
											</Badge>
										</td>
										<td class="px-4 py-4">
											<div class="text-sm font-medium text-gray-900 dark:text-white">
												{transaction.description || 'Transaction'}
											</div>
											{#if transaction.reference_id}
												<div class="text-xs text-gray-500 dark:text-gray-400 font-mono">
													Ref: {transaction.reference_id.slice(0, 16)}...
												</div>
											{/if}
										</td>
										<td class="px-4 py-4 whitespace-nowrap">
											<span
												class="text-sm font-medium {transaction.amount >= 0
													? 'text-green-600 dark:text-green-400'
													: 'text-red-600 dark:text-red-400'}"
											>
												{transaction.amount >= 0 ? '+' : ''}{transaction.amount}
											</span>
										</td>
										<td class="px-4 py-4 whitespace-nowrap">
											<span class="text-sm text-gray-900 dark:text-white font-medium">
												{transaction.credits_after}
											</span>
										</td>
										<td
											class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
										>
											{formatDate(transaction.created_at)}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- Mobile Cards -->
					<div class="md:hidden space-y-4">
						{#each creditHistory as unknown as Transaction[] as transaction}
							<div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
								<div class="flex items-center justify-between mb-2">
									<Badge
										class="{getTransactionTypeColor(
											transaction.transaction_type
										)} flex items-center gap-1"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-3 w-3"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d={getTransactionTypeIcon(transaction.transaction_type)}
											/>
										</svg>
										{transaction.transaction_type}
									</Badge>
									<span
										class="text-sm font-medium {transaction.amount >= 0
											? 'text-green-600 dark:text-green-400'
											: 'text-red-600 dark:text-red-400'}"
									>
										{transaction.amount >= 0 ? '+' : ''}{transaction.amount}
									</span>
								</div>
								<p class="text-sm font-medium text-gray-900 dark:text-white mb-1">
									{transaction.description || 'Transaction'}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">
									Balance: {transaction.credits_after} • {formatDate(transaction.created_at)}
								</p>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-12">
						<div
							class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-8 w-8 text-gray-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
								/>
							</svg>
						</div>
						<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
							No transactions yet
						</h3>
						<p class="text-gray-500 dark:text-gray-400 mb-4">
							Your credit purchases and usage will appear here.
						</p>
						{#if !$paymentFlags.paymentsEnabled}
							<div
								class="px-4 py-2 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md inline-block"
							>
								Purchases temporarily disabled. Contact admin for manual provisioning.
							</div>
						{:else}
							<Button href="/pricing">Buy Your First Credits</Button>
						{/if}
					</div>
				{/if}
			{:catch error}
				<div class="text-red-500 text-center py-8">Error loading transaction history</div>
			{/await}
		</CardContent>
	</Card>
</div>
