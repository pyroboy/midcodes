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

  // Group interface for proper typing
  interface MeterGroup {
    id: number | null;
    name: string;
    meters: ExtendedMeterFormData[];
  }

  // Component state with Svelte 5 reactive primitives
  let { data } = $props<{ data: PageData }>();
  
  // Debug logging
  // console.log("Initial data received:", data);
  
  let selectedMeter = $state<ExtendedMeterFormData | undefined>(undefined);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let selectedType = $state('');
  let selectedStatus = $state('');
  let searchQuery = $state('');
  let sortBy = $state<'name' | 'type' | 'status' | 'reading'>('name');
  let sortOrder = $state<'asc' | 'desc'>('asc');
  let editMode = $state(false);
  
  // Store data in state variables with null checks
  let metersData = $state<ExtendedMeterFormData[]>(data.meters || []);
  let propertiesData = $state<Property[]>(data.properties || []);
  let floorsData = $state<Floor[]>(data.floors || []);
  let rentalUnitData = $state<Rental_unit[]>(data.rental_unit || []);
  
  // Process meters to extract latest readings
  const processMeters = () => {
    if (!metersData || !Array.isArray(metersData)) {
      return [];
    }
    
    return metersData.map((meter) => {
      // Ensure readings is at least an empty array
      const readings = meter.readings || [];
      
      if (readings.length > 0) {
        // Sort readings by date, newest first
        const sortedReadings = [...readings].sort((a, b) => {
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
  };
  
  let processedMeters = $derived(processMeters());

  // Filtered and sorted meters
  const filterMeters = () => {
    if (!processedMeters || !Array.isArray(processedMeters)) {
      return [];
    }
    
    try {
      const filtered = processedMeters.filter((meter: ExtendedMeterFormData) => {
        if (!meter) {
          return false;
        }
        
        try {
          // Get location details with error handling
          let locationDetails = "";
          try {
            locationDetails = getLocationDetails(meter).toLowerCase();
          } catch (locErr) {
            locationDetails = "location error";
          }
          
          const matchesType = !selectedType || meter.type === selectedType;
          const matchesStatus = !selectedStatus || meter.status === selectedStatus;
          const matchesSearch = !searchQuery || 
            meter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            locationDetails.includes(searchQuery.toLowerCase());
            
          return matchesType && matchesStatus && matchesSearch;
        } catch (err) {
          return false;
        }
      });
      
      const result = filtered.sort((a: ExtendedMeterFormData, b: ExtendedMeterFormData) => {
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
      
      return result;
    } catch (err) {
      error = "Error filtering meter data";
      return [];
    }
  };
  
  let filteredMeters = $derived(filterMeters());
  
  // Group filtered meters by property
  const groupMeters = (): MeterGroup[] => {
    const grouped: Record<string, MeterGroup> = {};
    
    filteredMeters.forEach(meter => {
      let propertyId: number | null = null;
      let propertyName = 'Unknown Property';
      
      if (meter.location_type === 'PROPERTY' && meter.property_id) {
        propertyId = meter.property_id;
        const property = propertiesData?.find(p => p.id === propertyId);
        propertyName = property?.name || 'Unknown Property';
      } else if (meter.location_type === 'FLOOR' && meter.floor_id) {
        const floor = floorsData?.find(f => f.id === meter.floor_id);
        if (floor?.property) {
          propertyId = floor.property.id;
          propertyName = floor.property.name;
        }
      } else if (meter.location_type === 'RENTAL_UNIT' && meter.rental_unit_id) {
        const unit = rentalUnitData?.find(r => r.id === meter.rental_unit_id);
        if (unit?.floor?.property) {
          propertyId = unit.floor.property.id;
          propertyName = unit.floor.property.name;
        }
      }
      
      const propId = propertyId ? propertyId.toString() : 'unknown';
      
      if (!grouped[propId]) {
        grouped[propId] = {
          id: propertyId,
          name: propertyName,
          meters: []
        };
      }
      
      grouped[propId].meters.push(meter);
    });
    
    return Object.values(grouped);
  };
  
  let groupedMeters = $derived(groupMeters());

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
    console.log("Editing meter:", meter);
    editMode = true;
    selectedMeter = meter;
    
    // Make sure to copy all properties to the form
    $form = { 
      ...meter,
      // Ensure ID is properly set
      id: meter.id 
    };
    
    console.log("Edit mode set to:", editMode);
    console.log("Form after setting:", $form);
}

  function clearFilters() {
    searchQuery = '';
    selectedType = '';
    selectedStatus = '';
  }

  // Utility functions
  function getLocationDetails(meter: ExtendedMeterFormData): string {
    if (!meter || !meter.location_type) return 'Unknown Location';
    
    try {
      switch (meter.location_type) {
        case 'PROPERTY':
          const property = propertiesData?.find((p: Property) => p.id === meter.property_id);
          return property ? `Property: ${property.name}` : 'Unknown Property';
        case 'FLOOR':
          const floor = floorsData?.find((f: Floor) => f.id === meter.floor_id);
          return floor 
            ? `Floor ${floor.floor_number}${floor.property ? ` - ${floor.property.name}` : ''}`
            : 'Unknown Floor';
        case 'RENTAL_UNIT':
          const unit = rentalUnitData?.find((r: Rental_unit) => r.id === meter.rental_unit_id);
          return unit 
            ? `Rental_unit ${unit.number}${unit.floor?.property ? ` - ${unit.floor.property.name}` : ''}`
            : 'Unknown Rental_unit';
        default:
          return 'Unknown Location';
      }
    } catch (err) {
      return 'Location Error';
    }
  }

  function getDetailedLocationInfo(meter: ExtendedMeterFormData): string {
    if (!meter || !meter.location_type) return '';
    
    try {
      switch (meter.location_type) {
        case 'PROPERTY':
          return '';
        case 'FLOOR':
          const floor = floorsData?.find((f: Floor) => f.id === meter.floor_id);
          return floor ? `Floor ${floor.floor_number}${floor.wing ? `, Wing ${floor.wing}` : ''}` : '';
        case 'RENTAL_UNIT':
          const unit = rentalUnitData?.find((r: Rental_unit) => r.id === meter.rental_unit_id);
          return unit ? `Rental_unit ${unit.number}` : '';
        default:
          return '';
      }
    } catch (err) {
      return '';
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

    <Card.Root class="mb-4">
      <Card.Content class="p-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <Select.Trigger>
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
              <Select.Trigger>
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
        <Card.Footer class="py-2 px-4">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500">{filteredMeters.length} result{filteredMeters.length !== 1 ? 's' : ''}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onclick={clearFilters}
            >
              Clear
            </Button>
          </div>
        </Card.Footer>
      {/if}
    </Card.Root>

    <div class="flex items-center justify-between text-sm text-gray-500 mb-3 px-2">
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

    {#if loading}
      <div class="flex justify-center items-center py-6">
        <Loader2 class="h-8 w-8 animate-spin" />
      </div>
    {:else if groupedMeters.length === 0}
      <div class="flex flex-col items-center justify-center py-8 px-4 bg-gray-50 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 mb-3">
          <path d="M10.3 8.2c.7-.3 1.5-.4 2.3-.4h1.2c2.2 0 4 1.8 4 4 0 .5-.1 1-.3 1.5" />
          <path d="M2.5 10a2.5 2.5 0 0 1 5 0c0 .5-.1 1-.3 1.5" />
          <path d="M7.8 15.2a5 5 0 0 0-2.3.4 2.5 2.5 0 0 0 3.4 1c.7-.3 1.5-.4 2.3-.4h1.2c.8 0 1.6.1 2.3.4a2.5 2.5 0 0 0 3.4-1 2.5 2.5 0 0 0-1-3.4 5 5 0 0 0-2.3-.4h-5.6z" />
          <path d="M21.7 16.2a2.5 2.5 0 0 0-3.2-3.4" />
        </svg>
        <p class="text-center text-gray-500">No meters found</p>
      </div>
    {:else}
      <div class="space-y-6">
        {#each groupedMeters as group}
          <div>
            <h2 class="text-lg font-semibold mb-2 px-1">{group.name}</h2>
            <div class="space-y-2">
              {#each group.meters as meter}
                <Card.Root class={`${selectedMeter?.id === meter.id ? 'border-2 border-blue-500' : ''} hover:bg-gray-50 transition-colors`}>
                  <button 
                    type="button"
                    class="w-full text-left cursor-pointer"
                    onclick={() => handleEdit(meter)}
                  >
                    <Card.Content class="p-3">
                      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                        <div class="flex flex-col">
                          <div class="flex items-center gap-2 mb-1">
                            <span class="font-medium">{meter.name}</span>
                            <Badge variant={getTypeVariant(meter.type)} class="text-xs px-2 py-0.5">
                              {meter.type}
                            </Badge>
                            <Badge class={`text-xs px-2 py-0.5 ${getStatusColor(meter.status)}`}>
                              {meter.status}
                            </Badge>
                          </div>
                          {#if getDetailedLocationInfo(meter)}
                            <span class="text-sm text-gray-500">{getDetailedLocationInfo(meter)}</span>
                          {/if}
                        </div>
                        
                        <div class="text-right">
                          {#if meter.latest_reading}
                            <div class="flex flex-col items-end">
                              <span class="font-medium">{formatReading(meter.latest_reading.value)}</span>
                              <span class="text-xs text-gray-500">
                                {new Date(meter.latest_reading.date).toLocaleDateString()}
                              </span>
                            </div>
                          {:else}
                            <span class="text-sm text-gray-400">No readings yet</span>
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
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Meter Form (Right side) -->
  <div class="w-full lg:w-1/3 lg:sticky lg:top-0 lg:h-screen lg:overflow-auto">
    <div class="bg-white p-4 rounded-lg border">
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-lg font-semibold">{editMode ? 'Edit' : 'Add'} Meter</h2>
        <!-- Debug info for troubleshooting -->
        <span class="text-xs text-gray-500">
          Edit Mode: {editMode ? "YES" : "NO"} | 
          Selected Meter ID: {selectedMeter?.id || "none"}
        </span>
      </div>
  
      <MeterForm
        {editMode}
        data={{
          properties: propertiesData,
          floors: floorsData,
          rental_unit: rentalUnitData,
          meter: selectedMeter
        }}
        form={form}
        errors={errors}
        enhance={enhance}
        constraints={constraints}
        submitting={submitting}
        on:cancel={handleCancel}
      />
    </div>
  </div>
</div>

{#if browser}
  <SuperDebug data={form} />
{/if}