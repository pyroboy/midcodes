<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { loginSchema, registerSchema } from './schema';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Separator } from '$lib/components/ui/separator';
	import { Loader2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	// Login Form Logic
	const {
		form: loginFormData,
		errors: loginErrors,
		submitting: loginSubmitting,
		enhance: loginEnhance,
		message: loginMessage
	} = superForm(data.loginForm, {
		validators: zodClient(loginSchema),
		onResult: ({ result }) => {
			if (result.type === 'failure') {
				toast.error('Login Failed', { description: result.data?.message });
			}
		}
	});

	// Register Form Logic
	const {
		form: regFormData,
		errors: regErrors,
		submitting: regSubmitting,
		enhance: regEnhance,
		message: regMessage
	} = superForm(data.registerForm, {
		validators: zodClient(registerSchema),
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Account Created', { description: result.data?.message });
			} else if (result.type === 'failure') {
				toast.error('Registration Failed', { description: result.data?.message });
			}
		}
	});

	const ALLOW_SIGNUP = true;
</script>

<div class="flex flex-col space-y-2 text-center">
	<h1 class="text-3xl font-bold tracking-tight">Welcome back</h1>
	<p class="text-sm text-muted-foreground">Enter your credentials to manage your properties</p>
</div>

<Tabs value="login" class="w-full mt-6">
	<TabsList class="grid w-full {ALLOW_SIGNUP ? 'grid-cols-2' : 'grid-cols-1'} mb-6">
		<TabsTrigger value="login">Login</TabsTrigger>
		{#if ALLOW_SIGNUP}
			<TabsTrigger value="register">Create Account</TabsTrigger>
		{/if}
	</TabsList>

	<!-- LOGIN TAB -->
	<TabsContent value="login">
		<form method="POST" action="?/login" use:loginEnhance class="space-y-4">
			{#if $loginMessage}
				<div
					class="p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium border border-destructive/20 flex items-center gap-2"
				>
					<span class="h-2 w-2 rounded-full bg-destructive"></span>
					{$loginMessage}
				</div>
			{/if}

			<div class="grid gap-2">
				<Label for="email" class="text-left">Email Address</Label>
				<Input
					id="email"
					name="email"
					type="email"
					placeholder="name@company.com"
					bind:value={$loginFormData.email}
					disabled={$loginSubmitting}
					class="bg-background"
				/>
				{#if $loginErrors.email}<span class="text-xs text-destructive text-left"
						>{$loginErrors.email}</span
					>{/if}
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
					bind:value={$loginFormData.password}
					disabled={$loginSubmitting}
					class="bg-background"
				/>
				{#if $loginErrors.password}<span class="text-xs text-destructive text-left"
						>{$loginErrors.password}</span
					>{/if}
			</div>

			<Button type="submit" class="w-full mt-2" disabled={$loginSubmitting}>
				{#if $loginSubmitting}
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
			<form method="POST" action="?/register" use:regEnhance class="space-y-4">
				{#if $regMessage}
					<div
						class="p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium border border-destructive/20"
					>
						{$regMessage}
					</div>
				{/if}

				<div class="grid gap-2">
					<Label for="reg-email" class="text-left">Email Address</Label>
					<Input
						id="reg-email"
						name="email"
						type="email"
						placeholder="name@company.com"
						bind:value={$regFormData.email}
						disabled={$regSubmitting}
						class="bg-background"
					/>
					{#if $regErrors.email}<span class="text-xs text-destructive text-left"
							>{$regErrors.email}</span
						>{/if}
				</div>

				<div class="grid gap-2">
					<Label for="reg-password" class="text-left">Password</Label>
					<Input
						id="reg-password"
						name="password"
						type="password"
						placeholder="Create a password"
						bind:value={$regFormData.password}
						disabled={$regSubmitting}
						class="bg-background"
					/>
					{#if $regErrors.password}<span class="text-xs text-destructive text-left"
							>{$regErrors.password}</span
						>{/if}
				</div>

				<div class="grid gap-2">
					<Label for="confirmPassword" class="text-left">Confirm Password</Label>
					<Input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						placeholder="Confirm your password"
						bind:value={$regFormData.confirmPassword}
						disabled={$regSubmitting}
						class="bg-background"
					/>
					{#if $regErrors.confirmPassword}<span class="text-xs text-destructive text-left"
							>{$regErrors.confirmPassword}</span
						>{/if}
				</div>

				<Button type="submit" class="w-full mt-2" disabled={$regSubmitting}>
					{#if $regSubmitting}
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
