<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Loader2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { goto, invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Login state
	let loginEmail = $state('');
	let loginPassword = $state('');
	let loginLoading = $state(false);
	let loginError = $state('');

	// Register state
	let regEmail = $state('');
	let regPassword = $state('');
	let regConfirmPassword = $state('');
	let regLoading = $state(false);

	const ALLOW_SIGNUP = true;
	let activeTab = $state('login');

	async function handleLogin(e: Event) {
		e.preventDefault();
		loginError = '';
		loginLoading = true;

		try {
			const res = await fetch('/api/auth/sign-in/email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: loginEmail, password: loginPassword })
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				loginError = body?.message || 'Invalid email or password';
				toast.error('Login Failed', { description: loginError });
				return;
			}

			// Better Auth sets session cookie via Set-Cookie header automatically.
			// Invalidate all server data so hooks re-run with the new cookie,
			// then navigate client-side (no full page reload needed).
			await invalidateAll();
			await goto('/');
		} catch (err: any) {
			loginError = err?.message || 'Something went wrong';
			toast.error('Login Failed', { description: loginError });
		} finally {
			loginLoading = false;
		}
	}

	async function handleRegister(e: Event) {
		e.preventDefault();

		if (regPassword !== regConfirmPassword) {
			toast.error("Passwords don't match");
			return;
		}

		regLoading = true;

		try {
			const res = await fetch('/api/auth/sign-up/email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: regEmail,
					password: regPassword,
					name: regEmail.split('@')[0]
				})
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				toast.error('Registration Failed', { description: body?.message || 'Please try again.' });
				return;
			}

			toast.success('Account Created', { description: 'You can now log in.' });
			activeTab = 'login';
			loginEmail = regEmail;
		} catch (err: any) {
			toast.error('Registration Failed', { description: err?.message || 'Something went wrong' });
		} finally {
			regLoading = false;
		}
	}
</script>

<div class="flex flex-col space-y-2 text-center">
	<h1 class="text-3xl font-bold tracking-tight">Welcome back</h1>
	<p class="text-sm text-muted-foreground">Enter your credentials or use quick access</p>
</div>

<!-- Quick Access Cards -->
{#if data.devBypass}
	<div class="mt-6 space-y-2">
		<p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick Access</p>
		<div class="grid grid-cols-2 gap-2">
			<a href="/?dev_role=super_admin" data-sveltekit-reload class="rounded-lg border-2 border-red-200 bg-red-50 px-3 py-2 text-left hover:border-red-400 transition-colors">
				<div class="font-semibold text-sm text-red-900">Super Admin</div>
				<div class="text-xs text-red-600">Full access</div>
			</a>
			<a href="/?dev_role=property_admin" data-sveltekit-reload class="rounded-lg border-2 border-orange-200 bg-orange-50 px-3 py-2 text-left hover:border-orange-400 transition-colors">
				<div class="font-semibold text-sm text-orange-900">Property Admin</div>
				<div class="text-xs text-orange-600">Manage all</div>
			</a>
			<a href="/?dev_role=property_manager" data-sveltekit-reload class="rounded-lg border-2 border-blue-200 bg-blue-50 px-3 py-2 text-left hover:border-blue-400 transition-colors">
				<div class="font-semibold text-sm text-blue-900">Manager</div>
				<div class="text-xs text-blue-600">Operations</div>
			</a>
			<a href="/?dev_role=property_tenant" data-sveltekit-reload class="rounded-lg border-2 border-green-200 bg-green-50 px-3 py-2 text-left hover:border-green-400 transition-colors">
				<div class="font-semibold text-sm text-green-900">Tenant</div>
				<div class="text-xs text-green-600">Read-only</div>
			</a>
		</div>
		<div class="relative my-4">
			<div class="absolute inset-0 flex items-center"><span class="w-full border-t"></span></div>
			<div class="relative flex justify-center text-xs uppercase"><span class="bg-background px-2 text-muted-foreground">or sign in</span></div>
		</div>
	</div>
{/if}

<!-- Login / Register Form -->
<Tabs value={activeTab} onValueChange={(v) => (activeTab = v)} class="w-full">
	<TabsList class="grid w-full {ALLOW_SIGNUP ? 'grid-cols-2' : 'grid-cols-1'} mb-6">
		<TabsTrigger value="login">Login</TabsTrigger>
		{#if ALLOW_SIGNUP}
			<TabsTrigger value="register">Create Account</TabsTrigger>
		{/if}
	</TabsList>

	<!-- LOGIN TAB -->
	<TabsContent value="login">
		<form onsubmit={handleLogin} class="space-y-4">
			{#if loginError}
				<div class="p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium border border-destructive/20 flex items-center gap-2">
					<span class="h-2 w-2 rounded-full bg-destructive"></span>
					{loginError}
				</div>
			{/if}

			<div class="grid gap-2">
				<Label for="email" class="text-left">Email Address</Label>
				<Input
					id="email"
					name="email"
					type="email"
					placeholder="name@company.com"
					bind:value={loginEmail}
					disabled={loginLoading}
					class="bg-background"
				/>
			</div>

			<div class="grid gap-2">
				<div class="flex items-center justify-between">
					<Label for="password">Password</Label>
					<a href="/auth/forgot-password" class="text-xs font-medium text-primary hover:underline">
						Forgot password?
					</a>
				</div>
				<Input
					id="password"
					name="password"
					type="password"
					placeholder="••••••••"
					bind:value={loginPassword}
					disabled={loginLoading}
					class="bg-background"
				/>
			</div>

			<Button type="submit" class="w-full mt-2" disabled={loginLoading}>
				{#if loginLoading}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Signing in...
				{:else}
					Sign In
				{/if}
			</Button>
		</form>
	</TabsContent>

	<!-- REGISTER TAB -->
	{#if ALLOW_SIGNUP}
		<TabsContent value="register">
			<form onsubmit={handleRegister} class="space-y-4">
				<div class="grid gap-2">
					<Label for="reg-email" class="text-left">Email Address</Label>
					<Input
						id="reg-email"
						name="email"
						type="email"
						placeholder="name@company.com"
						bind:value={regEmail}
						disabled={regLoading}
						class="bg-background"
					/>
				</div>

				<div class="grid gap-2">
					<Label for="reg-password" class="text-left">Password</Label>
					<Input
						id="reg-password"
						name="password"
						type="password"
						placeholder="Create a password"
						bind:value={regPassword}
						disabled={regLoading}
						class="bg-background"
					/>
				</div>

				<div class="grid gap-2">
					<Label for="confirmPassword" class="text-left">Confirm Password</Label>
					<Input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						placeholder="Confirm your password"
						bind:value={regConfirmPassword}
						disabled={regLoading}
						class="bg-background"
					/>
				</div>

				<Button type="submit" class="w-full mt-2" disabled={regLoading}>
					{#if regLoading}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Creating Account...
					{:else}
						Create Account
					{/if}
				</Button>
			</form>
		</TabsContent>
	{/if}
</Tabs>
