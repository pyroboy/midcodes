<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');

	let filteredChurches = $derived(
		data.churches.filter((church) => {
			if (!searchQuery) return true;
			const q = searchQuery.toLowerCase();
			return (
				church.name.toLowerCase().includes(q) ||
				church.city.toLowerCase().includes(q) ||
				church.province.toLowerCase().includes(q)
			);
		})
	);
</script>

<svelte:head>
	<title>Churches - MOFI Admin</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl font-bold text-gray-900">Churches</h1>
	<a
		href="/admin/churches/new"
		class="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
	>
		New Church
	</a>
</div>

<div class="mb-4">
	<input type="text" bind:value={searchQuery} placeholder="Search..."
		class="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500" />
</div>

{#if data.churches.length === 0}
	<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
		No churches yet. Add your first one.
	</div>
{:else}
	<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
		<table class="w-full">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Founded</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
					<th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
					<th class="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-50">
				{#each filteredChurches as church}
					<tr class="hover:bg-gray-50/50">
						<td class="px-5 py-4">
							<div class="text-sm text-gray-900 font-medium">{church.name}</div>
							{#if church.pastors.length > 0}
								<div class="text-xs text-gray-400 mt-0.5">
									{church.pastors.map((p) => p.pastorName).join(', ')}
								</div>
							{/if}
						</td>
						<td class="px-5 py-4 text-sm text-gray-900">{church.city}, {church.province}</td>
						<td class="px-5 py-4 text-sm text-gray-900">{church.yearFounded ?? '—'}</td>
						<td class="px-5 py-4 text-sm text-gray-900">{church.totalMembers ?? '—'}</td>
						<td class="px-5 py-4">
							{#if church.isActive}
								<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span>
							{:else}
								<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Inactive</span>
							{/if}
						</td>
						<td class="px-5 py-4 text-right">
							<div class="flex items-center justify-end gap-3">
								<a
									href="/admin/churches/{church.id}"
									class="text-sm text-blue-600 hover:text-blue-800"
								>
									Edit
								</a>
								<form method="POST" action="?/delete" onsubmit={(e) => { if (!confirm(`Delete "${church.name}"?`)) e.preventDefault(); }}>
									<input type="hidden" name="id" value={church.id} />
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
