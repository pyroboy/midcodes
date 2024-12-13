<script lang="ts">
  import { tick } from 'svelte';
  import { superForm } from 'sveltekit-superforms/client';
  import { browser } from '$app/environment';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { page } from '$app/stores';
  import * as Select from "$lib/components/ui/select";
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { PageData } from './$types';
  import { format, parse, isAfter } from 'date-fns';
  import toast, { Toaster } from 'svelte-french-toast';
  import { createSchema, type Schema } from './formSchema';
  import { goto } from '$app/navigation';
  import { tweened } from 'svelte/motion';

  export let data: PageData;
  let selectedMeterType = '';
  $: filteredMeters = selectedMeterType
    ? data.meters.filter(meter => meter.meterType === selectedMeterType)
    : [];

  let meterTypeSelected = { value: '', label: 'Select a meter type' };

  const today = format(new Date(), 'yyyy-MM-dd');
  const latestOverallReadingDate = data.latestOverallReadingDate;
  const isPreviousDateInFuture = isAfter(new Date(latestOverallReadingDate), new Date());
  const schema = createSchema(data.latestOverallReadingDate);
const duration = 1500;


  let showProgressBar = false;
  const progress = tweened(0, { duration: duration });

  const { form, errors, enhance, message, reset } = superForm(data.form, {
    validators: zodClient(schema),
    dataType: 'json',
    applyAction: true,
    taintedMessage: null,
    resetForm: true,
    onResult: async ({ result }) => {
      if (result.type === 'success') {
        console.log('Form submitted successfully');
        toast.success('Readings submitted successfully!');
        
        // Start progress bar
        showProgressBar = true;
        progress.set(100);

        // Wait for the next tick and then add a delay
        await tick();
        await new Promise(resolve => setTimeout(resolve, duration)); // 2000ms delay

        // Reset the form and navigate
        selectedMeterType = '';
        meterTypeSelected = { value: '', label: 'Select a meter type' };
        filteredMeters = [];
        $form.readingDate = isPreviousDateInFuture ? latestOverallReadingDate : today;
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
      $form.readings = filteredMeters.map(meter => ({
        meterId: meter.id,
        readingValue: data.previousReadings[meter.id]?.readingValue ?? 0
      }));
    }
  }

  // Set default value for readingDate
  $: if (!$form.readingDate) {
    $form.readingDate = isPreviousDateInFuture ? latestOverallReadingDate : today;
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
  <h1 class="text-3xl font-bold mb-6 text-center">Meter Readings</h1>

  {#if showProgressBar}
    <div class="w-full max-w-2xl mx-auto h-1 bg-gray-200 mb-4">
      <div class="h-1 bg-red-500" style="width: {$progress}%;"></div>
    </div>
  {/if}

  <form method="POST" use:enhance action="?/create" class="max-w-2xl mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
    <div class="mb-4">
      <Label for="readingDate" class="block text-gray-700 text-sm font-bold mb-2">Reading Date</Label>
      <Input type="date" id="readingDate" name="readingDate" bind:value={$form.readingDate} min={today} />
      {#if $errors.readingDate}<span class="text-red-500 text-xs italic">{$errors.readingDate}</span>{/if}
    </div>

    <div class="mb-6">
      <Label for="meterType" class="block text-gray-700 text-sm font-bold mb-2">Meter Type</Label>
      <Select.Root    
        selected={{value: $form.meterType, label: $form.meterType || 'Select a meter type'}}
        onSelectedChange={(s) => {
          if (s) {
            $form.meterType = s.value;
            meterTypeSelected = { value: s.value, label: s.value };
            selectedMeterType = s.value;
          }
        }}
      >
        <Select.Trigger class="w-full">
          <Select.Value placeholder="Select a meter type" />
        </Select.Trigger>
        <Select.Content>
          {#each data.meterTypes as type}
            <Select.Item value={type}>{type}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      {#if $errors.meterType}<span class="text-red-500 text-xs italic">{$errors.meterType}</span>{/if}
    </div>

    <div class="mb-6">
      <div class="mb-6">
        <h2 class="text-xl font-semibold mb-4">Readings</h2>
        {#if $errors.readings}
          <div class="mb-3 pl-2 text-red-500 text-xs italic">
            {#if Array.isArray($errors.readings)}
              <ul>
                {#each $errors.readings as error, index}
                  <li>{`Meter ${index + 1}: ${error}`}</li>
                {/each}
              </ul>
            {:else}
              {$errors.readings? JSON.stringify($errors.readings): ''}
            {/if}
          </div>
        {/if}

        <div class="grid grid-cols-4 gap-4 mb-2 font-bold">
          <div>Meter</div>
          <div>
            Previous
            <div class="text-xs text-gray-500">{formatDate2(data.overallPreviousReadingDate)}</div>
          </div>
          <div>
            Current
            <div class="text-xs font-normal">{formatDate($form.readingDate)}</div>
          </div>
          <div>Difference</div>
        </div>
        {#if filteredMeters.length > 0}
          {#each filteredMeters as meter, index (meter.id)}
            <div class="grid grid-cols-4 gap-4 mb-2 items-center">
              <div>{meter.meterName} (Floor {meter.meterFloorLevel})</div>
              
              <div>
                {#if data.previousReadings[meter.id]}
                  <Input type="number" value={data.previousReadings[meter.id]?.readingValue} disabled />
                {:else}
                  <Input type="number" value={0} disabled />
                  <div class="text-xs text-gray-500">No previous date</div>
                {/if}
              </div>
              <div>
                <Input 
                  type="number" 
                  name="readings[{index}].readingValue"
                  bind:value={$form.readings[index].readingValue} 
                  min="0"
                  step="0.01"
                />
                <input type="hidden" name="readings[{index}].meterId" value={meter.id} />
                {#if $errors.readings?.[index]?.readingValue}
                  <span class="text-red-500 text-xs italic">{$errors.readings[index].readingValue}</span>
                {/if}
              </div>
              <Input 
                type="number" 
                value={calculateDifference($form.readings[index].readingValue, data.previousReadings[meter.id]?.readingValue)} 
                disabled 
              />
            </div>
          {/each}
        {:else}
          <div class="text-center text-gray-500 italic">No meters available for the selected type</div>
        {/if}
      </div>
    </div>

    <div class="flex items-center justify-end">
      <Button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
        Submit Readings
      </Button>
    </div>
  </form>

  {#if browser}
    <SuperDebug data={$form} />
  {/if}
</div>