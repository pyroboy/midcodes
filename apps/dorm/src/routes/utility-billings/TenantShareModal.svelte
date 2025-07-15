<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import * as Checkbox from '$lib/components/ui/checkbox';
  import { Input } from '$lib/components/ui/input';
  import type { Lease, Tenant, Reading, ShareData, MeterData } from './types';
  import Fuse from 'fuse.js';
import * as Table from '$lib/components/ui/table';
  type Props = {
    open: boolean;
    close: () => void;
    generatePreview: (data: ShareData[]) => void;
    reading: MeterData | null;
    leases: Lease[];

  };

  type FlatTenant = {
    leaseId: number;
    leaseName: string;
    tenant: Tenant;
  };

  let {open , generatePreview , reading, leases = []}: Props = $props();

  let selectedTenants = $state(new Set<number>());

  let searchQuery = $state('');
  let showHistory = $state(false);

  const flatTenantList = $derived(leases
    .filter(lease => lease) // Ensure lease is not null/undefined
    .flatMap(lease => 
      (lease.tenants || []).map(tenant => ({
        leaseId: lease.id,
        leaseName: lease.name,
        tenant: tenant
      }))
  ));

  const fuse = $derived(new Fuse(flatTenantList, {
    keys: ['leaseName', 'tenant.full_name'],
    threshold: 0.4,
  }));

  const filteredList = $derived(
    searchQuery ? fuse.search(searchQuery).map(result => result.item) : flatTenantList
  );

  const shareData = $derived.by(() => {
    if (!reading || selectedTenants.size === 0) return [];

    const totalCost = reading.totalCost || 0;
    const sharePerTenant = totalCost / selectedTenants.size;

    return flatTenantList
      .filter(item => selectedTenants.has(item.tenant.id))
      .map(item => ({
        tenant: item.tenant,
        lease: { id: item.leaseId, name: item.leaseName },
        share: sharePerTenant
      }));
  });

  function toggleTenantSelection(tenantId: number, isChecked: boolean) {
    if (isChecked) {
      selectedTenants.add(tenantId);
    } else {
      selectedTenants.delete(tenantId);
    }
    selectedTenants = new Set(selectedTenants);
  }

  function handleGenerate() {
    console.log('Selected tenants:', selectedTenants);
    console.log('Generating print preview with data:', shareData);
    generatePreview(shareData);
  }

  function handleClose() {
    console.log('Closing tenant share modal');
    close();
    setTimeout(() => {
      selectedTenants.clear();
      searchQuery = '';
      showHistory = false;
    }, 300); // Delay to allow closing animation
  }



  // Formatting functions
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString();
  }

  function formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '-';

    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  function getUnitLabel(type: string): string {
    switch (type.toUpperCase()) {
      case 'ELECTRICITY':
        return 'kWh';
      case 'WATER':
        return 'm³';
      case 'GAS':
        return 'm³';
      case 'INTERNET':
        return 'GB';
      case 'CABLE':
        return 'month';
      default:
        return 'unit';
    }
  }
</script>

<Dialog.Root bind:open={open}>
  <Dialog.Content class="sm:max-w-[600px]">
      <Dialog.Header>
          <Dialog.Title>Tenant Share Calculation</Dialog.Title>
          {#if reading}
            <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-2 border-t border-b py-3">
              <div class="font-semibold">Meter Name:</div>
              <div>{reading.meterName}</div>
              <div class="font-semibold">Reading Date:</div>
              <div>{reading.lastReadingDate ? new Date(reading.lastReadingDate).toLocaleDateString() : 'N/A'}</div>
              <div class="font-semibold">Consumption:</div>
              <div>{reading.consumption?.toFixed(2) || 'N/A'}</div>
              <div class="font-semibold">Total Cost:</div>
              <div class="font-bold text-base">₱{reading.totalCost?.toFixed(2) || '0.00'}</div>
            </div>
          {/if}
      </Dialog.Header>

      <div class="py-4 space-y-4">
          <Input 
            type="search" 
            placeholder="Search by lease or tenant name..." 
            bind:value={searchQuery} 
          />

          {#if reading}
            <div class="p-3 bg-gray-50 rounded-md text-sm">
              <div class="flex justify-between">
                <span>Tenants Selected:</span>
                <span class="font-bold">{selectedTenants.size}</span>
              </div>
              <div class="flex justify-between mt-1">
                <span>Cost per Tenant:</span>
                <span class="font-bold">
                  {selectedTenants.size > 0 ? `₱${((reading.totalCost || 0) / selectedTenants.size).toFixed(2)}` : '₱0.00'}
                </span>
              </div>
            </div>
          {/if}

        <div class="space-y-2 max-h-[55vh] overflow-y-auto pr-2">
          {#if filteredList.length > 0}
            {#each filteredList as item (item.tenant.id)}
              <div class="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
                <Checkbox.Root
                  id={`tenant-${item.tenant.id}`}
                  checked={selectedTenants.has(item.tenant.id)}
                  onCheckedChange={(isChecked) => toggleTenantSelection(item.tenant.id, isChecked === true)}
                />
                <label
                  for={`tenant-${item.tenant.id}`}
                  class="text-sm font-medium leading-none w-full cursor-pointer"
                >
                  <span class="font-bold">{item.leaseName}</span> - {item.tenant.full_name}
                </label>
              </div>
            {/each}
          {:else}
            <p class="text-sm text-gray-500 text-center py-4">No tenants found.</p>
          {/if}
        </div>
      </div>

      <div class="mt-6">
        <div class="flex justify-between items-center mb-2">
          <h4 class="text-sm font-medium">Reading History</h4>
          <button onclick={() => showHistory = !showHistory}>
            {showHistory ? 'Hide' : 'Show'}
          </button>
        </div>
        {#if showHistory}
          {#if reading && reading.history.length > 0}
            <div class="rounded-md border max-h-60 overflow-y-auto animate-in fade-in-0">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.Head>Date</Table.Head>
                    <Table.Head class="text-right">Reading</Table.Head>
                    <Table.Head class="text-right">Consumption</Table.Head>
                    <Table.Head class="text-right">Cost</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {#each reading.history as historyItem}
                    <Table.Row>
                      <Table.Cell>{formatDate(historyItem.reading_date)}</Table.Cell>
                      <Table.Cell class="text-right">{formatNumber(historyItem.reading)}</Table.Cell>
                      <Table.Cell class="text-right">
                        {formatNumber(historyItem.consumption)}
                        <span class="text-xs text-muted-foreground ml-1">{getUnitLabel(reading.meterType)}</span>
                      </Table.Cell>
                      <Table.Cell class="text-right">{formatCurrency(historyItem.cost)}</Table.Cell>
                    </Table.Row>
                  {/each}
                </Table.Body>
              </Table.Root>
            </div>
          {:else}
            <p class="text-sm text-muted-foreground">No reading history available.</p>
          {/if}
        {/if}
      </div>

      <Dialog.Footer>
        <Button variant="outline" onclick={handleClose}>Cancel</Button>
        <button onclick={() => handleGenerate()} disabled={selectedTenants.size === 0}
          class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Generate Print Preview
        </button>
      </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>