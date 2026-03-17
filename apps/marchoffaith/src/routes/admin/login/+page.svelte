<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Admin Login - MOFI</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="w-full max-w-sm">
		<div class="bg-white rounded-xl shadow-lg p-8">
			<div class="text-center mb-8">
				<h1 class="text-2xl font-bold text-gray-900">Admin Access</h1>
				<p class="text-sm text-gray-500 mt-1">March of Faith Incorporated</p>
			</div>

			{#if form?.error}
				<div class="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
					{form.error}
				</div>
			{/if}

			<form method="POST">
				<label for="pin" class="block text-sm font-medium text-gray-700 mb-2">PIN Code</label>
				<input
					type="password"
					id="pin"
					name="pin"
					required
					autofocus
					minlength="4"
					placeholder="Enter admin PIN"
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center text-lg tracking-widest"
				/>
				<button
					type="submit"
					class="w-full mt-4 px-4 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
				>
					Enter
				</button>
			</form>
		</div>
	</div>
</div>
