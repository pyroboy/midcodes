<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

	let email = '';
	let password = '';
	let isLoading = false;
	let error = '';

	async function handleLogin(e: Event) {
		e.preventDefault();
		isLoading = true;
		error = '';

		try {
			// TODO: Implement actual login logic
			console.log('Login attempt:', { email, password });
			// const response = await fetch('/api/auth/login', {
			//   method: 'POST',
			//   headers: { 'Content-Type': 'application/json' },
			//   body: JSON.stringify({ email, password })
			// });
		} catch (err) {
			error = 'Login failed. Please try again.';
			console.error(err);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-muted p-4">
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>FlowWork Login</CardTitle>
			<CardDescription>Sign in to manage your workforce</CardDescription>
		</CardHeader>
		<CardContent>
			<form onsubmit={handleLogin} class="space-y-4">
				{#if error}
					<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
						{error}
					</div>
				{/if}

				<div>
					<label for="email" class="block text-sm font-medium mb-1">Email</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						placeholder="you@example.com"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
						required
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium mb-1">Password</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						placeholder="••••••••"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
						required
					/>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
				>
					{isLoading ? 'Signing in...' : 'Sign In'}
				</button>

				<p class="text-center text-sm text-muted-foreground">
					Demo credentials: Use any email/password combo. Authentication not yet implemented.
				</p>
			</form>
		</CardContent>
	</Card>
</div>
