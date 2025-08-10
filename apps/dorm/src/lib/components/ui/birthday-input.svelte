<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Calendar } from 'lucide-svelte';

	let {
		value = $bindable(''),
		label = 'Birthday',
		name = 'birthday',
		id = 'birthday',
		required = false,
		disabled = false,
		error = ''
	} = $props<{
		value?: string;
		label?: string;
		name?: string;
		id?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
	}>();

	// Individual field values
	let month = $state('');
	let day = $state('');
	let year = $state('');

	// Refs for auto-navigation
	let monthRef: HTMLInputElement | null = $state(null);
	let dayRef: HTMLInputElement | null = $state(null);
	let yearRef: HTMLInputElement | null = $state(null);

	// Initialize from ISO date string (YYYY-MM-DD)
	$effect(() => {
		if (value && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
			const [y, m, d] = value.split('-');
			month = m;
			day = d;
			year = y;
		} else if (!value) {
			month = '';
			day = '';
			year = '';
		}
	});

	// Update value when individual fields change
	$effect(() => {
		if (month && day && year) {
			// Validate the date
			const monthNum = parseInt(month, 10);
			const dayNum = parseInt(day, 10);
			const yearNum = parseInt(year, 10);

			if (
				monthNum >= 1 && monthNum <= 12 &&
				dayNum >= 1 && dayNum <= 31 &&
				yearNum >= 1900 && yearNum <= new Date().getFullYear()
			) {
				// Create a date to validate it's actually valid
				const testDate = new Date(yearNum, monthNum - 1, dayNum);
				if (
					testDate.getFullYear() === yearNum &&
					testDate.getMonth() === monthNum - 1 &&
					testDate.getDate() === dayNum
				) {
					value = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
				}
			}
		} else if (!month && !day && !year) {
			value = '';
		}
	});

	// Auto-advance on input
	function handleMonthInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const val = target.value;

		// Remove non-numeric characters
		target.value = val.replace(/\D/g, '');
		month = target.value;

		// Auto-advance when we have 2 digits or when month is > 1 and we have 1 digit
		if (target.value.length === 2 || (parseInt(target.value) > 1 && target.value.length === 1)) {
			// Ensure month is valid (01-12)
			const monthNum = parseInt(target.value);
			if (monthNum > 12) {
				target.value = '12';
				month = '12';
			}
			if (dayRef) {
				dayRef.focus();
			}
		}
	}

	function handleDayInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const val = target.value;

		// Remove non-numeric characters
		target.value = val.replace(/\D/g, '');
		day = target.value;

		// Auto-advance when we have 2 digits or when day is > 3 and we have 1 digit
		if (target.value.length === 2 || (parseInt(target.value) > 3 && target.value.length === 1)) {
			// Ensure day is valid (01-31)
			const dayNum = parseInt(target.value);
			if (dayNum > 31) {
				target.value = '31';
				day = '31';
			}
			if (yearRef) {
				yearRef.focus();
			}
		}
	}

	function handleYearInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const val = target.value;

		// Remove non-numeric characters
		target.value = val.replace(/\D/g, '');
		year = target.value;

		// Limit to 4 digits
		if (target.value.length > 4) {
			target.value = target.value.slice(0, 4);
			year = target.value;
		}
	}

	// Handle backspace for auto-navigation
	function handleKeyDown(e: KeyboardEvent, field: 'month' | 'day' | 'year') {
		const target = e.target as HTMLInputElement;

		if (e.key === 'Backspace' && target.value === '' && target.selectionStart === 0) {
			e.preventDefault();
			if (field === 'day' && monthRef) {
				monthRef.focus();
				monthRef.setSelectionRange(monthRef.value.length, monthRef.value.length);
			} else if (field === 'year' && dayRef) {
				dayRef.focus();
				dayRef.setSelectionRange(dayRef.value.length, dayRef.value.length);
			}
		}

		// Allow navigation with arrow keys
		if (e.key === 'ArrowRight' && target.selectionStart === target.value.length) {
			if (field === 'month' && dayRef) {
				dayRef.focus();
			} else if (field === 'day' && yearRef) {
				yearRef.focus();
			}
		}

		if (e.key === 'ArrowLeft' && target.selectionStart === 0) {
			if (field === 'day' && monthRef) {
				monthRef.focus();
			} else if (field === 'year' && dayRef) {
				dayRef.focus();
			}
		}
	}

	// Month names for Philippines context
	const monthNames = [
		'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
		'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
	];

	// Format display value
	let displayValue = $derived.by(() => {
		if (month && day && year) {
			const monthNum = parseInt(month, 10);
			if (monthNum >= 1 && monthNum <= 12) {
				return `${monthNames[monthNum - 1]} ${day}, ${year}`;
			}
		}
		return '';
	});
</script>

<div class="space-y-2">
	<Label for={id}>
		{label}
		{#if required}
			<span class="text-red-500">*</span>
		{/if}
	</Label>

	<div class="space-y-3">
		<!-- Input Fields -->
		<div class="flex items-center gap-2">
			<div class="flex-1">
				<Label for={`${id}-month`} class="text-xs text-gray-600">Month</Label>
				<Input
					bind:this={monthRef}
					id={`${id}-month`}
					type="text"
					inputmode="numeric"
					placeholder="MM"
					maxlength="2"
					class={`text-center ${error ? 'border-red-500' : ''}`}
					value={month}
					oninput={handleMonthInput}
					onkeydown={(e) => handleKeyDown(e, 'month')}
					{disabled}
				/>
			</div>

			<span class="text-gray-400 mt-5">/</span>

			<div class="flex-1">
				<Label for={`${id}-day`} class="text-xs text-gray-600">Day</Label>
				<Input
					bind:this={dayRef}
					id={`${id}-day`}
					type="text"
					inputmode="numeric"
					placeholder="DD"
					maxlength="2"
					class={`text-center ${error ? 'border-red-500' : ''}`}
					value={day}
					oninput={handleDayInput}
					onkeydown={(e) => handleKeyDown(e, 'day')}
					{disabled}
				/>
			</div>

			<span class="text-gray-400 mt-5">/</span>

			<div class="flex-[1.5]">
				<Label for={`${id}-year`} class="text-xs text-gray-600">Year</Label>
				<Input
					bind:this={yearRef}
					id={`${id}-year`}
					type="text"
					inputmode="numeric"
					placeholder="YYYY"
					maxlength="4"
					class={`text-center ${error ? 'border-red-500' : ''}`}
					value={year}
					oninput={handleYearInput}
					onkeydown={(e) => handleKeyDown(e, 'year')}
					{disabled}
				/>
			</div>
		</div>

		<!-- Display Value -->
		{#if displayValue}
			<div class="flex items-center gap-2 text-sm text-gray-600">
				<Calendar class="w-4 h-4" />
				<span>{displayValue}</span>
			</div>
		{/if}

		<!-- Helper Text -->
		<p class="text-xs text-gray-500">
			Format: MM/DD/YYYY (e.g., 03/15/1990)
		</p>
	</div>

	<!-- Hidden input for form submission -->
	<input type="hidden" {name} {value} {required} />
</div>

<style>
	/* Remove number input spinners */
	:global(input[type="text"][inputmode="numeric"]::-webkit-outer-spin-button),
	:global(input[type="text"][inputmode="numeric"]::-webkit-inner-spin-button) {
		-webkit-appearance: none;
		margin: 0;
	}

	:global(input[type="text"][inputmode="numeric"]) {
		-moz-appearance: textfield;
	}
</style>