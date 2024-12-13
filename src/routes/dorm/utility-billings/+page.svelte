<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import * as Select from "$lib/components/ui/select";
  import { Calendar } from 'lucide-svelte';
  import type { PageData } from './$types';
  import type { utilityBillingTypeEnum } from '$lib/db/schema';
  import type { SuperValidated } from 'sveltekit-superforms';

  export let data: PageData;

  const { form, errors, enhance } = superForm(data.form as SuperValidated<any>, {
    dataType: 'json',
    onUpdated: ({ form }) => {
      console.log('Form updated:', form);
    },
    onSubmit: ({ formData }) => {
      console.log('Form submitted:', formData);
    },
    onResult: ({ result }) => {
      if (result.type === 'success') {
        console.log('Form submitted successfully');
        alert(`Billing created successfully!\nTotal accounts created: ${result.data?.summary?.totalAccountsCreated}\nTotal billed amount: ${result.data?.summary.totalBilledAmount.toFixed(2)}`);
      } else {
        console.error('Form submission failed:', result);
        if (result.type === 'error') {
          console.error('Error details:', result.error);
        } else if (result.type === 'failure') {
          console.error('Failure details:', result.data);
        }
      }
    },
  });

  $: selectedMeterType = $form.type as (typeof utilityBillingTypeEnum.enumValues)[number];
  $: filteredMeters = data.allMeters?.filter(meter => 
    (!selectedMeterType || meter.meterType === selectedMeterType) && 
    meter.meterActive
  ) ?? [];
  $: metersGroupedByFloor = filteredMeters.reduce<Record<number, typeof filteredMeters>>((acc, meter) => {
    if (!acc[meter.meterFloorLevel]) {
      acc[meter.meterFloorLevel] = [];
    }
    acc[meter.meterFloorLevel].push(meter);
    return acc;
  }, {});
  $: filteredReadings = data.allReadings?.filter(reading => 
    filteredMeters.some(meter => meter.id === reading.meterId)
  ) ?? [];

  function getReadingsForMeter(meterId: number) {
    return filteredReadings.filter(reading => reading.meterId === meterId);
  }

  function getTenantCountForMeter(locationId: number | null) {
    return data.tenantCounts?.find(tc => tc.locationId === locationId)?.tenantCount ?? 0;
  }

  $: totalBill = calculateTotalBill($form, filteredMeters, filteredReadings);

  function calculateTotalBill(formData: typeof $form, meters: typeof filteredMeters, readings: typeof filteredReadings) {
    let total = 0;
    meters.forEach(meter => {
      const meterReadings = readings.filter(r => r.meterId === meter.id);
      const startReading = meterReadings.find(r => formatDate(r.readingDate) === formatDate(formData.startDate))?.readingValue ?? 0;
      const endReading = meterReadings.find(r => formatDate(r.readingDate) === formatDate(formData.endDate))?.readingValue ?? 0;
      const consumption = endReading - startReading;
      total += consumption * (formData.costPerUnit ?? 0);
    });
    return total.toFixed(2);
  }

  function getUnitForMeterType(meterType: (typeof utilityBillingTypeEnum.enumValues)[number]) {
    switch (meterType) {
      case 'ELECTRICITY':
        return 'kWh';
      case 'WATER':
      case 'GAS':
        return 'm³';
      default:
        return '';
    }
  }

  $: previousDate = $form.startDate ? new Date($form.startDate).toLocaleDateString() : 'Not selected';
  $: currentDate = $form.endDate ? new Date($form.endDate).toLocaleDateString() : 'Not selected';

  $: availableEndDates = $form.startDate && data.availableReadingDates
    ? data.availableReadingDates.filter(date => new Date(date) > new Date($form.startDate as string))
    : data.availableReadingDates ?? [];

  function formatDate(date: string | Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  function updateMeterBillings() {
    const meterBillings = Object.values(metersGroupedByFloor).flat().map(meter => {
      const meterReadings = getReadingsForMeter(meter.id);
      const startReading = meterReadings.find(r => formatDate(r.readingDate) === formatDate($form.startDate))?.readingValue ?? 0;
      const endReading = meterReadings.find(r => formatDate(r.readingDate) === formatDate($form.endDate))?.readingValue ?? 0;
      const consumption = endReading - startReading;
      const totalCost = consumption * ($form.costPerUnit ?? 0);
      const tenantCount = getTenantCountForMeter(meter.locationId);
      const perTenantCost = tenantCount > 0 ? totalCost / tenantCount : 0;

      return {
        meterId: meter.id,
        meterName: meter.meterName,
        startReading,
        endReading,
        consumption,
        totalCost,
        tenantCount,
        perTenantCost
      };
    });

    $form.meterBillings = meterBillings;
  }

  $: {
    $form.type;
    $form.startDate;
    $form.endDate;
    $form.costPerUnit;
    filteredMeters;
    if ($form.startDate && $form.endDate && $form.type && $form.costPerUnit) {
      updateMeterBillings();
    }
  }
</script>

<div class="p-6 max-w-4xl mx-auto">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Utility Billing</h1>
    <h2 class="text-xl font-semibold">Bill Total: {totalBill}</h2>
  </div>
  {#if $errors._errors}
    <div class="error-message">
      {$errors._errors}
    </div>
  {/if}

  <form method="POST" use:enhance class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="mb-6">
        <Label for="type" class="block text-gray-700 text-sm font-bold mb-2">Meter Type</Label>
        <Select.Root    
          selected={{value: $form.type ?? '', label: $form.type || 'Select a meter type'}}
          onSelectedChange={(s) => {
            if (s) {
              $form.type = s.value;
            }
          }}
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
        {#if $errors.type}<span class="text-red-500 text-xs italic">{$errors.type}</span>{/if}
      </div>

      <div>
        <Label for="startDate" class="block text-gray-700 text-sm font-bold mb-2">Previous Reading Date</Label>
        <div class="relative">
          <select 
            name="startDate" 
            bind:value={$form.startDate} 
            class="w-full p-2 pr-8 border rounded appearance-none"
          >
            <option value="">Select a date</option>
            {#each data.availableReadingDates ?? [] as date}
              <option value={date}>{new Date(date).toLocaleDateString()}</option>
            {/each}
          </select>
          <Calendar class="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
        {#if $errors.startDate}<span class="text-red-500 text-xs italic">{$errors.startDate}</span>{/if}
      </div>

      <div>
        <Label for="endDate" class="block text-gray-700 text-sm font-bold mb-2">Current Reading Date</Label>
        <div class="relative">
          <select 
            name="endDate" 
            bind:value={$form.endDate} 
            class="w-full p-2 pr-8 border rounded appearance-none"
          >
            <option value="">Select a date</option>
            {#each availableEndDates as date}
              <option value={date}>{new Date(date).toLocaleDateString()}</option>
            {/each}
          </select>
          <Calendar class="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
        {#if $errors.endDate}<span class="text-red-500 text-xs italic">{$errors.endDate}</span>{/if}
      </div>

      <div>
        <Label for="costPerUnit" class="block text-gray-700 text-sm font-bold mb-2">Cost per Unit</Label>
        <div class="flex items-center">
          <Input 
            type="number" 
            step="0.01" 
            name="costPerUnit" 
            bind:value={$form.costPerUnit} 
            class="w-full" 
          />
          <span class="ml-2">{getUnitForMeterType($form.type ?? 'ELECTRICITY')}</span>
        </div>
        {#if $errors.costPerUnit}<span class="text-red-500 text-xs italic">{$errors.costPerUnit}</span>{/if}
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-100">
            <th class="p-2 text-left">Active Meters</th>
            <th class="p-2 text-right">Previous ({previousDate})</th>
            <th class="p-2 text-right">Current ({currentDate})</th>
            <th class="p-2 text-right">Consumption</th>
            <th class="p-2 text-right">Total</th>
            <th class="p-2 text-right">Tenant Count</th>
            <th class="p-2 text-right">Per Tenant</th>
          </tr>
        </thead>
        <tbody>
          {#each Object.entries(metersGroupedByFloor) as [floorLevel, meters]}
            <tr class="bg-gray-200">
              <td colspan="7" class="p-2 font-bold">Floor Level {floorLevel}</td>
            </tr>
            {#each meters as meter (meter.id)}
              {@const meterReadings = getReadingsForMeter(meter.id)}
              {@const startReading = meterReadings.find(r => formatDate(r.readingDate) === formatDate($form.startDate))?.readingValue ?? 0}
              {@const endReading = meterReadings.find(r => formatDate(r.readingDate) === formatDate($form.endDate))?.readingValue ?? 0}
              {@const consumption = endReading - startReading}
              {@const totalCost = consumption * ($form.costPerUnit ?? 0)}
              {@const tenantCount = getTenantCountForMeter(meter.locationId)}
              {@const perTenantCost = tenantCount > 0 ? totalCost / tenantCount : 0}
              <tr class="border-b">
                <td class="p-2">{meter.meterName}</td>
                <td class="p-2 text-right">{startReading}</td>
                <td class="p-2 text-right">{endReading}</td>
                <td class="p-2 text-right">{consumption.toFixed(2)}</td>
                <td class="p-2 text-right">{totalCost.toFixed(2)}</td>
                <td class="p-2 text-right">{tenantCount}</td>
                <td class="p-2 text-right">{perTenantCost.toFixed(2)}</td>
              </tr>
            {/each}
          {/each}
        </tbody>
      </table>
    </div>

    <div class="flex justify-end">
      <Button type="submit" class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded">
        Create Utility Billing
      </Button>
    </div>
  </form>
</div>

<SuperDebug data={$form} />

<style>
  .error-message {
    color: red;
    margin-top: 10px;
  }
</style>