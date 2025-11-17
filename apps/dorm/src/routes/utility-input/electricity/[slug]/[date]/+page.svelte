<script lang="ts">
	import type { PageData, ElectricityMeter } from './+page';
	import { superForm } from 'sveltekit-superforms/client';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { readingSubmissionSchema, meterReadingFieldSchema } from './formSchema';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import { z } from 'zod';

	let { data }: { data: PageData } = $props();

	// Helper functions for date navigation
	function getPreviousDate(currentDate: string): string {
		const date = new Date(currentDate);
		date.setDate(date.getDate() - 1);
		return date.toISOString().split('T')[0];
	}

	function getNextDate(currentDate: string): string {
		const date = new Date(currentDate);
		date.setDate(date.getDate() + 1);
		return date.toISOString().split('T')[0];
	}

	// Simple client-side validation state
	let fieldErrors = $state<Record<string, string>>({});

	const { form, errors, enhance, submitting, reset } = superForm(data.form, {
		validators: zodClient(readingSubmissionSchema),
		resetForm: false,
		onResult: async ({ result }) => {
			console.log('📥 Form submission result:', result);
			if (result.type === 'success') {
				console.log('✅ Submission successful, reloading data...');
				toast.success(result.data?.message || 'Readings saved successfully');
				await invalidateAll();
				console.log('🔄 Data invalidated, page should reload');
				reset();
				// Clear field errors on success
				fieldErrors = {};
				console.log('🧹 Form reset and errors cleared');
			} else if (result.type === 'failure') {
				// Aggregate server-side errors for toast
				const serverMessage = (result.data as any)?.error as string | undefined;
				const formErrors = (result.data as any)?.form?.errors || (result.data as any)?.errors;
				let combined = '';
				if (serverMessage) combined = serverMessage;
				if (formErrors) {
					const flat = Object.values(formErrors).flat().join(', ');
					combined = combined ? `${combined} — ${flat}` : flat;
				}
				toast.error(combined || 'Failed to save readings');
			}
		},
		onSubmit: ({ formData, cancel }) => {
			// Validate all fields before submission
			let hasErrors = false;
			data.meters.forEach(meter => {
				const fieldName = `reading_${meter.id}`;
				const value = formData.get(fieldName)?.toString() || '';
				validateField(meter, value, fieldName);
				if (fieldErrors[fieldName]) {
					hasErrors = true;
				}
			});

			if (hasErrors) {
				toast.error('Please fix the highlighted errors before saving');
				cancel();
				return;
			}

			// Build readings_json before submit
			const readingsArray = data.meters
				.map((m) => {
					const raw = formData.get(`reading_${m.id}`)?.toString();

					if (raw === undefined || raw === null || raw === '') {
						return null;
					}
					const value = Number(raw);
					if (!Number.isFinite(value)) {
						return null;
					}
					return {
						meter_id: m.id,
						reading: value,
						reading_date: data.date
					};
				})
				.filter(Boolean);

			if (readingsArray.length === 0) {
				toast.error('Please enter at least one valid reading');
				cancel();
				return;
			}

			const readingsJson = JSON.stringify(readingsArray);
			formData.set('readings_json', readingsJson);
			formData.set('reading_date', data.date);
			$form.readings_json = readingsJson;
			$form.reading_date = data.date;
		},
		onError: ({ result }) => {
			const msg = result.error?.message || (typeof result.error === 'string' ? result.error : 'Failed to save readings');
			toast.error(msg);
		}
	});

	// Real-time field validation
	function validateField(meter: ElectricityMeter, value: string, fieldName: string) {
		fieldErrors[fieldName] = '';

		if (!value || value.trim() === '') {
			fieldErrors[fieldName] = 'Reading is required';
			return;
		}

		// Allow decimal values with up to 2 decimal places
		const decimalRegex = /^\d+(\.\d{0,2})?$/;
		if (!decimalRegex.test(value)) {
			fieldErrors[fieldName] = 'Must be a valid number (max 2 decimal places)';
			return;
		}

		const num = Number(value);
		if (!Number.isFinite(num)) {
			fieldErrors[fieldName] = 'Must be a valid number';
			return;
		}

		if (num < 0) {
			fieldErrors[fieldName] = 'Must be positive';
			return;
		}

		const baseline = getBaselineReading(meter);
		if (num < baseline) {
			fieldErrors[fieldName] = `Must be ≥ ${baseline}`;
			return;
		}

		// Check for unusually high consumption (>500 units above baseline)
		const consumption = num - baseline;
		if (consumption > 500) {
			fieldErrors[fieldName] = `Unusually high consumption (${consumption} units). Please verify the reading.`;
			return;
		}

		// Clear error if validation passes
		fieldErrors[fieldName] = '';
	}

	function getBaselineReading(meter: ElectricityMeter): number {
		return meter.latest_reading?.value ?? meter.initial_reading ?? 0;
	}

	function getInputClass(meterId: number) {
		const fieldName = `reading_${meterId}`;
		const hasError = !!fieldErrors[fieldName];
		const base =
			'bg-transparent border-none outline-none text-xl font-bold text-gray-900 placeholder-gray-400 w-full rounded';
		if (hasError) {
			return `${base} ring-2 ring-red-500 focus:ring-red-500 text-red-700 placeholder-red-400`;
		}
		return base;
	}

	// Safe parsing - replace XSS vulnerability
	function parseErrorMessage(error: string) {
		return [{type: 'text', content: error}];
	}
</script>

<div class="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">


	<!-- Combined Date and Property Display -->
		{#if data.date}
			<div class="mb-6 sm:mb-8">
				<div class="bg-white border-2 border-gray-300 rounded-lg py-4 sm:py-6 lg:py-8 px-16 sm:px-20 lg:px-24 shadow-md relative min-h-[80px] sm:min-h-[100px] lg:min-h-[120px]">
					<!-- Previous Day Button -->
					<div class="absolute left-6 top-1/2 transform -translate-y-1/2 z-10">
						<a
							href="/utility-input/electricity/{data.property?.slug}/{getPreviousDate(data.date)}"
							class="inline-flex items-center justify-center w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors duration-200 shadow-lg hover:shadow-xl border-2 border-white"
							title="Previous Day"
							aria-label="Go to previous day"
						>
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
							</svg>
						</a>
					</div>

					<div class="text-center">
						<div class="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
							{new Date(data.date).toLocaleDateString('en-US', {
								weekday: 'long',
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						</div>
						{#if data.property}
							<h1 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
								{data.property.name}
							</h1>
						{/if}
					</div>

					<!-- Next Day Button -->
					<div class="absolute right-4 top-1/2 transform -translate-y-1/2">
						<a
							href="/utility-input/electricity/{data.property?.slug}/{getNextDate(data.date)}"
							class="inline-flex items-center justify-center w-12 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors duration-200 shadow-sm hover:shadow-md"
							title="Next Day"
							aria-label="Go to next day"
						>
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
							</svg>
						</a>
					</div>
				</div>
			</div>
		{/if}
	<!-- Message Display -->
	{#if data.errors && data.errors.length > 0}
		<div class="mb-8">
			<div class="{data.errors.some(e => e.includes('ℹ️ Information:')) && !data.errors.some(e => e.includes('⚠️')) ? 'bg-blue-50 border-2 border-blue-300' : data.errors.some(e => e.includes('✅ Success!')) && !data.errors.some(e => e.includes('⚠️')) ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'} rounded-lg p-4 sm:p-6 shadow-md">
				<div class="flex items-center mb-4">
					<div class="{data.errors.some(e => e.includes('ℹ️ Information:')) && !data.errors.some(e => e.includes('⚠️')) ? 'text-blue-600' : data.errors.some(e => e.includes('✅ Success!')) && !data.errors.some(e => e.includes('⚠️')) ? 'text-green-600' : 'text-red-600'} text-xl mr-3">
						{data.errors.some(e => e.includes('ℹ️ Information:')) && !data.errors.some(e => e.includes('⚠️')) ? 'ℹ️' : data.errors.some(e => e.includes('✅ Success!')) && !data.errors.some(e => e.includes('⚠️')) ? '✅' : '⚠️'}
					</div>
					<h2 class="text-lg sm:text-xl font-bold {data.errors.some(e => e.includes('ℹ️ Information:')) && !data.errors.some(e => e.includes('⚠️')) ? 'text-blue-800' : data.errors.some(e => e.includes('✅ Success!')) && !data.errors.some(e => e.includes('⚠️')) ? 'text-green-800' : 'text-red-800'}">
						{data.errors.some(e => e.includes('ℹ️ Information:')) && !data.errors.some(e => e.includes('⚠️')) ? 'Information' : data.errors.some(e => e.includes('✅ Success!')) && !data.errors.some(e => e.includes('⚠️')) ? 'Success' : 'Error'}{data.errors.length > 1 ? 's' : ''} Detected
					</h2>
				</div>
				<div class="space-y-2">
					{#each data.errors as error}
						<div class="{data.errors.some(e => e.includes('ℹ️ Information:')) && !data.errors.some(e => e.includes('⚠️')) ? 'bg-blue-100 border-l-4 border-blue-500' : data.errors.some(e => e.includes('✅ Success!')) && !data.errors.some(e => e.includes('⚠️')) ? 'bg-green-100 border-l-4 border-green-500' : 'bg-red-100 border-l-4 border-red-500'} p-3 rounded">
							<div class="{data.errors.some(e => e.includes('ℹ️ Information:')) && !data.errors.some(e => e.includes('⚠️')) ? 'text-blue-800' : data.errors.some(e => e.includes('✅ Success!')) && !data.errors.some(e => e.includes('⚠️')) ? 'text-green-800' : 'text-red-800'} text-sm sm:text-base whitespace-pre-line">
								{error}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Meter Cards Section -->
	{#if (!data.errors || data.errors.length === 0) && data.date && data.meters && data.meters.length > 0}
		<form method="POST" action="?/addReadings" use:enhance>
			<!-- Hidden fields managed by superforms -->
			<input type="hidden" name="readings_json" bind:value={$form.readings_json} />
			<input type="hidden" name="reading_date" bind:value={$form.reading_date} />

			<div class="bg-white shadow rounded-lg">
				<div class="p-2">
					{#if data.meters.length === 0}
						<div class="text-center py-6 sm:py-8">
							<p class="text-sm sm:text-base text-gray-500">No active electricity meters found for this property.</p>
						</div>
					{:else}
						<div class="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
							{#each data.meters as meter}
								<div class="border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow">
									<div class="mb-1">
										<h3 class="font-semibold text-gray-900 text-sm sm:text-base">{meter.name}</h3>
									</div>

									<!-- Reading Input Table -->
									<div class="mt-1 border-t border-gray-100 pt-1">
										<div class="flex items-center justify-center gap-3 text-xs sm:text-sm">
											<!-- Previous Reading Section -->
											<div class="flex items-center gap-2 flex-1">
												<div class="flex-shrink-0">
													<span class="text-xs font-medium text-gray-700" style="writing-mode: vertical-lr; text-orientation: mixed;">Previous</span>
												</div>
												<div class="text-gray-600">
													<div class="text-xs text-gray-500 font-medium mb-0">
														{#if meter.latest_reading}
															{new Date(meter.latest_reading.date).toLocaleDateString('en-US', {
																month: 'short',
																day: 'numeric',
																year: 'numeric'
															})}
														{:else}
															Date
														{/if}
													</div>
													{#if meter.latest_reading}
														<span class="text-xl font-bold text-gray-900">{meter.latest_reading.value}</span>
														<span class="text-xs text-gray-500 ml-1">kWh</span>
													{:else}
														<span class="text-orange-600 font-medium">No readings recorded</span>
													{/if}
												</div>
											</div>

											<!-- Vertical Divider -->
											<div class="flex items-center justify-center">
												<div class="h-16 w-px bg-gray-300"></div>
											</div>

											<!-- Current Reading Section -->
											<div class="flex items-center gap-2 flex-1">
												<div class="flex-shrink-0">
													<span class="text-xs font-medium text-gray-700" style="writing-mode: vertical-lr; text-orientation: mixed;">Current</span>
												</div>
												<div>
													<div class="text-xs text-gray-500 font-medium mb-0">
														{new Date(data.date).toLocaleDateString('en-US', {
															month: 'short',
															day: 'numeric',
															year: 'numeric'
														})}
													</div>
													<div class="flex items-baseline">
														<input
															type="number"
															name={`reading_${meter.id}`}
															placeholder={meter.latest_reading ? (meter.latest_reading.value.toString().includes('.') ? '000.00' : '0000.00') : '0000.00'}
															step="0.01"
															class={getInputClass(meter.id)}
															oninput={(e) => validateField(meter, (e.target as HTMLInputElement).value, `reading_${meter.id}`)}
														/>
														<span class="text-xs text-gray-500 ml-1">kWh</span>
													</div>
													{#if fieldErrors[`reading_${meter.id}`]}
														<p class="mt-1 text-xs text-red-600">{fieldErrors[`reading_${meter.id}`]}</p>
													{/if}
												</div>
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}

					<div class="flex justify-end mt-4 p-2">
						<button type="submit" class="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white text-sm font-medium shadow hover:bg-blue-700 disabled:opacity-50" disabled={$submitting}>
							{$submitting ? 'Saving...' : 'Save Readings'}
						</button>
					</div>
				</div>
			</div>
		</form>
	{/if}

</div>
