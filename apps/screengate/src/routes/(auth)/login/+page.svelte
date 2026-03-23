<script lang="ts">
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';
		try {
			const res = await fetch('/api/auth/sign-in/email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			if (!res.ok) {
				const data = await res.json();
				error = data.message ?? 'Invalid credentials';
			} else {
				window.location.href = '/';
			}
		} catch {
			error = 'Network error';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign In — ScreenGate</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 flex items-center justify-center px-4">
	<div class="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl p-8">
		<h1 class="text-3xl font-bold text-white mb-2">ScreenGate</h1>
		<p class="text-gray-400 mb-8">Sign in to manage attendance</p>

		{#if error}
			<div class="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
				{error}
			</div>
		{/if}

		<form onsubmit={handleLogin} class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-gray-300 mb-1">Email</label>
				<input id="email" type="email" bind:value={email} required
					class="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none" />
			</div>
			<div>
				<label for="password" class="block text-sm font-medium text-gray-300 mb-1">Password</label>
				<input id="password" type="password" bind:value={password} required
					class="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none" />
			</div>
			<button type="submit" disabled={loading}
				class="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-50">
				{loading ? 'Signing in...' : 'Sign In'}
			</button>
		</form>
	</div>
</div>
