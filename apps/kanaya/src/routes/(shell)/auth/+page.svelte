<!-- src/routes/auth/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { toast } from 'svelte-sonner';
	import { loginSchema, registerSchema } from '$lib/schemas';

	let loading = $state(false);
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let name = $state('');
	let fieldErrors = $state<Record<string, string>>({});

	function clearErrors() {
		fieldErrors = {};
	}

	async function handleSignIn(e: Event) {
		e.preventDefault();
		clearErrors();

		const result = loginSchema.safeParse({ email, password });
		if (!result.success) {
			for (const issue of result.error.issues) {
				const field = issue.path[0] as string;
				fieldErrors[field] = issue.message;
			}
			return;
		}

		loading = true;
		try {
			const { data, error } = await authClient.signIn.email({
				email,
				password
			});

			if (error) {
				toast.error(error.message || 'Invalid credentials');
			} else {
				toast.success('Signed in successfully');
				window.location.href = '/';
			}
		} catch (e: any) {
			toast.error(e.message || 'An unexpected error occurred');
		} finally {
			loading = false;
		}
	}

	async function handleSignUp(e: Event) {
		e.preventDefault();
		clearErrors();

		const result = registerSchema.safeParse({
			email,
			password,
			confirm_password: confirmPassword,
			name: name || email.split('@')[0],
			terms_accepted: true
		});
		if (!result.success) {
			for (const issue of result.error.issues) {
				const field = issue.path[0] as string;
				if (!fieldErrors[field]) {
					fieldErrors[field] = issue.message;
				}
			}
			return;
		}

		loading = true;
		try {
			const { data, error } = await authClient.signUp.email({
				email,
				password,
				name: name || email.split('@')[0]
			});

			if (error) {
				toast.error(error.message || 'Registration failed');
			} else {
				toast.success('Account created! Signing you in...');
				window.location.href = '/';
			}
		} catch (e: any) {
			console.error(e);
			toast.error(e.message || 'An unexpected error occurred during signup');
		} finally {
			loading = false;
		}
	}
</script>

<div class="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
	<Card class="w-[350px]">
		<CardHeader>
			<CardTitle>Welcome to ID Generator</CardTitle>
			<CardDescription>Sign in to your account or create a new one</CardDescription>
		</CardHeader>
		<CardContent>
			<Tabs class="w-full">
				<TabsList class="grid w-full grid-cols-2">
					<TabsTrigger value="signin">Sign In</TabsTrigger>
					<TabsTrigger value="signup">Sign Up</TabsTrigger>
				</TabsList>

				<TabsContent value="signin">
					<form onsubmit={handleSignIn}>
						<div class="grid gap-4">
							<div class="grid gap-2">
								<Label for="email">Email</Label>
								<Input
									id="email"
									name="email"
									type="email"
									placeholder="name@example.com"
									bind:value={email}
									required
									disabled={loading}
								/>
								{#if fieldErrors.email}
									<p class="text-sm text-red-500">{fieldErrors.email}</p>
								{/if}
							</div>
							<div class="grid gap-2">
								<Label for="password">Password</Label>
								<Input
									id="password"
									name="password"
									type="password"
									bind:value={password}
									required
									disabled={loading}
								/>
								{#if fieldErrors.password}
									<p class="text-sm text-red-500">{fieldErrors.password}</p>
								{/if}
							</div>
							<Button type="submit" class="w-full" disabled={loading}>
								{#if loading}
									Signing in...
								{:else}
									Sign In
								{/if}
							</Button>
						</div>
					</form>
				</TabsContent>

				<TabsContent value="signup">
					<form onsubmit={handleSignUp}>
						<div class="grid gap-4">
							<div class="grid gap-2">
								<Label for="signup-name">Name</Label>
								<Input
									id="signup-name"
									name="name"
									type="text"
									placeholder="Your name"
									bind:value={name}
									disabled={loading}
								/>
							</div>
							<div class="grid gap-2">
								<Label for="signup-email">Email</Label>
								<Input
									id="signup-email"
									name="email"
									type="email"
									placeholder="name@example.com"
									bind:value={email}
									required
									disabled={loading}
								/>
								{#if fieldErrors.email}
									<p class="text-sm text-red-500">{fieldErrors.email}</p>
								{/if}
							</div>
							<div class="grid gap-2">
								<Label for="signup-password">Password</Label>
								<Input
									id="signup-password"
									name="password"
									type="password"
									bind:value={password}
									required
									disabled={loading}
								/>
								{#if fieldErrors.password}
									<p class="text-sm text-red-500">{fieldErrors.password}</p>
								{/if}
							</div>
							<div class="grid gap-2">
								<Label for="confirm-password">Confirm Password</Label>
								<Input
									id="confirm-password"
									name="confirmPassword"
									type="password"
									bind:value={confirmPassword}
									required
									disabled={loading}
								/>
								{#if fieldErrors.confirm_password}
									<p class="text-sm text-red-500">{fieldErrors.confirm_password}</p>
								{/if}
							</div>
							<Button type="submit" class="w-full" disabled={loading}>
								{#if loading}
									Creating account...
								{:else}
									Create Account
								{/if}
							</Button>
						</div>
					</form>
				</TabsContent>
			</Tabs>
		</CardContent>
		<CardFooter class="flex justify-center">
			<a href="/auth/forgot-password" class="text-sm text-muted-foreground hover:underline">
				Forgot your password?
			</a>
		</CardFooter>
	</Card>
</div>
