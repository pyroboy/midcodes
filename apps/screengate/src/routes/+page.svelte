<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>ScreenGate</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 flex items-center justify-center">
	<div class="text-center">
		<h1 class="text-6xl font-bold text-white mb-4">ScreenGate</h1>
		<p class="text-xl text-gray-400 mb-8">School Attendance & ID Scanning System</p>
		<div class="flex gap-4 justify-center">
			{#if data.user}
				<a href="/screen" class="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium">
					Scan Screen
				</a>
				<a href="/attendance" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
					Attendance
				</a>
				<a href="/add" class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
					Manage
				</a>
			{:else}
				<a href="/login" class="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-lg">
					Sign In
				</a>
			{/if}
		</div>
	</div>
</div>
