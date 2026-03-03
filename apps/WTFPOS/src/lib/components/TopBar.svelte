<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import { session, BRANCHES, ELEVATED_ROLES, ADMIN_ROLES } from '$lib/stores/session.svelte';

	const canSeeBranches = $derived(ELEVATED_ROLES.includes(session.role));
	const canSeeAdmin    = $derived(ADMIN_ROLES.includes(session.role));
	const isFloorLocked  = $derived(session.branch === 'all');

	const navLinks = $derived([
		{ href: '/floor',   label: 'Floor',   icon: '🪑', show: true },
		{ href: '/stock',   label: 'Stock',   icon: '📦', show: true },
		{ href: '/reports', label: 'Reports', icon: '📊', show: true },
		{ href: '/admin',   label: 'Admin',   icon: '⚙️',  show: canSeeAdmin }
	]);

	function isActive(href: string) {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	}

	const roleClass = $derived(
		session.role === 'admin' || session.role === 'owner'
			? 'border-status-purple/30 bg-status-purple-light text-status-purple'
			: session.role === 'manager'
				? 'border-accent/30 bg-accent-light text-accent'
				: session.role === 'kitchen'
					? 'border-status-green/30 bg-status-green-light text-status-green'
					: 'border-gray-200 bg-gray-50 text-gray-500'
	);
</script>

<header class="topbar shrink-0">
	<!-- Brand -->
	<div class="flex shrink-0 items-center gap-2">
		<span class="text-base font-extrabold tracking-tight text-gray-900">WTF! SAMGYUP</span>
		<span class="inline-flex h-5 items-center rounded-full bg-accent px-2 text-[10px] font-bold uppercase tracking-wide text-white">
			POS
		</span>
	</div>

	<!-- Center primary nav -->
	<nav class="flex flex-1 items-center justify-center gap-0.5">
		{#each navLinks.filter(l => l.show) as link}
			{@const active = isActive(link.href)}
			{@const locked = link.href === '/floor' && isFloorLocked}
			<a
				href={locked ? undefined : link.href}
				aria-disabled={locked}
				class={cn(
					'flex items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors no-select',
					active
						? 'bg-accent-light text-accent'
						: locked
							? 'pointer-events-none text-gray-300'
							: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
				)}
				style="min-height:36px"
			>
				<span class="text-sm leading-none">{link.icon}</span>
				{link.label}
				{#if locked}<span class="ml-0.5 text-xs text-gray-300">🔒</span>{/if}
			</a>
		{/each}
	</nav>

	<!-- Right: branch select + role badge + user + logout -->
	<div class="flex shrink-0 items-center gap-3">
		{#if canSeeBranches}
			<select
				bind:value={session.branch}
				class="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-gray-700 outline-none focus:border-accent transition-all"
				style="min-height:unset"
			>
				{#each BRANCHES as b}
					<option value={b.id}>{b.name}</option>
				{/each}
			</select>
		{/if}

		<span class={cn('hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase', roleClass)}>
			{session.role}
		</span>

		<div class="flex items-center gap-1.5">
			<span class="flex h-7 w-7 items-center justify-center rounded-full bg-accent-light text-sm font-semibold text-accent">
				{(session.userName || 'U').charAt(0).toUpperCase()}
			</span>
			<span class="hidden text-sm font-medium text-gray-700 md:inline">{session.userName || 'User'}</span>
		</div>

		<a href="/" class="flex items-center rounded-md border border-border px-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors" style="min-height:32px">
			Logout
		</a>
	</div>
</header>
