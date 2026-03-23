<script lang="ts">
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let name = $state('');
	let isSignUp = $state(false);
	let loading = $state(false);
	let error = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		try {
			const endpoint = isSignUp ? '/api/auth/sign-up/email' : '/api/auth/sign-in/email';
			const body: any = { email, password };
			if (isSignUp) body.name = name;

			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || 'Authentication failed');
			}

			goto('/dashboard');
		} catch (e: any) {
			error = e.message;
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-amber-50 flex items-center justify-center p-4">
	<div class="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-amber-900">BakeOps</h1>
			<p class="text-amber-700 mt-1">Baking Business Backend</p>
		</div>

		{#if error}
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
		{/if}

		<form onsubmit={handleSubmit} class="space-y-4">
			{#if isSignUp}
				<div>
					<label for="name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
					<input id="name" type="text" bind:value={name} required
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
				</div>
			{/if}

			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
				<input id="email" type="email" bind:value={email} required
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
				<input id="password" type="password" bind:value={password} required minlength="8"
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
			</div>

			<button type="submit" disabled={loading}
				class="w-full py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50 transition">
				{loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
			</button>
		</form>

		<p class="text-center mt-6 text-sm text-gray-600">
			{isSignUp ? 'Already have an account?' : "Don't have an account?"}
			<button onclick={() => { isSignUp = !isSignUp; error = ''; }}
				class="text-amber-600 font-medium hover:underline ml-1">
				{isSignUp ? 'Sign In' : 'Sign Up'}
			</button>
		</p>
	</div>
</div>
