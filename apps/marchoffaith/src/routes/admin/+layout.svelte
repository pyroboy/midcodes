<script lang="ts">
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import AdminToast from '$lib/components/AdminToast.svelte';

	let { data, children }: { data: LayoutData; children: any } = $props();

	const navSections = [
		{
			label: '',
			items: [
				{ href: '/admin', label: 'Dashboard' }
			]
		},
		{
			label: 'Content',
			items: [
				{ href: '/admin/articles', label: 'Articles' },
				{ href: '/admin/events', label: 'Events' },
				{ href: '/admin/sermons', label: 'Sermons' },
				{ href: '/admin/gallery', label: 'Gallery' },
				{ href: '/admin/announcements', label: 'Announcements' }
			]
		},
		{
			label: 'Church',
			items: [
				{ href: '/admin/churches', label: 'Churches' },
				{ href: '/admin/pastors', label: 'Pastors' }
			]
		},
		{
			label: 'Community',
			items: [
				{ href: '/admin/prayers', label: 'Prayer Wall' },
				{ href: '/admin/inbox', label: 'Inbox' }
			]
		}
	];

	function isActive(href: string): boolean {
		if (href === '/admin') return $page.url.pathname === '/admin';
		return $page.url.pathname.startsWith(href);
	}
</script>

{#if !data.authenticated}
	{@render children()}
{:else}
	<div class="min-h-screen bg-gray-50 flex">
		<!-- Sidebar -->
		<aside class="w-60 bg-gray-900 text-white flex flex-col shrink-0">
			<div class="p-5 border-b border-gray-800">
				<h1 class="text-lg font-bold">MOFI Admin</h1>
				<p class="text-xs text-gray-400 mt-0.5">marchoffaithinc.com</p>
			</div>

			<nav class="flex-1 p-3 space-y-4 overflow-y-auto">
				{#each navSections as section}
					<div>
						{#if section.label}
							<div class="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">{section.label}</div>
						{/if}
						<div class="space-y-0.5">
							{#each section.items as item}
								<a
									href={item.href}
									class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
										{isActive(item.href) ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}"
								>
									{item.label}
								</a>
							{/each}
						</div>
					</div>
				{/each}
			</nav>

			<div class="p-3 border-t border-gray-800">
				<a href="/" class="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors">
					View Site
				</a>
				<form method="POST" action="/admin/logout">
					<button type="submit" class="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-red-400 transition-colors">
						Logout
					</button>
				</form>
			</div>
		</aside>

		<!-- Main -->
		<main class="flex-1 overflow-auto">
			<AdminToast />
			<div class="max-w-6xl mx-auto p-8">
				{@render children()}
			</div>
		</main>
	</div>
{/if}
