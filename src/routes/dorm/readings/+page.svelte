<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { page } from '$app/stores';
  import type { Reading, meter_location_type, utility_type, meter_status, Meter } from './schema';
  import { readingFormSchema } from './schema';
  import type { z } from 'zod';
  import { onMount, onDestroy } from 'svelte';
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "$lib/components/ui/select";
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Progress } from '$lib/components/ui/progress';
  import { format } from 'date-fns';
  import toast, { Toaster } from 'svelte-french-toast';

  interface Property {
    id: number;
    name: string;
  }

  interface Floor {
    id: number;
    floor_number: number;
    wing: string | null;
    property: Property;
  }

  interface Room {
    id: number;
    number: string;
    floor: Floor;
  }

  interface MeterBase {
    id: number;
    name: string;
    type: utility_type;
    location_type: meter_location_type;
    is_active: boolean;
    status: string;
    initial_reading: number;
    unit_rate: number;
    floor_id?: number;
    room: {
      id: number;
      number: string;
      floor: {
        id: number;
        floor_number: number;
        wing: string | null;
        property: {
          id: number;
          name: string;
        };
      };
    } | null;
  }

  interface ExtendedMeter extends MeterBase {
    room: Room | null;
  }

  type MeterWithRoom = {
    id: number;
    name: string;
    type: utility_type;
    location_type: meter_location_type;
    is_active: boolean;
    status: string;
    initial_reading: number;
    unit_rate: number;
    room: Room | null;
    floor_id?: number;
  }

  export let data: {
    meters: Meter[];
    canEdit: boolean;
    form: SuperValidated<z.output<ReturnType<typeof readingFormSchema>>>;
    latestOverallReadingDate: string;
    previousReadings: Record<number, Reading>;
  };

  let selectedMeterType: utility_type | undefined;
  let selectedLocationType: meter_location_type | undefined;
  let showProgressBar = false;
  let progress = 0;
  let progressInterval: ReturnType<typeof setInterval> | undefined;
  let progressTimeout: ReturnType<typeof setTimeout> | undefined;

  // Cleanup function for timers
  onDestroy(() => {
    if (progressInterval) clearInterval(progressInterval);
    if (progressTimeout) clearTimeout(progressTimeout);
  });

  const {
    form,
    errors,
    enhance,
    delayed,
    submitting,
    message,
    reset
  } = superForm(data.form, {
    onUpdated: ({ form }) => {
      if (form.valid) {
        toast.success('Readings saved successfully');
      }
    },
    onError: ({ result }) => {
      toast.error(result.error.message);
    }
  });

  function isValidProperty(property: unknown): property is Property {
    if (!property || typeof property !== 'object') return false;
    const p = property as Record<string, unknown>;
    return Boolean(
      typeof p.id === 'number' &&
      typeof p.name === 'string'
    );
  }

  function isValidFloor(floor: unknown): floor is Floor {
    if (!floor || typeof floor !== 'object') return false;
    const f = floor as Record<string, unknown>;
    return Boolean(
      typeof f.id === 'number' &&
      typeof f.floor_number === 'number' &&
      (f.wing === null || typeof f.wing === 'string') &&
      f.property && isValidProperty(f.property)
    );
  }

  function isValidRoom(room: unknown): room is Room {
    if (!room || typeof room !== 'object') return false;
    const r = room as Record<string, unknown>;
    return Boolean(
      typeof r.id === 'number' &&
      typeof r.number === 'string' &&
      r.floor && isValidFloor(r.floor)
    );
  }

  function isMeterWithRoom(meter: unknown): meter is MeterWithRoom {
    if (!meter || typeof meter !== 'object') return false;
    const m = meter as Record<string, unknown>;
    
    const hasRequiredProperties = 
      typeof m.id === 'number' &&
      typeof m.name === 'string' &&
      typeof m.type === 'string' &&
      typeof m.location_type === 'string' &&
      typeof m.is_active === 'boolean' &&
      typeof m.status === 'string' &&
      typeof m.initial_reading === 'number' &&
      typeof m.unit_rate === 'number';

    if (!hasRequiredProperties) return false;

    if ('room' in m && m.room !== null) {
      if (!isValidRoom(m.room)) return false;
    }

    return true;
  }

  function assertMeter(meter: unknown): asserts meter is ExtendedMeter {
    if (!isMeterWithRoom(meter)) {
      throw new Error('Invalid meter data');
    }
  }

  $: filteredMeters = (data.meters ?? []).filter(meter => {
    return (
      meter.is_active &&
      meter.status === 'ACTIVE' &&
      (!selectedMeterType || meter.type === selectedMeterType) &&
      (!selectedLocationType || meter.location_type === selectedLocationType)
    );
  });

  $: isValidMeterType = Boolean(selectedMeterType);
  $: isValidLocationType = Boolean(selectedLocationType);

  // Progress bar reactivity with cleanup
  $: if ($delayed) {
    showProgressBar = true;
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      progress = Math.min(progress + 1, 95);
    }, 100);
  } else if (showProgressBar) {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = undefined;
    }
    progress = 100;
    if (progressTimeout) {
      clearTimeout(progressTimeout);
    }
    progressTimeout = setTimeout(() => {
      showProgressBar = false;
      progress = 0;
      progressTimeout = undefined;
    }, 500);
  }

  function updateMeterType(value: { value: string } | undefined) {
    if (value?.value === 'ELECTRICITY' || value?.value === 'WATER' || value?.value === 'INTERNET') {
      selectedMeterType = value.value as utility_type;
      $form.meter_type = value.value as utility_type;
    }
  }

  function updateLocationType(value: { value: string } | undefined) {
    if (value?.value === 'PROPERTY' || value?.value === 'FLOOR' || value?.value === 'ROOM') {
      selectedLocationType = value.value as meter_location_type;
      $form.location_type = value.value as meter_location_type;
    }
  }

  let formReadings: Record<number, { reading_value: number }> = {};
  $: {
    filteredMeters.forEach(meter => {
      if (!formReadings[meter.id]) {
        formReadings[meter.id] = { reading_value: 0 };
      }
    });
  }

  type FormErrorsType = {
    readings: Record<number, {
      reading: {
        _errors: string[];
      };
    }>;
  };

  $: formErrors = $form as unknown as FormErrorsType;
</script>

<div class="container mx-auto p-4">
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Meter Readings</h1>
      {#if !data.canEdit}
        <div class="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm text-yellow-800">
          You do not have permission to add readings
        </div>
      {/if}
    </div>

    {#if showProgressBar}
      <div class="w-full">
        <Progress value={progress} />
      </div>
    {/if}

    <form
      method="POST"
      action="?/create"
      use:enhance
      class="space-y-4 bg-card p-4 rounded-lg border"
    >
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="space-y-2">
          <Label for="reading_date">Reading Date</Label>
          <Input
            type="date"
            name="reading_date"
            bind:value={$form.reading_date}
            max={format(new Date(), 'yyyy-MM-dd')}
            min={data.latestOverallReadingDate}
            disabled={!data.canEdit}
          />
          {#if $errors.reading_date}
            <p class="text-sm text-red-500">{$errors.reading_date}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="meter_type">Meter Type</Label>
          <Select onSelectedChange={updateMeterType} disabled={!data.canEdit}>
            <SelectTrigger>
              <SelectValue placeholder="Select meter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ELECTRICITY">Electricity</SelectItem>
              <SelectItem value="WATER">Water</SelectItem>
              <SelectItem value="INTERNET">Internet</SelectItem>
            </SelectContent>
          </Select>
          {#if $errors.meter_type}
            <p class="text-sm text-red-500">{$errors.meter_type}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="location_type">Location Type</Label>
          <Select onSelectedChange={updateLocationType} disabled={!data.canEdit}>
            <SelectTrigger>
              <SelectValue placeholder="Select location type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PROPERTY">Property</SelectItem>
              <SelectItem value="FLOOR">Floor</SelectItem>
              <SelectItem value="ROOM">Room</SelectItem>
            </SelectContent>
          </Select>
          {#if $errors.location_type}
            <p class="text-sm text-red-500">{$errors.location_type}</p>
          {/if}
        </div>
      </div>

      {#if filteredMeters.length > 0}
        <div class="space-y-4">
          <h2 class="text-lg font-semibold">Enter Readings</h2>
          <div class="grid gap-4">
            {#each filteredMeters as meter (meter.id)}
              <div class="p-4 border rounded-lg space-y-2">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-medium">{meter.name}</h3>
                    <p class="text-sm text-muted-foreground">
                      {#if meter.room}
                        Room {meter.room.number},
                        Floor {meter.room.floor.floor_number}
                        {#if meter.room.floor.wing}
                          Wing {meter.room.floor.wing},
                        {/if}
                        {meter.room.floor.property.name}
                      {:else if meter.floor_id}
                        Floor {meter.floor_id}
                      {:else}
                        Property Level
                      {/if}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm">
                      Initial Reading: {meter.initial_reading.toFixed(2)}
                    </p>
                    <p class="text-sm">
                      Rate: ₱{meter.unit_rate.toFixed(2)}/unit
                    </p>
                    <p class="text-sm text-muted-foreground">
                      Status: {meter.status}
                    </p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {#if data.previousReadings?.[meter.id]}
                    <div class="text-sm">
                      Previous Reading: {data.previousReadings[meter.id].reading.toFixed(2)}
                      <br />
                      Date: {format(new Date(data.previousReadings[meter.id].reading_date), 'MMM d, yyyy')}
                    </div>
                  {/if}

                  <div class="space-y-2">
                    <Label for="reading_{meter.id}">New Reading</Label>
                    <Input
                      type="number"
                      id="reading_{meter.id}"
                      name={`readings[${meter.id}].reading_value`}
                      bind:value={formReadings[meter.id].reading_value}
                      step="0.01"
                      min={data.previousReadings?.[meter.id]?.reading ?? meter.initial_reading}
                      disabled={!data.canEdit}
                    />
                    {#if formErrors?.readings?.[meter.id]?.reading?._errors}
                      <p class="text-sm text-red-500">
                        {formErrors.readings[meter.id].reading._errors.join(', ')}
                      </p>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <div class="flex justify-end">
          <Button type="submit" disabled={!data.canEdit || $delayed}>
            {#if $delayed}
              Saving...
            {:else}
              Save Readings
            {/if}
          </Button>
        </div>
      {:else if selectedMeterType || selectedLocationType}
        <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p class="text-yellow-800">No meters found matching the selected criteria.</p>
        </div>
      {/if}
    </form>
  </div>
</div>

<Toaster />