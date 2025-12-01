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

	const { form, errors, enhance, delayed, message } = superForm(data.form);
</script>

<div class="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
	<Card class="w-full max-w-[450px] p-4">
		<CardHeader class="text-center">
			<CardTitle>Reset Password</CardTitle>
			<CardDescription>Enter your new password below</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" use:enhance class="space-y-4">
				<div class="space-y-2">
					<Label for="password">New Password</Label>
					<Input
						id="password"
						name="password"
						type="password"
						placeholder="New Password"
						bind:value={$form.password}
						aria-invalid={$errors.password ? 'true' : undefined}
					/>
					{#if $errors.password}
						<p class="text-sm text-destructive">{$errors.password}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="confirmPassword">Confirm Password</Label>
					<Input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						placeholder="Confirm Password"
						bind:value={$form.confirmPassword}
						aria-invalid={$errors.confirmPassword ? 'true' : undefined}
					/>
					{#if $errors.confirmPassword}
						<p class="text-sm text-destructive">{$errors.confirmPassword}</p>
					{/if}
				</div>

				{#if $message}
					<p class="text-sm text-destructive">{$message}</p>
				{/if}

				<Button type="submit" class="w-full" disabled={$delayed}>
					{#if $delayed}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Updating password...
					{:else}
						Update Password
					{/if}
				</Button>
			</form>
		</CardContent>
	</Card>
</div>
