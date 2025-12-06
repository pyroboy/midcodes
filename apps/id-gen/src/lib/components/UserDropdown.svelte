<script lang="ts">
	import { User, Settings, Shield, LogOut, CreditCard } from 'lucide-svelte';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { goto } from '$app/navigation';

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
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<Button
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
					<p class="text-xs text-muted-foreground">
						{formatRoleName(user?.role)}
					</p>
				</div>
			</div>
		</div>

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

			{#if isAdmin(user)}
				<DropdownMenu.Separator />
				<DropdownMenu.Item onSelect={() => navigateTo('/admin')}>
					<Shield class="mr-2 h-4 w-4" />
					<span>Admin Panel</span>
				</DropdownMenu.Item>
			{/if}
		</DropdownMenu.Group>

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
