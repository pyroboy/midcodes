<!-- src/routes/accounts/+page.svelte -->

<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import * as Card from '$lib/components/ui/card';
  import * as Tabs from '$lib/components/ui/tabs';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import BillingForm from './BillingForm.svelte';
  
  let { data } = $props();
  let selectedBillingType = $state<'RENT' | 'UTILITY' | 'PENALTY'>('RENT');
  let editMode = $state(false);
  let billingsByLease: Record<string, { lease: any; billings: any[] }> = {};
  
  // Group billings by lease
  $effect(() => {
    billingsByLease = data.billings.reduce((acc, billing) => {
      if (!acc[billing.lease_id]) {
        acc[billing.lease_id] = {
          lease: billing.lease,
          billings: []
        };
      }
      acc[billing.lease_id].billings.push(billing);
      return acc;
    }, {});
  });

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString();
  }

  function getBillingStatusColor(status: string) {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PARTIAL': return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<div class="container mx-auto p-4">
  <div class="flex flex-col lg:flex-row gap-4">
    <!-- Billings List -->
    <div class="w-full lg:w-2/3 space-y-4">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold">Billings</h1>
        <Tabs.Root value={selectedBillingType} onValueChange={(v: any) => selectedBillingType = v as 'RENT' | 'UTILITY' | 'PENALTY'}>
          <Tabs.List>
            <Tabs.Trigger value="RENT">Rent</Tabs.Trigger>
            <Tabs.Trigger value="UTILITY">Utilities</Tabs.Trigger>
            <Tabs.Trigger value="PENALTY">Penalties</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </div>

      {#each Object.values(billingsByLease) as { lease, billings }}
        <Card.Root>
          <Card.Header>
            <Card.Title>
              {lease.rental_unit.property.name} - {lease.rental_unit.name}
            </Card.Title>
            <Card.Description>
              Tenant(s): {lease.lease_tenants.map((lt: { tenant: { name: string } }) => lt.tenant.name).join(', ')}
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div class="space-y-2">
              {#each billings.filter(b => b.type === selectedBillingType) as billing}
                <div class="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                  <div>
                    <div class="font-medium">
                      {billing.type} 
                      {#if billing.utility_type}
                        - {billing.utility_type}
                      {/if}
                    </div>
                    <div class="text-sm text-muted-foreground">
                      Due: {formatDate(billing.due_date)}
                    </div>
                  </div>
                  <div class="text-right">
                    <div>{formatCurrency(billing.amount)}</div>
                    <Badge variant={billing.status === 'PAID' ? 'default' : 'secondary'}>
                      {billing.status}
                    </Badge>
                  </div>
                </div>
              {/each}
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>

    <!-- Billing Form -->
    <div class="w-full lg:w-1/3">
      <Card.Root>
        <Card.Header>
          <Card.Title>{editMode ? 'Edit' : 'Add'} Billing</Card.Title>
        </Card.Header>
        <Card.Content>
          <BillingForm 
            {data}
            {editMode}
            on:cancel={() => editMode = false}
          />
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</div>