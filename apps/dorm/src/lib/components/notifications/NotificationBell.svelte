<script lang="ts">
	import { Bell } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import NotificationPanel from './NotificationPanel.svelte';

	let unreadCount = $state(0);
	let showPanel = $state(false);
	let panelRef = $state<HTMLElement | null>(null);

	async function fetchUnreadCount() {
		try {
			const res = await fetch('/api/notifications?status=UNREAD&limit=1');
			if (res.ok) {
				const data = await res.json();
				unreadCount = data.unreadCount ?? 0;
			}
		} catch {
			// Silently fail — notification count isn't critical
		}
	}

	function togglePanel() {
		showPanel = !showPanel;
	}

	function handleClickOutside(e: MouseEvent) {
		if (panelRef && !panelRef.contains(e.target as Node)) {
			showPanel = false;
		}
	}

	function handleNotificationUpdate() {
		fetchUnreadCount();
	}

	onMount(() => {
		fetchUnreadCount();
		// Poll every 60 seconds
		const interval = setInterval(fetchUnreadCount, 60_000);
		document.addEventListener('click', handleClickOutside, true);
		return () => {
			clearInterval(interval);
			document.removeEventListener('click', handleClickOutside, true);
		};
	});
</script>

<div class="relative" bind:this={panelRef}>
	<button
		onclick={togglePanel}
		class="relative inline-flex items-center justify-center rounded-md p-2 hover:bg-muted transition-colors"
		aria-label="Notifications"
	>
		<Bell class="h-5 w-5 text-muted-foreground" />
		{#if unreadCount > 0}
			<span
				class="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
			>
				{unreadCount > 99 ? '99+' : unreadCount}
			</span>
		{/if}
	</button>

	{#if showPanel}
		<NotificationPanel
			onclose={() => (showPanel = false)}
			onupdate={handleNotificationUpdate}
		/>
	{/if}
</div>
