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
	import { page } from '$app/stores';

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
			// Refresh page data to update the user's credit balance in the header if displayed
			// invalidateAll();
		} catch (error) {
			console.error('Failed to adjust credits:', error);
			// You might want to add proper error handling UI here
		}
	}

    // Define a type that includes the properties added in layout.server.ts
    type UserWithCredits = {
        id: string;
        email?: string;
        credits_balance?: number;
    };

    // Identify current user with type assertion
    $: currentUser = $page.data.user as UserWithCredits | null;
</script>

<svelte:head>
	<title>Manage Credits - Admin</title>
</svelte:head>

<div class="space-y-6">
    <!-- Self Credit Management -->
    {#if currentUser}
        <Card class="border-primary/20 bg-primary/5">
            <CardHeader>
                <CardTitle>My Credits</CardTitle>
                <CardDescription>
                    Manage your own credit balance (Admin Self-Service)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div class="flex items-center justify-between gap-4">
                    <div class="min-w-0">
                        <div class="font-medium text-lg">{currentUser.email}</div>
                        <div class="text-sm text-muted-foreground">
                            Current Balance: <span class="font-bold text-primary">{currentUser.credits_balance ?? 0}</span>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <input
                            class="w-28 border rounded px-2 py-1 text-sm bg-background"
                            type="number"
                            placeholder="+/- credits"
                            bind:value={deltas[currentUser.id]}
                        />
                        <input
                            class="w-64 border rounded px-2 py-1 text-sm bg-background"
                            placeholder="Reason (optional)"
                            bind:value={reasons[currentUser.id]}
                        />
                        <Button onclick={() => apply(currentUser.id)}>Apply to Self</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    {/if}

    <!-- Other Users Management -->
    <Card>
        <CardHeader>
            <CardTitle>User Credit Management</CardTitle>
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
                    {#if u.id !== currentUser?.id}
                        <div class="flex items-center justify-between gap-4 border-b pb-3 last:border-0">
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
                    {/if}
                {/each}
            {/await}
        </CardContent>
    </Card>
</div>
