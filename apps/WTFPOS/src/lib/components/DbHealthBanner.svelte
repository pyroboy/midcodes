<script lang="ts">
	import { dbHealth, resetDatabase } from '$lib/stores/db-health.svelte';
	import { AlertTriangle, RefreshCw } from 'lucide-svelte';

	let resetting = $state(false);

	async function handleReset() {
		resetting = true;
		await resetDatabase();
	}
</script>

{#if dbHealth.status === 'error'}
	<div class="relative z-50 border-b-2 border-red-300 bg-red-50 px-4 py-3 sm:px-6">
		<div class="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-start gap-3">
				<div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
					<AlertTriangle class="h-5 w-5 text-red-600" />
				</div>
				<div>
					<p class="text-sm font-bold text-red-900">Database Incompatible</p>
					<p class="mt-0.5 text-xs text-red-700 leading-relaxed max-w-xl">
						{dbHealth.errorMessage}
					</p>
					<p class="mt-1 text-[11px] text-red-500">
						Code: <code class="font-mono">{dbHealth.errorCode}</code>
					</p>
				</div>
			</div>

			<button
				onclick={handleReset}
				disabled={resetting}
				class="inline-flex shrink-0 items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-60"
			>
				<RefreshCw class="h-4 w-4 {resetting ? 'animate-spin' : ''}" />
				{resetting ? 'Resetting...' : 'Reset Database'}
			</button>
		</div>
	</div>
{/if}
