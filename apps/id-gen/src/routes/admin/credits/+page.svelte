<script lang="ts">
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import {
		getUsersWithCredits,
		adjustUserCredits,
		getBillingSettings
	} from '$lib/remote/billing.remote';
	import SuperAdminAccessPrompt from '$lib/components/SuperAdminAccessPrompt.svelte';
	import BypassWarningBanner from '$lib/components/BypassWarningBanner.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Check for access denied or bypassed access states
	const accessDenied = $derived((data as any).accessDenied as boolean | undefined);
	const bypassedAccess = $derived((data as any).bypassedAccess as boolean | undefined);
	const requiredRole = $derived((data as any).requiredRole as string | undefined);
	const currentRole = $derived((data as any).currentRole as string | undefined);
	const emulatedRole = $derived((data as any).emulatedRole as string | undefined);
	const originalRole = $derived((data as any).originalRole as string | undefined);

	const users = getUsersWithCredits();
	const billing = getBillingSettings();

	let deltas: Record<string, number> = {};
	let reasons: Record<string, string> = {};

	async function apply(userId: string) {
		const delta = Number(deltas[userId] || 0);
		if (!delta) return;

		try {
			await adjustUserCredits({ userId, delta, reason: reasons[userId] });
			deltas[userId] = 0;
			reasons[userId] = '';
			await getUsersWithCredits().refresh();
		} catch (error) {
			console.error('Failed to adjust credits:', error);
			// You might want to add proper error handling UI here
		}
	}
</script>

<svelte:head>
	<title>Manage Credits - Admin</title>
</svelte:head>

<!-- Show access denied prompt for super admins who need to bypass -->
{#if accessDenied}
	<SuperAdminAccessPrompt
		requiredRole={requiredRole || 'super_admin'}
		{currentRole}
		{emulatedRole}
	/>
{:else}
	<!-- Show bypass warning banner when accessing via bypass -->
	{#if bypassedAccess}
		<BypassWarningBanner requiredRole={requiredRole || 'super_admin'} {originalRole} />
	{/if}

	<Card>
		<CardHeader>
			<CardTitle>Manual Credit Management</CardTitle>
			<CardDescription>
				{#await billing}
					Loading billing settings...
				{:then billingData}
					{billingData?.payments_enabled
						? 'Payments are enabled. You can still manually adjust if needed.'
						: 'Payments are disabled. Use manual adjustments to provision credits.'}
				{/await}
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			{#await users}
				<p class="text-sm text-muted-foreground">Loading users...</p>
			{:then usersData}
				{#each usersData as u}
					<div class="flex items-center justify-between gap-4 border-b pb-3">
						<div class="min-w-0">
							<div class="font-medium">{u.email}</div>
							<div class="text-xs text-muted-foreground">
								Role: {u.role} • Credits: {u.credits_balance} • Cards: {u.card_generation_count}
							</div>
						</div>
						<div class="flex gap-2">
							<input
								class="w-28 border rounded px-2 py-1 text-sm"
								type="number"
								placeholder="+/- credits"
								bind:value={deltas[u.id]}
							/>
							<input
								class="w-64 border rounded px-2 py-1 text-sm"
								placeholder="Reason (optional)"
								bind:value={reasons[u.id]}
							/>
							<Button onclick={() => apply(u.id)}>Apply</Button>
						</div>
					</div>
				{/each}
			{/await}
		</CardContent>
	</Card>
{/if}
