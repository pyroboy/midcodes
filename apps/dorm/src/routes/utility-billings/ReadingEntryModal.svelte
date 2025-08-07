<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';

	import DatePicker from '$lib/components/ui/date-picker.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import type { MeterReadingEntry, ReadingSaveEvent, Property } from './types';
	import { superForm } from 'sveltekit-superforms/client';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { batchReadingsSchema } from './meterReadingSchema';
	import { formatCurrency } from '$lib/utils/format';
	import { toast } from 'svelte-sonner';
	import { CalendarDate, getLocalTimeZone, today, parseDate } from '@internationalized/date';
	import { invalidate } from '$app/navigation';

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

		form: any; // SuperForm form data
	}

	let {
		open = $bindable(),
		property,
		utilityType,
		meters,
		meterReadings: initialMeterReadings,
		readingDate,
		costPerUnit,
		onSave,
		close,

		form: formData
	}: Props = $props();

	let meterReadings = $state([...initialMeterReadings]);

	$effect(() => {
		meterReadings = [...initialMeterReadings];
	});

	let isSubmitting = $state(false);
	let allowBackdating = $state(false);

		// Debug effect to monitor state changes
	$effect(() => {
		console.log('🔍 Modal state changed:', {
			open,
			propertyId: property?.id,
			propertyName: property?.name,
			utilityType
		});
	});



	// Calculate recommended date ranges based on backdating toggle with enhanced constraints
	let dateConstraints = $derived.by(() => {
		// Set maximum date to 1 month from now
		const maxDate = new Date();
		maxDate.setMonth(maxDate.getMonth() + 1);

		// Get all existing reading dates from meter readings
		const existingReadingDates = new Set<string>();
		const latestReadingDates = new Map<number, string>();

		// Collect existing reading dates and latest reading dates for each meter
		meterReadings.forEach((reading) => {
			if (reading.previousDate) {
				existingReadingDates.add(reading.previousDate);
			}
			
			// Track the latest reading date for each meter
			if (reading.previousDate) {
				const currentLatest = latestReadingDates.get(reading.meterId);
				if (!currentLatest || new Date(reading.previousDate) > new Date(currentLatest)) {
					latestReadingDates.set(reading.meterId, reading.previousDate);
				}
			}
		});

		// Find the overall latest reading date across all meters
		const overallLatestReadingDate = latestReadingDates.size > 0 
			? new Date(Math.max(...Array.from(latestReadingDates.values()).map(date => new Date(date).getTime())))
			: null;

		let minDate: Date;
		let maxDateConstraint: Date;
		let suggestion: string;

		if (allowBackdating) {
			// When backdating is enabled:
			// - Min date: 1 year ago
			// - Max date: Latest reading date (to prevent future readings beyond existing data)
			minDate = new Date();
			minDate.setFullYear(minDate.getFullYear() - 1);
			
			maxDateConstraint = overallLatestReadingDate || maxDate;
			
			suggestion = overallLatestReadingDate 
				? `Backdating enabled - choose any date within the last year, but not after ${overallLatestReadingDate.toLocaleDateString()} (latest reading)`
				: 'Backdating enabled - choose any date within the last year';
		} else {
			// When backdating is disabled:
			// - Min date: Today (no backdating)
			// - Max date: 1 month from now
			minDate = new Date();
			maxDateConstraint = maxDate;
			suggestion = 'Select today or a recent date';
		}

		return {
			minDate: new CalendarDate(
				minDate.getFullYear(),
				minDate.getMonth() + 1,
				minDate.getDate()
			),
			maxDate: new CalendarDate(
				maxDateConstraint.getFullYear(), 
				maxDateConstraint.getMonth() + 1, 
				maxDateConstraint.getDate()
			),
			recommendedDate: today(getLocalTimeZone()),
			suggestion,
			existingReadingDates: Array.from(existingReadingDates),
			latestReadingDates: Object.fromEntries(latestReadingDates),
			overallLatestReadingDate: overallLatestReadingDate?.toISOString().split('T')[0] || null
		};
	});

	// Derive readings JSON from current state with validation
	let readingsJson = $derived.by(() => {
		const readingsToSubmit = meterReadings
			.filter((r) => {
				const hasReading =
					r.currentReading !== null &&
					r.currentReading !== undefined &&
					!isNaN(Number(r.currentReading));
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
					backdating_enabled: allowBackdating
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
            // Invalidate to refresh data
            invalidate('app:utility-billings');
        } else if (f.errors) {
            // Handle validation errors
            const errorMessages = Object.values(f.errors).flat().join(', ');
            toast.error(`Validation failed: ${errorMessages}`);
            isSubmitting = false;
        }
    },
    onResult: async ({ result }) => {
        console.log('Form submission result:', result);
        isSubmitting = false;
        
        if (result.type === 'success') {
            if (result.data?.message) {
                toast.success(result.data.message);
            } else {
                toast.success('Meter readings saved successfully');
            }
            close();
            // Invalidate to refresh data
            await invalidate('app:utility-billings');
        } else if (result.type === 'failure') {
            const errorMessage = result.data?.error || 'Failed to save readings';
            toast.error(errorMessage);
        }
    },
    onError: ({ result }) => {
        console.error('Form submission error:', result);
        const errorMessage =
            result.error?.message ||
            (typeof result.error === 'string' ? result.error : 'Failed to save readings');
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
			const baselineReading =
				readingToUpdate.previousReading ?? readingToUpdate.initialReading ?? 0;

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

	// Enhanced date validation function with backdating constraints
	function validateReadingDate(selectedDate: string): {
		isValid: boolean;
		warning?: string;
		error?: string;
		level?: 'info' | 'warning' | 'error';
		icon?: string;
	} {
		if (!selectedDate) {
			return { isValid: false, error: 'Reading date is required', level: 'error', icon: '❌' };
		}

		const currentDate = new Date(selectedDate);
		const now = new Date();

		// Check if date is too far in the future (now more lenient - 1 month)
		const oneMonthFromNow = new Date(now);
		oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

		if (currentDate > oneMonthFromNow) {
			return {
				isValid: false,
				error: 'Reading date cannot be more than 1 month in the future',
				level: 'error',
				icon: '❌'
			};
		}

		// Enhanced validation for backdating
		if (allowBackdating) {
			// Check if date already has readings
			const dateString = selectedDate;
			if (dateConstraints.existingReadingDates.includes(dateString)) {
				return {
					isValid: false,
					error: `Reading already exists for ${new Date(selectedDate).toLocaleDateString()}. Please choose a different date.`,
					level: 'error',
					icon: '❌'
				};
			}

			// Check if date is beyond the latest reading date
			if (dateConstraints.overallLatestReadingDate && dateString > dateConstraints.overallLatestReadingDate) {
				return {
					isValid: false,
					error: `Date cannot be after ${new Date(dateConstraints.overallLatestReadingDate).toLocaleDateString()} (latest reading date)`,
					level: 'error',
					icon: '❌'
				};
			}

			// Check if date is very far in the past
			const oneYearAgo = new Date();
			oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
			
			if (currentDate < oneYearAgo) {
				return {
					isValid: false,
					error: `Date cannot be more than 1 year in the past (${oneYearAgo.toLocaleDateString()})`,
					level: 'error',
					icon: '❌'
				};
			}

			// Warning for very old dates
			const sixMonthsAgo = new Date();
			sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
			
			if (currentDate < sixMonthsAgo) {
				return {
					isValid: true,
					warning: 'Very old date selected. Please confirm this is accurate historical data.',
					level: 'warning',
					icon: '🔴'
				};
			}
		} else {
			// When backdating is disabled, ensure date is not in the past
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			
			if (currentDate < today) {
				return {
					isValid: false,
					error: 'Backdating is disabled. Please select today or a future date.',
					level: 'error',
					icon: '❌'
				};
			}
		}

		// Check if it's a weekend (informational warning)
		const dayOfWeek = currentDate.getDay();
		const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

		if (isWeekend) {
			return {
				isValid: true,
				warning: 'Reading scheduled for weekend. Ensure meter access is available.',
				level: 'info',
				icon: '🟡'
			};
		}

		// Future date warning (but allow)
		if (currentDate > now) {
			const daysInFuture = Math.floor((currentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
			return {
				isValid: true,
				warning: `Future date selected (${daysInFuture} days ahead). Ensure this is intentional.`,
				level: 'info',
				icon: '🟡'
			};
		}

		return { isValid: true };
	}

	// Helper function to get disabled dates information
	function getDisabledDatesInfo(): string {
		if (!allowBackdating) {
			return 'Past dates are disabled when backdating is off';
		}

		const existingCount = dateConstraints.existingReadingDates.length;
		const latestDate = dateConstraints.overallLatestReadingDate;
		
		let info = '';
		if (existingCount > 0) {
			info += `${existingCount} existing reading date${existingCount > 1 ? 's' : ''} will be disabled. `;
		}
		if (latestDate) {
			info += `Dates after ${new Date(latestDate).toLocaleDateString()} will be disabled.`;
		}
		
		return info || 'No date restrictions apply';
	}

	// Reactive validation of the current reading date
	let dateValidation = $derived.by(() => validateReadingDate(readingDate));

	async function handleSave() {
		if (isSubmitting) return;

		console.log('=== Starting form save ===');
		console.log('Current meter readings:', meterReadings);
		console.log('Reading date:', readingDate, 'Cost per unit:', costPerUnit, typeof costPerUnit);

		const readingsToSubmit = meterReadings.filter(
			(r) =>
				r.currentReading !== null &&
				r.currentReading !== undefined &&
				!isNaN(Number(r.currentReading))
		);

		console.log('Filtered readings to submit:', readingsToSubmit);

		if (readingsToSubmit.length === 0) {
			toast.error('Please enter at least one valid reading');
			return;
		}

		// Validate required fields and date validation
		if (!readingDate) {
			toast.error('Reading date is required');
			return;
		}

		// Check date validation errors
		const dateCheck = validateReadingDate(readingDate);
		if (!dateCheck.isValid) {
			toast.error(dateCheck.error || 'Invalid reading date');
			return;
		}

		// Show warning but allow submission
		if (dateCheck.warning) {
			console.warn('Date validation warning:', dateCheck.warning);
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
				utilityType,
				backdating_enabled: allowBackdating
			});

			// Update form data before submission
			$form.readings_json = readingsJson;
			$form.reading_date = readingDate;
			$form.rate_at_reading = Number(costPerUnit);
			$form.type = utilityType;
			$form.backdating_enabled = allowBackdating;

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


</script>

<Dialog.Root {open} onOpenChange={(isOpen) => !isOpen && close()}>
	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
		/>
		<Dialog.Content
			class="fixed left-1/2 top-1/2 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
		>
			<form id="reading-form" method="POST" action="?/addBatchReadings" use:enhance>
				<Dialog.Header class="flex flex-col gap-3">
					<div class="flex items-center justify-between">
						<Dialog.Title class="text-2xl font-bold">Add Meter Readings</Dialog.Title>
						{#if utilityType}
							<Badge class="{getUtilityColorClass(utilityType)} text-lg">
								<span class="mr-2 h-3 w-3 rounded-full {getUtilityBadgeColor(utilityType)}"></span>
								{utilityType}
							</Badge>
						{/if}
					</div>
					
					<!-- Enhanced Backdating Toggle with Context -->
					<div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
						<div class="flex flex-col">
							<Label class="text-sm font-medium text-slate-700">Enable Backdating</Label>
							<span class="text-xs text-slate-500">
								Allow selecting dates before the last reading (for corrections or historical data)
							</span>
						</div>
						<Switch bind:checked={allowBackdating} />
					</div>
					
					{#if allowBackdating}
						<div class="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
							<span class="text-amber-600">⚠️</span>
							<span class="text-sm text-amber-700">
								<strong>Backdating Enabled:</strong> You can now select dates up to 1 year in the past. Please ensure date accuracy for data integrity.
							</span>
						</div>
					{/if}
				</Dialog.Header>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
					<div class="space-y-2">
						<DatePicker
							bind:value={readingDate}
							label="Reading Date"
							placeholder="Select reading date"
							required={true}
							id="reading_date"
							name="reading_date"
							minValue={dateConstraints.minDate}
							maxValue={dateConstraints.maxDate}
							onChange={(newDate) => {
								readingDate = newDate;
							}}
						/>
						<!-- Enhanced date validation and information -->
						{#if dateValidation.error}
							<p class="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
								<span class="font-medium">{dateValidation.icon || '❌'} Error:</span>
								{dateValidation.error}
							</p>
						{:else if dateValidation.warning}
							<p class="text-xs {dateValidation.level === 'warning' ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-blue-600 bg-blue-50 border-blue-200'} border rounded p-2">
								<span class="font-medium">{dateValidation.icon || '⚠️'} {dateValidation.level === 'warning' ? 'Warning' : 'Info'}:</span>
								{dateValidation.warning}
							</p>
						{:else if dateConstraints.suggestion}
							<p class="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded p-2">
								<span class="font-medium text-blue-700">💡 Suggestion:</span>
								{dateConstraints.suggestion}
							</p>
						{/if}
						
						<!-- Show disabled dates information when backdating is enabled -->
						{#if allowBackdating}
							<p class="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-2">
								<span class="font-medium text-gray-700">📅 Date Restrictions:</span>
								{getDisabledDatesInfo()}
							</p>
						{/if}
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
							<p class="text-gray-500">
								No {utilityType.toLowerCase()} meters found for this property.
							</p>
						</div>
					{:else}
						<table class="w-full text-sm text-left text-gray-500">
							<thead class="text-xs text-gray-700 uppercase bg-gray-50">
								<tr>
									<th scope="col" class="px-4">Meter Name</th>
									<th scope="col" class="px-4">Latest Reading</th>
									<th scope="col" class="px-4"
										>Current Reading <span class="text-red-500">*</span></th
									>
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
													<span class="text-xs text-gray-500 block"
														>({formatDate(reading.previousDate)})</span
													>
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
													oninput={(e) =>
														handleReadingChange(
															reading.meterId,
															(e.target as HTMLInputElement).value
														)}
													value={reading.currentReading || ''}
													class="w-full {reading.validationError
														? 'border-red-500 focus:border-red-500'
														: ''}"
												/>
												{#if reading.validationError}
													<div
														class="absolute top-full left-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 z-10"
													>
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
				<input type="hidden" name="rate_at_reading" value={costPerUnit} />
				<input type="hidden" name="type" value={utilityType} />
				<input type="hidden" name="backdating_enabled" value={allowBackdating} />

				<!-- Debug info in development -->
				{#if typeof window !== 'undefined' && window.location.hostname === 'localhost'}
					<div class="mt-2 p-2 bg-gray-50 border rounded text-xs text-gray-600">
						<strong>Debug Info:</strong><br />
						Readings JSON: {readingsJson?.substring(0, 100)}...<br />
						Reading Date: {readingDate}<br />
						Rate At Reading: {costPerUnit} (type: {typeof costPerUnit})<br />
						Utility Type: {utilityType}<br />
						Backdating Enabled: {allowBackdating}<br />
		
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
			{#if $errors.rate_at_reading}
				<div class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
					{$errors.rate_at_reading}
				</div>
			{/if}

			<Dialog.Footer class="mt-4">
				<Button variant="outline" onclick={close} class="mr-2">Cancel</Button>
				<Button
					type="button"
					onclick={handleSave}
					disabled={meterReadings.filter((r) => r.currentReading !== null).length === 0 ||
						isSubmitting ||
						$submitting ||
						!dateValidation.isValid}
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
