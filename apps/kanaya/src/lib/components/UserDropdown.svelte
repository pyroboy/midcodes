<script lang="ts">
	import { User, Settings, Shield, LogOut, CreditCard, Eye, X } from 'lucide-svelte';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	interface Props {
		user?: {
			id?: string;
			email?: string;
			role?: string;
			avatar_url?: string;
			credits_balance?: number;
		};
	}

	let { user }: Props = $props();

	// Get emulation data from page store
	const isSuperAdmin = $derived($page.data.isSuperAdmin);
	const availableRoles = $derived($page.data.availableRolesForEmulation || []);
	const roleEmulation = $derived($page.data.roleEmulation);

	let emulationLoading = $state(false);

	function getUserInitials(user: Props['user']): string {
		if (!user?.email) return 'U';
		return user.email.substring(0, 2).toUpperCase();
	}

	function formatRoleName(role?: string): string {
		if (!role) return 'User';
		return role
			.split('_')
			.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	function isAdmin(user: Props['user']): boolean {
		return !!user?.role && ['super_admin', 'org_admin', 'id_gen_admin'].includes(user.role);
	}

	function navigateTo(href: string) {
		goto(href);
	}

	/**
	 * Force a session refresh to get updated app_metadata after emulation changes.
	 * The JWT contains stale data until explicitly refreshed.
	 */
	async function refreshSession() {
		try {
			const refreshRes = await fetch('/api/auth/refresh-session', { method: 'POST' });
			if (!refreshRes.ok) {
				console.warn('Session refresh failed');
			}
		} catch (e) {
			console.warn('Session refresh error:', e);
		}
	}

	async function startEmulation(role: string) {
		emulationLoading = true;
		try {
			const res = await fetch('/api/admin/start-emulation', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role })
			});
			if (res.ok) {
				// Refresh session then redirect to home to experience app as emulated role
				await refreshSession();
				window.location.href = '/';
			} else {
				const data = await res.json();
				alert(data.error || 'Failed to start emulation');
			}
		} catch (e) {
			console.error('Error starting emulation:', e);
			alert('Error starting emulation.');
		} finally {
			emulationLoading = false;
		}
	}

	async function stopEmulation() {
		try {
			const res = await fetch('/api/admin/stop-emulation', { method: 'POST' });
			if (res.ok) {
				// Refresh session then reload to restore original role
				await refreshSession();
				window.location.reload();
			} else {
				alert('Failed to stop emulation');
			}
		} catch (e) {
			console.error('Error stopping emulation:', e);
			alert('Error stopping emulation.');
		}
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				class="relative h-10 w-10 rounded-full p-0"
				aria-label="User account menu"
			>
				<Avatar class="h-8 w-8 border border-border">
					<AvatarImage src={user?.avatar_url} alt={user?.email || 'User avatar'} />
					<AvatarFallback class="bg-primary text-primary-foreground text-sm font-medium">
						{getUserInitials(user)}
					</AvatarFallback>
				</Avatar>
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content class="w-64" align="end">
		<!-- User Info Header -->
		<div class="px-3 py-3 border-b border-border">
			<div class="flex items-center gap-3">
				<Avatar class="h-10 w-10 border border-border">
					<AvatarImage src={user?.avatar_url} alt={user?.email || 'User avatar'} />
					<AvatarFallback class="bg-primary text-primary-foreground text-sm font-medium">
						{getUserInitials(user)}
					</AvatarFallback>
				</Avatar>
				<div class="flex flex-col min-w-0">
					<p class="text-sm font-medium text-foreground truncate">
						{user?.email || 'Unknown User'}
					</p>
					{#if roleEmulation?.active}
						<p class="text-xs text-primary font-medium">
							{formatRoleName(roleEmulation.originalRole)}
						</p>
						<p class="text-xs text-blue-500 font-medium">
							Viewing as: {formatRoleName(roleEmulation.emulatedRole)}
						</p>
					{:else}
						<p class="text-xs text-muted-foreground">
							{formatRoleName(user?.role)}
						</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Emulation Status Banner -->
		{#if roleEmulation?.active}
			<div class="px-3 py-2 bg-purple-500/10 border-b border-purple-500/20">
				<div class="flex items-center justify-between">
					<span class="text-xs text-purple-600 dark:text-purple-400 font-medium">
						Emulating Role
					</span>
					<button
						onclick={stopEmulation}
						class="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 font-bold flex items-center gap-1"
					>
						<X class="h-3 w-3" />
						Stop
					</button>
				</div>
			</div>
		{/if}

		<!-- Menu Items -->
		<DropdownMenu.Group>
			<DropdownMenu.Item onSelect={() => navigateTo('/profile')}>
				<User class="mr-2 h-4 w-4" />
				<span>Profile</span>
			</DropdownMenu.Item>

			<DropdownMenu.Item onSelect={() => navigateTo('/credits')}>
				<CreditCard class="mr-2 h-4 w-4" />
				<span>Credits</span>
			</DropdownMenu.Item>

			<DropdownMenu.Item onSelect={() => navigateTo('/settings')}>
				<Settings class="mr-2 h-4 w-4" />
				<span>Settings</span>
			</DropdownMenu.Item>

			{#if isAdmin(user) || isSuperAdmin}
				<DropdownMenu.Separator />
				<DropdownMenu.Item onSelect={() => navigateTo('/admin')}>
					<Shield class="mr-2 h-4 w-4" />
					<span>Admin Panel</span>
				</DropdownMenu.Item>
			{/if}
		</DropdownMenu.Group>

		<!-- Role Emulation Section (Super Admin Only) -->
		{#if isSuperAdmin && availableRoles.length > 0 && !roleEmulation?.active}
			<DropdownMenu.Separator />
			<DropdownMenu.Sub>
				<DropdownMenu.SubTrigger>
					<Eye class="mr-2 h-4 w-4" />
					<span>Emulate Role</span>
				</DropdownMenu.SubTrigger>
				<DropdownMenu.SubContent class="w-48">
					{#each availableRoles as role}
						<DropdownMenu.Item
							onSelect={() => startEmulation(role.value)}
							disabled={emulationLoading}
						>
							{role.label}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.SubContent>
			</DropdownMenu.Sub>
		{/if}

		<DropdownMenu.Separator />

		<!-- Sign Out -->
		<DropdownMenu.Item
			class="text-destructive focus:text-destructive"
			onSelect={() => {
				const form = document.createElement('form');
				form.method = 'POST';
				form.action = '/auth/signout';
				document.body.appendChild(form);
				form.submit();
			}}
		>
			<LogOut class="mr-2 h-4 w-4" />
			<span>Sign Out</span>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
