<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Loader2 } from 'lucide-svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const { form, errors, enhance, delayed, message } = superForm(data.form, {
		resetForm: false
	});

	// Check for success state from form submission
	let success = $state(false);
	let successMessage = $state('');

	$effect(() => {
		if (message && $message) {
			success = true;
			successMessage = $message;
		}
	});
</script>

<div class="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
	<Card class="w-full max-w-[450px] p-4">
		<CardHeader class="text-center">
			<CardTitle>Forgot Password</CardTitle>
			<CardDescription
				>Enter your email address and we'll send you a link to reset your password</CardDescription
			>
		</CardHeader>
		<CardContent>
			<form method="POST" use:enhance class="space-y-4">
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						placeholder="Email"
						bind:value={$form.email}
						aria-invalid={$errors.email ? 'true' : undefined}
					/>
					{#if $errors.email}
						<p class="text-sm text-destructive">{$errors.email}</p>
					{/if}
				</div>

				{#if success}
					<p class="text-sm text-green-600">{successMessage}</p>
				{/if}

				<Button type="submit" class="w-full" disabled={$delayed}>
					{#if $delayed}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Sending reset link...
					{:else}
						Send Reset Link
					{/if}
				</Button>

				<div class="text-center">
					<a href="/auth" class="text-sm text-muted-foreground hover:text-primary"
						>Back to Sign In</a
					>
				</div>
			</form>
		</CardContent>
	</Card>
</div>
