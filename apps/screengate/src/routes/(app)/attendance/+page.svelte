<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createRxStore } from '$lib/stores/rx.svelte';
	import { upsertRxDoc } from '$lib/db';

	let { data } = $props();

	const scanStore = createRxStore<{
		id: string; fullName: string; idNumber: string; anomalyData: string | null; scannedAt: string;
	}>('scans', (col) => col.find().sort({ scannedAt: 'desc' }).limit(50));

	onMount(async () => {
		// Seed RxDB from server data
		for (const s of data.scans) {
			await upsertRxDoc('scans', s);
		}
		scanStore.init();
	});

	onDestroy(() => scanStore.destroy());

	function formatTime(iso: string) {
		return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
</script>

<svelte:head>
	<title>Attendance — ScreenGate</title>
</svelte:head>

<div class="p-6">
	<h1 class="text-2xl font-bold text-white mb-6">Recent Scans</h1>

	<div class="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
		<table class="w-full">
			<thead>
				<tr class="border-b border-gray-700">
					<th class="text-left text-gray-400 text-sm font-medium px-6 py-3">ID Number</th>
					<th class="text-left text-gray-400 text-sm font-medium px-6 py-3">Name</th>
					<th class="text-left text-gray-400 text-sm font-medium px-6 py-3">Date</th>
					<th class="text-left text-gray-400 text-sm font-medium px-6 py-3">Time</th>
					<th class="text-left text-gray-400 text-sm font-medium px-6 py-3">Anomaly</th>
				</tr>
			</thead>
			<tbody>
				{#each scanStore.items as scan (scan.id)}
					<tr class="border-b border-gray-700/50 hover:bg-gray-700/30 transition">
						<td class="px-6 py-3 text-gray-300 font-mono">{scan.idNumber}</td>
						<td class="px-6 py-3 text-white font-medium">{scan.fullName}</td>
						<td class="px-6 py-3 text-gray-400">{formatDate(scan.scannedAt)}</td>
						<td class="px-6 py-3 text-gray-400">{formatTime(scan.scannedAt)}</td>
						<td class="px-6 py-3">
							{#if scan.anomalyData}
								<span class="text-orange-400">{scan.anomalyData}</span>
							{:else}
								<span class="text-gray-600">—</span>
							{/if}
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="5" class="px-6 py-12 text-center text-gray-500">No scans recorded yet</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
