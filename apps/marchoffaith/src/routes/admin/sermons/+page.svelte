<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let filtered = $derived(data.sermons.filter(s =>
		s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
		s.speaker?.toLowerCase().includes(searchQuery.toLowerCase())
	));
</script>

<svelte:head>
	<title>Sermons - MOFI Admin</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl font-bold text-gray-900">Sermons</h1>
	<a
		href="/admin/sermons/new"
		class="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
	>
		New Sermon
	</a>
</div>

<div class="mb-4">
	<input type="text" bind:value={searchQuery} placeholder="Search..."
		class="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500" />
</div>

{#if data.sermons.length === 0}
	<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
		No sermons yet. Create your first one.
	</div>
{:else}
	<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
		<table class="w-full">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Speaker</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Has Video</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Published</th>
					<th class="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-50">
				{#each filtered as sermon}
					<tr class="hover:bg-gray-50/50">
						<td class="px-5 py-4 text-sm text-gray-900 font-medium">{sermon.title}</td>
						<td class="px-5 py-4 text-sm text-gray-900">{sermon.speaker}</td>
						<td class="px-5 py-4 text-sm text-gray-900">{sermon.date}</td>
						<td class="px-5 py-4 text-sm text-gray-900">
							{#if sermon.videoUrl}
								<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
							{:else}
								<span class="text-gray-300">&mdash;</span>
							{/if}
						</td>
						<td class="px-5 py-4">
							{#if sermon.isPublished}
								<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Published</span>
							{:else}
								<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Draft</span>
							{/if}
						</td>
						<td class="px-5 py-4 text-right">
							<div class="flex items-center justify-end gap-3">
								<a
									href="/admin/sermons/{sermon.id}"
									class="text-sm text-blue-600 hover:text-blue-800"
								>
									Edit
								</a>
								<form method="POST" action="?/delete" onsubmit={(e) => { if (!confirm(`Delete "${sermon.title}"?`)) e.preventDefault(); }}>
									<input type="hidden" name="id" value={sermon.id} />
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
