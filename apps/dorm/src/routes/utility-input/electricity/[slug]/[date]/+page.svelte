<script lang="ts">
	import type { PageData, ElectricityMeter } from './+page';
	import { superForm } from 'sveltekit-superforms/client';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { readingSubmissionSchema } from './formSchema';
	import { toast } from 'svelte-sonner';
	import { invalidateAll, beforeNavigate } from '$app/navigation';
	import { onMount, tick } from 'svelte';

	let { data }: { data: PageData } = $props();

	// --- Date helpers ---
	function getPreviousDate(d: string): string {
		const dt = new Date(d);
		dt.setDate(dt.getDate() - 1);
		return dt.toISOString().split('T')[0];
	}
	function getNextDate(d: string): string {
		const dt = new Date(d);
		dt.setDate(dt.getDate() + 1);
		return dt.toISOString().split('T')[0];
	}
	function formatShortDate(d: string): string {
		return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
	}

	// --- Validation state ---
	let fieldErrors = $state<Record<string, string>>({});
	let fieldWarnings = $state<Record<string, string>>({});
	let verifiedHighReadings = $state<Set<string>>(new Set());

	// --- Loading state for date navigation ---
	let isNavigating = $state(false);
	beforeNavigate(() => { isNavigating = true; });

	const { form, errors, enhance, submitting, reset } = superForm((() => data.form)(), {
		validators: zodClient(readingSubmissionSchema),
		resetForm: false,
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				toast.success(result.data?.message || 'Readings saved successfully');
				await invalidateAll();
				reset();
				fieldErrors = {};
				fieldWarnings = {};
				verifiedHighReadings = new Set();
			} else if (result.type === 'failure') {
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
			let hasErrors = false;
			data.meters.forEach((meter) => {
				const fieldName = `reading_${meter.id}`;
				const value = formData.get(fieldName)?.toString() || '';
				validateField(meter, value, fieldName);
				if (fieldErrors[fieldName]) hasErrors = true;
			});

			if (hasErrors) {
				toast.error('Please fix the highlighted errors before saving');
				cancel();
				return;
			}

			const readingsArray = data.meters
				.map((m) => {
					const raw = formData.get(`reading_${m.id}`)?.toString();
					if (raw === undefined || raw === null || raw === '') return null;
					const value = Number(raw);
					if (!Number.isFinite(value)) return null;
					return { meter_id: m.id, reading: value, reading_date: data.date };
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

	// --- Consumption helpers ---
	function getBaselineReading(meter: ElectricityMeter): number {
		return meter.latest_reading?.value ?? meter.initial_reading ?? 0;
	}

	function getDaysSinceLastReading(meter: ElectricityMeter): number {
		if (!meter.latest_reading) return 30; // default
		const last = new Date(meter.latest_reading.date).getTime();
		const now = new Date(data.date).getTime();
		return Math.max(1, Math.round((now - last) / (1000 * 60 * 60 * 24)));
	}

	function getConsumption(meter: ElectricityMeter, currentValue: string): { value: number; status: 'normal' | 'high' | 'negative' } | null {
		if (!currentValue) return null;
		const current = parseFloat(currentValue);
		if (Number.isNaN(current)) return null;
		const diff = current - getBaselineReading(meter);
		if (diff < 0) return { value: diff, status: 'negative' };
		// Scale threshold by time gap: 500 per 30 days
		const days = getDaysSinceLastReading(meter);
		const threshold = Math.max(500, (500 / 30) * days);
		if (diff > threshold) return { value: diff, status: 'high' };
		return { value: diff, status: 'normal' };
	}

	// --- Validation: errors block submit, warnings do NOT ---
	function validateField(meter: ElectricityMeter, value: string, fieldName: string) {
		fieldErrors[fieldName] = '';
		fieldWarnings[fieldName] = '';

		if (!value || value.trim() === '') return; // empty = not filled, not an error

		const decimalRegex = /^\d+(\.\d{0,2})?$/;
		if (!decimalRegex.test(value)) {
			fieldErrors[fieldName] = 'Must be a valid number (max 2 decimal places)';
			return;
		}

		const num = Number(value);
		if (!Number.isFinite(num)) { fieldErrors[fieldName] = 'Must be a valid number'; return; }
		if (num < 0) { fieldErrors[fieldName] = 'Must be positive'; return; }
		if (num > 999999999) { fieldErrors[fieldName] = 'Reading too large (max 999,999,999)'; return; }

		const baseline = getBaselineReading(meter);
		if (num < baseline) {
			fieldErrors[fieldName] = `Must be ≥ ${baseline.toLocaleString()}`;
			return;
		}

		// High consumption = WARNING, not error (P0-3 fix)
		const consumption = num - baseline;
		const days = getDaysSinceLastReading(meter);
		const threshold = Math.max(500, (500 / 30) * days);
		if (consumption > threshold && !verifiedHighReadings.has(fieldName)) {
			fieldWarnings[fieldName] = `High usage: ${consumption.toLocaleString()} kWh over ${days}d`;
		}
	}

	function verifyHighReading(fieldName: string) {
		verifiedHighReadings = new Set([...verifiedHighReadings, fieldName]);
		fieldWarnings[fieldName] = '';
	}

	// --- Progress counter ---
	let filledCount = $derived(
		data.meters.filter((m) => {
			const val = $form[`reading_${m.id}`];
			return val !== undefined && val !== null && val !== '';
		}).length
	);

	let hasErrors = $derived(Object.values(fieldErrors).some((e) => !!e));

	// --- Floor grouping with progress ---
	function getFloorLabel(meter: ElectricityMeter): string {
		if (meter.floor) {
			const ordinal = getOrdinal(meter.floor.floor_number);
			const wing = meter.floor.wing ? ` — ${meter.floor.wing}` : '';
			return `${ordinal} Floor${wing}`;
		}
		return 'Property-Level';
	}

	function getOrdinal(n: number): string {
		const s = ['th', 'st', 'nd', 'rd'];
		const v = n % 100;
		return n + (s[(v - 20) % 10] || s[v] || s[0]);
	}

	let metersByFloor = $derived.by(() => {
		const groups = new Map<string, ElectricityMeter[]>();
		for (const meter of data.meters) {
			const label = getFloorLabel(meter);
			const existing = groups.get(label);
			if (existing) existing.push(meter);
			else groups.set(label, [meter]);
		}
		return groups;
	});

	// Floor filled counts
	function getFloorFilledCount(floorMeters: ElectricityMeter[]): number {
		return floorMeters.filter((m) => {
			const val = $form[`reading_${m.id}`];
			return val !== undefined && val !== null && val !== '';
		}).length;
	}

	// --- Collapsible floor sections ---
	let collapsedFloors = $state<Set<string>>(new Set());

	function toggleFloor(label: string) {
		const next = new Set(collapsedFloors);
		if (next.has(label)) next.delete(label);
		else next.add(label);
		collapsedFloors = next;
	}

	// --- Jump to next empty input ---
	function jumpToNextEmpty() {
		const allInputs = Array.from(
			document.querySelectorAll<HTMLInputElement>("input[type='number'][name^='reading_']")
		);
		const empty = allInputs.find((el) => !el.value || el.value.trim() === '');
		if (empty) {
			// Expand the floor section if collapsed
			const card = empty.closest('[data-floor]');
			if (card) {
				const floorLabel = card.getAttribute('data-floor');
				if (floorLabel && collapsedFloors.has(floorLabel)) {
					const next = new Set(collapsedFloors);
					next.delete(floorLabel);
					collapsedFloors = next;
					// Wait for DOM update before scrolling
					tick().then(() => {
						empty.scrollIntoView({ behavior: 'smooth', block: 'center' });
						empty.focus();
					});
					return;
				}
			}
			empty.scrollIntoView({ behavior: 'smooth', block: 'center' });
			empty.focus();
		} else {
			toast.success('All meters filled!');
		}
	}

	// --- Keyboard navigation ---
	function handleInputKeydown(e: KeyboardEvent, meterId: number) {
		if (e.key === 'Enter') {
			e.preventDefault();
			const allInputs = Array.from(
				document.querySelectorAll<HTMLInputElement>("input[type='number'][name^='reading_']")
			);
			const currentIndex = allInputs.findIndex((el) => el.name === `reading_${meterId}`);
			if (currentIndex >= 0 && currentIndex < allInputs.length - 1) {
				allInputs[currentIndex + 1].focus();
			}
		}
	}

	// Ctrl+Enter to save
	function handleGlobalKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			const btn = document.querySelector<HTMLButtonElement>('button[type="submit"]');
			if (btn && !btn.disabled) btn.click();
		}
	}

	// --- Error message parser with markdown links ---
	type ParsedErrorPart = { type: 'text'; content: string } | { type: 'link'; content: string; href: string };

	function parseErrorMessage(error: string): ParsedErrorPart[] {
		// Strip **bold** markdown before parsing links (EC-P1-2)
		const cleaned = error.replace(/\*\*([^*]+)\*\*/g, '$1');
		const parts: ParsedErrorPart[] = [];
		const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
		let lastIndex = 0;
		let match;
		while ((match = linkRegex.exec(cleaned)) !== null) {
			if (match.index > lastIndex) parts.push({ type: 'text', content: cleaned.slice(lastIndex, match.index) });
			parts.push({ type: 'link', content: match[1], href: match[2] });
			lastIndex = match.index + match[0].length;
		}
		if (lastIndex < cleaned.length) parts.push({ type: 'text', content: cleaned.slice(lastIndex) });
		return parts.length > 0 ? parts : [{ type: 'text', content: cleaned }];
	}

	onMount(async () => {
		await tick();
		const firstInput = document.querySelector<HTMLInputElement>("input[type='number'][name^='reading_']");
		if (firstInput) firstInput.focus();
	});
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<!-- Compact top nav -->
<nav class="bg-white border-b border-gray-200 sticky top-0 z-20">
	<div class="container mx-auto px-3 sm:px-4 flex items-center h-12">
		<a
			href="/utility-billings"
			class="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] pr-2"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			<span class="hidden sm:inline">Utility Billings</span>
		</a>
		<span class="text-gray-300 mx-1">/</span>
		<span class="text-sm font-semibold text-gray-900 truncate">Electricity</span>
		{#if data.property}
			<span class="text-gray-300 mx-1 hidden sm:inline">/</span>
			<span class="text-sm text-gray-500 truncate hidden sm:inline">{data.property.name}</span>
		{/if}
	</div>
</nav>

{#if isNavigating}
	<div class="fixed top-12 left-0 right-0 z-30 h-1 bg-blue-100">
		<div class="h-full bg-blue-500 animate-pulse" style="width: 60%"></div>
	</div>
{/if}

<div class="container mx-auto px-3 sm:px-4 py-3 sm:py-6 lg:py-8 pb-24 sm:pb-8">

	<!-- Compact date header (P0-1 fix) -->
	{#if data.date}
		<div class="mb-4 sm:mb-6 flex items-center justify-between gap-2">
			{#if data.property}
				<a
					href="/utility-input/electricity/{data.property.id}/{getPreviousDate(data.date)}"
					class="inline-flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors shadow-sm"
					aria-label="Previous day"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
				</a>
			{:else}
				<div class="w-10 h-10"></div>
			{/if}
			<div class="text-center min-w-0">
				<div class="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
					{formatShortDate(data.date)}
				</div>
				{#if data.property}
					<div class="text-sm text-gray-500 truncate">{data.property.name}</div>
				{/if}
			</div>
			{#if data.property}
				<a
					href="/utility-input/electricity/{data.property.id}/{getNextDate(data.date)}"
					class="inline-flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors shadow-sm"
					aria-label="Next day"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</a>
			{:else}
				<div class="w-10 h-10"></div>
			{/if}
		</div>
	{/if}

	<!-- Error/Info Messages -->
	{#if data.errors && data.errors.length > 0}
		<div class="mb-6">
			<div class="{data.errors.some(e => e.includes('Information:')) && !data.errors.some(e => e.includes('Warning')) ? 'bg-blue-50 border border-blue-200' : data.errors.some(e => e.includes('Success')) && !data.errors.some(e => e.includes('Warning')) ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'} rounded-lg p-3 sm:p-4">
				<h2 class="text-sm font-bold mb-2 {data.errors.some(e => e.includes('Information:')) && !data.errors.some(e => e.includes('Warning')) ? 'text-blue-800' : data.errors.some(e => e.includes('Success')) && !data.errors.some(e => e.includes('Warning')) ? 'text-green-800' : 'text-red-800'}">
					{data.errors.some(e => e.includes('Information:')) && !data.errors.some(e => e.includes('Warning')) ? 'Information' : data.errors.some(e => e.includes('Success')) && !data.errors.some(e => e.includes('Warning')) ? 'Success' : 'Error'}{data.errors.length > 1 ? 's' : ''}
				</h2>
				<div class="space-y-1.5">
					{#each data.errors as error}
						<div class="text-sm whitespace-pre-line {data.errors.some(e => e.includes('Information:')) ? 'text-blue-700' : data.errors.some(e => e.includes('Success')) ? 'text-green-700' : 'text-red-700'}">
							{#each parseErrorMessage(error) as part}
								{#if part.type === 'link'}
									<a href={part.href} class="text-blue-600 hover:text-blue-800 underline font-semibold">{part.content}</a>
								{:else}
									{part.content}
								{/if}
							{/each}
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Future date warning (EC-P1-1) -->
	{#if data.date && data.currentServerDate && data.date > data.currentServerDate}
		<div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-700">
			This date is in the future. Readings will be recorded for {formatShortDate(data.date)}.
		</div>
	{/if}

	<!-- Empty meters state (EC-P0-2) -->
	{#if data.meters && data.meters.length === 0 && (!data.errors || data.errors.length === 0) && data.date}
		<div class="text-center py-12">
			<svg class="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
			</svg>
			<p class="text-lg font-medium text-gray-700">No electricity meters</p>
			<p class="text-sm text-gray-500 mt-1">This property has no active electricity meters configured.</p>
			<a href="/meters" class="text-blue-600 hover:underline text-sm mt-3 inline-block">Manage Meters &rarr;</a>
		</div>
	{/if}

	<!-- Meter Cards -->
	{#if (!data.errors || data.errors.length === 0) && data.date && data.meters && data.meters.length > 0}
		<form method="POST" action="?/addReadings" use:enhance>
			<input type="hidden" name="readings_json" bind:value={$form.readings_json} />
			<input type="hidden" name="reading_date" bind:value={$form.reading_date} />

			<!-- Floor sections (P0-2 fix: collapsible) -->
			{#each [...metersByFloor.entries()] as [floorLabel, floorMeters]}
				{@const floorFilled = getFloorFilledCount(floorMeters)}
				{@const isCollapsed = collapsedFloors.has(floorLabel)}
				{@const allFilled = floorFilled === floorMeters.length}

				<div class="mb-3" data-floor={floorLabel}>
					<!-- Floor header — clickable to collapse -->
					<button
						type="button"
						onclick={() => toggleFloor(floorLabel)}
						class="w-full flex items-center justify-between py-2 px-1 text-left cursor-pointer hover:bg-gray-50 rounded transition-colors"
					>
						<div class="flex items-center gap-2">
							<svg class="w-4 h-4 text-gray-400 transition-transform {isCollapsed ? '-rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
							<span class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{floorLabel}</span>
						</div>
						<div class="flex items-center gap-2">
							<!-- Progress pill -->
							<span class="text-xs font-medium px-2 py-0.5 rounded-full {allFilled ? 'bg-green-100 text-green-700' : floorFilled > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}">
								{floorFilled}/{floorMeters.length}
							</span>
						</div>
					</button>

					{#if !isCollapsed}
						<div class="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-1">
							{#each floorMeters as meter}
								{@const consumption = getConsumption(meter, $form[`reading_${meter.id}`] as string)}
								{@const fieldName = `reading_${meter.id}`}
								{@const hasError = !!fieldErrors[fieldName]}
								{@const hasWarning = !!fieldWarnings[fieldName]}
								{@const isFilled = $form[fieldName] !== undefined && $form[fieldName] !== null && $form[fieldName] !== ''}

								<div class="border rounded-lg p-2.5 transition-all {hasError ? 'border-red-300 bg-red-50/30' : hasWarning ? 'border-amber-300 bg-amber-50/30' : isFilled ? 'border-green-200 bg-green-50/20' : 'border-gray-200 hover:shadow-md'}">
									<h3 class="font-semibold text-gray-900 text-sm mb-1.5">{meter.name}</h3>

									<div class="flex items-stretch gap-2 text-xs sm:text-sm">
										<!-- Previous reading -->
										<div class="flex-1 min-w-0">
											<div class="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Previous</div>
											<div class="text-[11px] text-gray-500 mt-0.5">
												{#if meter.latest_reading}
													{new Date(meter.latest_reading.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
												{:else}
													Initial
												{/if}
											</div>
											{#if meter.latest_reading}
												<div class="text-lg font-bold text-gray-900 tabular-nums">{meter.latest_reading.value.toLocaleString()}</div>
											{:else}
												<div class="text-lg font-bold text-gray-400">{(meter.initial_reading ?? 0).toLocaleString()}</div>
											{/if}
											<div class="text-[10px] text-gray-400">kWh</div>
										</div>

										<!-- Divider -->
										<div class="w-px bg-gray-200 self-stretch my-1"></div>

										<!-- Current reading input -->
										<div class="flex-1 min-w-0">
											<div class="flex items-center justify-between">
												<div class="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Current</div>
												{#if consumption}
													<span class="text-[10px] font-bold px-1.5 py-0.5 rounded {consumption.status === 'negative' ? 'bg-red-100 text-red-700' : consumption.status === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}">
														{consumption.value > 0 ? '+' : ''}{consumption.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
													</span>
												{/if}
											</div>
											<div class="text-[11px] text-gray-500 mt-0.5">
												{new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
											</div>

											<div class="flex items-baseline gap-1 mt-0.5">
												<input
													type="number"
													inputmode="decimal"
													name={fieldName}
													bind:value={$form[fieldName]}
													placeholder="0"
													step="0.01"
													class="w-full h-10 bg-gray-50 border rounded-md px-2 text-lg font-bold tabular-nums text-gray-900 placeholder-gray-300 outline-none transition-all {hasError ? 'border-red-400 ring-2 ring-red-200 focus:ring-red-400 text-red-700' : hasWarning ? 'border-amber-400 ring-1 ring-amber-200 focus:ring-amber-400' : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200'}"
													oninput={(e) => validateField(meter, (e.target as HTMLInputElement).value, fieldName)}
													onkeydown={(e) => handleInputKeydown(e, meter.id)}
												/>
												<span class="text-[10px] text-gray-400 flex-shrink-0">kWh</span>
											</div>

											{#if hasError}
												<p class="mt-1 text-[11px] text-red-600 font-medium">{fieldErrors[fieldName]}</p>
											{/if}
											{#if hasWarning}
												<div class="mt-1 flex items-center gap-1">
													<p class="text-[11px] text-amber-600">{fieldWarnings[fieldName]}</p>
													<button
														type="button"
														onclick={() => verifyHighReading(fieldName)}
														class="text-[10px] font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
													>
														Verify ✓
													</button>
												</div>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}

			<!-- Desktop Save area -->
			<div class="hidden sm:flex justify-between items-center mt-4 py-3 px-2 border-t border-gray-100">
				<div class="flex items-center gap-3">
					<div class="text-sm text-gray-500">
						<span class="font-semibold text-gray-700">{filledCount}</span> / <span class="font-semibold text-gray-700">{data.meters.length}</span> meters
					</div>
					{#if filledCount > 0 && filledCount < data.meters.length}
						<button
							type="button"
							onclick={jumpToNextEmpty}
							class="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
						>
							Jump to next empty →
						</button>
					{/if}
				</div>
				<div class="flex items-center gap-2">
					{#if filledCount === 0}
						<span class="text-xs text-gray-400">Fill at least 1 reading</span>
					{/if}
					<button
						type="submit"
						class="inline-flex items-center rounded-md bg-blue-600 px-5 py-2 text-white text-sm font-medium shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						disabled={$submitting || filledCount === 0 || hasErrors}
					>
						{#if $submitting}
							<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Saving...
						{:else}
							Save Readings
						{/if}
					</button>
				</div>
			</div>
		</form>

		<!-- Mobile sticky bar (P0-2 fix: jump to next empty) -->
		<div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30 sm:hidden">
			<div class="flex items-center justify-between px-3 py-2">
				<div class="flex items-center gap-2">
					<div class="text-sm text-gray-600">
						<span class="font-bold text-gray-900">{filledCount}</span><span class="text-gray-400">/{data.meters.length}</span>
					</div>
					{#if filledCount > 0 && filledCount < data.meters.length}
						<button
							type="button"
							onclick={jumpToNextEmpty}
							class="text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-full cursor-pointer transition-colors"
						>
							Next →
						</button>
					{/if}
				</div>
				{#if filledCount === 0}
					<span class="text-[11px] text-gray-400">Fill at least 1</span>
				{/if}
				<button
					type="submit"
					form="readingsForm"
					class="inline-flex items-center rounded-md bg-blue-600 px-5 py-2.5 text-white text-sm font-medium shadow hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
					disabled={$submitting || filledCount === 0 || hasErrors}
					onclick={() => {
						// Trigger the actual form submit
						const form = document.querySelector<HTMLFormElement>('form[action="?/addReadings"]');
						if (form) form.requestSubmit();
					}}
				>
					{#if $submitting}
						<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Saving...
					{:else}
						Save
					{/if}
				</button>
			</div>
		</div>
	{/if}
</div>
