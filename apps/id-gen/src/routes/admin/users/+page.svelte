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
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import { getUsersData, addUser, updateUserRole, deleteUser } from '$lib/remote/admin.remote';

	type UserProfile = {
		id: string;
		email: string;
		role: string;
		created_at: string;
		updated_at: string;
	};

	// Use remote function to get users data
	const usersData = getUsersData();

	// Reactive state using Svelte 5 runes
	let searchQuery = $state('');
	let selectedRole = $state('all');
	let loading = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');

	// Dialog state for user management
	let showAddUserDialog = $state(false);
	let showEditUserDialog = $state(false);
	let showDeleteConfirmDialog = $state(false);
	let selectedUser = $state<any>(null);

	// Form state
	let newUserEmail = $state('');
	let newUserRole = $state('id_gen_user');

	// Define the role type
	type UserRole =
		| 'id_gen_user'
		| 'id_gen_admin'
		| 'org_admin'
		| 'super_admin'
		| 'id_gen_super_admin'
		| 'id_gen_org_admin'
		| 'id_gen_accountant'
		| 'id_gen_encoder'
		| 'id_gen_printer'
		| 'id_gen_viewer'
		| 'id_gen_template_designer'
		| 'id_gen_auditor';

	// Role options - organized by category
	const roleOptions = [
		// Admin roles
		{
			value: 'super_admin',
			label: 'Super Admin',
			description: 'Full system access',
			category: 'Admin'
		},
		{
			value: 'org_admin',
			label: 'Organization Admin',
			description: 'Organization management',
			category: 'Admin'
		},
		{
			value: 'id_gen_super_admin',
			label: 'ID Gen Super Admin',
			description: 'Full ID Generator access',
			category: 'Admin'
		},
		{
			value: 'id_gen_org_admin',
			label: 'ID Gen Org Admin',
			description: 'ID Generator org management',
			category: 'Admin'
		},
		{
			value: 'id_gen_admin',
			label: 'ID Generator Admin',
			description: 'Template and user management',
			category: 'Admin'
		},
		// Specialized roles
		{
			value: 'id_gen_template_designer',
			label: 'Template Designer',
			description: 'Create and manage templates',
			category: 'Specialized'
		},
		{
			value: 'id_gen_accountant',
			label: 'Accountant',
			description: 'Manage invoices and credits',
			category: 'Specialized'
		},
		{
			value: 'id_gen_encoder',
			label: 'Encoder',
			description: 'Create ID cards from templates',
			category: 'Specialized'
		},
		// Basic roles
		{
			value: 'id_gen_user',
			label: 'ID Generator User',
			description: 'Generate ID cards only',
			category: 'Basic'
		},
		{
			value: 'id_gen_printer',
			label: 'Printer',
			description: 'Print and view ID cards only',
			category: 'Basic'
		},
		{ value: 'id_gen_viewer', label: 'Viewer', description: 'Read-only access', category: 'Basic' },
		{
			value: 'id_gen_auditor',
			label: 'Auditor',
			description: 'Read-only access for audit',
			category: 'Basic'
		}
	];

	// Functions to handle user management actions
	async function handleAddUser() {
		try {
			loading = true;
			const result = await addUser({ email: newUserEmail, role: newUserRole as UserRole });

			successMessage = result.message || 'User added successfully!';
			errorMessage = '';

			// Close dialog and clear form
			showAddUserDialog = false;
			newUserEmail = '';
			newUserRole = 'id_gen_user';
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to add user';
			successMessage = '';
		} finally {
			loading = false;
		}
	}

	async function handleUpdateUserRole(userId: string, role: string) {
		try {
			loading = true;
			const result = await updateUserRole({ userId, role: role as UserRole });

			successMessage = result.message || 'User role updated successfully!';
			errorMessage = '';

			// Close dialog
			showEditUserDialog = false;
			selectedUser = null;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to update user role';
			successMessage = '';
		} finally {
			loading = false;
		}
	}

	async function handleDeleteUserConfirm() {
		if (!selectedUser) return;

		try {
			loading = true;
			const result = await deleteUser({ userId: selectedUser.id });

			successMessage = result.message || 'User deleted successfully!';
			errorMessage = '';

			// Close dialog
			showDeleteConfirmDialog = false;
			selectedUser = null;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
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

	function getRoleBadgeVariant(role: string) {
		switch (role) {
			case 'super_admin':
			case 'id_gen_super_admin':
				return 'destructive';
			case 'org_admin':
			case 'id_gen_org_admin':
				return 'default';
			case 'id_gen_admin':
			case 'id_gen_accountant':
			case 'id_gen_template_designer':
				return 'secondary';
			case 'id_gen_encoder':
			case 'id_gen_printer':
			case 'id_gen_auditor':
			case 'id_gen_viewer':
				return 'outline';
			default:
				return 'outline';
		}
	}

	function formatRoleName(role: string) {
		return role
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	import { formatDate } from '$lib/utils/dateFormat';

	function handleEditUser(user: any) {
		selectedUser = user;
		showEditUserDialog = true;
	}

	function handleDeleteUser(user: any) {
		selectedUser = user;
		showDeleteConfirmDialog = true;
	}

	function canDeleteUser(
		user: any,
		currentUserRole?: string,
		currentUserId?: string,
		users: any[] = []
	) {
		// Prevent self-deletion
		if (user.id === currentUserId) return false;

		// Only super_admin and org_admin can delete users
		if (!['super_admin', 'org_admin'].includes(currentUserRole || '')) return false;

		// Prevent deletion of last admin
		if (['super_admin', 'org_admin'].includes(user.role)) {
			const adminCount = users.filter((u) => ['super_admin', 'org_admin'].includes(u.role)).length;
			return adminCount > 1;
		}

		return true;
	}

	function canEditUser(user: any, currentUserRole?: string) {
		// Super admin can edit anyone
		if (currentUserRole === 'super_admin') return true;

		// Org admin can edit non-super-admins
		if (currentUserRole === 'org_admin' && user.role !== 'super_admin') return true;

		return false;
	}
</script>

<div class="space-y-8">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">User Management</h1>
			<p class="text-muted-foreground">Manage users and their roles in your organization.</p>
		</div>
		<div class="mt-4 sm:mt-0">
			{#await usersData}
				<!-- Show nothing while loading -->
			{:then data}
				{#if ['super_admin', 'org_admin'].includes(data?.currentUserRole || '')}
					<Button
						onclick={() => {
							showAddUserDialog = true;
						}}
					>
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
						Add User
					</Button>
				{/if}
			{/await}
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

	<!-- Filters -->
	<div class="flex flex-col sm:flex-row gap-4">
		<div class="flex-1">
			<Input placeholder="Search users..." bind:value={searchQuery} class="w-full sm:max-w-sm" />
		</div>
		<Select.Root type="single" bind:value={selectedRole}>
			<Select.Trigger class="w-full sm:w-[180px]">
				{selectedRole === 'all' ? 'All Roles' : formatRoleName(selectedRole)}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all">All Roles</Select.Item>
				{#each roleOptions as role}
					<Select.Item value={role.value}>{role.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<!-- Users Table -->
	<Card>
		<CardHeader>
			{#await usersData}
				<CardTitle>Users (Loading...)</CardTitle>
				<CardDescription>Loading users...</CardDescription>
			{:then data}
				{@const users = data?.users || []}
				{@const filteredUsers = users.filter((user: UserProfile) => {
					const matchesSearch =
						!searchQuery || user.email?.toLowerCase().includes(searchQuery.toLowerCase());

					const matchesRole = selectedRole === 'all' || user.role === selectedRole;

					return matchesSearch && matchesRole;
				})}
				<CardTitle>Users ({filteredUsers.length})</CardTitle>
				<CardDescription>
					{#if selectedRole !== 'all'}
						Showing {formatRoleName(selectedRole)} users
					{:else}
						All users in your organization
					{/if}
				</CardDescription>
			{/await}
		</CardHeader>
		<CardContent>
			{#await usersData}
				<p class="text-sm text-muted-foreground">Loading users...</p>
			{:then data}
				{@const users = data?.users || []}
				{@const filteredUsers = users.filter((user: UserProfile) => {
					const matchesSearch =
						!searchQuery || user.email?.toLowerCase().includes(searchQuery.toLowerCase());

					const matchesRole = selectedRole === 'all' || user.role === selectedRole;

					return matchesSearch && matchesRole;
				})}
				{#if filteredUsers.length > 0}
					<!-- Desktop Table View -->
					<div class="hidden md:block relative overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>User</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Joined</TableHead>
									<TableHead>Last Active</TableHead>
									<TableHead class="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each filteredUsers as user}
									<TableRow>
										<TableCell class="font-medium">
											<div class="flex flex-col">
												<span>{user.email}</span>
												{#if user.id === data?.currentUserId}
													<span class="text-xs text-muted-foreground">(You)</span>
												{/if}
											</div>
										</TableCell>
										<TableCell>
											<Badge variant={getRoleBadgeVariant(user.role)}>
												{formatRoleName(user.role)}
											</Badge>
										</TableCell>
										<TableCell>{formatDate(user.created_at, 'date')}</TableCell>
										<TableCell>{formatDate(user.updated_at, 'date')}</TableCell>
										<TableCell class="text-right">
											<div class="flex justify-end gap-2">
												{#if canEditUser(user, data?.currentUserRole)}
													<Button variant="outline" size="sm" onclick={() => handleEditUser(user)}>
														Edit
													</Button>
												{/if}
												{#if canDeleteUser(user, data?.currentUserRole, data?.currentUserId, users)}
													<Button
														variant="destructive"
														size="sm"
														onclick={() => handleDeleteUser(user)}
													>
														Delete
													</Button>
												{/if}
											</div>
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>

					<!-- Mobile Card View -->
					<div class="md:hidden space-y-4">
						{#each filteredUsers as user}
							<div class="border rounded-lg p-4 space-y-3">
								<div class="flex items-start justify-between">
									<div class="flex-1 min-w-0">
										<p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
											{user.email}
										</p>
										{#if user.id === data?.currentUserId}
											<p class="text-xs text-muted-foreground">(You)</p>
										{/if}
									</div>
									<Badge variant={getRoleBadgeVariant(user.role)} class="ml-2">
										{formatRoleName(user.role)}
									</Badge>
								</div>

								<div class="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
									<div>
										<span class="font-medium">Joined:</span>
										{formatDate(user.created_at, 'date')}
									</div>
									<div>
										<span class="font-medium">Active:</span>
										{formatDate(user.updated_at, 'date')}
									</div>
								</div>

								{#if canEditUser(user, data?.currentUserRole) || canDeleteUser(user, data?.currentUserRole, data?.currentUserId, users)}
									<div class="flex gap-2 pt-2">
										{#if canEditUser(user, data?.currentUserRole)}
											<Button
												variant="outline"
												size="sm"
												class="flex-1"
												onclick={() => handleEditUser(user)}
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
														d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
													/>
												</svg>
												Edit
											</Button>
										{/if}
										{#if canDeleteUser(user, data?.currentUserRole, data?.currentUserId, users)}
											<Button
												variant="destructive"
												size="sm"
												class="flex-1"
												onclick={() => handleDeleteUser(user)}
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
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
													/>
												</svg>
												Delete
											</Button>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					{#await import('$lib/components/empty-states/EmptyUsers.svelte') then module}
						{@const EmptyUsersComponent = module.default}
						<EmptyUsersComponent
							isFiltered={Boolean(searchQuery) || selectedRole !== 'all'}
							onInvite={() => {
								showAddUserDialog = true;
							}}
						/>
					{/await}
				{/if}
			{/await}
		</CardContent>
	</Card>
</div>

<!-- Add User Dialog -->
<Dialog.Root bind:open={showAddUserDialog}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Add New User</Dialog.Title>
			<Dialog.Description>
				Invite a new user to your organization. They will receive an email invitation.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="email">Email Address</Label>
				<Input
					id="email"
					type="email"
					bind:value={newUserEmail}
					placeholder="user@example.com"
					required
				/>
			</div>

			<div class="space-y-2">
				<Label for="role">Role</Label>
				<Select.Root type="single" bind:value={newUserRole}>
					<Select.Trigger class="w-full">
						{roleOptions.find((r) => r.value === newUserRole)?.label || 'Select role'}
					</Select.Trigger>
					<Select.Content>
						{#each roleOptions as role}
							<Select.Item value={role.value}>
								<div class="flex flex-col">
									<span>{role.label}</span>
									<span class="text-xs text-muted-foreground">{role.description}</span>
								</div>
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>

		<div class="flex justify-end gap-2 mt-6">
			<Button
				type="button"
				variant="outline"
				onclick={() => {
					showAddUserDialog = false;
				}}
			>
				Cancel
			</Button>
			<Button onclick={handleAddUser} disabled={loading}>
				{#if loading}
					<svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					Adding User...
				{:else}
					Add User
				{/if}
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit User Dialog -->
{#if selectedUser}
	<Dialog.Root bind:open={showEditUserDialog}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Edit User Role</Dialog.Title>
				<Dialog.Description>
					Update the role for {selectedUser.email}
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="userRole">Role</Label>
					<Select.Root type="single" bind:value={selectedUser.role}>
						<Select.Trigger class="w-full">
							{roleOptions.find((r) => r.value === selectedUser.role)?.label || 'Select role'}
						</Select.Trigger>
						<Select.Content>
							{#each roleOptions as role}
								<Select.Item value={role.value}>
									<div class="flex flex-col">
										<span>{role.label}</span>
										<span class="text-xs text-muted-foreground">{role.description}</span>
									</div>
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			<div class="flex justify-end gap-2 mt-6">
				<Button
					type="button"
					variant="outline"
					onclick={() => {
						showEditUserDialog = false;
					}}
				>
					Cancel
				</Button>
				<Button
					onclick={() => handleUpdateUserRole(selectedUser.id, selectedUser.role)}
					disabled={loading}
				>
					{#if loading}
						<svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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
						Updating...
					{:else}
						Update Role
					{/if}
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}

<!-- Delete Confirmation Dialog -->
{#if selectedUser}
	<Dialog.Root bind:open={showDeleteConfirmDialog}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Delete User</Dialog.Title>
				<Dialog.Description>
					Are you sure you want to delete {selectedUser.email}? This action cannot be undone.
				</Dialog.Description>
			</Dialog.Header>

			<div class="flex justify-end gap-2 mt-6">
				<Button
					type="button"
					variant="outline"
					onclick={() => {
						showDeleteConfirmDialog = false;
					}}
				>
					Cancel
				</Button>
				<Button onclick={handleDeleteUserConfirm} variant="destructive" disabled={loading}>
					{#if loading}
						<svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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
						Deleting...
					{:else}
						Delete User
					{/if}
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}
