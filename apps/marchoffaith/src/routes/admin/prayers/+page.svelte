<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type FilterTab = 'all' | 'pending' | 'approved';
	let activeFilter: FilterTab = $state('pending');
	let searchQuery = $state('');
	let actionLoading = $state<number | null>(null);

	let filteredRequests = $derived(
		data.requests
			.filter((r) => {
				if (activeFilter === 'pending') return !r.isApproved;
				if (activeFilter === 'approved') return r.isApproved;
				return true;
			})
			.filter(
				(r) =>
					!searchQuery ||
					r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					r.request.toLowerCase().includes(searchQuery.toLowerCase())
			)
	);

	let totalCount = $derived(data.requests.length);
	let pendingCount = $derived(data.requests.filter((r) => !r.isApproved).length);
	let approvedCount = $derived(data.requests.filter((r) => r.isApproved).length);

	const tabs: { key: FilterTab; label: string; count: () => number }[] = [
		{ key: 'pending', label: 'Pending', count: () => pendingCount },
		{ key: 'approved', label: 'Approved', count: () => approvedCount },
		{ key: 'all', label: 'All', count: () => totalCount }
	];
</script>

<svelte:head>
	<title>Prayer Wall - MOFI Admin</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<div class="flex items-center gap-3">
		<h1 class="text-2xl font-bold text-gray-900">Prayer Wall</h1>
		{#if pendingCount > 0}
			<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
				{pendingCount} pending
			</span>
		{/if}
	</div>
	<p class="text-sm text-gray-400">{totalCount} total requests</p>
</div>

<!-- Filter tabs + search -->
<div class="flex flex-wrap items-center gap-3 mb-5">
	<div class="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
		{#each tabs as tab}
			<button
				type="button"
				class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors {activeFilter === tab.key
					? 'bg-white text-gray-900 shadow-sm'
					: 'text-gray-500 hover:text-gray-700'}"
				onclick={() => (activeFilter = tab.key)}
			>
				{tab.label}
				<span class="ml-1 text-xs text-gray-400">{tab.count()}</span>
			</button>
		{/each}
	</div>
	<input
		type="text"
		bind:value={searchQuery}
		placeholder="Search prayers..."
		class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 w-full max-w-sm"
	/>
</div>

{#if filteredRequests.length === 0}
	<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
		{#if searchQuery}
			No prayer requests matching "{searchQuery}".
		{:else if activeFilter === 'pending'}
			No pending prayer requests.
		{:else if activeFilter === 'approved'}
			No approved prayer requests yet.
		{:else}
			No prayer requests yet.
		{/if}
	</div>
{:else}
	<div class="space-y-3">
		{#each filteredRequests as request}
			<div
				class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 {request.isApproved
					? 'border-l-green-500'
					: 'border-l-yellow-500 bg-yellow-50/30'}"
			>
				<div class="flex items-start justify-between gap-4">
					<div class="flex-1 min-w-0">
						<!-- Name + email + badges -->
						<div class="flex items-center gap-2 mb-1 flex-wrap">
							<span class="text-sm font-semibold text-gray-900">{request.name}</span>
							{#if request.email}
								<span class="text-xs text-gray-400">{request.email}</span>
							{/if}
							<!-- Status badges -->
							{#if request.isApproved}
								<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Approved</span>
							{:else}
								<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Pending</span>
							{/if}
							{#if request.isPublic}
								<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-600">Public</span>
							{:else}
								<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Private</span>
							{/if}
						</div>

						<!-- Request text -->
						<p class="text-sm text-gray-600 mt-2 whitespace-pre-line">{request.request}</p>

						<!-- Date -->
						<p class="text-xs text-gray-400 mt-2">
							{new Date(request.createdAt).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'short',
								day: 'numeric',
								hour: 'numeric',
								minute: '2-digit'
							})}
						</p>
					</div>

					<!-- Actions -->
					<div class="flex items-center gap-2 shrink-0 flex-wrap justify-end">
						{#if request.isApproved}
							<form
								method="POST"
								action="?/reject"
								onsubmit={() => {
									actionLoading = request.id;
								}}
							>
								<input type="hidden" name="id" value={request.id} />
								<button
									type="submit"
									disabled={actionLoading === request.id}
									class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{actionLoading === request.id ? 'Loading...' : 'Unapprove'}
								</button>
							</form>
						{:else}
							<form
								method="POST"
								action="?/approve"
								onsubmit={() => {
									actionLoading = request.id;
								}}
							>
								<input type="hidden" name="id" value={request.id} />
								<button
									type="submit"
									disabled={actionLoading === request.id}
									class="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{actionLoading === request.id ? 'Loading...' : 'Approve'}
								</button>
							</form>
						{/if}

						<form
							method="POST"
							action="?/togglePublic"
							onsubmit={() => {
								actionLoading = request.id;
							}}
						>
							<input type="hidden" name="id" value={request.id} />
							<input type="hidden" name="isPublic" value={request.isPublic ? 'true' : 'false'} />
							<button
								type="submit"
								disabled={actionLoading === request.id}
								class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{actionLoading === request.id ? 'Loading...' : request.isPublic ? 'Make Private' : 'Make Public'}
							</button>
						</form>

						<form
							method="POST"
							action="?/delete"
							onsubmit={(e) => {
								if (!confirm(`Delete prayer request from "${request.name}"?`)) {
									e.preventDefault();
								} else {
									actionLoading = request.id;
								}
							}}
						>
							<input type="hidden" name="id" value={request.id} />
							<button
								type="submit"
								disabled={actionLoading === request.id}
								class="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{actionLoading === request.id ? 'Deleting...' : 'Delete'}
							</button>
						</form>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
