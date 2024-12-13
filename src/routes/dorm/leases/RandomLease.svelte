<!-- RandomLease.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Button } from '$lib/components/ui/button';
    import { leaseStatusEnum, leaseTypeEnum } from '$lib/db/schema';
  
    export let tenants: { id: number; tenantName: string }[] = [];
    export let locations: { id: number; locationName: string }[] = [];
  
    const dispatch = createEventDispatcher();
  
    function generateRandomLease() {
      const randomLease = {
        tenantIds: [tenants[Math.floor(Math.random() * tenants.length)].id],
        locationId: locations[Math.floor(Math.random() * locations.length)].id,
        leaseStatus: leaseStatusEnum.enumValues[Math.floor(Math.random() * leaseStatusEnum.enumValues.length)],
        leaseType: leaseTypeEnum.enumValues[Math.floor(Math.random() * leaseTypeEnum.enumValues.length)],
        leaseStartDate: new Date().toISOString().split('T')[0],
        leaseTermsMonth: Math.floor(Math.random() * 12) + 1,
        leaseSecurityDeposit: Math.floor(Math.random() * 1000) + 500,
        leaseRentRate: Math.floor(Math.random() * 1000) + 500,
        leaseNotes: "This is a randomly generated lease.",
      };
  
      if (randomLease.leaseType === 'PRIVATEROOM') {
        randomLease.tenantIds.push(tenants[Math.floor(Math.random() * tenants.length)].id);
      }
  
      dispatch('randomLease', randomLease);
    }
  </script>
  
  <Button on:click={generateRandomLease} class="mb-4">Generate Random Lease</Button>