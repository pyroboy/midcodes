<script lang="ts">
	import { untrack } from 'svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Tabs from '$lib/components/ui/tabs';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import type { PageData } from './$types';

	// Type definitions
	interface Organization {
		id: string;
		name: string;
		created_at: string | null;
		updated_at: string | null;
	}

	interface Member {
		id: string;
		email: string | null;
		role: string | null;
		created_at: string | null;
		credits_balance: number;
		card_generation_count: number;
	}

	interface OrgRole {
		id: string;
		name: string;
		display_name: string | null;
		description: string | null;
		is_system: boolean;
		org_id: string | null;
	}

	interface OrgSettings {
		org_id: string;
		payments_enabled: boolean;
		payments_bypass: boolean;
		updated_at: string;
		updated_by: string | null;
	}

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Cast data with proper types
	const organization = $derived(data.organization as Organization | null);
	const members = $derived((data.members || []) as Member[]);
	const availableRoles = $derived((data.availableRoles || []) as OrgRole[]);
	const orgSettings = $derived(data.orgSettings as OrgSettings | null);

	// UI State
	let activeTab = $state('overview');
	let searchQuery = $state('');
	let isEditingName = $state(false);
	let editedOrgName = $state(untrack(() => organization?.name || ''));
	let successMessage = $state('');
	let errorMessage = $state('');
	let isLoading = $state(false);

	// Derived data
	let filteredMembers = $derived(
		members.filter(
			(member) =>
				!searchQuery ||
				member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				member.role?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	// Role display names
	const roleDisplayNames: Record<string, string> = {
		super_admin: 'Super Admin',
		org_admin: 'Organization Admin',
		id_gen_admin: 'ID Gen Admin',
		id_gen_user: 'ID Gen User',
		id_gen_accountant: 'Accountant',
		id_gen_encoder: 'Encoder',
		id_gen_printer: 'Printer',
		id_gen_viewer: 'Viewer',
		id_gen_template_designer: 'Template Designer',
		id_gen_auditor: 'Auditor'
	};

	function getRoleDisplayName(role: string | null): string {
		if (!role) return 'Unknown';
		return roleDisplayNames[role] || role;
	}

	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	async function updateOrgName() {
		if (!editedOrgName.trim() || editedOrgName === organization?.name) {
			isEditingName = false;
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			// TODO: Implement update organization name remote function
			successMessage = 'Organization name updated successfully';
			isEditingName = false;
		} catch (err) {
			errorMessage = 'Failed to update organization name';
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	async function updateMemberRole(memberId: string, newRole: string) {
		isLoading = true;
		errorMessage = '';

		try {
			// TODO: Implement update member role remote function
			successMessage = 'Member role updated successfully';
		} catch (err) {
			errorMessage = 'Failed to update member role';
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	async function removeMember(memberId: string, email: string | null) {
		if (
			!confirm(`Are you sure you want to remove ${email || 'this user'} from this organization?`)
		) {
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			// TODO: Implement remove member remote function
			successMessage = 'Member removed successfully';
		} catch (err) {
			errorMessage = 'Failed to remove member';
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
</script>

<svelte:head>
	<title>My Organization | ID Card Generator</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 space-y-8">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">My Organization</h1>
			<p class="text-muted-foreground mt-1">
				Manage your organization's members, roles, and settings
			</p>
		</div>
	</div>

	<!-- Success/Error Messages -->
	{#if successMessage}
		<div
			class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
		>
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
		<div
			class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
		>
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

	<!-- Tabs -->
	<Tabs.Root bind:value={activeTab}>
		<Tabs.List>
			<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
			<Tabs.Trigger value="members">Members</Tabs.Trigger>
			<Tabs.Trigger value="roles">Roles</Tabs.Trigger>
			<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
		</Tabs.List>

		<!-- Overview Tab -->
		<Tabs.Content value="overview" class="mt-6">
			<div class="grid gap-6 md:grid-cols-3 mb-6">
				<Card>
					<CardHeader class="pb-2">
						<CardDescription>Total Members</CardDescription>
						<CardTitle class="text-4xl">{data.stats?.totalMembers || 0}</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-xs text-muted-foreground">Active users in organization</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader class="pb-2">
						<CardDescription>ID Cards</CardDescription>
						<CardTitle class="text-4xl">{data.stats?.totalCards || 0}</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-xs text-muted-foreground">Cards generated by org</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader class="pb-2">
						<CardDescription>Templates</CardDescription>
						<CardTitle class="text-4xl">{data.stats?.totalTemplates || 0}</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-xs text-muted-foreground">Templates owned by org</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Organization Details</CardTitle>
					<CardDescription>Basic information about your organization</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="grid gap-4 sm:grid-cols-2">
						<div>
							<span class="text-sm font-medium text-muted-foreground">Organization Name</span>
							{#if isEditingName}
								<div class="flex gap-2 mt-1">
									<Input bind:value={editedOrgName} class="flex-1" />
									<Button size="sm" onclick={updateOrgName} disabled={isLoading}>Save</Button>
									<Button
										size="sm"
										variant="outline"
										onclick={() => {
											isEditingName = false;
											editedOrgName = organization?.name || '';
										}}
									>
										Cancel
									</Button>
								</div>
							{:else}
								<div class="flex items-center gap-2 mt-1">
									<p class="text-lg font-semibold">{organization?.name || 'Unknown'}</p>
									{#if data.capabilities?.isOrgAdmin}
										<Button
											size="sm"
											variant="ghost"
											onclick={() => (isEditingName = true)}
											class="h-6 px-2"
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
									{/if}
								</div>
							{/if}
						</div>
						<div>
							<span class="text-sm font-medium text-muted-foreground">Organization ID</span>
							<p class="text-sm font-mono mt-1 text-muted-foreground">{organization?.id}</p>
						</div>
						<div>
							<span class="text-sm font-medium text-muted-foreground">Created</span>
							<p class="mt-1">{formatDate(organization?.created_at)}</p>
						</div>
						<div>
							<span class="text-sm font-medium text-muted-foreground">Last Updated</span>
							<p class="mt-1">{formatDate(organization?.updated_at)}</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</Tabs.Content>

		<!-- Members Tab -->
		<Tabs.Content value="members" class="mt-6">
			<Card>
				<CardHeader>
					<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<CardTitle>Organization Members ({members?.length || 0})</CardTitle>
							<CardDescription>Manage users in your organization</CardDescription>
						</div>
						<div class="flex gap-2">
							<Input
								placeholder="Search members..."
								bind:value={searchQuery}
								class="w-full sm:w-64"
							/>
							{#if data.capabilities?.canManageMembers}
								<Button>
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
									Invite
								</Button>
							{/if}
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{#if filteredMembers.length > 0}
						<div class="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Email</TableHead>
										<TableHead>Role</TableHead>
										<TableHead class="text-center">Credits</TableHead>
										<TableHead class="text-center">Cards</TableHead>
										<TableHead>Joined</TableHead>
										{#if data.capabilities?.canManageMembers}
											<TableHead class="text-right">Actions</TableHead>
										{/if}
									</TableRow>
								</TableHeader>
								<TableBody>
									{#each filteredMembers as member (member.id)}
										<TableRow>
											<TableCell class="font-medium">
												{member.email || 'No email'}
												{#if member.id === data.user?.id}
													<span class="ml-2 text-xs text-muted-foreground">(you)</span>
												{/if}
											</TableCell>
											<TableCell>
												<span
													class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
													{member.role?.includes('super_admin')
														? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
														: member.role?.includes('admin')
															? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
															: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}"
												>
													{getRoleDisplayName(member.role)}
												</span>
											</TableCell>
											<TableCell class="text-center">{member.credits_balance || 0}</TableCell>
											<TableCell class="text-center">{member.card_generation_count || 0}</TableCell>
											<TableCell>{formatDate(member.created_at)}</TableCell>
											{#if data.capabilities?.canManageMembers}
												<TableCell class="text-right">
													{#if member.id !== data.user?.id}
														<div class="flex justify-end gap-2">
															<Button
																size="sm"
																variant="outline"
																onclick={() => updateMemberRole(member.id, 'id_gen_user')}
															>
																Edit
															</Button>
															<Button
																size="sm"
																variant="destructive"
																onclick={() => removeMember(member.id, member.email)}
															>
																Remove
															</Button>
														</div>
													{:else}
														<span class="text-xs text-muted-foreground">—</span>
													{/if}
												</TableCell>
											{/if}
										</TableRow>
									{/each}
								</TableBody>
							</Table>
						</div>
					{:else}
						<div class="text-center py-8 text-muted-foreground">
							{#if searchQuery}
								No members found matching "{searchQuery}"
							{:else}
								No members in this organization
							{/if}
						</div>
					{/if}
				</CardContent>
			</Card>
		</Tabs.Content>

		<!-- Roles Tab -->
		<Tabs.Content value="roles" class="mt-6">
			<Card>
				<CardHeader>
					<CardTitle>Available Roles</CardTitle>
					<CardDescription>
						Roles that can be assigned to members of your organization
					</CardDescription>
				</CardHeader>
				<CardContent>
					{#if availableRoles?.length > 0}
						<div class="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Role</TableHead>
										<TableHead>Description</TableHead>
										<TableHead class="text-center">Type</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{#each availableRoles as role (role.id)}
										<TableRow>
											<TableCell class="font-medium">
												{role.display_name || role.name}
											</TableCell>
											<TableCell class="text-muted-foreground">
												{role.description || 'No description'}
											</TableCell>
											<TableCell class="text-center">
												{#if role.is_system}
													<span
														class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
													>
														System
													</span>
												{:else}
													<span
														class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
													>
														Custom
													</span>
												{/if}
											</TableCell>
										</TableRow>
									{/each}
								</TableBody>
							</Table>
						</div>
					{:else}
						<div class="text-center py-8 text-muted-foreground">No roles available</div>
					{/if}
				</CardContent>
			</Card>
		</Tabs.Content>

		<!-- Settings Tab -->
		<Tabs.Content value="settings" class="mt-6">
			<div class="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Payment Settings</CardTitle>
						<CardDescription>Configure payment options for your organization</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="flex items-center justify-between py-2 border-b">
							<div>
								<p class="font-medium">Payments Enabled</p>
								<p class="text-sm text-muted-foreground">
									Allow users to make payments in this organization
								</p>
							</div>
							<div
								class="px-3 py-1 rounded-full text-sm font-medium {orgSettings?.payments_enabled
									? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
									: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}"
							>
								{orgSettings?.payments_enabled ? 'Enabled' : 'Disabled'}
							</div>
						</div>
						<div class="flex items-center justify-between py-2">
							<div>
								<p class="font-medium">Payment Bypass</p>
								<p class="text-sm text-muted-foreground">
									Allow users to skip payment requirements
								</p>
							</div>
							<div
								class="px-3 py-1 rounded-full text-sm font-medium {orgSettings?.payments_bypass
									? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
									: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}"
							>
								{orgSettings?.payments_bypass ? 'Active' : 'Inactive'}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Organization Information</CardTitle>
						<CardDescription>Contact your super administrator for advanced changes</CardDescription>
					</CardHeader>
					<CardContent>
						<p class="text-sm text-muted-foreground">
							For actions like deleting this organization, transferring assets, or changing billing
							settings, please contact your system administrator.
						</p>
					</CardContent>
				</Card>
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>
