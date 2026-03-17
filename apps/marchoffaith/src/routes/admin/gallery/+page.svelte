<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let filtered = $derived(data.galleries.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase())));
</script>

<svelte:head>
	<title>Photo Gallery - MOFI Admin</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl font-bold text-gray-900">Photo Gallery</h1>
	<a
		href="/admin/gallery/new"
		class="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
	>
		New Gallery
	</a>
</div>

<div class="mb-4">
	<input type="text" bind:value={searchQuery} placeholder="Search galleries..."
		class="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500" />
</div>

{#if filtered.length === 0}
	<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
		{searchQuery ? 'No galleries match your search.' : 'No galleries yet. Create your first one.'}
	</div>
{:else}
	<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
		<table class="w-full">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cover</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Images</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Published</th>
					<th class="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-50">
				{#each filtered as gallery}
					<tr class="hover:bg-gray-50/50">
						<td class="px-5 py-4">
							{#if gallery.coverImageUrl}
								<img
									src={gallery.coverImageUrl}
									alt={gallery.title}
									class="w-12 h-12 rounded-lg object-cover"
								/>
							{:else}
								<div class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
									No img
								</div>
							{/if}
						</td>
						<td class="px-5 py-4 text-sm text-gray-900 font-medium">{gallery.title}</td>
						<td class="px-5 py-4 text-sm text-gray-900">{gallery.date ?? '-'}</td>
						<td class="px-5 py-4 text-sm text-gray-900">{gallery.imageCount}</td>
						<td class="px-5 py-4">
							{#if gallery.isPublished}
								<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Published</span>
							{:else}
								<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Draft</span>
							{/if}
						</td>
						<td class="px-5 py-4 text-right">
							<div class="flex items-center justify-end gap-3">
								<a
									href="/admin/gallery/{gallery.id}"
									class="text-sm text-blue-600 hover:text-blue-800"
								>
									Edit
								</a>
								<form method="POST" action="?/delete" onsubmit={(e) => { if (!confirm(`Delete "${gallery.title}"?`)) e.preventDefault(); }}>
									<input type="hidden" name="id" value={gallery.id} />
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
