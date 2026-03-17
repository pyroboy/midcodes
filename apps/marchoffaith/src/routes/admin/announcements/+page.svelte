<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let filtered = $derived(data.announcements.filter(a => a.message.toLowerCase().includes(searchQuery.toLowerCase())));

	function truncate(text: string, maxLength: number = 60): string {
		return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
	}

	function formatExpiry(expiresAt: string | Date | null): string {
		if (!expiresAt) return 'Never';
		const d = new Date(expiresAt);
		return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}
</script>

<svelte:head>
	<title>Announcements - MOFI Admin</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl font-bold text-gray-900">Announcements</h1>
	<a
		href="/admin/announcements/new"
		class="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
	>
		New Announcement
	</a>
</div>

<div class="mb-4">
	<input type="text" bind:value={searchQuery} placeholder="Search announcements..."
		class="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500" />
</div>

{#if filtered.length === 0}
	<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
		{searchQuery ? 'No announcements match your search.' : 'No announcements yet. Create your first one.'}
	</div>
{:else}
	<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
		<table class="w-full">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Link</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
					<th class="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-50">
				{#each filtered as announcement}
					<tr class="hover:bg-gray-50/50">
						<td class="px-5 py-4 text-sm text-gray-900 font-medium max-w-xs">
							{truncate(announcement.message)}
						</td>
						<td class="px-5 py-4 text-sm text-gray-900">
							{#if announcement.linkUrl}
								<a href={announcement.linkUrl} target="_blank" rel="noopener" class="text-blue-600 hover:text-blue-800">
									{announcement.linkText ?? 'Link'}
								</a>
							{:else}
								<span class="text-gray-400">-</span>
							{/if}
						</td>
						<td class="px-5 py-4">
							{#if announcement.isActive}
								<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span>
							{:else}
								<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Inactive</span>
							{/if}
						</td>
						<td class="px-5 py-4 text-sm text-gray-900">
							{formatExpiry(announcement.expiresAt)}
						</td>
						<td class="px-5 py-4 text-right">
							<div class="flex items-center justify-end gap-3">
								<form method="POST" action="?/toggleActive">
									<input type="hidden" name="id" value={announcement.id} />
									<input type="hidden" name="isActive" value={String(announcement.isActive)} />
									<button type="submit" class="text-sm text-gray-600 hover:text-gray-800">
										{announcement.isActive ? 'Deactivate' : 'Activate'}
									</button>
								</form>
								<a
									href="/admin/announcements/{announcement.id}"
									class="text-sm text-blue-600 hover:text-blue-800"
								>
									Edit
								</a>
								<form method="POST" action="?/delete" onsubmit={(e) => { if (!confirm(`Delete this announcement: "${truncate(announcement.message)}"?`)) e.preventDefault(); }}>
									<input type="hidden" name="id" value={announcement.id} />
									<button type="submit" class="text-sm text-red-600 hover:text-red-800">
										Delete
									</button>
								</form>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
