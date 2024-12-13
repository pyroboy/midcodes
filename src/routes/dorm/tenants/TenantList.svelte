<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Button from '$lib/components/ui/button/button.svelte';
    import * as Table from '$lib/components/ui/table';

    export let tenants: any[] = [];
    // export let leases: any[] = [];

    const dispatch = createEventDispatcher();

    async function handleDelete(tenant: any) {
        const confirmed = window.confirm(`Are you sure you want to delete ${tenant.name}?`);
        if (!confirmed) return;

        const response = await fetch('?/delete', {
            method: 'POST',
            body: new FormData(document.createElement('form')),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (response.ok) {
            dispatch('deleteSuccess');
        }
    }

    function getLeasesForTenant(tenant: any) {
        return tenant.lease_tenants
            ?.map((lt: any) => lt.lease)
            .filter((lease: any) => lease)
            .map((lease: any) => ({
                ...lease,
                room_name: lease.room?.name || 'No Room'
            })) || [];
    }
</script>

<div class="w-2/3">
    <h2 class="text-2xl font-bold mb-4">Tenants</h2>
    <div class="border rounded-lg">
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head>Name</Table.Head>
                    <Table.Head>Contact</Table.Head>
                    <Table.Head>Email</Table.Head>
                    <Table.Head>Current Lease</Table.Head>
                    <Table.Head>Actions</Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each tenants as tenant}
                    {@const tenantLeases = getLeasesForTenant(tenant)}
                    <Table.Row>
                        <Table.Cell>{tenant.name}</Table.Cell>
                        <Table.Cell>{tenant.contact_number || '-'}</Table.Cell>
                        <Table.Cell>{tenant.email || '-'}</Table.Cell>
                        <Table.Cell>
                            {#if tenantLeases.length > 0}
                                <div class="space-y-1">
                                    {#each tenantLeases as lease}
                                        <div class="text-sm">
                                            {lease.room_name} - {lease.name}
                                        </div>
                                    {/each}
                                </div>
                            {:else}
                                No active lease
                            {/if}
                        </Table.Cell>
                        <Table.Cell>
                            <div class="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    on:click={() => dispatch('edit', tenant)}
                                >
                                    Edit
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    size="sm"
                                    on:click={() => handleDelete(tenant)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </Table.Cell>
                    </Table.Row>
                {/each}
            </Table.Body>
        </Table.Root>
    </div>
</div>