<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Label } from '$lib/components/ui/label';
    import { Input } from '$lib/components/ui/input';
    import { Button } from '$lib/components/ui/button';
    import {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
    } from "$lib/components/ui/select";
    import * as Card from '$lib/components/ui/card';
    import { RefreshCw } from 'lucide-svelte';
    import type { Property, FilterChangeEvent } from './types';
    
    // We're keeping this prop for compatibility but it's not used anymore
    // export let showFilters: boolean = true;
    export let properties: Property[] = [];
    export let availableReadingDates: string[] = [];
    export let utilityTypes: Record<string, string> = {};
    export let selectedPropertyId: number | null = null;
    export let selectedType: string | null = null;
    export let dateFilter: string = '';
    export let searchQuery: string = '';
    
    const dispatch = createEventDispatcher<{
      filterChange: FilterChangeEvent;
      addReadings: void;
    }>();
    
    // Property name lookup helper
    function getPropertyName(propertyId: number | null): string {
      if (!propertyId) return 'N/A';
      const property = properties.find(p => p.id === propertyId);
      return property ? property.name : 'Unknown';
    }
    
    // Format date for display
    function formatDate(dateString: string): string {
      return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    function handlePropertyChange(value: string): void {
      const propertyId = parseInt(value, 10);
      if (!isNaN(propertyId) || value === '') {
        selectedPropertyId = value === '' ? null : propertyId;
        dispatch('filterChange', { 
          property: selectedPropertyId, 
          type: selectedType, 
          date: dateFilter, 
          search: searchQuery 
        });
      }
    }
    
    function handleTypeChange(value: string): void {
      selectedType = value === '' ? null : value;
      dispatch('filterChange', { 
        property: selectedPropertyId, 
        type: selectedType, 
        date: dateFilter, 
        search: searchQuery 
      });
    }
    
    function handleDateFilterChange(value: string): void {
      dateFilter = value;
      dispatch('filterChange', { 
        property: selectedPropertyId, 
        type: selectedType, 
        date: dateFilter, 
        search: searchQuery 
      });
    }
    
    function handleSearchChange(): void {
      dispatch('filterChange', { 
        property: selectedPropertyId, 
        type: selectedType, 
        date: dateFilter, 
        search: searchQuery 
      });
    }
    
    function resetFilters(): void {
      selectedPropertyId = null;
      selectedType = null;
      dateFilter = '';
      searchQuery = '';
      dispatch('filterChange', { 
        property: null, 
        type: null, 
        date: '', 
        search: '' 
      });
    }
  </script>
  
  <Card.Root class="mb-6">
    <Card.Header class="pb-2">
      <div class="flex items-center justify-between">
        <div>
          <Card.Title class="text-lg">Filter Readings</Card.Title>
          <Card.Description>
            Select criteria to filter the readings table
          </Card.Description>
        </div>
        <div class="flex items-center gap-2">
          <Button 
            variant="outline" 
            onclick={() => resetFilters()}
            class="flex items-center gap-2"
            size="sm"
          >
            <RefreshCw class="h-4 w-4" />
            Reset Filters
          </Button>
        
        </div>
      </div>
    </Card.Header>
    <Card.Content>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Property filter -->
        <div class="space-y-2">
          <Label for="property-filter" class="text-sm font-medium">Property</Label>
          <Select 
            type="single" 
            onValueChange={handlePropertyChange} 
            value={selectedPropertyId?.toString() || ""}
          >
            <SelectTrigger class="w-full">
              <span>
                {selectedPropertyId 
                  ? getPropertyName(selectedPropertyId)
                  : "All Properties"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Properties</SelectItem>
              {#each properties as property}
                <SelectItem value={property.id.toString()}>{property.name}</SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>
        
        <!-- Utility Type filter -->
        <div class="space-y-2">
          <Label for="type-filter" class="text-sm font-medium">Utility Type</Label>
          <Select 
            type="single" 
            onValueChange={handleTypeChange} 
            value={selectedType || ""}
          >
            <SelectTrigger class="w-full">
              <span>{selectedType || "All Types"}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {#each Object.entries(utilityTypes) as [key, value]}
                <SelectItem value={value}>{value}</SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>
        
        <!-- Reading Date filter -->
        <div class="space-y-2">
          <Label for="date-filter" class="text-sm font-medium">Reading Date</Label>
          <Select 
            type="single" 
            onValueChange={handleDateFilterChange} 
            value={dateFilter || ""}
          >
            <SelectTrigger class="w-full">
              <span>{dateFilter ? formatDate(dateFilter) : "All Dates"}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Dates</SelectItem>
              {#each availableReadingDates as date}
                <SelectItem value={date}>{formatDate(date)}</SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>
        
        <!-- Search filter -->
        <div class="space-y-2">
          <Label for="search" class="text-sm font-medium">Search Meters</Label>
          <Input
            type="text"
            id="search"
            placeholder="Search by meter name..."
            bind:value={searchQuery}
            oninput={() => handleSearchChange()}
          />
        </div>
      </div>
    </Card.Content>
  </Card.Root>