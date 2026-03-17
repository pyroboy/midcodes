<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');

	let filteredPastors = $derived(
		data.pastors.filter((pastor) => {
			if (!searchQuery) return true;
			const q = searchQuery.toLowerCase();
			return (
				pastor.name.toLowerCase().includes(q) ||
				pastor.title.toLowerCase().includes(q)
			);
		})
	);
</script>

<svelte:head>
	<title>Pastors - MOFI Admin</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl font-bold text-gray-900">Pastors</h1>
	<a
		href="/admin/pastors/new"
		class="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
	>
		New Pastor
	</a>
</div>

<div class="mb-4">
	<input type="text" bind:value={searchQuery} placeholder="Search..."
		class="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500" />
</div>

{#if data.pastors.length === 0}
	<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
		No pastors yet. Add your first one.
	</div>
{:else}
	<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
		<table class="w-full">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ministry Focus</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Churches</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
					<th class="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-50">
				{#each filteredPastors as pastor}
					<tr class="hover:bg-gray-50/50">
						<td class="px-5 py-4">
							{#if pastor.photoUrl}
								<img src={pastor.photoUrl} alt={pastor.name} class="w-8 h-8 rounded-full object-cover" />
							{:else}
								<div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
									{pastor.name.charAt(0).toUpperCase()}
								</div>
							{/if}
						</td>
						<td class="px-5 py-4 text-sm text-gray-900 font-medium">{pastor.name}</td>
						<td class="px-5 py-4 text-sm text-gray-900">{pastor.title}</td>
						<td class="px-5 py-4 text-sm text-gray-900">{pastor.ministryFocus ?? ''}</td>
						<td class="px-5 py-4 text-sm text-gray-900">
							{#if pastor.churches.length > 0}
								{pastor.churches.map((c) => c.churchName).join(', ')}
							{:else}
								<span class="text-gray-400">None</span>
							{/if}
						</td>
						<td class="px-5 py-4">
							{#if pastor.isActive}
								<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span>
							{:else}
								<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Inactive</span>
							{/if}
						</td>
						<td class="px-5 py-4 text-right">
							<div class="flex items-center justify-end gap-3">
								<a
									href="/admin/pastors/{pastor.id}"
									class="text-sm text-blue-600 hover:text-blue-800"
								>
									Edit
								</a>
								<form method="POST" action="?/delete" onsubmit={(e) => { if (!confirm(`Delete "${pastor.name}"?`)) e.preventDefault(); }}>
									<input type="hidden" name="id" value={pastor.id} />
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
