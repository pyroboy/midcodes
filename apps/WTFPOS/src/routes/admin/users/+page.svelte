<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Role } from '$lib/stores/session.svelte';

	interface UserRecord {
		id: string;
		displayName: string;
		username: string;
		role: Role;
		branch: string;
		status: 'active' | 'inactive';
		lastLogin: string;
	}

	let users = $state<UserRecord[]>([
		{ id: 'u1', displayName: 'Christopher S.',  username: 'owner',   role: 'owner',   branch: 'All',               status: 'active',   lastLogin: 'Today 9:00 AM' },
		{ id: 'u2', displayName: 'Juan Reyes',      username: 'manager', role: 'manager', branch: 'Quezon City',       status: 'active',   lastLogin: 'Today 10:15 AM' },
		{ id: 'u3', displayName: 'Maria Santos',    username: 'staff',   role: 'staff',   branch: 'Quezon City',       status: 'active',   lastLogin: 'Today 11:00 AM' },
		{ id: 'u4', displayName: 'Pedro Cruz',      username: 'kitchen', role: 'kitchen', branch: 'Quezon City',       status: 'active',   lastLogin: 'Today 9:30 AM' },
		{ id: 'u5', displayName: 'Ana Reyes',       username: 'staff2',  role: 'staff',   branch: 'Makati',            status: 'active',   lastLogin: 'Mar 2, 3:00 PM' },
		{ id: 'u6', displayName: 'Lito Gutierrez',  username: 'mgr2',    role: 'manager', branch: 'Makati',            status: 'inactive', lastLogin: 'Feb 28, 5:00 PM' }
	]);

	const roleConfig: Record<Role, { label: string; class: string }> = {
		owner:   { label: '💼 Owner',   class: 'border-purple-200 bg-purple-50 text-purple-700' },
		admin:   { label: '🛡 Admin',   class: 'border-gray-300 bg-gray-100 text-gray-700' },
		manager: { label: '👑 Manager', class: 'border-accent/30 bg-accent-light text-accent' },
		kitchen: { label: '🍳 Kitchen', class: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
		staff:   { label: '👤 Staff',   class: 'border-blue-200 bg-blue-50 text-blue-700' }
	};

	let showAdd = $state(false);
</script>

<div class="flex flex-col gap-4">
	<!-- Header row -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-sm font-bold uppercase tracking-wide text-gray-500">{users.length} Users</h2>
		</div>
		<button onclick={() => (showAdd = true)} class="btn-primary text-sm">
			+ Add User
		</button>
	</div>

	<!-- User table -->
	<div class="overflow-hidden rounded-xl border border-border bg-white">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border bg-gray-50">
					<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Name</th>
					<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Username</th>
					<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Role</th>
					<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Branch</th>
					<th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
					<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Last Login</th>
					<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				{#each users as user (user.id)}
					<tr class={cn('transition-colors hover:bg-gray-50', user.status === 'inactive' && 'opacity-60')}>
						<td class="px-4 py-3">
							<div class="flex items-center gap-2">
								<span class="flex h-7 w-7 items-center justify-center rounded-full bg-accent-light text-sm font-bold text-accent">
									{user.displayName.charAt(0)}
								</span>
								<span class="font-medium text-gray-900">{user.displayName}</span>
							</div>
						</td>
						<td class="px-4 py-3 font-mono text-gray-500">{user.username}</td>
						<td class="px-4 py-3">
							<span class={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', roleConfig[user.role].class)}>
								{roleConfig[user.role].label}
							</span>
						</td>
						<td class="px-4 py-3 text-gray-500">{user.branch}</td>
						<td class="px-4 py-3 text-center">
							<span class={cn(
								'rounded-full px-2.5 py-0.5 text-xs font-semibold',
								user.status === 'active'
									? 'bg-status-green-light text-status-green'
									: 'bg-gray-100 text-gray-400'
							)}>
								{user.status}
							</span>
						</td>
						<td class="px-4 py-3 text-right text-xs text-gray-400">{user.lastLogin}</td>
						<td class="px-4 py-3 text-right">
							<div class="flex items-center justify-end gap-2">
								<button class="rounded px-2 py-1 text-xs font-medium text-accent hover:bg-accent-light transition-colors" style="min-height: unset">
									Edit
								</button>
								<button
									onclick={() => {
										const u = users.find(u => u.id === user.id);
										if (u) u.status = u.status === 'active' ? 'inactive' : 'active';
									}}
									class="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
									style="min-height: unset"
								>
									{user.status === 'active' ? 'Deactivate' : 'Activate'}
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Add User modal (stub) -->
{#if showAdd}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
		<div class="pos-card w-[420px] p-8 flex flex-col gap-5">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-bold text-gray-900">Add New User</h2>
				<button onclick={() => (showAdd = false)} class="text-gray-400 hover:text-gray-600" style="min-height: unset">✕</button>
			</div>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<label class="text-xs font-semibold uppercase tracking-wide text-gray-500">Display Name</label>
					<input type="text" placeholder="Full name" class="pos-input" />
				</div>
				<div class="flex flex-col gap-1.5">
					<label class="text-xs font-semibold uppercase tracking-wide text-gray-500">Username</label>
					<input type="text" placeholder="Login username" class="pos-input" />
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="flex flex-col gap-1.5">
						<label class="text-xs font-semibold uppercase tracking-wide text-gray-500">Role</label>
						<select class="pos-input">
							<option>staff</option>
							<option>kitchen</option>
							<option>manager</option>
						</select>
					</div>
					<div class="flex flex-col gap-1.5">
						<label class="text-xs font-semibold uppercase tracking-wide text-gray-500">Branch</label>
						<select class="pos-input">
							<option>Quezon City</option>
							<option>Makati</option>
						</select>
					</div>
				</div>
				<div class="flex flex-col gap-1.5">
					<label class="text-xs font-semibold uppercase tracking-wide text-gray-500">Temporary Password</label>
					<input type="password" placeholder="Set initial password" class="pos-input" />
				</div>
			</div>
			<div class="flex gap-2">
				<button class="btn-primary flex-1">Create User</button>
				<button onclick={() => (showAdd = false)} class="btn-secondary flex-1">Cancel</button>
			</div>
		</div>
	</div>
{/if}
