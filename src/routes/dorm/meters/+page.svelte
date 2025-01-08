<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import * as Alert from '$lib/components/ui/alert';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { page } from '$app/stores';
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "$lib/components/ui/select";
  import { utilityTypeEnum, meterStatusEnum, type MeterFormData, meterFormSchema } from './formSchema';
  import { Loader2 } from 'lucide-svelte';
  import type { z } from 'zod';
  import type { Database } from '$lib/database.types';
  import type { PageData } from './$types';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { superValidate } from 'sveltekit-superforms/client';
  import { zod } from 'sveltekit-superforms/adapters';
  import MeterForm from './MeterForm.svelte';

  type Property = Database['public']['Tables']['properties']['Row'];
  type Floor = Database['public']['Tables']['floors']['Row'] & {
    property: Property | null;
  };
  type Rental_unit = Database['public']['Tables']['rental_unit']['Row'] & {
    floor: Floor | null;
  };

  export let data: PageData;
  let showForm = false;
  let selectedMeter: MeterFormData | undefined;
  let loading = false;
  let error: string | null = null;
  let selectedType: z.infer<typeof utilityTypeEnum> | undefined = undefined;
  let selectedStatus: z.infer<typeof meterStatusEnum> | undefined = undefined;
  let searchQuery = '';
  let sortBy: 'name' | 'type' | 'status' | 'reading' = 'name';
  let sortOrder: 'asc' | 'desc' = 'asc';

  $: ({ form, meters = [], properties = [], floors = [], rental_unit = [], isAdminLevel, isUtility, isMaintenance } = data);

  // Create a default form value
  const defaultForm: SuperValidated<MeterFormData, any> = {
    id: crypto.randomUUID(),
    valid: true,
    posted: false,
    errors: {},
    data: {
      name: '',
      type: 'ELECTRICITY',
      status: 'ACTIVE',
      location_type: 'PROPERTY',
      property_id: null,
      floor_id: null,
      rental_unit_id: null,
      unit_rate: 0,
      initial_reading: 0,
      is_active: true,
      notes: null
    }
  };

  function handleTypeSelect(value: { value: string } | undefined) {
    selectedType = value?.value as z.infer<typeof utilityTypeEnum>;
  }

  function handleStatusSelect(value: { value: string } | undefined) {
    selectedStatus = value?.value as z.infer<typeof meterStatusEnum>;
  }

  function handleMeterClick(meter: MeterFormData) {
    if (isAdminLevel || isUtility) {
      selectedMeter = meter;
      showForm = true;
    }
  }

  function handleMeterAdded() {
    showForm = false;
    selectedMeter = undefined;
  }

  function getLocationDetails(meter: MeterFormData): string {
    switch (meter.location_type) {
      case 'PROPERTY':
        const property = properties?.find(p => p.id === meter.property_id);
        return property ? `Property: ${property.name}` : 'Unknown Property';
      case 'FLOOR':
        const floor = floors?.find(f => f.id === meter.floor_id);
        return floor 
          ? `Floor ${floor.floor_number}${floor.property ? ` - ${floor.property.name}` : ''}`
          : 'Unknown Floor';
      case 'RENTAL_UNIT':
        const unit = rental_unit?.find(r => r.id === meter.rental_unit_id);
        return unit 
          ? `Rental_unit ${unit.number}${unit.floor?.property ? ` - ${unit.floor.property.name}` : ''}`
          : 'Unknown Rental_unit';
      default:
        return 'Unknown Location';
    }
  }

  function getTypeVariant(type: string): 'default' | 'outline' | 'secondary' | 'destructive' {
    switch (type) {
      case 'ELECTRICITY':
        return 'default';
      case 'WATER':
        return 'secondary';
      case 'INTERNET':
        return 'outline';
      default:
        return 'default';
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function formatReading(value: number): string {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function handleSort(field: typeof sortBy) {
    if (sortBy === field) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = field;
      sortOrder = 'asc';
    }
  }

  $: filteredMeters = (meters ?? []).filter(meter => {
    if (!meter) return false;
    const matchesType = !selectedType || meter.type === selectedType;
    const matchesStatus = !selectedStatus || meter.status === selectedStatus;
    const matchesSearch = !searchQuery || 
      meter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getLocationDetails(meter).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  }).sort((a, b) => {
    const order = sortOrder === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'name':
        return order * a.name.localeCompare(b.name);
      case 'type':
        return order * a.type.localeCompare(b.type);
      case 'status':
        return order * a.status.localeCompare(b.status);
      case 'reading':
        const aReading = a.latest_reading?.value || 0;
        const bReading = b.latest_reading?.value || 0;
        return order * (aReading - bReading);
      default:
        return 0;
    }
  }) || [];
</script>

<div class="space-y-6">
  {#if error}
    <Alert.Root variant="destructive">
      <Alert.Title>{error}</Alert.Title>
    </Alert.Root>
  {/if}

  {#if !showForm}
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold">Meters</h1>
        {#if isAdminLevel || isUtility}
          <Button on:click={() => {
            selectedMeter = undefined;
            showForm = true;
          }}>Add Meter</Button>
        {/if}
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Input
            type="text"
            placeholder="Search meters..."
            value={searchQuery}
            on:input={(e) => searchQuery = e.currentTarget.value}
          />
        </div>
        <div>
          <Label for="type">Type</Label>
          <Select onSelectedChange={handleTypeSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {#each Object.values(utilityTypeEnum.Values) as type}
                <SelectItem value={type}>{type}</SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label for="status">Status</Label>
          <Select onSelectedChange={handleStatusSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {#each Object.values(meterStatusEnum.Values) as status}
                <SelectItem value={status}>{status}</SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- Meters Grid -->
      <div class="grid gap-4">
        {#if loading}
          <div class="flex justify-center items-center py-8">
            <Loader2 class="h-8 w-8 animate-spin" />
          </div>
        {:else if filteredMeters.length === 0}
          <div class="text-center py-8 text-gray-500">
            No meters found matching your criteria
          </div>
        {:else}
          {#each filteredMeters as meter (meter.id)}
            <Card.Root 
              class="cursor-pointer {(isAdminLevel || isUtility) ? 'hover:bg-gray-50' : ''}"
              on:click={() => handleMeterClick(meter)}
            >
              <Card.Header>
                <Card.Title class="flex justify-between items-center">
                  <div class="flex items-center space-x-2">
                    <span>{meter.name}</span>
                    <Badge variant={getTypeVariant(meter.type)}>
                      {meter.type}
                    </Badge>
                    <Badge class={getStatusColor(meter.status)}>
                      {meter.status}
                    </Badge>
                  </div>
                  {#if meter.latest_reading}
                    <div class="text-sm text-gray-500">
                      Latest Reading: {formatReading(meter.latest_reading.value)}
                      <span class="text-xs">
                        ({new Date(meter.latest_reading.date).toLocaleDateString()})
                      </span>
                    </div>
                  {/if}
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm font-medium text-gray-500">Location</p>
                    <p>{getLocationDetails(meter)}</p>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-500">Unit Rate</p>
                    <p>{formatReading(meter.unit_rate)} per unit</p>
                  </div>
                </div>
                {#if meter.notes}
                  <p class="mt-2 text-sm text-gray-500">{meter.notes}</p>
                {/if}
              </Card.Content>
            </Card.Root>
          {/each}
        {/if}
      </div>
    </div>
  {:else}
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold">{selectedMeter ? 'Edit' : 'Add'} Meter</h2>
        <Button variant="outline" on:click={() => {
          showForm = false;
          selectedMeter = undefined;
        }}>Cancel</Button>
      </div>
      <MeterForm
        form={form ?? defaultForm}
        properties={properties ?? []}
        floors={floors ?? []}
        rental_unit={rental_unit ?? []}
        meter={selectedMeter}
        on:meterAdded={handleMeterAdded}
        on:meterUpdated={handleMeterAdded}
      />
    </div>
  {/if}
</div>

{#if !isAdminLevel && !isUtility && !isMaintenance}
  <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <p class="text-yellow-800">
      You do not have permission to manage meters. Please contact your administrator.
    </p>
  </div>
{/if}
