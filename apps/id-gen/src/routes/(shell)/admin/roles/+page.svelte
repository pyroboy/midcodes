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
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Tabs from '$lib/components/ui/tabs';
	import { getRolesData, bulkAssignPermissions } from '$lib/remote/admin.remote';
	import type { Role, RolePermission } from '$lib/types/admin.schema';

	// Use remote function to get roles data
	const rolesData = getRolesData();

	// Reactive state
	let searchQuery = $state('');
	let loading = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');
	let activeTab = $state('roles');

	// Dialog state
	let showPermissionsDialog = $state(false);
	let selectedRole = $state<Role | null>(null);
	let selectedPermissions = $state<Set<string>>(new Set());

	// Permission categories for better organization
	const permissionCategories = {
		Templates: ['templates.create', 'templates.read', 'templates.update', 'templates.delete'],
		'Template Assets': [
			'template_assets.create',
			'template_assets.read',
			'template_assets.update',
			'template_assets.delete'
		],
		'ID Cards': ['idcards.create', 'idcards.read', 'idcards.update', 'idcards.delete'],
		Invoices: ['invoices.create', 'invoices.read', 'invoices.update', 'invoices.delete'],
		Credits: ['credits.create', 'credits.read', 'credits.update', 'credits.delete'],
		Users: ['users.create', 'users.read', 'users.update', 'users.delete'],
		Organizations: [
			'organizations.create',
			'organizations.read',
			'organizations.update',
			'organizations.delete'
		],
		Profiles: ['profiles.read', 'profiles.update'],
		Analytics: ['analytics.read']
	};

	// Helper functions
	function formatRoleName(name: string) {
		return name
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	function getRoleBadgeVariant(role: Role) {
		if (role.is_system) return 'secondary';
		return 'outline';
	}

	function getPermissionCount(roleName: string, permissions: RolePermission[]) {
		return permissions.filter((p) => p.role === roleName).length;
	}

	function getRolePermissions(roleName: string, permissions: RolePermission[]) {
		return permissions.filter((p) => p.role === roleName).map((p) => p.permission);
	}

	function openPermissionsDialog(role: Role, permissions: RolePermission[]) {
		selectedRole = role;
		const rolePerms = getRolePermissions(role.name, permissions);
		selectedPermissions = new Set(rolePerms);
		showPermissionsDialog = true;
	}

	function togglePermission(permission: string) {
		const newSet = new Set(selectedPermissions);
		if (newSet.has(permission)) {
			newSet.delete(permission);
		} else {
			newSet.add(permission);
		}
		selectedPermissions = newSet;
	}

	function toggleCategory(category: string) {
		const categoryPerms = permissionCategories[category as keyof typeof permissionCategories] || [];
		const allSelected = categoryPerms.every((p) => selectedPermissions.has(p));

		const newSet = new Set(selectedPermissions);
		if (allSelected) {
			categoryPerms.forEach((p) => newSet.delete(p));
		} else {
			categoryPerms.forEach((p) => newSet.add(p));
		}
		selectedPermissions = newSet;
	}

	function isCategoryFullySelected(category: string) {
		const categoryPerms = permissionCategories[category as keyof typeof permissionCategories] || [];
		return categoryPerms.every((p) => selectedPermissions.has(p));
	}

	function isCategoryPartiallySelected(category: string) {
		const categoryPerms = permissionCategories[category as keyof typeof permissionCategories] || [];
		const selected = categoryPerms.filter((p) => selectedPermissions.has(p));
		return selected.length > 0 && selected.length < categoryPerms.length;
	}

	async function handleSavePermissions() {
		if (!selectedRole) return;

		try {
			loading = true;
			await bulkAssignPermissions({
				role: selectedRole.name,
				permissions: Array.from(selectedPermissions),
				roleId: selectedRole.id
			});

			successMessage = `Permissions updated for "${selectedRole.display_name || selectedRole.name}"`;
			errorMessage = '';
			showPermissionsDialog = false;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to update permissions';
			successMessage = '';
		} finally {
			loading = false;
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

<div class="space-y-8">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
			<p class="text-muted-foreground">Manage roles and their permissions for your organization.</p>
		</div>
	</div>

	<!-- Messages -->
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

	<!-- Search -->
	<div class="flex flex-col sm:flex-row gap-4">
		<div class="flex-1">
			<Input placeholder="Search roles..." bind:value={searchQuery} class="w-full sm:max-w-sm" />
		</div>
	</div>

	<!-- Tabs -->
	<Tabs.Root bind:value={activeTab}>
		<Tabs.List>
			<Tabs.Trigger value="roles">Roles</Tabs.Trigger>
			<Tabs.Trigger value="matrix">Permission Matrix</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="roles" class="mt-6">
			<!-- Roles List -->
			<Card>
				<CardHeader>
					{#await rolesData}
						<CardTitle>Roles (Loading...)</CardTitle>
					{:then data}
						{@const roles = data?.roles || []}
						{@const filteredRoles = roles.filter(
							(role) =>
								!searchQuery ||
								role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
								role.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
						)}
						<CardTitle>Roles ({filteredRoles.length})</CardTitle>
						<CardDescription>
							System roles cannot be modified. Custom roles can be created for your organization.
						</CardDescription>
					{/await}
				</CardHeader>
				<CardContent>
					{#await rolesData}
						<p class="text-sm text-muted-foreground">Loading roles...</p>
					{:then data}
						{@const roles = data?.roles || []}
						{@const permissions = data?.permissions || []}
						{@const filteredRoles = roles.filter(
							(role) =>
								!searchQuery ||
								role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
								role.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
						)}

						{#if filteredRoles.length > 0}
							<div class="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Role</TableHead>
											<TableHead>Description</TableHead>
											<TableHead class="text-center">Permissions</TableHead>
											<TableHead class="text-center">Type</TableHead>
											<TableHead class="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{#each filteredRoles as role}
											<TableRow>
												<TableCell class="font-medium">
													<div class="flex flex-col">
														<span>{role.display_name || formatRoleName(role.name)}</span>
														<span class="text-xs text-muted-foreground font-mono">{role.name}</span>
													</div>
												</TableCell>
												<TableCell>
													<span class="text-sm text-muted-foreground">
														{role.description || 'No description'}
													</span>
												</TableCell>
												<TableCell class="text-center">
													<Badge variant="outline">
														{getPermissionCount(role.name, permissions)} permissions
													</Badge>
												</TableCell>
												<TableCell class="text-center">
													{#if role.is_system}
														<Badge variant="secondary">System</Badge>
													{:else}
														<Badge variant="outline">Custom</Badge>
													{/if}
												</TableCell>
												<TableCell class="text-right">
													<Button
														variant="outline"
														size="sm"
														onclick={() => openPermissionsDialog(role, permissions)}
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															class="h-4 w-4 mr-1"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
															/>
														</svg>
														Permissions
													</Button>
												</TableCell>
											</TableRow>
										{/each}
									</TableBody>
								</Table>
							</div>
						{:else}
							<p class="text-sm text-muted-foreground text-center py-8">
								No roles found matching your search.
							</p>
						{/if}
					{/await}
				</CardContent>
			</Card>
		</Tabs.Content>

		<Tabs.Content value="matrix" class="mt-6">
			<!-- Permission Matrix -->
			<Card>
				<CardHeader>
					<CardTitle>Permission Matrix</CardTitle>
					<CardDescription>
						Overview of all permissions across roles. Click on a role to edit its permissions.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{#await rolesData}
						<p class="text-sm text-muted-foreground">Loading permission matrix...</p>
					{:then data}
						{@const roles = data?.roles || []}
						{@const permissions = data?.permissions || []}
						{@const idGenRoles = roles.filter((r) => r.name.startsWith('id_gen_'))}

						<div class="overflow-x-auto">
							<table class="min-w-full text-xs">
								<thead>
									<tr class="border-b">
										<th class="text-left py-2 px-2 font-medium sticky left-0 bg-background"
											>Permission</th
										>
										{#each idGenRoles as role}
											<th class="text-center py-2 px-1 font-medium min-w-[80px]">
												<button
													class="hover:text-blue-600 cursor-pointer"
													onclick={() => openPermissionsDialog(role, permissions)}
												>
													{role.display_name?.replace('ID Gen ', '') ||
														formatRoleName(role.name.replace('id_gen_', ''))}
												</button>
											</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each Object.entries(permissionCategories) as [category, perms]}
										<tr class="bg-muted/50">
											<td
												colspan={idGenRoles.length + 1}
												class="py-1 px-2 font-semibold text-muted-foreground"
											>
												{category}
											</td>
										</tr>
										{#each perms as perm}
											<tr class="border-b border-muted/30">
												<td class="py-1 px-2 sticky left-0 bg-background">
													<span class="font-mono">{perm.split('.')[1]}</span>
												</td>
												{#each idGenRoles as role}
													{@const hasPermission = permissions.some(
														(p) => p.role === role.name && p.permission === perm
													)}
													<td class="text-center py-1">
														{#if hasPermission}
															<svg
																xmlns="http://www.w3.org/2000/svg"
																class="h-4 w-4 text-green-600 mx-auto"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																	d="M5 13l4 4L19 7"
																/>
															</svg>
														{:else}
															<svg
																xmlns="http://www.w3.org/2000/svg"
																class="h-4 w-4 text-gray-300 mx-auto"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																	d="M6 18L18 6M6 6l12 12"
																/>
															</svg>
														{/if}
													</td>
												{/each}
											</tr>
										{/each}
									{/each}
								</tbody>
							</table>
						</div>
					{/await}
				</CardContent>
			</Card>
		</Tabs.Content>
	</Tabs.Root>
</div>

<!-- Edit Permissions Dialog -->
{#if selectedRole}
	<Dialog.Root bind:open={showPermissionsDialog}>
		<Dialog.Content class="max-w-2xl max-h-[80vh] overflow-y-auto">
			<Dialog.Header>
				<Dialog.Title>
					Edit Permissions: {selectedRole.display_name || formatRoleName(selectedRole.name)}
				</Dialog.Title>
				<Dialog.Description>
					{#if selectedRole.is_system}
						<span class="text-amber-600">
							Warning: Modifying system role permissions affects all users with this role.
						</span>
					{:else}
						Select the permissions for this role.
					{/if}
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-6 py-4">
				{#each Object.entries(permissionCategories) as [category, perms]}
					<div class="space-y-2">
						<div class="flex items-center space-x-2">
							<Checkbox
								id={`cat-${category}`}
								checked={isCategoryFullySelected(category)}
								indeterminate={isCategoryPartiallySelected(category)}
								onCheckedChange={() => toggleCategory(category)}
							/>
							<Label for={`cat-${category}`} class="font-semibold cursor-pointer">
								{category}
							</Label>
						</div>
						<div class="grid grid-cols-2 gap-2 pl-6">
							{#each perms as perm}
								<div class="flex items-center space-x-2">
									<Checkbox
										id={perm}
										checked={selectedPermissions.has(perm)}
										onCheckedChange={() => togglePermission(perm)}
									/>
									<Label for={perm} class="text-sm cursor-pointer font-mono">
										{perm.split('.')[1]}
									</Label>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<div class="flex justify-between items-center mt-6">
				<div class="text-sm text-muted-foreground">
					{selectedPermissions.size} permissions selected
				</div>
				<div class="flex gap-2">
					<Button variant="outline" onclick={() => (showPermissionsDialog = false)}>Cancel</Button>
					<Button onclick={handleSavePermissions} disabled={loading}>
						{#if loading}
							<svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Saving...
						{:else}
							Save Permissions
						{/if}
					</Button>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}
