<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import type { MeterReadingEntry, ReadingSaveEvent, Property, ReadingGroup } from './types';
	import { superForm } from 'sveltekit-superforms/client';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { batchReadingsSchema } from './meterReadingSchema';
	import { formatCurrency } from '$lib/utils/format';
	import { toast } from 'svelte-sonner';

	interface Props {
    open: boolean;
    property: Property;
    utilityType: string;
    meters: any[]; // Pass full meter objects
    meterReadings: MeterReadingEntry[];
    readingDate: string;
    costPerUnit: number;
    onSave: (event: ReadingSaveEvent) => void;
    close: () => void;
    previousReadingGroups: ReadingGroup[];
    form: any; // SuperForm form data
  };

	  let { open = $bindable(), property, utilityType, meters, meterReadings: initialMeterReadings, readingDate, costPerUnit, onSave, close, previousReadingGroups = [], form: formData }: Props = $props();

  let meterReadings = $state([...initialMeterReadings]);

  $effect(() => {
    meterReadings = [...initialMeterReadings];
  });

  let selectedPreviousDate = $state<string | null>(null);
  let isSubmitting = $state(false);

  // Derive readings JSON from current state with validation
  let readingsJson = $derived.by(() => {
    const readingsToSubmit = meterReadings
      .filter((r) => {
        const hasReading = r.currentReading !== null && r.currentReading !== undefined && !isNaN(Number(r.currentReading));
        console.log(`Meter ${r.meterId} (${r.meterName}):`, {
          currentReading: r.currentReading,
          hasReading,
          type: typeof r.currentReading
        });
        return hasReading;
      })
      .map((r) => {
        const readingData = {
          meter_id: Number(r.meterId),
          reading: Number(r.currentReading),
          reading_date: readingDate,
          previous_reading: r.previousReading !== null ? Number(r.previousReading) : null
        };
        console.log(`Mapped reading for meter ${r.meterId}:`, readingData);
        return readingData;
      });
    
    const jsonString = JSON.stringify(readingsToSubmit);
    console.log('Generated readings JSON:', jsonString);
    console.log('Total readings to submit:', readingsToSubmit.length);
    return jsonString;
  });

  // Initialize superForm with comprehensive error handling
  const { form, errors, enhance, submitting, message } = superForm(formData, {
    validators: zodClient(batchReadingsSchema),
    resetForm: false,
    taintedMessage: null,
    id: `meter-reading-${property.id}-${utilityType}`,
    onUpdated: ({ form: f }) => {
      if (f.valid) {
        if (f.message) {
          toast.success(f.message);
        } else {
          toast.success('Meter readings saved successfully');
        }
        isSubmitting = false;
        close();
      } else if (f.errors) {
        // Handle validation errors
        const errorMessages = Object.values(f.errors).flat().join(', ');
        toast.error(`Validation failed: ${errorMessages}`);
        isSubmitting = false;
      }
    },
    onError: ({ result }) => {
      console.error('Form submission error:', result);
      const errorMessage = result.error?.message || result.error || 'Failed to save readings';
      toast.error(errorMessage);
      isSubmitting = false;
    },
    onSubmit: () => {
      isSubmitting = true;
    }
  });

	let sortedReadings = $derived.by(() => {
		return meterReadings.slice().sort((a, b) => a.meterName.localeCompare(b.meterName));
	});
	// Remove local formatCurrency function - using imported one

	// Format date for display
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-PH', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Update reading values with client-side validation
	function handleReadingChange(meterId: number, value: string): void {
		const readingToUpdate = meterReadings.find((r) => r.meterId === meterId);
		if (!readingToUpdate) return;

		const readingValue = value === '' ? null : parseFloat(value);
		
		// Clear any previous validation errors
		readingToUpdate.validationError = null;

		if (readingValue !== null && !isNaN(readingValue)) {
			// Client-side validation
			if (readingValue < 0) {
				readingToUpdate.validationError = 'Reading must be positive';
				readingToUpdate.currentReading = readingValue;
				readingToUpdate.consumption = null;
				readingToUpdate.cost = null;
				return;
			}

			if (readingValue > 999999999) {
				readingToUpdate.validationError = 'Reading value is too high';
				readingToUpdate.currentReading = readingValue;
				readingToUpdate.consumption = null;
				readingToUpdate.cost = null;
				return;
			}

			// Use previous reading if available, otherwise fall back to initial reading, then to 0
			const baselineReading = readingToUpdate.previousReading ?? readingToUpdate.initialReading ?? 0;
			
			// Validate against previous reading
			if (readingValue < baselineReading) {
				readingToUpdate.validationError = `Reading must be ≥ ${baselineReading} (previous reading)`;
				readingToUpdate.currentReading = readingValue;
				readingToUpdate.consumption = null;
				readingToUpdate.cost = null;
				return;
			}

			const consumption = readingValue - baselineReading;
			
			// Flag unusually high consumption
			if (consumption > 50000) {
				readingToUpdate.validationError = `Very high consumption (${consumption} units). Please verify.`;
			}

			readingToUpdate.currentReading = readingValue;
			readingToUpdate.consumption = consumption;
			readingToUpdate.cost = consumption > 0 ? consumption * costPerUnit : 0;
		} else {
			readingToUpdate.currentReading = readingValue;
			readingToUpdate.consumption = null;
			readingToUpdate.cost = null;
		}
	}

	// Utility to get proper unit label
	function getUnitLabel(): string {
		if (!utilityType) return 'Cost Per Unit';
		switch (utilityType.toUpperCase()) {
			case 'ELECTRICITY':
				return 'Cost Per kWh';
			case 'WATER':
				return 'Cost Per m³';
			case 'GAS':
				return 'Cost Per m³';
			case 'INTERNET':
				return 'Cost Per GB';
			case 'CABLE':
				return 'Monthly Fee';
			default:
				return 'Cost Per Unit';
		}
	}

	// Utility to get utility color class
	function getUtilityColorClass(type: string): string {
		switch (type.toUpperCase()) {
			case 'ELECTRICITY':
				return 'bg-amber-100 text-amber-800 border-amber-200';
			case 'WATER':
				return 'bg-blue-100 text-blue-800 border-blue-200';
			case 'GAS':
				return 'bg-red-100 text-red-800 border-red-200';
			case 'INTERNET':
				return 'bg-purple-100 text-purple-800 border-purple-200';
			case 'CABLE':
				return 'bg-green-100 text-green-800 border-green-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	}

	async function handleSave() {
		if (isSubmitting) return;
		
		console.log('=== Starting form save ===');
		console.log('Current meter readings:', meterReadings);
		console.log('Reading date:', readingDate, 'Cost per unit:', costPerUnit, typeof costPerUnit);
		
		const readingsToSubmit = meterReadings
			.filter((r) => r.currentReading !== null && r.currentReading !== undefined && !isNaN(Number(r.currentReading)));

		console.log('Filtered readings to submit:', readingsToSubmit);

		if (readingsToSubmit.length === 0) {
			toast.error('Please enter at least one valid reading');
			return;
		}
		
		// Validate required fields
		if (!readingDate) {
			toast.error('Reading date is required');
			return;
		}
		
		if (!costPerUnit || isNaN(Number(costPerUnit)) || Number(costPerUnit) <= 0) {
			toast.error('Valid cost per unit is required');
			return;
		}

		isSubmitting = true;
		
		try {
			console.log('Submitting form with data:', {
				readingsJson,
				readingDate,
				costPerUnit: Number(costPerUnit),
				utilityType
			});
			
			// Update form data before submission
			$form.readings_json = readingsJson;
			$form.reading_date = readingDate;
			$form.cost_per_unit = Number(costPerUnit);
			$form.type = utilityType;
			
			// Submit using the form action
			const formElement = document.getElementById('reading-form') as HTMLFormElement;
			if (formElement) {
				formElement.requestSubmit();
			}
		} catch (error) {
			console.error('Form submission error:', error);
			toast.error('Failed to submit readings');
			isSubmitting = false;
		}
	}

	function getUtilityBadgeColor(type: string): string {
		switch (type.toUpperCase()) {
			case 'ELECTRICITY':
				return 'bg-amber-500';
			case 'WATER':
				return 'bg-blue-500';
			case 'GAS':
				return 'bg-red-500';
			case 'INTERNET':
				return 'bg-purple-500';
			case 'CABLE':
				return 'bg-green-500';
			default:
				return 'bg-gray-500';
		}
	}


  function handlePreviousReadingSelection(selectedDate: string | null): void {
    if (!previousReadingGroups) return;
    selectedPreviousDate = selectedDate;
    if (!selectedDate) {
      // Reset previous readings if 'None' is selected
      meterReadings.forEach(reading => {
        reading.previousReading = null;
        reading.previousDate = null;
        handleReadingChange(reading.meterId, String(reading.currentReading || ''));
      });
      return;
    }

    const selectedGroup = previousReadingGroups.find(g => g.date === selectedDate);
    if (!selectedGroup) return;

    meterReadings.forEach(currentReading => {
      const previous = selectedGroup.readings.find(pr => pr.meter_id === currentReading.meterId);
      if (previous) {
        currentReading.previousReading = previous.reading;
        currentReading.previousDate = previous.reading_date;
      } else {
        currentReading.previousReading = null;
        currentReading.previousDate = null;
      }
      // Recalculate consumption and cost
      handleReadingChange(currentReading.meterId, String(currentReading.currentReading || ''));
    });
  }
</script>

<Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && close()}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
		<Dialog.Content class="fixed left-1/2 top-1/2 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
			<form id="reading-form" method="POST" action="?/addBatchReadings" use:enhance>
			<Dialog.Header class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<Dialog.Title class="text-2xl font-bold">Add Meter Readings</Dialog.Title>
					{#if utilityType}
						<Badge class="{getUtilityColorClass(utilityType)} text-lg">
							<span class="mr-2 h-3 w-3 rounded-full {getUtilityBadgeColor(utilityType)}"></span>
							{utilityType}
						</Badge>
					{/if}
				</div>
				<!-- <Dialog.Description class="text-base text-muted-foreground">
            Enter readings for {utilityType?.toLowerCase() || 'selected'} meters at {propertyName}
          </Dialog.Description> -->
			</Dialog.Header>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
        <div class="space-y-2 md:col-span-2">
          <Label>Load Previous Readings</Label>
          <Select type="single" name="previous_reading_date" onValueChange={(value) => handlePreviousReadingSelection(value)}>
            <SelectTrigger class="w-full">
              <span>
                {selectedPreviousDate 
                  ? (() => {
                      const selectedGroup = previousReadingGroups.find(g => g.date === selectedPreviousDate);
                      return selectedGroup?.monthName || new Date(selectedPreviousDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                    })()
                  : 'Select a previous reading month...'}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {#each previousReadingGroups as group}
                <SelectItem value={group.date}>{group.monthName || new Date(group.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>
				<div class="space-y-2">
					<Label>Reading Date <span class="text-red-500">*</span></Label>
					<Input type="date" bind:value={readingDate} class="w-full" />
				</div>
				<div class="space-y-2">
					<Label>{getUnitLabel()} <span class="text-red-500">*</span></Label>
					<div class="relative">
						<span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
						<Input
							type="number"
							step="0.01"
							min="0"
							bind:value={costPerUnit}
							placeholder="Enter cost per unit"
							class="pl-7"
						/>
					</div>
				</div>
			</div>

			<div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-4">
				{#if sortedReadings.length === 0}
					<div class="p-6 text-center bg-gray-50">
						<p class="text-gray-500">No {utilityType.toLowerCase()} meters found for this property.</p>
					</div>
				{:else}
					<table class="w-full text-sm text-left text-gray-500">
						<thead class="text-xs text-gray-700 uppercase bg-gray-50">
							<tr>
								<th scope="col" class="px-4">Meter Name</th>
								<th scope="col" class="px-4">Previous Reading</th>
								<th scope="col" class="px-4">Current Reading <span class="text-red-500">*</span></th>
								<th scope="col" class="px-4 bg-gray-50">
									<div class="font-semibold">Consumption</div>
									<div class="text-xs font-normal">Units Used</div>
								</th>
								<th scope="col" class="px-4 bg-gray-50">
									<div class="font-semibold">Cost</div>
									<div class="text-xs font-normal">Amount (₱)</div>
								</th>
							</tr>
						</thead>
						<tbody>
							{#each sortedReadings as reading}
								<tr class="bg-white border-b hover:bg-gray-50">
									<td class="px-4 font-medium text-gray-900">{reading.meterName}</td>
									<td class="px-4">
										{#if reading.previousReading != null}
											{reading.previousReading.toFixed(2)}
											{#if reading.previousDate}
												<span class="text-xs text-gray-500 block">({formatDate(reading.previousDate)})</span>
											{/if}
										{:else if reading.initialReading != null}
											{reading.initialReading.toFixed(2)}
											<span class="text-xs text-gray-500 block">(initial)</span>
										{:else}
											<span class="text-gray-400">No previous reading</span>
										{/if}
									</td>
									<td class="px-4">
										<div class="relative">
											<Input
												type="number"
												step="0.01"
												min="0"
												placeholder="Enter reading"
												oninput={(e) => handleReadingChange(reading.meterId, (e.target as HTMLInputElement).value)}
												value={reading.currentReading || ''}
												class="w-full {reading.validationError ? 'border-red-500 focus:border-red-500' : ''}"
											/>
											{#if reading.validationError}
												<div class="absolute top-full left-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 z-10">
													{reading.validationError}
												</div>
											{/if}
										</div>
									</td>
									<td class="px-4">
										{reading.consumption !== null ? reading.consumption.toFixed(2) : '-'}
									</td>
									<td class="px-4">
										{reading.cost !== null ? formatCurrency(reading.cost) : '-'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>

				
				<!-- Hidden form fields for superform -->
				<input type="hidden" name="readings_json" value={readingsJson} />
				<input type="hidden" name="reading_date" value={readingDate} />
				<input type="hidden" name="cost_per_unit" value={costPerUnit} />
				<input type="hidden" name="type" value={utilityType} />
				
				<!-- Debug info in development -->
				{#if typeof window !== 'undefined' && window.location.hostname === 'localhost'}
					<div class="mt-2 p-2 bg-gray-50 border rounded text-xs text-gray-600">
						<strong>Debug Info:</strong><br/>
						Readings JSON: {readingsJson?.substring(0, 100)}...<br/>
						Reading Date: {readingDate}<br/>
						Cost Per Unit: {costPerUnit} (type: {typeof costPerUnit})<br/>
						Utility Type: {utilityType}
					</div>
				{/if}
				
			</form>

			<!-- Display validation errors -->
			{#if $errors.readings_json}
				<div class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
					{$errors.readings_json}
				</div>
			{/if}
			{#if $errors.reading_date}
				<div class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
					{$errors.reading_date}
				</div>
			{/if}
			{#if $errors.cost_per_unit}
				<div class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
					{$errors.cost_per_unit}
				</div>
			{/if}

			<Dialog.Footer class="mt-4">
				<Button variant="outline" onclick={close} class="mr-2">Cancel</Button>
				<Button
					type="button"
					onclick={handleSave}
					disabled={meterReadings.filter((r) => r.currentReading !== null).length === 0 || isSubmitting || $submitting}
				>
					{#if isSubmitting || $submitting}
						<span class="mr-2">⏳</span>
						Saving...
					{:else}
						Save Readings
					{/if}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>