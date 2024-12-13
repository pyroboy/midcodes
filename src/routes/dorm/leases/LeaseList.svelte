<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import type { Leases } from '$lib/db/schema';

    export let leases: (Leases & {
        location?: { locationName: string },
        leaseTenants?: Array<{ tenant?: { tenantName: string } }>
    })[];
    export let editLease: (lease: Leases) => void;

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString();
    }
</script>

<div class="overflow-x-auto">
    <table class="min-w-full bg-white">
        <thead>
            <tr>
                <th class="px-4 py-2">Location</th>
                <th class="px-4 py-2">Tenants</th>
                <th class="px-4 py-2">Status</th>
                <th class="px-4 py-2">Type</th>
                <th class="px-4 py-2">Start Date</th>
                <th class="px-4 py-2">End Date</th>
                <th class="px-4 py-2">Actions</th>
            </tr>
        </thead>
        <tbody>
            {#each leases as lease (lease.id)}
                <tr>
                    <td class="border px-4 py-2">{lease.location?.locationName ?? 'N/A'}</td>
                    <td class="border px-4 py-2">
                        {#if lease.leaseTenants}
                            {lease.leaseTenants.map(lt => lt.tenant?.tenantName).filter(Boolean).join(', ')}
                        {/if}
                    </td>
                    <td class="border px-4 py-2">{lease.leaseStatus}</td>
                    <td class="border px-4 py-2">{lease.leaseType}</td>
                    <td class="border px-4 py-2">{formatDate(lease.leaseStartDate)}</td>
                    <td class="border px-4 py-2">{formatDate(lease.leaseEndDate)}</td>
                    <td class="border px-4 py-2">
                        <Button on:click={() => editLease(lease)}>Edit</Button>
                        <form method="POST" action="?/delete" class="inline-block ml-2">
                            <input type="hidden" name="id" value={lease.id} />
                            <Button type="submit">Delete</Button>
                        </form>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>