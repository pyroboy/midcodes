<script lang="ts">
	import { page } from '$app/state';
	import { auth } from '$lib/stores/auth.svelte';
	import { roleStore } from '$lib/stores/role.svelte';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { EmployeeRole } from '$lib/types';
	import {
		LayoutDashboard,
		Clock,
		ClipboardCheck,
		Calendar,
		Package,
		Receipt,
		MessageSquare,
		BarChart3,
		Shield,
		LogOut,
		Menu,
		X,
		UserCog,
		ChevronDown
	} from 'lucide-svelte';

	let { children }: { children: Snippet } = $props();
	let isReady = $state(false);
	let sidebarOpen = $state(false);
	let currentRole = $state<EmployeeRole>(roleStore.role);
	let roleSwitcherOpen = $state(false);

	// Sync local role state with shared store
	$effect(() => {
		roleStore.role = currentRole;
	});

	onMount(() => {
		isReady = true;
		const handler = () => { sidebarOpen = !sidebarOpen; };
		window.addEventListener('toggle-sidebar', handler);
		return () => window.removeEventListener('toggle-sidebar', handler);
	});

	const roles: { value: EmployeeRole; label: string; description: string; color: string }[] = [
		{ value: 'admin', label: 'Admin', description: 'Full system access', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
		{ value: 'manager', label: 'Manager', description: 'Team & operations', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
		{ value: 'staff', label: 'Staff', description: 'Field worker', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' }
	];

	const allNavItems = {
		main: [
			{ href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager', 'staff'] },
			{ href: '/shifts', icon: Clock, label: 'Shifts', roles: ['admin', 'manager', 'staff'] },
			{ href: '/tasks', icon: ClipboardCheck, label: 'Tasks', roles: ['admin', 'manager', 'staff'] },
			{ href: '/schedules', icon: Calendar, label: 'Schedule', roles: ['admin', 'manager', 'staff'] }
		],
		operations: [
			{ href: '/inventory', icon: Package, label: 'Inventory', roles: ['admin', 'manager'] },
			{ href: '/expenses', icon: Receipt, label: 'Expenses', roles: ['admin', 'manager', 'staff'] },
			{ href: '/messages', icon: MessageSquare, label: 'Messages', roles: ['admin', 'manager', 'staff'] }
		],
		management: [
			{ href: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin', 'manager'] },
			{ href: '/admin', icon: Shield, label: 'Admin', roles: ['admin'] }
		]
	};

	let navGroups = $derived([
		{
			label: 'Main',
			items: allNavItems.main.filter(i => i.roles.includes(currentRole))
		},
		{
			label: 'Operations',
			items: allNavItems.operations.filter(i => i.roles.includes(currentRole))
		},
		{
			label: 'Management',
			items: allNavItems.management.filter(i => i.roles.includes(currentRole))
		}
	].filter(g => g.items.length > 0));

	function isActive(href: string): boolean {
		if (href === '/dashboard') return page.url.pathname === '/dashboard' || page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<div class="flex h-full flex-row">
	<!-- Desktop Sidebar -->
	<aside class="hidden w-64 flex-shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
		<!-- Current Role Badge -->
		<div class="flex items-center gap-2 border-b border-sidebar-border px-6 py-3">
			<span class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold {roles.find(r => r.value === currentRole)?.color}">{roles.find(r => r.value === currentRole)?.label}</span>
			<span class="text-xs text-sidebar-foreground/50">{roles.find(r => r.value === currentRole)?.description}</span>
		</div>
		<nav class="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
			{#key currentRole}
				{#each navGroups as group}
					<p class="mb-1 mt-4 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 first:mt-0">
						{group.label}
					</p>
					{#each group.items as item}
						{@const active = isActive(item.href)}
						<a
							href={item.href}
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
								{active
									? 'bg-sidebar-accent text-sidebar-accent-foreground'
									: 'text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground'}"
						>
							<item.icon class="h-4 w-4" />
							{item.label}
						</a>
					{/each}
				{/each}
			{/key}
		</nav>

		<!-- Role Switcher -->
		<div class="border-t border-sidebar-border p-4">
			<p class="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">Test As</p>
			<button
				onclick={() => (roleSwitcherOpen = !roleSwitcherOpen)}
				class="flex w-full items-center justify-between rounded-lg bg-sidebar-accent/10 px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/20"
			>
				<div class="flex items-center gap-2">
					<UserCog class="h-4 w-4" />
					<span>{roles.find(r => r.value === currentRole)?.label}</span>
				</div>
				<ChevronDown class="h-3.5 w-3.5 transition-transform {roleSwitcherOpen ? 'rotate-180' : ''}" />
			</button>
			{#if roleSwitcherOpen}
				<div class="mt-1 space-y-0.5">
					{#each roles as role}
						<button
							onclick={() => { currentRole = role.value; roleSwitcherOpen = false; }}
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors
								{currentRole === role.value
									? 'bg-sidebar-accent text-sidebar-accent-foreground'
									: 'text-sidebar-foreground/70 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground'}"
						>
							<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold {role.color}">{role.label}</span>
							<span class="text-xs text-sidebar-foreground/50">{role.description}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="border-t border-sidebar-border p-4">
			<a
				href="/login"
				class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground"
			>
				<LogOut class="h-4 w-4" />
				Logout
			</a>
		</div>
	</aside>

	<!-- Mobile Sidebar Overlay -->
	{#if sidebarOpen}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-40 bg-black/50 lg:hidden"
			onclick={() => (sidebarOpen = false)}
			onkeydown={(e) => { if (e.key === 'Escape') sidebarOpen = false; }}
		></div>

		<aside class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground lg:hidden">
			<div class="flex items-center justify-between border-b border-sidebar-border p-4">
				<span class="text-lg font-bold text-sidebar-primary">FlowWork</span>
				<button
					onclick={() => (sidebarOpen = false)}
					class="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/20"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<nav class="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
				{#each navGroups as group}
					<p class="mb-1 mt-4 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 first:mt-0">
						{group.label}
					</p>
					{#each group.items as item}
						{@const active = isActive(item.href)}
						<a
							href={item.href}
							onclick={() => (sidebarOpen = false)}
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
								{active
									? 'bg-sidebar-accent text-sidebar-accent-foreground'
									: 'text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground'}"
						>
							<item.icon class="h-4 w-4" />
							{item.label}
						</a>
					{/each}
				{/each}
			</nav>

			<!-- Mobile Role Switcher -->
			<div class="border-t border-sidebar-border p-4">
				<p class="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">Test As</p>
				<div class="space-y-0.5">
					{#each roles as role}
						<button
							onclick={() => { currentRole = role.value; }}
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors
								{currentRole === role.value
									? 'bg-sidebar-accent text-sidebar-accent-foreground'
									: 'text-sidebar-foreground/70 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground'}"
						>
							<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold {role.color}">{role.label}</span>
							<span class="text-xs text-sidebar-foreground/50">{role.description}</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="border-t border-sidebar-border p-4">
				<a
					href="/login"
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground"
				>
					<LogOut class="h-4 w-4" />
					Logout
				</a>
			</div>
		</aside>
	{/if}

	<!-- Main Content -->
	<div class="flex flex-1 flex-col overflow-auto">
		{#if isReady}
			{@render children()}
		{:else}
			<div class="flex flex-1 items-center justify-center">
				<p class="text-muted-foreground">Loading...</p>
			</div>
		{/if}
	</div>
</div>
