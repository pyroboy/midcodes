<!-- RandomTenant.svelte -->
<script lang="ts">
  import { createInsertSchema } from 'drizzle-zod';
  import { tenants, leases, locations } from '$lib/db/schema';
  import Button from '$lib/components/ui/button/button.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function generateAndSubmitRandomData() {
    const randomTenant = {
      tenantName: `Random Tenant ${Math.floor(Math.random() * 1000)}`,
      tenantContactNumber: `+1${Math.floor(Math.random() * 10000000000)}`,
    };

    dispatch('submitRandom', randomTenant);
  }
</script>

<Button
  on:click={generateAndSubmitRandomData}
  class="border-2 border-gray-300 rounded-full text-[8px] font-bold"
>
  ADD RANDOM
</Button>