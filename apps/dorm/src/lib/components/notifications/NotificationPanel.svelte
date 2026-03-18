<script lang="ts">
	import { onMount } from 'svelte';
	import { formatDate } from '$lib/utils/format';
	import { cn } from '$lib/utils';
	import {
		AlertTriangle,
		Bell,
		Clock,
		FileText,
		ShieldAlert,
		CheckCheck,
		X,
		Loader2
	} from 'lucide-svelte';

	interface Notification {
		id: number;
		type: string;
		title: string;
		body: string;
		status: string;
		relatedId: number | null;
		relatedType: string | null;
		createdAt: string;
	}

	let { onclose, onupdate }: { onclose: () => void; onupdate: () => void } = $props();

	let notifications = $state<Notification[]>([]);
	let loading = $state(true);
	let markingAll = $state(false);

	async function fetchNotifications() {
		loading = true;
		try {
			const res = await fetch('/api/notifications?limit=30');
			if (res.ok) {
				const data = await res.json();
				notifications = data.notifications;
			}
		} catch {
			// fail silently
		}
		loading = false;
	}

	async function markAsRead(id: number) {
		try {
			await fetch('/api/notifications', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids: [id], action: 'read' })
			});
			const notif = notifications.find((n) => n.id === id);
			if (notif) notif.status = 'READ';
			notifications = [...notifications];
			onupdate();
		} catch {
			// fail silently
		}
	}

	async function markAllRead() {
		markingAll = true;
		try {
			await fetch('/api/notifications', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'read_all' })
			});
			notifications = notifications.map((n) => ({ ...n, status: 'READ' }));
			onupdate();
		} catch {
			// fail silently
		}
		markingAll = false;
	}

	async function dismiss(id: number) {
		try {
			await fetch('/api/notifications', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids: [id], action: 'dismiss' })
			});
			notifications = notifications.filter((n) => n.id !== id);
			onupdate();
		} catch {
			// fail silently
		}
	}

	function typeIcon(type: string) {
		switch (type) {
			case 'OVERDUE_NOTICE':
				return AlertTriangle;
			case 'PENALTY_APPLIED':
				return ShieldAlert;
			case 'PAYMENT_REMINDER':
				return Clock;
			case 'LEASE_EXPIRY':
				return FileText;
			default:
				return Bell;
		}
	}

	function typeColor(type: string) {
		switch (type) {
			case 'OVERDUE_NOTICE':
				return 'text-red-500';
			case 'PENALTY_APPLIED':
				return 'text-orange-500';
			case 'PAYMENT_REMINDER':
				return 'text-blue-500';
			case 'LEASE_EXPIRY':
				return 'text-yellow-500';
			default:
				return 'text-muted-foreground';
		}
	}

	function formatTimeAgo(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}d ago`;
		return formatDate(dateStr);
	}

	onMount(() => {
		fetchNotifications();
	});
</script>

<div
	class="absolute right-0 top-full mt-2 w-96 max-h-[28rem] rounded-lg border bg-background shadow-lg z-50 flex flex-col overflow-hidden"
>
	<!-- Header -->
	<div class="flex items-center justify-between border-b px-4 py-3 shrink-0">
		<h3 class="font-semibold text-sm">Notifications</h3>
		<div class="flex items-center gap-2">
			{#if notifications.some((n) => n.status === 'UNREAD')}
				<button
					onclick={markAllRead}
					disabled={markingAll}
					class="text-xs text-primary hover:underline disabled:opacity-50 flex items-center gap-1"
				>
					{#if markingAll}
						<Loader2 class="h-3 w-3 animate-spin" />
					{:else}
						<CheckCheck class="h-3 w-3" />
					{/if}
					Mark all read
				</button>
			{/if}
			<button onclick={onclose} class="p-1 hover:bg-muted rounded">
				<X class="h-4 w-4 text-muted-foreground" />
			</button>
		</div>
	</div>

	<!-- Notification list -->
	<div class="flex-1 overflow-y-auto">
		{#if loading}
			<div class="flex items-center justify-center p-8">
				<Loader2 class="h-5 w-5 animate-spin text-muted-foreground" />
			</div>
		{:else if notifications.length === 0}
			<div class="flex flex-col items-center justify-center p-8 text-muted-foreground">
				<Bell class="h-8 w-8 mb-2 opacity-30" />
				<p class="text-sm">No notifications</p>
			</div>
		{:else}
			{#each notifications as notif (notif.id)}
				{@const Icon = typeIcon(notif.type)}
				<div
					class={cn(
						"flex gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors group",
						notif.status === 'UNREAD' && "bg-primary/5"
					)}
				>
					<div class="shrink-0 mt-0.5">
						<Icon class="h-4 w-4 {typeColor(notif.type)}" />
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-start justify-between gap-2">
							<p class="text-sm font-medium leading-tight" class:font-semibold={notif.status === 'UNREAD'}>
								{notif.title}
							</p>
							<button
								onclick={() => dismiss(notif.id)}
								class="shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
								title="Dismiss"
							>
								<X class="h-3 w-3 text-muted-foreground" />
							</button>
						</div>
						<p class="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
						<div class="flex items-center justify-between mt-1">
							<span class="text-[10px] text-muted-foreground/70">
								{formatTimeAgo(notif.createdAt)}
							</span>
							{#if notif.status === 'UNREAD'}
								<button
									onclick={() => markAsRead(notif.id)}
									class="text-[10px] text-primary hover:underline"
								>
									Mark read
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
