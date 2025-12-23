<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import type { ForgotPasswordFormData } from './types';
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

	interface Props {
		form: ActionData & ForgotPasswordFormData;
	}

	let { form }: Props = $props();
	let loading = $state(false);

	let error = $derived(form?.error);
	let message = $derived(form?.message);
	let success = $derived(form?.success);
	let email = $derived((form?.email as string) || '');
</script>

<div class="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
	<Card class="w-[350px]">
		<CardHeader>
			<CardTitle>Forgot Password</CardTitle>
			<CardDescription>Enter your email to receive password reset instructions</CardDescription>
		</CardHeader>
		<CardContent>
			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
			>
				<div class="grid gap-4">
					<div class="grid gap-2">
						<Label for="email">Email</Label>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="name@example.com"
							value={email}
							required
						/>
					</div>
					{#if error}
						<div class="text-sm text-red-500">{error}</div>
					{/if}
					{#if message}
						<div class="text-sm text-green-500">{message}</div>
					{/if}
					<Button type="submit" class="w-full" disabled={loading}>
						{#if loading}
							Sending instructions...
						{:else}
							Send Instructions
						{/if}
					</Button>
				</div>
			</form>
		</CardContent>
		<CardFooter class="flex justify-center">
			<a href="/auth" class="text-sm text-muted-foreground hover:underline"> Back to Sign In </a>
		</CardFooter>
	</Card>
</div>
