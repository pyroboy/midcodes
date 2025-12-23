<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import SuperAdminAccessPrompt from '$lib/components/SuperAdminAccessPrompt.svelte';
	import BypassWarningBanner from '$lib/components/BypassWarningBanner.svelte';
	import type { PageData } from './$types';

	// Type definitions
	interface Organization {
		id: string;
		name: string;
		created_at: string | null;
		updated_at: string | null;
		memberCount: number;
		cardCount: number;
		templateCount: number;
	}

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Cast data with proper types
	const organizations = $derived((data.organizations || []) as Organization[]);
	const globalStats = $derived(
		data.globalStats as {
			totalOrganizations: number;
			totalMembers: number;
			totalCards: number;
			totalTemplates: number;
		} | null
	);

	// UI State
	let searchQuery = $state('');
	let successMessage = $state('');
	let errorMessage = $state('');
	let isLoading = $state(false);
	let showCreateModal = $state(false);
	let newOrgName = $state('');

	// Derived data
	let filteredOrganizations = $derived(
		organizations.filter(
			(org) =>
				!searchQuery ||
				org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				org.id.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	async function createOrganization() {
		if (!newOrgName.trim()) {
			errorMessage = 'Organization name is required';
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			// TODO: Implement create organization remote function
			successMessage = `Organization "${newOrgName}" created successfully`;
			newOrgName = '';
			showCreateModal = false;
		} catch (err) {
			errorMessage = 'Failed to create organization';
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	async function deleteOrganization(orgId: string, orgName: string) {
		if (
			!confirm(
				`Are you sure you want to delete "${orgName}"? This action cannot be undone and will delete all associated data.`
			)
		) {
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			// TODO: Implement delete organization remote function
			successMessage = `Organization "${orgName}" deleted successfully`;
		} catch (err) {
			errorMessage = 'Failed to delete organization';
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	// Clear messages after 5 seconds
	$effect(() => {
		if (successMessage || errorMessage) {
			const timer = setTimeout(() => {
				successMessage = '';
				errorMessage = '';
			}, 5000);
			return () => clearTimeout(timer);
		}
	});

	// Check for access denied or bypassed access states
	const accessDenied = $derived((data as any).accessDenied as boolean | undefined);
	const bypassedAccess = $derived((data as any).bypassedAccess as boolean | undefined);
	const requiredRole = $derived((data as any).requiredRole as string | undefined);
	const currentRole = $derived((data as any).currentRole as string | undefined);
	const emulatedRole = $derived((data as any).emulatedRole as string | undefined);
	const originalRole = $derived((data as any).originalRole as string | undefined);
</script>

<!-- Show access denied prompt for super admins who need to bypass -->
{#if accessDenied}
	<SuperAdminAccessPrompt
		requiredRole={requiredRole || 'super_admin'}
		{currentRole}
		{emulatedRole}
	/>
{:else}
	<!-- Show bypass warning banner when accessing via bypass -->
	{#if bypassedAccess}
		<BypassWarningBanner requiredRole={requiredRole || 'super_admin'} {originalRole} />
	{/if}

	<div class="space-y-8">
		<!-- Header -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Organizations</h1>
				<p class="text-muted-foreground mt-1">Manage all organizations in the system</p>
			</div>
			<Button onclick={() => (showCreateModal = true)}>
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
				Create Organization
			</Button>
		</div>

		<!-- Success/Error Messages -->
		{#if successMessage}
			<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
				<div class="flex">
					<svg class="flex-shrink-0 h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
					<div class="ml-3">
						<p class="text-sm font-medium">{successMessage}</p>
					</div>
				</div>
			</div>
		{/if}

		{#if errorMessage}
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
				<div class="flex">
					<svg class="flex-shrink-0 h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
					<div class="ml-3">
						<p class="text-sm font-medium">{errorMessage}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Global Stats -->
		<div class="grid gap-6 md:grid-cols-4">
			<Card>
				<CardHeader class="pb-2">
					<CardDescription>Total Organizations</CardDescription>
					<CardTitle class="text-4xl">{globalStats?.totalOrganizations || 0}</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-xs text-muted-foreground">Active organizations</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader class="pb-2">
					<CardDescription>Total Members</CardDescription>
					<CardTitle class="text-4xl">{globalStats?.totalMembers || 0}</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-xs text-muted-foreground">Users across all orgs</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader class="pb-2">
					<CardDescription>Total ID Cards</CardDescription>
					<CardTitle class="text-4xl">{globalStats?.totalCards || 0}</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-xs text-muted-foreground">Cards across all orgs</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader class="pb-2">
					<CardDescription>Total Templates</CardDescription>
					<CardTitle class="text-4xl">{globalStats?.totalTemplates || 0}</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-xs text-muted-foreground">Templates across all orgs</p>
				</CardContent>
			</Card>
		</div>

		<!-- Organizations List -->
		<Card>
			<CardHeader>
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<CardTitle>All Organizations ({organizations.length})</CardTitle>
						<CardDescription>View and manage all organizations</CardDescription>
					</div>
					<Input
						placeholder="Search organizations..."
						bind:value={searchQuery}
						class="w-full sm:w-64"
					/>
				</div>
			</CardHeader>
			<CardContent>
				{#if filteredOrganizations.length > 0}
					<div class="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Organization</TableHead>
									<TableHead class="text-center">Members</TableHead>
									<TableHead class="text-center">Cards</TableHead>
									<TableHead class="text-center">Templates</TableHead>
									<TableHead>Created</TableHead>
									<TableHead class="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each filteredOrganizations as org (org.id)}
									<TableRow>
										<TableCell>
											<div>
												<p class="font-medium">{org.name}</p>
												<p class="text-xs text-muted-foreground font-mono">{org.id}</p>
											</div>
										</TableCell>
										<TableCell class="text-center">
											<span
												class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
											>
												{org.memberCount}
											</span>
										</TableCell>
										<TableCell class="text-center">
											<span
												class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
											>
												{org.cardCount}
											</span>
										</TableCell>
										<TableCell class="text-center">
											<span
												class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
											>
												{org.templateCount}
											</span>
										</TableCell>
										<TableCell>{formatDate(org.created_at)}</TableCell>
										<TableCell class="text-right">
											<div class="flex justify-end gap-2">
												<Button
													size="sm"
													variant="outline"
													onclick={() => {
														// TODO: Navigate to org details or open modal
														console.log('View org:', org.id);
													}}
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-4 w-4"
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
												</Button>
												<Button
													size="sm"
													variant="outline"
													onclick={() => {
														// TODO: Open edit modal
														console.log('Edit org:', org.id);
													}}
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-4 w-4"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
														/>
													</svg>
												</Button>
												<Button
													size="sm"
													variant="destructive"
													onclick={() => deleteOrganization(org.id, org.name)}
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-4 w-4"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
												</Button>
											</div>
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>
				{:else}
					<div class="text-center py-8 text-muted-foreground">
						{#if searchQuery}
							No organizations found matching "{searchQuery}"
						{:else}
							No organizations found
						{/if}
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>

	<!-- Create Organization Modal -->
	{#if showCreateModal}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
			onclick={() => (showCreateModal = false)}
		>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="bg-background rounded-lg shadow-xl max-w-md w-full p-6"
				onclick={(e) => e.stopPropagation()}
			>
				<h2 class="text-xl font-bold mb-4">Create New Organization</h2>
				<div class="space-y-4">
					<div>
						<label for="org-name" class="block text-sm font-medium mb-1">Organization Name</label>
						<Input id="org-name" bind:value={newOrgName} placeholder="Enter organization name" />
					</div>
					<div class="flex justify-end gap-2">
						<Button variant="outline" onclick={() => (showCreateModal = false)}>Cancel</Button>
						<Button onclick={createOrganization} disabled={isLoading}>
							{#if isLoading}
								Creating...
							{:else}
								Create Organization
							{/if}
						</Button>
					</div>
				</div>
			</div>
		</div>
	{/if}
{/if}
