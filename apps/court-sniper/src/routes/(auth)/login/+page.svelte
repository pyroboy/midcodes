<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { Target, Mail, Lock, User, Building2, ArrowRight } from 'lucide-svelte';

	let email = $state('player@courtsniper.ph');
	let password = $state('demo1234');
	let name = $state('Juan Dela Cruz');
	let isLoading = $state(false);
	let error = $state('');
	let isSignUp = $state(false);
	let loginAs = $state<'player' | 'venue'>('player');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!email.trim() || !password.trim()) {
			error = 'Please fill in all fields';
			return;
		}
		if (isSignUp && !name.trim()) {
			error = 'Please enter your name';
			return;
		}

		isLoading = true;
		error = '';

		// Mock auth: accept anything
		setTimeout(() => {
			const mockUser = {
				id: 'usr-' + Math.random().toString(36).substring(2, 10),
				email: email.trim(),
				name: isSignUp ? name.trim() : email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
				role: loginAs === 'venue' ? 'venue_manager' as const : 'player' as const,
				skillLevel: 'intermediate' as const,
				phone: '+63 917 123 4567',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			authStore.setUser(mockUser);
			isLoading = false;

			if (loginAs === 'venue') {
				goto('/venue/dashboard');
			} else {
				goto('/');
			}
		}, 800);
	}
</script>

<svelte:head>
	<title>{isSignUp ? 'Sign Up' : 'Sign In'} - Court Sniper</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-muted/30 px-4">
	<div class="w-full max-w-sm">
		<!-- Logo + branding -->
		<div class="mb-8 text-center">
			<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
				<Target class="h-6 w-6 text-primary-foreground" />
			</div>
			<h1 class="text-2xl font-extrabold tracking-tight">
				{isSignUp ? 'Create your account' : 'Welcome back'}
			</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				{isSignUp ? 'Join the PH pickleball community' : 'Sign in to Court Sniper'}
			</p>
		</div>

		<!-- Role toggle -->
		<div class="mb-4 flex rounded-xl border border-border bg-muted/50 p-1">
			<button
				onclick={() => { loginAs = 'player'; }}
				class="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all {loginAs === 'player' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
			>
				<User class="h-4 w-4" />
				Player
			</button>
			<button
				onclick={() => { loginAs = 'venue'; }}
				class="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all {loginAs === 'venue' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
			>
				<Building2 class="h-4 w-4" />
				Venue Owner
			</button>
		</div>

		<div class="rounded-xl border border-border bg-background p-6 shadow-sm">
			{#if error}
				<div class="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4">
				{#if isSignUp}
					<div>
						<label for="name" class="block text-sm font-medium mb-1.5">Full Name</label>
						<div class="relative">
							<User class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<input
								id="name"
								type="text"
								bind:value={name}
								class="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
								placeholder="Juan Dela Cruz"
							/>
						</div>
					</div>
				{/if}

				<div>
					<label for="email" class="block text-sm font-medium mb-1.5">Email</label>
					<div class="relative">
						<Mail class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<input
							id="email"
							type="email"
							bind:value={email}
							required
							class="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
							placeholder="you@example.com"
						/>
					</div>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium mb-1.5">Password</label>
					<div class="relative">
						<Lock class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<input
							id="password"
							type="password"
							bind:value={password}
							required
							class="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
							placeholder="Enter your password"
						/>
					</div>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.98]"
				>
					{#if isLoading}
						<div class="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
						{isSignUp ? 'Creating account...' : 'Signing in...'}
					{:else}
						{isSignUp ? 'Create Account' : 'Sign In'}
						<ArrowRight class="h-4 w-4" />
					{/if}
				</button>
			</form>

			<div class="mt-6 text-center">
				<p class="text-sm text-muted-foreground">
					{isSignUp ? 'Already have an account?' : "Don't have an account?"}
					<button
						onclick={() => { isSignUp = !isSignUp; error = ''; }}
						class="font-medium text-primary hover:underline"
					>
						{isSignUp ? 'Sign in' : 'Sign up'}
					</button>
				</p>
			</div>
		</div>

		<p class="mt-4 text-center text-xs text-muted-foreground">
			Demo: any email/password works. Pre-filled for convenience.
		</p>

		<p class="mt-2 text-center text-xs text-muted-foreground">
			<a href="/" class="hover:underline">Back to home</a>
		</p>
	</div>
</div>
