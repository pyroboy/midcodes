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
		data: PageData;
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
				<CardTitle class="text-sm font-medium">Total ID Cards</CardTitle>
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
					<div class="text-2xl font-bold">0</div>
					<p class="text-xs text-muted-foreground">0 new this month</p>
				{:then data}
					<div class="text-2xl font-bold">{data?.stats?.totalCards || 0}</div>
					<p class="text-xs text-muted-foreground">
						{data?.stats?.newCardsThisMonth || 0} new this month
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
					<div class="text-2xl font-bold">0</div>
					<p class="text-xs text-muted-foreground">0 admins, 0 active</p>
				{:then data}
					{@const users = data?.users || []}
					{@const userStats = {
						total: users.length,
						admins: users.filter(
							(u) => u.role && ['super_admin', 'org_admin', 'id_gen_admin'].includes(u.role)
						).length,
						active: users.filter((u) => {
							const lastSeen = new Date(u.updated_at);
							const thirtyDaysAgo = new Date();
							thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
							return lastSeen > thirtyDaysAgo;
						}).length
					}}
					<div class="text-2xl font-bold">{userStats.total}</div>
					<p class="text-xs text-muted-foreground">
						{userStats.admins} admins, {userStats.active} active
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
					<div class="text-2xl font-bold">0</div>
					<p class="text-xs text-muted-foreground">No templates</p>
				{:then data}
					{@const templates = data?.templates || []}
					{@const templateStats = {
						total: templates.length,
						mostUsed: templates.length > 0 ? templates[0] : null
					}}
					<div class="text-2xl font-bold">{templateStats.total}</div>
					<p class="text-xs text-muted-foreground">
						{templateStats.mostUsed?.name || 'No templates'} most used
					</p>
				{/await}
			</CardContent>
		</Card>

		<!-- Payments -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Payments</CardTitle>
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
						d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
					/>
				</svg>
			</CardHeader>
			<CardContent class="space-y-2">
				{#await billing}
					<div class="text-2xl font-bold">Loading...</div>
					<p class="text-xs text-muted-foreground">Bypass: Loading...</p>
				{:then billingData}
					<div class="text-2xl font-bold">
						{billingData?.payments_enabled ? 'Enabled' : 'Disabled'}
					</div>
					<p class="text-xs text-muted-foreground">
						Bypass: {billingData?.payments_bypass ? 'On (simulated)' : 'Off'}
					</p>
				{/await}

				<div class="mt-2 space-y-2">
					<input
						placeholder="Type TOGGLE_PAYMENTS"
						bind:value={keyword}
						class="w-full border rounded px-2 py-1 text-sm"
					/>
					<div class="flex gap-2">
						{#await billing}
							<Button variant="outline" disabled>Loading...</Button>
							<Button variant="outline" disabled>Loading...</Button>
						{:then billingData}
							<Button
								variant="outline"
								disabled={keyword !== 'TOGGLE_PAYMENTS'}
								onclick={() => {
									desiredEnabled = !billingData?.payments_enabled;
									onTogglePayments();
								}}
							>
								{billingData?.payments_enabled ? 'Disable Payments' : 'Enable Payments'}
							</Button>

							<Button
								variant={billingData?.payments_bypass ? 'secondary' : 'outline'}
								onclick={() => onToggleBypass(!billingData?.payments_bypass)}
							>
								{billingData?.payments_bypass ? 'Disable Bypass' : 'Enable Bypass'}
							</Button>
						{/await}
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Organization Status -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Organization</CardTitle>
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
				<div class="text-2xl font-bold">Active</div>
				<p class="text-xs text-muted-foreground">
					Since {data.organization ? formatDate(data.organization.created_at, 'date') : 'Unknown'}
				</p>
			</CardContent>
		</Card>
	</div>

	<!-- Recent Activity and Quick Actions -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Recent Activity -->
		<Card>
			<CardHeader>
				<CardTitle>Recent Activity</CardTitle>
				<CardDescription>Latest ID card generations and user activities</CardDescription>
			</CardHeader>
			<CardContent>
				{#await dashboardData}
					<p class="text-sm text-muted-foreground">Loading recent activity...</p>
				{:then data}
					{@const recentActivity = data?.recentActivity || []}
					{#if recentActivity && recentActivity.length > 0}
						<div class="space-y-4">
							{#each recentActivity.slice(0, 5) as activity}
								<div class="flex items-center justify-between">
									<div class="flex items-center space-x-3">
										<div class="flex-shrink-0">
											{#if activity.type === 'card_generated'}
												<div
													class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"
												>
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
												<div
													class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"
												>
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
												<div
													class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
												>
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
											p class="text-xs text-muted-foreground"{formatDate(activity.created_at, 'date')}/p
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-muted-foreground">No recent activity to display.</p>
					{/if}
				{/await}
			</CardContent>
		</Card>

		<!-- Quick Actions -->
		<Card>
			<CardHeader>
				<CardTitle>Quick Actions</CardTitle>
				<CardDescription>Common administrative tasks</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 gap-3">
					<Button href="/admin/users" variant="outline" class="justify-start">
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
								d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
							/>
						</svg>
						Add New User
					</Button>

					<Button href="/templates" variant="outline" class="justify-start">
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

					<Button href="/admin/organization" variant="outline" class="justify-start">
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
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
						Organization Settings
					</Button>

					<Button href="/admin/analytics" variant="outline" class="justify-start">
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
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
						View Analytics
					</Button>

					<Button href="/admin/credits" variant="outline" class="justify-start">
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
								d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
							/>
						</svg>
						Manage Credits
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>
</div>
