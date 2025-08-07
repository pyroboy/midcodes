<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Loader2 } from 'lucide-svelte';

	interface Props {
		form: ActionData;
	}

	let { form }: Props = $props();
	let isLoading = $state(false);
</script>

<div class="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
	<Card class="w-full max-w-[450px] p-4">
		<CardHeader class="text-center">
			<CardTitle>Reset Password</CardTitle>
			<CardDescription>Enter your new password below</CardDescription>
		</CardHeader>
		<CardContent>
			<form
				method="POST"
				use:enhance={() => {
					isLoading = true;
					return async ({ update }) => {
						await update();
						isLoading = false;
					};
				}}
				class="space-y-4"
			>
				<div class="space-y-2">
					<Input
						id="password"
						name="password"
						type="password"
						placeholder="New Password"
						required
					/>
				</div>

				{#if form?.error}
					<p class="text-sm text-destructive">{form.error}</p>
				{/if}

				<Button type="submit" class="w-full" disabled={isLoading}>
					{#if isLoading}
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
