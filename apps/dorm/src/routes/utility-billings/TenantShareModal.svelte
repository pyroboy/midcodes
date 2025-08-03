<script lang="ts">
    import { enhance } from '$app/forms';
  import { toast } from 'svelte-sonner';
import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import * as Checkbox from '$lib/components/ui/checkbox';
  import { Input } from '$lib/components/ui/input';
  import { Search } from 'lucide-svelte';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import type { Lease, Tenant, Reading, ShareData, MeterData } from './types';
  import Fuse from 'fuse.js';
  import * as Table from '$lib/components/ui/table';

  type Props = {
    open: boolean;
    close: () => void;
    generatePreview: (data: ShareData[]) => void;
    reading: MeterData | null;
    leases: Lease[];
    leaseMeterBilledDates?: Record<string, string>;
  };

  type View = 'tenants' | 'history';

  let { 
    open = $bindable(), 
    close, 
    generatePreview, 
    reading, 
    leases = [], 
    leaseMeterBilledDates = {} 
  }: Props = $props();

  let view: View = $state('tenants');

  let selectedTenants = $state(new Set<number>());
  let searchQuery = $state(reading?.meterName ?? '');

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
    threshold: 0.6,
  }));

  const filteredList = $derived(
    searchQuery ? fuse.search(searchQuery).map(result => result.item) : flatTenantList
  );

  function toggleTenantSelection(tenantId: number, isChecked: boolean | 'indeterminate') {
    if (isChecked === true) {
      selectedTenants.add(tenantId);
    } else {
      selectedTenants.delete(tenantId);
    }
    selectedTenants = new Set(selectedTenants);
  }

  function handleGenerate() {
    if (!reading || selectedTenants.size === 0) return;

    const totalCost = reading.totalCost || 0;
    const sharePerTenant = totalCost / selectedTenants.size;

    const shareData = flatTenantList
      .filter(item => selectedTenants.has(item.tenant.id))
      .map(item => ({
        tenant: item.tenant,
        lease: { id: item.leaseId, name: item.leaseName },
        share: sharePerTenant
      }));

    console.log('Selected tenants:', selectedTenants);
    console.log('Generating print preview with data:', shareData);
    generatePreview(shareData);
  }

  function handleClose() {
    // Reset internal state before closing
    selectedTenants.clear();
    searchQuery = '';
    view = 'tenants';
    // Call the close function passed from the parent
    close();
  }

  // Formatting functions
  function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
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

<Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
  <Dialog.Content class="sm:max-w-[600px]">
    <Dialog.Header>
      <Dialog.Title>Tenant Share Calculation</Dialog.Title>
      {#if reading}
      <div class="p-4 rounded-xl bg-muted/40 border shadow-sm space-y-4">
        <!-- Top Section: Meter Info -->
        <div class="flex justify-center items-center gap-2 text-center">
          <h2 class="text-lg font-semibold">{reading.meterName}</h2>
          <span class="text-muted-foreground">–</span>
          <p class="text-sm text-muted-foreground">{formatDate(reading.lastReadingDate)}</p>
          <span class="text-muted-foreground">–</span>
          <p class="text-sm text-muted-foreground">{formatDate(reading.currentReadingDate)}</p>
        </div>
        
      
        <!-- Bottom Section: Two Columns -->
        <div class="grid grid-cols-2 divide-x divide-border text-sm">
          <!-- Left Column: Consumption & Cost -->
          <div class="flex flex-col justify-center px-4 space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground">Consumption</span>
              <span class="font-semibold">
                {formatNumber(reading.consumption)} {getUnitLabel(reading.meterType)}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground">Total Cost</span>
              <span class="font-semibold">{formatCurrency(reading.totalCost)}</span>
            </div>
          </div>
      
          <!-- Right Column: Tenants & Per Tenant -->
          <div class="flex flex-col justify-center px-4 space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground">Tenants</span>
              <span class="font-semibold">{selectedTenants.size}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground">Per Tenant</span>
              <span class="font-semibold">
                {selectedTenants.size > 0 
                  ? formatCurrency((reading.totalCost || 0) / selectedTenants.size) 
                  : formatCurrency(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      
      
      
      {/if}
    </Dialog.Header>

    <div class="">
        <ToggleGroup.Root type="single" value={view} onValueChange={(v: string | null) => { if(v) view = v as View; }} class="w-full">
          <ToggleGroup.Item value="tenants" class="w-1/2">Tenants</ToggleGroup.Item>
          <ToggleGroup.Item value="history" class="w-1/2">History</ToggleGroup.Item>
        </ToggleGroup.Root>

      {#if view === 'tenants'}
        <div class="animate-in fade-in-0">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tenants or unit..."
              bind:value={searchQuery}
              class="w-full pl-10"
            />
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">Search for Unit or Tenant names</p>

         
          <div class="mt-4 pr-2 -mr-4 max-h-60 overflow-y-auto">
            {#if filteredList.length > 0}
              <div class="grid gap-2">
                {#each filteredList as item (item.tenant.id)}
                  {@const billedDate = reading && leaseMeterBilledDates ? leaseMeterBilledDates[`${reading.meterId}-${item.leaseId}`] : undefined}
                  <label
                    class="flex items-center p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox.Root
                      class="mr-3"
                      checked={selectedTenants.has(item.tenant.id)}
                      onCheckedChange={(isChecked) => toggleTenantSelection(item.tenant.id, isChecked)}
                    />
                    <div class="flex-1">
                      <p class="font-medium">{item.leaseName} - <span class="text-muted-foreground">{item.tenant.full_name}</span>
                        {#if billedDate && reading && billedDate === reading.currentReadingDate}
                          <span class="ml-2 text-xs font-normal text-green-600">(Billed {formatDate(billedDate)} {reading.meterName})</span>
                        {/if}
                      </p>
                    </div>
                  </label>
                {/each}
              </div>
            {:else}
              <p class="text-sm text-muted-foreground text-center py-4">No tenants found.</p>
            {/if}
          </div>
        </div>
      {:else if view === 'history'}
        <div class="animate-in fade-in-0">
          {#if reading && reading.history.length > 0}
            <div class="rounded-md border max-h-[284px] overflow-y-auto">
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
                      <Table.Cell class="text-right">{formatNumber(historyItem.consumption)} {getUnitLabel(reading.meterType)}</Table.Cell>
                      <Table.Cell class="text-right">{formatCurrency(historyItem.cost)}</Table.Cell>
                    </Table.Row>
                  {/each}
                </Table.Body>
              </Table.Root>
            </div>
          {:else}
            <p class="text-sm text-muted-foreground text-center py-4">No reading history available.</p>
          {/if}
        </div>
      {/if}

            <Dialog.Footer>
        <Button variant="outline" type="button" onclick={handleClose}>Cancel</Button>
        <button type="button" onclick={() => handleGenerate()} disabled={selectedTenants.size === 0}
          class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Generate Print Preview
        </button>

        <form
        action="?/createUtilityBillings"
        method="POST"
        use:enhance={({ formData }) => {
          if (!reading || selectedTenants.size === 0) return;

          const totalCost = reading.totalCost || 0;
          const sharePerTenant = totalCost / selectedTenants.size;

          const shareData = flatTenantList
            .filter(item => selectedTenants.has(item.tenant.id))
            .map(item => ({
              tenant: item.tenant,
              lease: { id: item.leaseId, name: item.leaseName },
              share: sharePerTenant
            }));

          formData.set(
            'billingData',
            JSON.stringify(
              shareData.map((d: ShareData) => ({
                lease_id: d.lease.id,
                lease: { name: d.lease.name }, // Pass lease name for server-side error messages
                amount: d.share,
                meter_id: reading?.meterId,
                utility_type: reading?.meterType,
                billing_date: reading?.currentReadingDate,
                notes: `Utility bill for ${reading?.meterName}`
              }))
            )
          );

          return async ({ result, update }) => {
            if (result.type === 'success') {
              const data = result.data as any;
              let message = `Successfully created ${data.created} billing(s).`;
              if (Array.isArray(data.duplicates) && data.duplicates.length > 0) {
                message += ` ${data.duplicates.length} duplicate(s) were skipped.`;
              }
              toast.success(message);
              handleClose();
            } else if (result.type === 'failure') {
              const data = result.data as any;
              // Handle specific 409 Conflict for duplicate billings
              if (result.status === 409 && data?.error) {
                toast.error('Duplicate Billing Found', {
                  description: data.error,
                  duration: 10000 // Show for longer
                });
              } else if (data?.error) {
                toast.error('Billing Error', { description: data.error });
              } else {
                toast.error('An unknown validation error occurred.');
              }
            } else if (result.type === 'error') {
              toast.error('Request Failed', { description: result.error.message });
            }

            // Prevent default form reset/invalidation
            await update({ reset: false });
          };
        }}
    

      >
        <Button type="submit" disabled={selectedTenants.size === 0}>Bill Leases</Button>
      </form>
      </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>