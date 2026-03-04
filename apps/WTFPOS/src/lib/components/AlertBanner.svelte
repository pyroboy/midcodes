<script lang="ts">
	import { unacknowledgedAlerts, acknowledgeAlert } from '$lib/stores/alert.svelte';

	function formatTime(iso: string) {
		return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
	}
</script>

{#if unacknowledgedAlerts.length > 0}
	<div class="shrink-0 flex flex-col gap-0 border-b border-red-300">
		{#each unacknowledgedAlerts as alert (alert.id)}
			<div class="flex items-center justify-between bg-red-50 px-6 py-2 animate-pulse">
				<div class="flex items-center gap-3">
					<span class="text-lg">🚫</span>
					<div>
						<span class="text-sm font-bold text-red-800">
							KITCHEN REFUSED: {alert.itemName}
							{alert.tableNumber !== null ? ` (T${alert.tableNumber})` : ''}
						</span>
						<span class="ml-2 text-xs text-red-500">— {alert.reason} · {formatTime(alert.createdAt)}</span>
					</div>
				</div>
				<button
					onclick={() => acknowledgeAlert(alert.id)}
					class="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-colors"
					style="min-height: 32px"
				>
					Acknowledge
				</button>
			</div>
		{/each}
	</div>
{/if}
