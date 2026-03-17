<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let actionLoading = $state<number | null>(null);

	let unreadCount = $derived(data.submissions.filter((s) => !s.isRead).length);

	let filtered = $derived(
		data.submissions.filter(
			(m) =>
				m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				m.message.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);
</script>

<svelte:head>
	<title>Inbox - MOFI Admin</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<div class="flex items-center gap-3">
		<h1 class="text-2xl font-bold text-gray-900">Inbox</h1>
		{#if unreadCount > 0}
			<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
				{unreadCount} unread
			</span>
		{/if}
	</div>
	<p class="text-sm text-gray-400">{data.submissions.length} total messages</p>
</div>

<div class="mb-4">
	<input
		type="text"
		bind:value={searchQuery}
		placeholder="Search messages..."
		class="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
	/>
</div>

{#if filtered.length === 0}
	<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
		{#if searchQuery}
			No messages matching "{searchQuery}".
		{:else}
			No messages yet.
		{/if}
	</div>
{:else}
	<div class="space-y-3">
		{#each filtered as submission}
			<div
				class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 {submission.isRead
					? 'border-l-transparent'
					: 'border-l-orange-500 bg-orange-50/50'}"
			>
				<div class="flex items-start justify-between gap-4">
					<div class="flex-1 min-w-0">
						<!-- Name + email + unread dot -->
						<div class="flex items-center gap-2 mb-1">
							{#if !submission.isRead}
								<span class="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
							{/if}
							<span class="text-sm font-semibold text-gray-900 {!submission.isRead ? '' : ''}"
								>{submission.name}</span
							>
							<span class="text-xs text-gray-400">{submission.email}</span>
							{#if submission.phone}
								<span class="text-xs text-gray-400">| {submission.phone}</span>
							{/if}
						</div>

						<!-- Subject -->
						{#if submission.subject}
							<p class="text-sm font-medium text-gray-700 mb-1">{submission.subject}</p>
						{/if}

						<!-- Message preview -->
						<p class="text-sm text-gray-500 line-clamp-2">{submission.message}</p>

						<!-- Date -->
						<p class="text-xs text-gray-400 mt-2">
							{new Date(submission.createdAt).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'short',
								day: 'numeric',
								hour: 'numeric',
								minute: '2-digit'
							})}
						</p>
					</div>

					<!-- Actions -->
					<div class="flex items-center gap-2 shrink-0">
						<form
							method="POST"
							action="?/markRead"
							onsubmit={() => {
								actionLoading = submission.id;
							}}
						>
							<input type="hidden" name="id" value={submission.id} />
							<input type="hidden" name="isRead" value={submission.isRead ? 'false' : 'true'} />
							<button
								type="submit"
								disabled={actionLoading === submission.id}
								class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{actionLoading === submission.id ? 'Loading...' : submission.isRead ? 'Mark Unread' : 'Mark Read'}
							</button>
						</form>
						<form
							method="POST"
							action="?/delete"
							onsubmit={(e) => {
								if (!confirm(`Delete message from "${submission.name}"?`)) {
									e.preventDefault();
								} else {
									actionLoading = submission.id;
								}
							}}
						>
							<input type="hidden" name="id" value={submission.id} />
							<button
								type="submit"
								disabled={actionLoading === submission.id}
								class="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{actionLoading === submission.id ? 'Deleting...' : 'Delete'}
							</button>
						</form>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
