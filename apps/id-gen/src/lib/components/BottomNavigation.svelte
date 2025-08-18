<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	
	interface Props {
		user?: any;
	}
	
	let { user }: Props = $props();
	
	// Navigation items
	const navItems = [
		{
			href: '/',
			label: 'Home',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />`,
			activeIcon: `<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />`,
			mobileLabel: 'Home'
		},
		{
			href: '/templates',
			label: 'Templates',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />`,
			activeIcon: `<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />`,
			mobileLabel: 'Templates'
		},
		{
			href: '/account',
			label: 'My Account',
			icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />`,
			activeIcon: `<path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />`,
			mobileLabel: 'Account'
		}
	];
	
	// Check if a route is active
	function isActive(href: string, currentPath: string): boolean {
		if (href === '/') {
			return currentPath === '/';
		}
		return currentPath.startsWith(href);
	}
</script>

<!-- Bottom Navigation - Mobile/Tablet -->
<nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-40">
	<div class="grid grid-cols-3 h-16">
		{#each navItems as item}
			<a 
				href={item.href}
				class="flex flex-col items-center justify-center gap-1 px-2 py-2 transition-colors
					{isActive(item.href, $page.url.pathname) 
						? 'text-primary bg-primary/5' 
						: 'text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-primary/5'
					}"
			>
				<svg 
					xmlns="http://www.w3.org/2000/svg" 
					class="h-6 w-6" 
					fill={isActive(item.href, $page.url.pathname) ? 'currentColor' : 'none'} 
					viewBox="0 0 24 24" 
					stroke="currentColor"
				>
					{@html isActive(item.href, $page.url.pathname) ? item.activeIcon : item.icon}
				</svg>
				<span class="text-xs font-medium leading-none">
					{item.mobileLabel}
				</span>
			</a>
		{/each}
	</div>
</nav>

<!-- Desktop Navigation - Hidden on mobile -->
<nav class="hidden lg:flex lg:fixed lg:top-16 lg:left-0 lg:w-64 lg:h-full lg:bg-white lg:dark:bg-gray-900 lg:border-r lg:border-gray-200 lg:dark:border-gray-700 lg:z-30">
	<div class="flex flex-col w-full p-4 space-y-2">
		<div class="mb-4">
			<h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Main Navigation</h2>
		</div>
		
		{#each navItems as item}
			<a 
				href={item.href}
				class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
					{isActive(item.href, $page.url.pathname)
						? 'bg-primary text-white'
						: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
					}"
			>
				<svg 
					xmlns="http://www.w3.org/2000/svg" 
					class="h-5 w-5" 
					fill="none" 
					viewBox="0 0 24 24" 
					stroke="currentColor"
				>
					{@html item.icon}
				</svg>
				{item.label}
			</a>
		{/each}
		
		{#if user?.role && ['super_admin', 'org_admin', 'id_gen_admin'].includes(user.role)}
			<div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
				<h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Administration</h3>
				<a 
					href="/admin"
					class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
						{isActive('/admin', $page.url.pathname)
							? 'bg-primary text-white'
							: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
						}"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
					Admin Panel
				</a>
			</div>
		{/if}
	</div>
</nav>

<!-- Spacer for bottom navigation on mobile -->
<div class="lg:hidden h-16" aria-hidden="true"></div>