<!-- src/routes/overview/monthly/+page.svelte -->

<script lang="ts">
    import type { PageData } from './$types';
  
    export let data: PageData;
  
    function getBalance(tenantId: number, month: string) {
      const balance = data.balances.find(b => b.tenantId === tenantId && b.month === month);
      return balance ? balance.balance : 0;
    }
  </script>
  
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Monthly Overview</h1>
  
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white">
        <thead>
          <tr>
            <th class="py-2 px-4 border-b">Floor</th>
            <th class="py-2 px-4 border-b">Location</th>
            <th class="py-2 px-4 border-b">Tenant</th>
            {#each data.months as month}
              <th class="py-2 px-4 border-b">{month}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data.locations as location}
            {#each location.leases as lease}
              {#if lease.leaseType === 'PRIVATEROOM'}
                <tr>
                  <td class="py-2 px-4 border-b">{location.locationFloorLevel}</td>
                  <td class="py-2 px-4 border-b">{location.locationName}{location.leases[0].leaseType}</td>
                  <td class="py-2 px-4 border-b">
                    {lease.leaseTenants.map(lt => lt.tenant.tenantName).join(', ')}
                  </td>
                  {#each data.months as month}
                    <td class="py-2 px-4 border-b">
                      ${lease.leaseTenants.reduce((sum, lt) => sum + getBalance(lt.tenant.id, month), 0).toFixed(2)}
                    </td>
                  {/each}
                </tr>
              {:else}
                {#each lease.leaseTenants as leaseTenant}
                  <tr>
                    <td class="py-2 px-4 border-b">{location.locationFloorLevel}</td>
                    <td class="py-2 px-4 border-b">{location.locationName}</td>
                    <td class="py-2 px-4 border-b">{leaseTenant.tenant.tenantName}</td>
                    {#each data.months as month}
                      <td class="py-2 px-4 border-b">
                        ${getBalance(leaseTenant.tenant.id, month).toFixed(2)}
                      </td>
                    {/each}
                  </tr>
                {/each}
              {/if}
            {/each}
          {/each}
        </tbody>
      </table>
    </div>
  </div>