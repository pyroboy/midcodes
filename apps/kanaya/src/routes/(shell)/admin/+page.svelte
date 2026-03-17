<script lang="ts">
	import type { PageData } from './$types';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { getAdminDashboardData } from '$lib/remote/admin.remote';
	import {
		getBillingSettings,
		togglePayments,
		setPaymentsBypass
	} from '$lib/remote/billing.remote';

	interface Props {
		data: PageData & { organization?: any };
	}

	let { data }: Props = $props();

	// Use remote function to get dashboard data
	const dashboardData = getAdminDashboardData();
	let billing = getBillingSettings();
	let keyword = $state('');
	let desiredEnabled: boolean = false;

	async function onTogglePayments() {
		await togglePayments({ enabled: desiredEnabled, keyword });
		keyword = '';
		await getBillingSettings().refresh();
	}

	async function onToggleBypass(bypass: boolean) {
		await setPaymentsBypass({ bypass });
	}

	import { formatDate } from '$lib/utils/dateFormat';
</script>

<div class="space-y-8">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
			<p class="text-muted-foreground">
				Overview of your organization's ID generator usage and management.
			</p>
		</div>
		<div class="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
			<Button href="/admin/users" variant="outline">
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
						d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
					/>
				</svg>
				Manage Users
			</Button>
			<Button href="/templates">
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
						d="M12 6v6m0 0v6m0-6h6m-6 0H6"
					/>
				</svg>
				Create Template
			</Button>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		<!-- Total ID Cards -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">ID Cards</CardTitle>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-muted-foreground"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 4h6V3H9v1zm-2 3v12h10V7H7z"
					/>
				</svg>
			</CardHeader>
			<CardContent>
				{#await dashboardData}
					<div class="text-2xl font-bold">...</div>
					<p class="text-xs text-muted-foreground">Loading stats...</p>
				{:then data}
					<div class="text-2xl font-bold">{data?.stats?.totalCards || 0}</div>
					<p class="text-xs text-muted-foreground">
						+{data?.stats?.newCardsToday || 0} today
					</p>
				{/await}
			</CardContent>
		</Card>

		<!-- Revenue (Orders) -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Revenue</CardTitle>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-muted-foreground"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</CardHeader>
			<CardContent>
				{#await dashboardData}
					<div class="text-2xl font-bold">...</div>
					<p class="text-xs text-muted-foreground">Loading stats...</p>
				{:then data}
					<!-- Assuming currency is in base unit or formatted elsewhere, usually simple display here -->
					<div class="text-2xl font-bold">
						{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(
							data?.stats?.totalRevenue || 0
						)}
					</div>
					<p class="text-xs text-muted-foreground">
						{data?.stats?.paidInvoicesCount || 0} paid orders
					</p>
				{/await}
			</CardContent>
		</Card>

		<!-- Credits -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Credits</CardTitle>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-muted-foreground"
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
			</CardHeader>
			<CardContent>
				{#await dashboardData}
					<div class="text-2xl font-bold">...</div>
					<p class="text-xs text-muted-foreground">Loading stats...</p>
				{:then data}
					<div class="text-2xl font-bold">{data?.stats?.totalCredits || 0}</div>
					<p class="text-xs text-muted-foreground">
						{data?.stats?.creditsUsedToday || 0} used today
					</p>
				{/await}
			</CardContent>
		</Card>

		<!-- Total Users -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Users</CardTitle>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-muted-foreground"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
					/>
				</svg>
			</CardHeader>
			<CardContent>
				{#await dashboardData}
					<div class="text-2xl font-bold">...</div>
					<p class="text-xs text-muted-foreground">Loading stats...</p>
				{:then data}
					{@const users = data?.users || []}
					{@const activeCount = users.filter((u) => {
						const lastSeen = new Date(u.updated_at);
						const thirtyDaysAgo = new Date();
						thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
						return lastSeen > thirtyDaysAgo;
					}).length}
					<div class="text-2xl font-bold">{data?.stats?.totalUsers || 0}</div>
					<p class="text-xs text-muted-foreground">
						{activeCount} active recently
					</p>
				{/await}
			</CardContent>
		</Card>

		<!-- Templates -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Templates</CardTitle>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-muted-foreground"
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
			</CardHeader>
			<CardContent>
				{#await dashboardData}
					<div class="text-2xl font-bold">...</div>
					<p class="text-xs text-muted-foreground">Loading stats...</p>
				{:then data}
					<div class="text-2xl font-bold">{data?.stats?.totalTemplates || 0}</div>
					<p class="text-xs text-muted-foreground">Available designs</p>
				{/await}
			</CardContent>
		</Card>

		<!-- Template Assets -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Template Assets</CardTitle>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-muted-foreground"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
					/>
				</svg>
			</CardHeader>
			<CardContent>
				{#await dashboardData}
					<div class="text-2xl font-bold">...</div>
					<p class="text-xs text-muted-foreground">Loading stats...</p>
				{:then data}
					<div class="text-2xl font-bold">{data?.stats?.totalTemplateAssets || 0}</div>
					<p class="text-xs text-muted-foreground">
						{data?.stats?.publishedTemplateAssets || 0} published
					</p>
				{/await}
			</CardContent>
		</Card>

		<!-- Organizations -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Organizations</CardTitle>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-muted-foreground"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
					/>
				</svg>
			</CardHeader>
			<CardContent>
				{#await dashboardData}
					<div class="text-2xl font-bold">...</div>
					<p class="text-xs text-muted-foreground">Loading stats...</p>
				{:then data}
					<div class="text-2xl font-bold">{data?.stats?.totalOrgs || 0}</div>
					<p class="text-xs text-muted-foreground">Registered orgs</p>
				{/await}
			</CardContent>
		</Card>
	</div>

	<!-- Admin Sections -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<!-- Management -->
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
							d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
					Management
				</CardTitle>
				<CardDescription>Core administrative tasks</CardDescription>
			</CardHeader>
			<CardContent class="grid gap-2">
				<Button href="/admin/users" variant="outline" class="justify-start h-auto py-3 px-4">
					<div class="flex flex-col items-start text-left">
						<span class="font-semibold">Manage Users</span>
						<span class="text-xs text-muted-foreground font-normal"
							>View and edit user accounts</span
						>
					</div>
				</Button>
				<Button href="/admin/roles" variant="outline" class="justify-start h-auto py-3 px-4">
					<div class="flex flex-col items-start text-left">
						<span class="font-semibold">Roles & Permissions</span>
						<span class="text-xs text-muted-foreground font-normal">Manage access control</span>
					</div>
				</Button>
				<Button href="/admin/organization" variant="outline" class="justify-start h-auto py-3 px-4">
					<div class="flex flex-col items-start text-left">
						<span class="font-semibold">Organization</span>
						<span class="text-xs text-muted-foreground font-normal">Settings and details</span>
					</div>
				</Button>
				<Button href="/admin/invoices" variant="outline" class="justify-start h-auto py-3 px-4">
					<div class="flex flex-col items-start text-left">
						<span class="font-semibold">Invoices</span>
						<span class="text-xs text-muted-foreground font-normal">Billing history</span>
					</div>
				</Button>
				<Button href="/admin/credits" variant="outline" class="justify-start h-auto py-3 px-4">
					<div class="flex flex-col items-start text-left">
						<span class="font-semibold">Credits</span>
						<span class="text-xs text-muted-foreground font-normal">Manage credit allocation</span>
					</div>
				</Button>
				<Button href="/admin/docs" variant="outline" class="justify-start h-auto py-3 px-4">
					<div class="flex flex-col items-start text-left">
						<span class="font-semibold">Documentation Hub</span>
						<span class="text-xs text-muted-foreground font-normal">Internal knowledge base</span>
					</div>
				</Button>
			</CardContent>
		</Card>

		<!-- Content -->
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
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
					Content
				</CardTitle>
				<CardDescription>Templates and assets</CardDescription>
			</CardHeader>
			<CardContent class="grid gap-2">
				<Button href="/templates" variant="outline" class="justify-start h-auto py-3 px-4">
					<div class="flex flex-col items-start text-left">
						<span class="font-semibold">ID Templates</span>
						<span class="text-xs text-muted-foreground font-normal">Create and edit templates</span>
					</div>
				</Button>
				<Button
					href="/admin/template-assets/manage"
					variant="outline"
					class="justify-start h-auto py-3 px-4"
				>
					<div class="flex flex-col items-start text-left">
						<span class="font-semibold">Manage Assets</span>
						<span class="text-xs text-muted-foreground font-normal">Organize uploaded assets</span>
					</div>
				</Button>
				<Button
					href="/admin/upload-custom-id"
					variant="outline"
					class="justify-start h-auto py-3 px-4"
				>
					<div class="flex flex-col items-start text-left">
						<span class="font-semibold">Upload Custom ID</span>
						<span class="text-xs text-muted-foreground font-normal">Import existing designs</span>
					</div>
				</Button>
			</CardContent>
		</Card>

		<!-- Tools -->
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
							d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
						/>
					</svg>
					Dev Tools
				</CardTitle>
				<CardDescription>Utilities and debugging</CardDescription>
			</CardHeader>
			<CardContent class="grid gap-2">
				<Button
					href="/admin/template-assets"
					variant="outline"
					class="justify-start h-auto py-3 px-4"
				>
					<div class="flex flex-col items-start text-left">
						<span class="font-semibold">Detect Templates</span>
						<span class="text-xs text-muted-foreground font-normal">Asset detection wizard</span>
					</div>
				</Button>
				<Button
					href="/admin/overlay-batch"
					variant="outline"
					class="justify-start h-auto py-3 px-4"
				>
					<div class="flex flex-col items-start text-left">
						<span class="font-semibold">Batch Overlay</span>
						<span class="text-xs text-muted-foreground font-normal">Bulk ID processing</span>
					</div>
				</Button>
				<Button href="/test-3d" variant="outline" class="justify-start h-auto py-3 px-4">
					<div class="flex flex-col items-start text-left">
						<span class="font-semibold">3D Card Test</span>
						<span class="text-xs text-muted-foreground font-normal">Test 3D rendering</span>
					</div>
				</Button>
				<Button href="/font-test" variant="outline" class="justify-start h-auto py-3 px-4">
					<div class="flex flex-col items-start text-left">
						<span class="font-semibold">Font Test</span>
						<span class="text-xs text-muted-foreground font-normal">Check font loading</span>
					</div>
				</Button>
				<Button href="/debug-user" variant="outline" class="justify-start h-auto py-3 px-4">
					<div class="flex flex-col items-start text-left">
						<span class="font-semibold">User Debugger</span>
						<span class="text-xs text-muted-foreground font-normal">Inspect user permissions</span>
					</div>
				</Button>
			</CardContent>
		</Card>
	</div>

	<!-- Recent Activity -->
	<Card>
		<CardHeader>
			<CardTitle>Recent Activity</CardTitle>
			<CardDescription>Latest ID card generations and user activities</CardDescription>
		</CardHeader>
		<CardContent>
			{@const recentActivity = data?.recentActivity || []}
			{#if recentActivity && recentActivity.length > 0}
				<div class="space-y-4">
					{#each recentActivity.slice(0, 10) as activity}
						<div class="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
							<div class="flex items-center space-x-3">
								<div class="flex-shrink-0">
									{#if activity.type === 'card_generated'}
										<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
											<svg
												class="w-4 h-4 text-green-600"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
												></path>
											</svg>
										</div>
									{:else if activity.type === 'user_added'}
										<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
											<svg
												class="w-4 h-4 text-blue-600"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
												></path>
											</svg>
										</div>
									{:else}
										<div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
											<svg
												class="w-4 h-4 text-gray-600"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
												></path>
											</svg>
										</div>
									{/if}
								</div>
								<div>
									<p class="text-sm font-medium">{activity.description}</p>
									<p class="text-xs text-muted-foreground">
										{formatDate(activity.created_at, 'date')}
									</p>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-muted-foreground">No recent activity to display.</p>
			{/if}
		</CardContent>
	</Card>
</div>
