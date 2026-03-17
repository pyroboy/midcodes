<script lang="ts">
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);

	function formatDatetimeLocal(date: string | Date | null): string {
		if (!date) return '';
		const d = new Date(date);
		if (isNaN(d.getTime())) return '';
		// Format as YYYY-MM-DDTHH:MM for datetime-local input
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}
</script>

<svelte:head>
	<title>Edit Announcement - MOFI Admin</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl font-bold text-gray-900">Edit Announcement</h1>
	<a
		href="/admin/announcements"
		class="text-sm text-gray-500 hover:text-gray-700"
	>
		&larr; Back to Announcements
	</a>
</div>

{#if form?.error}
	<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
		{form.error}
	</div>
{/if}

<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
	<form method="POST" class="space-y-5" onsubmit={() => { submitting = true; }}>
		<div class="space-y-1.5">
			<label for="message" class="block text-sm font-medium text-gray-700">Message</label>
			<textarea
				id="message"
				name="message"
				rows="3"
				required
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
			>{form?.message ?? data.announcement.message}</textarea>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
			<div class="space-y-1.5">
				<label for="linkUrl" class="block text-sm font-medium text-gray-700">Link URL (optional)</label>
				<input
					type="url"
					id="linkUrl"
					name="linkUrl"
					value={form?.linkUrl ?? data.announcement.linkUrl ?? ''}
					placeholder="https://..."
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				/>
			</div>

			<div class="space-y-1.5">
				<label for="linkText" class="block text-sm font-medium text-gray-700">Link Text (optional)</label>
				<input
					type="text"
					id="linkText"
					name="linkText"
					value={form?.linkText ?? data.announcement.linkText ?? ''}
					placeholder="e.g. Learn More"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				/>
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
			<div class="space-y-1.5">
				<label for="expiresAt" class="block text-sm font-medium text-gray-700">Expires At (optional)</label>
				<input
					type="datetime-local"
					id="expiresAt"
					name="expiresAt"
					value={form?.expiresAt ?? formatDatetimeLocal(data.announcement.expiresAt)}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				/>
			</div>

			<div class="space-y-1.5">
				<label for="sortOrder" class="block text-sm font-medium text-gray-700">Sort Order</label>
				<input
					type="number"
					id="sortOrder"
					name="sortOrder"
					value={form?.sortOrder ?? data.announcement.sortOrder}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				/>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<input
				type="checkbox"
				id="isActive"
				name="isActive"
				checked={form?.isActive ?? data.announcement.isActive}
				class="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
			/>
			<label for="isActive" class="text-sm font-medium text-gray-700">Active</label>
		</div>

		<div class="flex items-center gap-3 pt-4">
			<button
				type="submit"
				disabled={submitting}
				class="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
			>
				{submitting ? 'Saving...' : 'Update Announcement'}
			</button>
			<a href="/admin/announcements" class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Cancel</a>
		</div>
	</form>
</div>
