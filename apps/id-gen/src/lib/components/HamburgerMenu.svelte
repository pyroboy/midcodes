<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { paymentFlags } from '$lib/stores/featureFlags';
	
	interface Props {
		isOpen: boolean;
		user?: any;
		onClose?: () => void;
	}
	
	let { isOpen, user, onClose }: Props = $props();
	
	// Secondary navigation items
	const secondaryNavItems = [
		{
			href: '/account',
			label: 'My Account',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />`,
			roles: ['all']
		},
		{
			href: '/pricing',
			label: 'Pricing',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />`,
			roles: ['all']
		},
		{
			href: '/profile',
			label: 'Profile Settings',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`,
			roles: ['all']
		},
		{
			href: '/help',
			label: 'Help & Support',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`,
			roles: ['all']
		}
	];
	
	// Admin-only navigation items
	const adminNavItems = [
		{
			href: '/admin/users',
			label: 'User Management',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />`,
			roles: ['super_admin', 'org_admin']
		},
		{
			href: '/admin/analytics',
			label: 'Analytics',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />`,
			roles: ['super_admin', 'org_admin', 'id_gen_admin']
		},
		{
			href: '/admin/credits',
			label: 'Manage Credits',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />`,
			roles: ['super_admin']
		},
		{
			href: '/admin/organization',
			label: 'Organization Settings',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />`,
			roles: ['super_admin']
		}
	];
	
	function hasPermission(itemRoles: string[], userRole?: string): boolean {
		if (itemRoles.includes('all')) return true;
		if (!userRole) return false;
		return itemRoles.includes(userRole);
	}
	
	function getUserDisplayName(user: any): string {
		return user?.email?.split('@')[0] || 'User';
	}
	
	function getUserRole(user: any): string {
		if (!user?.role) return 'User';
		return user.role.split('_').map((word: string) => 
			word.charAt(0).toUpperCase() + word.slice(1)
		).join(' ');
	}
	
	// Close menu when clicking outside or on links
	function handleBackdropClick() {
		onClose?.();
	}
	
	function handleLinkClick() {
		onClose?.();
	}
</script>

<!-- Backdrop -->
{#if isOpen}
	<div 
		class="lg:hidden fixed inset-0 bg-black/50 z-50" 
		transition:fade={{ duration: 200 }}
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Escape' && handleBackdropClick()}
		role="button"
		tabindex="-1"
		aria-label="Close menu"
	></div>
{/if}

<!-- Menu Drawer -->
{#if isOpen}
	<div 
		class="lg:hidden fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-xl z-50 overflow-y-auto"
		transition:fly={{ x: -300, duration: 300 }}
	>
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-4 0V4a2 2 0 014 0v2" />
					</svg>
				</div>
				<div>
					<h2 class="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
				</div>
			</div>
			
			<Button 
				variant="ghost" 
				size="icon"
				onclick={onClose}
				aria-label="Close menu"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</Button>
		</div>
		
		<!-- User Info -->
		{#if user}
			<div class="p-4 border-b border-gray-200 dark:border-gray-700">
				<div class="flex items-center gap-3">
					<div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-medium">
						{user.email?.substring(0, 2).toUpperCase() || 'U'}
					</div>
					<div>
						<p class="text-sm font-medium text-gray-900 dark:text-white">
							{getUserDisplayName(user)}
						</p>
						<p class="text-xs text-gray-500 dark:text-gray-400">
							{getUserRole(user)}
						</p>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Navigation Items -->
		<div class="p-4 space-y-2">
			<!-- Secondary Navigation -->
			<div class="space-y-1">
				{#each secondaryNavItems as item}
					{#if hasPermission(item.roles, user?.role)}
						{#if item.href === '/pricing' && !$paymentFlags.paymentsEnabled}
							<!-- Hide pricing link when payments are disabled -->
						{:else}
							<a 
								href={item.href}
								class="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
								onclick={handleLinkClick}
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									{@html item.icon}
								</svg>
								{item.label}
							</a>
						{/if}
					{/if}
				{/each}
			</div>
			
			<!-- Admin Section -->
			{#if user?.role && ['super_admin', 'org_admin', 'id_gen_admin'].includes(user.role)}
				<Separator class="my-4" />
				
				<div class="space-y-1">
					<h3 class="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
						Administration
					</h3>
					
					{#each adminNavItems as item}
						{#if hasPermission(item.roles, user?.role)}
							<a 
								href={item.href}
								class="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
								onclick={handleLinkClick}
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									{@html item.icon}
								</svg>
								{item.label}
							</a>
						{/if}
					{/each}
				</div>
			{/if}
			
			<!-- Sign Out -->
			{#if user}
				<Separator class="my-4" />
				
				<form method="POST" action="/auth/signout" class="w-full">
					<button 
						type="submit" 
						class="flex w-full items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
						</svg>
						Sign Out
					</button>
				</form>
			{/if}
		</div>
	</div>
{/if}