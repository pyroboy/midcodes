<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import type { MeterReadingEntry, ReadingSaveEvent, Property } from './types';

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
    previousReadingGroups: { date: string, readings: any[] }[];
  };

	  let { open = $bindable(), property, utilityType, meters, meterReadings: initialMeterReadings, readingDate, costPerUnit, onSave, close, previousReadingGroups = [] }: Props = $props();

  let meterReadings = $state([...initialMeterReadings]);

  $effect(() => {
    meterReadings = [...initialMeterReadings];
  });

  let selectedPreviousDate = $state<string | null>(null);

	let sortedReadings = $derived.by(() => {
		return meterReadings.slice().sort((a, b) => a.meterName.localeCompare(b.meterName));
	});
	// Helper: Format currency with peso sign
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-PH', {
			style: 'currency',
			currency: 'PHP'
		}).format(amount);
	}

	// Format date for display
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-PH', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Update reading values as the user types
	function handleReadingChange(meterId: number, value: string): void {
		const readingToUpdate = meterReadings.find((r) => r.meterId === meterId);
		if (!readingToUpdate) return;

		const readingValue = value === '' ? null : parseFloat(value);
		readingToUpdate.currentReading = readingValue;

		if (readingValue !== null && !isNaN(readingValue)) {
			// Use previous reading if available, otherwise fall back to initial reading, then to 0
			const baselineReading = readingToUpdate.previousReading ?? readingToUpdate.initialReading ?? 0;
			const consumption = readingValue - baselineReading;
			readingToUpdate.consumption = consumption;
			readingToUpdate.cost = consumption > 0 ? consumption * costPerUnit : 0;
		} else {
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

	function handleSave() {
		const readingsToSubmit = meterReadings
			.filter((r) => r.currentReading !== null && r.currentReading !== undefined)
			.map((r) => {
				return {
					meter_id: r.meterId,
					reading: r.currentReading,
					reading_date: readingDate,
					consumption: r.consumption,
					previous_reading: r.previousReading,
					cost: r.cost
				};
			});

		onSave({ readings: readingsToSubmit, readingDate, costPerUnit });
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
                  ? new Date(selectedPreviousDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'Select a previous reading date...'}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {#each previousReadingGroups as group}
                <SelectItem value={group.date}>{new Date(group.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</SelectItem>
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
									<td class="px-4  font-medium text-gray-900">{reading.meterName}</td>
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
												class="w-full"
											/>
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

			<Dialog.Footer class="mt-4">
								<Button variant="outline" onclick={close} class="mr-2">Cancel</Button>
								<Button
					type="button"
					onclick={handleSave}
					disabled={meterReadings.filter((r) => r.currentReading !== null).length === 0}
				>
					Save Readings
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>