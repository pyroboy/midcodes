<script lang="ts">
  import { tick } from 'svelte';
  import { superForm } from 'sveltekit-superforms/client';
  import { browser } from '$app/environment';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { page } from '$app/stores';
  import * as Select from "$lib/components/ui/select";
  import type { Selected } from "$lib/components/ui/select";
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { PageData } from './$types';
  import { format, parse, isAfter } from 'date-fns';
  import toast, { Toaster } from 'svelte-french-toast';
  import { readingFormSchema, type ReadingFormSchema } from './schema';
  import { goto } from '$app/navigation';
  import { tweened } from 'svelte/motion';

  export let data: PageData;

  interface Meter {
    id: number;
    name: string;
    type: string;
    active: boolean;
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
    };
  }

  let selectedMeterType = '';
  $: filteredMeters = selectedMeterType && data.meters
    ? data.meters.filter((meter: Meter) => meter.type === selectedMeterType)
    : [];

  let meterTypeSelected: Selected<string> = { value: '', label: 'Select a meter type' };

  const today = format(new Date(), 'yyyy-MM-dd');
  const latestOverallReadingDate = data.latestOverallReadingDate;
  const isPreviousDateInFuture = isAfter(new Date(latestOverallReadingDate), new Date());
  const schema = readingFormSchema(data.previousReadings, latestOverallReadingDate);
  const duration = 1500;

  let showProgressBar = false;
  const progress = tweened(0, { duration: duration });

  const { form, errors, enhance, message, reset } = superForm<ReadingFormSchema>(data.form, {
    validators: zodClient(schema),
    dataType: 'json',
    applyAction: true,
    taintedMessage: null,
    resetForm: true,
    onResult: async ({ result }) => {
      if (result.type === 'success') {
        toast.success('Readings submitted successfully!');
        
        // Start progress bar
        showProgressBar = true;
        progress.set(100);

        // Wait for the next tick and then add a delay
        await tick();
        await new Promise(resolve => setTimeout(resolve, duration));

        // Reset the form and navigate
        selectedMeterType = '';
        meterTypeSelected = { value: '', label: 'Select a meter type' };
        filteredMeters = [];
        $form.reading_date = isPreviousDateInFuture ? latestOverallReadingDate : today;
        showProgressBar = false;
        progress.set(0);
        goto($page.url.pathname, { replaceState: true });
      } else if (result.type === 'error') {
        console.error('Form submission failed', result.error);
        toast.error('Failed to submit readings. Please try again.');
      }
    },
  });

  function calculateDifference(currentReading: number, previousReading: number | undefined) {
    return previousReading !== undefined ? currentReading - previousReading : currentReading;
  }

  // Update form.readings when filteredMeters changes
  $: {
    if (filteredMeters.length > 0) {
      $form.readings = filteredMeters.map((meter: Meter) => ({
        meter_id: meter.id,
        reading_value: data.previousReadings[meter.id]?.reading_value ?? 0
      }));
    }
  }

  // Set default value for reading_date
  $: if (!$form.reading_date) {
    $form.reading_date = isPreviousDateInFuture ? latestOverallReadingDate : today;
  }

  function formatDate(date: string) {
    return format(parse(date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy');
  }

  function formatDate2(date: string | null | undefined): string {
    if (!date) return 'No previous reading';
    return format(parse(date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy');
  }
</script>

<Toaster />
<div class="container mx-auto p-4">
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Meter Readings</h1>
      {#if !data.canEdit}
        <p class="text-sm text-red-500">You don't have permission to add or edit readings</p>
      {/if}
    </div>

    <form method="POST" use:enhance class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2">
          <Label for="reading_date">Reading Date</Label>
          <Input
            type="date"
            name="reading_date"
            bind:value={$form.reading_date}
            min={latestOverallReadingDate}
            disabled={!data.canEdit}
          />
          {#if $errors.reading_date}
            <p class="text-sm text-red-500">{$errors.reading_date}</p>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="meter_type">Meter Type</Label>
          <Select.Root
            selected={meterTypeSelected}
            onSelectedChange={(value: Selected<string>) => {
              selectedMeterType = value.value;
              meterTypeSelected = value;
              $form.meter_type = value.value;
            }}
            disabled={!data.canEdit}
          >
            <Select.Trigger class="w-full">
              <Select.Value placeholder="Select a meter type" />
            </Select.Trigger>
            <Select.Content>
              {#each data.meterTypes ?? [] as type}
                <Select.Item value={type}>{type}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if $errors.meter_type}
            <p class="text-sm text-red-500">{$errors.meter_type}</p>
          {/if}
        </div>
      </div>

      {#if selectedMeterType && filteredMeters.length > 0}
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">Readings</h2>
          <div class="grid gap-4 md:grid-cols-2">
            {#each filteredMeters as meter, i}
              {@const previousReading = data.previousReadings[meter.id]}
              <div class="space-y-2 p-4 border rounded-lg">
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-medium">
                      {meter.name}
                      {#if meter.room?.floor?.property}
                        <span class="text-sm text-gray-500">
                          ({meter.room.floor.property.name})
                        </span>
                      {/if}
                    </h3>
                    <p class="text-sm text-gray-500">
                      {#if meter.room}
                        Room {meter.room.number}
                        {#if meter.room.floor}
                          - Floor {meter.room.floor.floor_number}
                          {#if meter.room.floor.wing}
                            Wing {meter.room.floor.wing}
                          {/if}
                        {/if}
                      {/if}
                    </p>
                  </div>
                  {#if previousReading}
                    <div class="text-right text-sm">
                      <p class="text-gray-500">Previous: {previousReading.reading_value}</p>
                      <p class="text-gray-400">{formatDate2(previousReading.reading_date)}</p>
                    </div>
                  {/if}
                </div>

                <Input
                  type="number"
                  name="readings[{i}].reading_value"
                  bind:value={$form.readings[i].reading_value}
                  min={previousReading?.reading_value ?? 0}
                  step="1"
                  disabled={!data.canEdit}
                />
                {#if $errors.readings?.[i]?.reading_value}
                  <p class="text-sm text-red-500">{$errors.readings[i].reading_value}</p>
                {/if}

                {#if $form.readings[i].reading_value > (previousReading?.reading_value ?? 0)}
                  <p class="text-sm text-gray-500">
                    Difference: {calculateDifference($form.readings[i].reading_value, previousReading?.reading_value)}
                  </p>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if showProgressBar}
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div
            class="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style="width: {$progress}%"
          />
        </div>
      {/if}

      {#if selectedMeterType && filteredMeters.length > 0}
        <div class="flex justify-end">
          <Button type="submit" disabled={!data.canEdit}>Submit Readings</Button>
        </div>
      {/if}
    </form>
  </div>
</div>