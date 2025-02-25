<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import * as Alert from '$lib/components/ui/alert';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Select from '$lib/components/ui/select';
  import { utilityTypeEnum, meterStatusEnum, type MeterFormData, meterFormSchema } from './formSchema';
  import { Loader2 } from 'lucide-svelte';
  import type { Database } from '$lib/database.types';
  import type { PageData } from './$types';
  import MeterForm from './MeterForm.svelte';
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { invalidate } from '$app/navigation';
  import { browser } from "$app/environment";
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';

  // Type definitions
  type Property = Database['public']['Tables']['properties']['Row'];
  type Floor = Database['public']['Tables']['floors']['Row'] & {
    property: Property | null;
  };
  type Rental_unit = Database['public']['Tables']['rental_unit']['Row'] & {
    floor: Floor | null;
  };

  interface LatestReading {
    value: number;
    date: string;
  }

  interface Reading {
    id: number;
    reading: number;
    reading_date: string;
  }

  type ExtendedMeterFormData = MeterFormData & {
    latest_reading?: LatestReading;
    property?: { name: string };
    floor?: { floor_number: number; wing?: string; property?: { name: string } };
    rental_unit?: { number: number; floor?: { floor_number: number; wing?: string; property?: { name: string } } };
    readings?: Reading[];
  };

  // Component state with Svelte 5 reactive primitives
  let { data } = $props<{ data: PageData }>();
  $inspect(data).with((type, data) => {
    console.log(`Data ${type}:`, {
      metersLength: data.meters?.length || 0,
      propertiesLength: data.properties?.length || 0,
      floorsLength: data.floors?.length || 0,
      rentalUnitLength: data.rental_unit?.length || 0
    });
  });
  
  let selectedMeter = $state<ExtendedMeterFormData | undefined>(undefined);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let selectedType = $state('');
  let selectedStatus = $state('');
  let searchQuery = $state('');
  let sortBy = $state<'name' | 'type' | 'status' | 'reading'>('name');
  let sortOrder = $state<'asc' | 'desc'>('asc');
  let editMode = $state(false);

  // Store data in state variables
  let metersData = $state<ExtendedMeterFormData[]>([]);
  let propertiesData = $state<Property[]>([]);
  let floorsData = $state<Floor[]>([]);
  let rentalUnitData = $state<Rental_unit[]>([]);
  let isAdminLevel = $state(false);
  let isUtility = $state(false);
  let isMaintenance = $state(false);

  // Update state when data changes
  $effect(() => {
    $inspect.trace('data-loading');
    metersData = data.meters || [];
    propertiesData = data.properties || [];
    floorsData = data.floors || [];
    rentalUnitData = data.rental_unit || [];
    isAdminLevel = data.isAdminLevel || false;
    isUtility = data.isUtility || false;
    isMaintenance = data.isMaintenance || false;
  });
  
  // Inspect state lengths to debug data loading
  $inspect({
    metersCount: metersData.length,
    propertiesCount: propertiesData.length,
    floorsCount: floorsData.length,
    rentalUnitsCount: rentalUnitData.length
  });

  // Process meters to extract latest readings
  let processedMeters = $state<ExtendedMeterFormData[]>([]);
  
  $effect(() => {
    $inspect.trace('process-meters');
    processedMeters = metersData.map((meter) => {
      // Add latest reading if readings exist
      if (meter.readings && meter.readings.length > 0) {
        // Sort readings by date, newest first
        const sortedReadings = [...meter.readings].sort((a, b) => {
          const dateA = new Date(a.reading_date);
          const dateB = new Date(b.reading_date);
          return dateB.getTime() - dateA.getTime();
        });
        
        return {
          ...meter,
          latest_reading: {
            value: sortedReadings[0].reading,
            date: sortedReadings[0].reading_date
          }
        };
      }
      return meter;
    });
  });
  
  // Inspect processed meters count
  $inspect(processedMeters.length);

  // Form handling
  const { form, enhance, errors, constraints, submitting, reset } = superForm(data.form, {
    id: 'meter-form',
    validators: zodClient(meterFormSchema),
    validationMethod: 'oninput',
    dataType: 'json',
    taintedMessage: null,
    resetForm: true,
    onError: ({ result }) => {
      console.error('Form submission error:', {
        error: result.error,
        status: result.status
      });
      if (result.error) {
        console.error('Server error:', result.error.message);
      }
    },
    onResult: async ({ result }) => {
      if (result.type === 'success') {
        editMode = false;
        selectedMeter = undefined;
        await invalidate('app:meters');
        reset();
      }
    }
  });
  
  // Inspect form values to debug form state
  $inspect($form).with((type, formValue) => {
    console.log(`Form ${type}:`, {
      name: formValue.name,
      location_type: formValue.location_type,
      property_id: formValue.property_id,
      floor_id: formValue.floor_id,
      rental_unit_id: formValue.rental_unit_id
    });
  });

  // Event handlers
  function handleCancel() {
    editMode = false;
    selectedMeter = undefined;
    reset();
  }

  function handleTypeChange(value: string) {
    selectedType = value;
  }

  function handleStatusChange(value: string) {
    selectedStatus = value;
  }

  function handleEdit(meter: ExtendedMeterFormData) {
    if (isAdminLevel || isUtility) {
      editMode = true;
      selectedMeter = meter;
      $form = { ...meter };
    }
  }

  // Utility functions
  function getLocationDetails(meter: ExtendedMeterFormData): string {
    switch (meter.location_type) {
      case 'PROPERTY':
        const property = propertiesData.find((p: Property) => p.id === meter.property_id);
        return property ? `Property: ${property.name}` : 'Unknown Property';
      case 'FLOOR':
        const floor = floorsData.find((f: Floor) => f.id === meter.floor_id);
        return floor 
          ? `Floor ${floor.floor_number}${floor.property ? ` - ${floor.property.name}` : ''}`
          : 'Unknown Floor';
      case 'RENTAL_UNIT':
        const unit = rentalUnitData.find((r: Rental_unit) => r.id === meter.rental_unit_id);
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

  // Filtered and sorted meters
  let filteredMeters = $state<ExtendedMeterFormData[]>([]);
  
  $effect(() => {
    $inspect.trace('filter-meters');
    filteredMeters = processedMeters.filter((meter) => {
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
    });
  });
  
  // Inspect filter criteria and filtered meters count
  $inspect({
    filterCriteria: { selectedType, selectedStatus, searchQuery },
    filteredCount: filteredMeters.length
  });
</script>

<div class="container mx-auto p-4 flex flex-col lg:flex-row gap-4">
  <!-- Meters List (Left side) -->
  <div class="w-full lg:w-2/3">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Meters</h1>
    </div>

    {#if error}
      <Alert.Root variant="destructive">
        <Alert.Title>{error}</Alert.Title>
      </Alert.Root>
    {/if}

    <Card.Root class="mb-6">
      <Card.Content class="pt-6">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <Input
              type="text"
              placeholder="Search by name or location"
              bind:value={searchQuery}
              class="pl-10"
            />
          </div>
          <div>
            <Select.Root type="single" value={selectedType} onValueChange={handleTypeChange}>
              <Select.Trigger class="w-full">
                <span>{selectedType || "All Types"}</span>
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="">All Types</Select.Item>
                {#each Object.values(utilityTypeEnum.enum) as type}
                  <Select.Item value={type}>
                    <div class="flex items-center">
                      <span class={`w-3 h-3 rounded-full mr-2 ${type === 'ELECTRICITY' ? 'bg-blue-500' : type === 'WATER' ? 'bg-cyan-500' : 'bg-purple-500'}`}></span>
                      {type}
                    </div>
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
          <div>
            <Select.Root type="single" value={selectedStatus} onValueChange={handleStatusChange}>
              <Select.Trigger class="w-full">
                <span>{selectedStatus || "All Statuses"}</span>
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="">All Statuses</Select.Item>
                {#each Object.values(meterStatusEnum.enum) as status}
                  <Select.Item value={status}>
                    <div class="flex items-center">
                      <span class={`w-3 h-3 rounded-full mr-2 ${
                        status === 'ACTIVE' ? 'bg-green-500' : 
                        status === 'INACTIVE' ? 'bg-gray-500' : 
                        'bg-yellow-500'
                      }`}></span>
                      {status}
                    </div>
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        </div>
      </Card.Content>
      {#if searchQuery || selectedType || selectedStatus}
        <Card.Footer>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">{filteredMeters.length} result{filteredMeters.length !== 1 ? 's' : ''}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onclick={() => {
                searchQuery = '';
                selectedType = '';
                selectedStatus = '';
              }}
            >
              Clear
            </Button>
          </div>
        </Card.Footer>
      {/if}
    </Card.Root>

    <div class="space-y-4">
      {#if loading}
        <div class="flex justify-center items-center py-8">
          <Loader2 class="h-8 w-8 animate-spin" />
        </div>
      {:else if filteredMeters.length === 0}
        <div class="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 mb-3">
            <path d="M10.3 8.2c.7-.3 1.5-.4 2.3-.4h1.2c2.2 0 4 1.8 4 4 0 .5-.1 1-.3 1.5" />
            <path d="M2.5 10a2.5 2.5 0 0 1 5 0c0 .5-.1 1-.3 1.5" />
            <path d="M7.8 15.2a5 5 0 0 0-2.3.4 2.5 2.5 0 0 0-1 3.4 2.5 2.5 0 0 0 3.4 1c.7-.3 1.5-.4 2.3-.4h1.2c.8 0 1.6.1 2.3.4a2.5 2.5 0 0 0 3.4-1 2.5 2.5 0 0 0-1-3.4 5 5 0 0 0-2.3-.4h-5.6z" />
            <path d="M21.7 16.2a2.5 2.5 0 0 0-3.2-3.4" />
          </svg>
          <p class="text-center text-gray-500">No results found</p>
        </div>
      {:else}
        <div class="flex items-center justify-between mb-2 text-sm text-gray-500">
          <div class="flex space-x-4">
            <button 
              class={`${sortBy === 'name' ? 'text-black font-medium' : ''}`}
              onclick={() => handleSort('name')}
            >
              Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
              class={`${sortBy === 'type' ? 'text-black font-medium' : ''}`}
              onclick={() => handleSort('type')}
            >
              Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
              class={`${sortBy === 'status' ? 'text-black font-medium' : ''}`}
              onclick={() => handleSort('status')}
            >
              Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
              class={`${sortBy === 'reading' ? 'text-black font-medium' : ''}`}
              onclick={() => handleSort('reading')}
            >
              Reading {sortBy === 'reading' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
        
        {#each filteredMeters as meter (meter.id)}
          <Card.Root class={selectedMeter?.id === meter.id ? 'border-2 border-blue-500' : ''}>
            <button 
              type="button"
              class="w-full text-left cursor-pointer {(isAdminLevel || isUtility) ? 'hover:bg-gray-50' : ''}"
              onclick={() => handleEdit(meter)}
              disabled={!(isAdminLevel || isUtility)}
            >
              <Card.Header class="pb-2">
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
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p class="text-sm font-medium text-gray-500">Location</p>
                    <p class="truncate">{getLocationDetails(meter)}</p>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-500">Unit Rate</p>
                    <p>{formatReading(meter.unit_rate)}</p>
                  </div>
                  <div>
                    {#if meter.latest_reading}
                      <p class="text-sm font-medium text-gray-500">Latest Reading</p>
                      <div class="flex items-baseline space-x-2">
                        <span>{formatReading(meter.latest_reading.value)}</span>
                        <span class="text-xs text-gray-500">
                          ({new Date(meter.latest_reading.date).toLocaleDateString()})
                        </span>
                      </div>
                    {/if}
                  </div>
                </div>
                {#if meter.notes}
                  <div class="mt-2 pt-2 border-t border-gray-100">
                    <p class="text-sm text-gray-500">{meter.notes}</p>
                  </div>
                {/if}
              </Card.Content>
            </button>
          </Card.Root>
        {/each}
      {/if}
    </div>
  </div>

  <!-- Meter Form (Right side) -->
  <div class="w-full lg:w-1/3">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">{editMode ? 'Edit' : 'Add'} Meter</h1>
    </div>
    
    {#if !isAdminLevel && !isUtility && !isMaintenance}
      <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p class="text-yellow-800">
          You do not have permission to manage meters. Please contact your administrator.
        </p>
      </div>
    {:else}
      <MeterForm
        data={{
          properties: propertiesData,
          floors: floorsData,
          rental_unit: rentalUnitData,
          meter: selectedMeter
        }}
        editMode={editMode}
        form={form}
        errors={errors}
        enhance={enhance}
        constraints={constraints}
        submitting={submitting}
        on:cancel={handleCancel}
      />
    {/if}
  </div>
</div>

{#if browser}
  <SuperDebug data={form} />
{/if}