<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createRxStore } from '$lib/stores/rx.svelte';

	const scanStore = createRxStore<{
		id: string; fullName: string; idNumber: string; anomalyData: string | null; scannedAt: string;
	}>('scans', (col) => col.find().sort({ scannedAt: 'desc' }).limit(1));

	let currentTime = $state('');
	let period = $state('');
	let interval: ReturnType<typeof setInterval>;

	onMount(() => {
		scanStore.init();
		interval = setInterval(() => {
			const now = new Date();
			currentTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: false });
			period = now.getHours() >= 12 ? 'PM' : 'AM';
		}, 100);
	});

	onDestroy(() => {
		scanStore.destroy();
		clearInterval(interval);
	});

	let latestScan = $derived(scanStore.items[0] ?? null);
	let randomGender = $derived(Math.random() > 0.5 ? 'women' : 'men');
	let randomNum = $derived(Math.floor(Math.random() * 80));
</script>

<svelte:head>
	<title>Scan Screen — ScreenGate</title>
</svelte:head>

<div class="flex items-center justify-center min-h-[calc(100vh-56px)] px-8">
	<div class="flex flex-col w-full max-w-2xl bg-gray-100 rounded-2xl shadow-2xl overflow-hidden">
		<div class="flex flex-col md:flex-row">
			<!-- Avatar -->
			<div class="md:w-1/3 flex-shrink-0">
				<img
					class="w-full h-64 md:h-full object-cover"
					src="https://randomuser.me/api/portraits/{randomGender}/{randomNum}.jpg"
					alt="Person"
				/>
			</div>
			<!-- Info -->
			<div class="flex-1 p-8 flex flex-col justify-center">
				{#if latestScan}
					<h1 class="text-5xl font-bold text-gray-800 mb-2">{latestScan.fullName}</h1>
					<p class="text-2xl text-gray-500">{latestScan.idNumber}</p>
					{#if latestScan.anomalyData}
						<p class="text-xl text-orange-600 mt-2">{latestScan.anomalyData}</p>
					{/if}
				{:else}
					<h1 class="text-4xl font-bold text-gray-400">Waiting for scan...</h1>
					<p class="text-lg text-gray-400 mt-2">Present an ID to the scanner</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Clock -->
	<div class="fixed bottom-4 left-6 text-gray-500">
		<span class="text-3xl font-mono">{currentTime}</span>
		<span class="text-lg ml-1">{period}</span>
	</div>
</div>
