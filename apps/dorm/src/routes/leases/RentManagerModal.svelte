<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter,
		DialogDescription
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { toast } from 'svelte-sonner';
	import type { Lease } from '$lib/types/lease';
	import { getMonthName, getDaysInMonth } from '$lib/utils/date';
	import { invalidateAll } from '$app/navigation';
	import DatePicker from '$lib/components/ui/date-picker.svelte';

	let { lease, open, onOpenChange } = $props<{
		lease: Lease;
		open: boolean;
		onOpenChange: (open: boolean) => void;
	}>();

	type MonthlyRent = {
		month: number;
		isActive: boolean;
		amount: number;
		dueDate: string;
		billingId: number | null;
	};

	let selectedYear = $state(new Date().getFullYear());
	let monthlyRents = $state<MonthlyRent[]>([]);
	let originalMonthlyRents = $state<MonthlyRent[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let hasUnsavedChanges = $state(false);

	// Fixed timezone-safe function
	const getFirstDayOfMonth = (year: number, month: number) => {
		const monthStr = month.toString().padStart(2, '0');
		return `${year}-${monthStr}-01`;
	};

	const initializeRents = (year: number, existingBillings: any[]) => {
		const billingsMap = new Map(
			existingBillings.map((b) => [new Date(b.billing_date).getMonth() + 1, b])
		);

		return Array.from({ length: 12 }, (_, i) => {
			const month = i + 1; // Fixed: months 1-12
			const existing = billingsMap.get(month);
			// Use the timezone-safe helper function
			const defaultDueDate = getFirstDayOfMonth(year, month);

			return {
				month,
				isActive: !!existing,
				amount: existing ? existing.amount : lease.rent_amount,
				dueDate: existing ? existing.due_date.split('T')[0] : defaultDueDate,
				billingId: existing ? existing.id : null
			};
		});
	};

	const fetchBillingsForYear = async (year: number) => {
		isLoading = true;
		error = null;
		try {
			const response = await fetch(`/leases/${lease.id}/billings?year=${year}&type=RENT`);
			if (!response.ok) throw new Error('Failed to fetch rent data.');
			const existingBillings = await response.json();
			monthlyRents = initializeRents(year, existingBillings);
			originalMonthlyRents = JSON.parse(JSON.stringify(monthlyRents)); // Deep copy for comparison
			hasUnsavedChanges = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unknown error occurred.';
			toast.error('Error', { description: error });
		} finally {
			isLoading = false;
		}
	};

	$effect(() => {
		if (open) {
			fetchBillingsForYear(selectedYear);
		} else {
			// Reset state when modal closes to free memory
			monthlyRents = [];
			originalMonthlyRents = [];
			isLoading = false;
			error = null;
			hasUnsavedChanges = false;
		}
	});

	// Auto-check for changes whenever monthlyRents changes
	$effect(() => {
		if (monthlyRents.length > 0 && originalMonthlyRents.length > 0) {
			checkForChanges();
		}
	});

	// Smart change detection - compares current state with original state
	const checkForChanges = () => {
		if (monthlyRents.length === 0 || originalMonthlyRents.length === 0) {
			hasUnsavedChanges = false;
			return;
		}

		const hasChanges = monthlyRents.some((currentRent, index) => {
			const originalRent = originalMonthlyRents[index];
			if (!originalRent) return false;

			// Check if any property has changed
			return (
				currentRent.isActive !== originalRent.isActive ||
				currentRent.amount !== originalRent.amount ||
				currentRent.dueDate !== originalRent.dueDate
			);
		});

		console.log('🔍 Checking for changes:', hasChanges);
		hasUnsavedChanges = hasChanges;
	};

	// Mark changes when any input is modified
	const markAsChanged = () => {
		console.log('🔔 Checking for changes...');
		checkForChanges();
		console.log('✅ hasUnsavedChanges set to:', hasUnsavedChanges);
	};

	const handleSaveChanges = async () => {
		console.log('💾 Starting save process...');
		console.log('📊 Current monthly rents:', monthlyRents);

		// Validate data before submission
		const validationErrors: string[] = [];
		const activeRents = monthlyRents.filter((rent) => rent.isActive);

		console.log(`🔍 Validating ${activeRents.length} active months...`);

		monthlyRents.forEach((rent, index) => {
			if (rent.isActive) {
				if (!rent.amount || rent.amount <= 0) {
					validationErrors.push(`Month ${rent.month}: Amount must be greater than 0`);
				}
				if (!rent.dueDate) {
					validationErrors.push(`Month ${rent.month}: Due date is required`);
				}
				// Validate due date format and ensure it's first day of month
				const dueDate = new Date(rent.dueDate + 'T00:00:00');
				if (isNaN(dueDate.getTime())) {
					validationErrors.push(`Month ${rent.month}: Invalid due date format`);
				}

				// Validate that the due date is within the correct month
				const selectedDate = new Date(rent.dueDate + 'T00:00:00');
				const expectedMonth = rent.month;
				const expectedYear = selectedYear;

				if (
					selectedDate.getMonth() + 1 !== expectedMonth ||
					selectedDate.getFullYear() !== expectedYear
				) {
					console.log(
						`⚠️ Due date ${rent.dueDate} is not in month ${expectedMonth}/${expectedYear}`
					);
					validationErrors.push(
						`Month ${rent.month}: Due date must be in ${getMonthName(expectedMonth)} ${expectedYear}`
					);
				}
			}
		});

		if (validationErrors.length > 0) {
			toast.error('Validation Error', {
				description: validationErrors.join(', ')
			});
			return;
		}

		isLoading = true;
		try {
			const formData = new FormData();
			formData.append('leaseId', lease.id.toString());
			formData.append('year', selectedYear.toString());
			formData.append('monthlyRents', JSON.stringify(monthlyRents));

			console.log('📤 Sending data to server:', {
				leaseId: lease.id,
				year: selectedYear,
				activeMonths: monthlyRents.filter((r) => r.isActive).map((r) => r.month),
				dueDates: monthlyRents
					.filter((r) => r.isActive)
					.map((r) => ({ month: r.month, dueDate: r.dueDate }))
			});

			const response = await fetch('?/manageRentBillings', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();
			console.log('📥 Server response:', result);

			if (!response.ok || result.success === false) {
				throw new Error(result.message || 'Failed to save changes.');
			}

			const activeCount = monthlyRents.filter((r) => r.isActive).length;
			toast.success('Success', {
				description: `Updated ${activeCount} rent billing${activeCount !== 1 ? 's' : ''} for ${selectedYear}`
			});

			// Force refresh of all lease data
			await invalidateAll();

			// Reset original data to current state after successful save
			originalMonthlyRents = JSON.parse(JSON.stringify(monthlyRents));
			hasUnsavedChanges = false;
			onOpenChange(false);
		} catch (err) {
			toast.error('Save Failed', {
				description: err instanceof Error ? err.message : 'An unknown error occurred.'
			});
		} finally {
			isLoading = false;
		}
	};

	const changeYear = (offset: number) => {
		if (hasUnsavedChanges) {
			const confirmed = confirm(
				'You have unsaved changes. Are you sure you want to change the year?'
			);
			if (!confirmed) return;
		}
		selectedYear += offset;
		fetchBillingsForYear(selectedYear);
	};

	// Allow flexible due date selection
	const handleDueDateChange = (rent: MonthlyRent, newDate: string) => {
		if (newDate) {
			console.log(`📅 Changing due date for month ${rent.month} to ${newDate}`);
			rent.dueDate = newDate;
			markAsChanged();
		}
	};

	// Handle checkbox changes to set default due date when activating
	const handleActiveChange = (rent: MonthlyRent, isActive: boolean) => {
		console.log(`🔄 Toggling month ${rent.month} to ${isActive ? 'active' : 'inactive'}`);
		console.log(`🔍 Current hasUnsavedChanges before: ${hasUnsavedChanges}`);

		if (isActive) {
			// Set to first day of the month when activating (but allow changes)
			if (!rent.dueDate) {
				rent.dueDate = getFirstDayOfMonth(selectedYear, rent.month);
				console.log(`📅 Set default due date for month ${rent.month} to ${rent.dueDate}`);
			}
			// Set default rent amount if not already set
			if (!rent.amount || rent.amount === 0) {
				rent.amount = lease.rent_amount || 0;
				console.log(`💰 Set amount for month ${rent.month} to ${rent.amount}`);
			}

			//   // Show immediate feedback
			//   toast.success(`Month ${getMonthName(rent.month)} enabled`, {
			//     description: `Rent: ₱${rent.amount.toLocaleString()}, Due: ${rent.dueDate}`
			//   });
			// } else {
			//   // Show feedback when disabling
			//   toast.info(`Month ${getMonthName(rent.month)} disabled`, {
			//     description: 'Click "Save Changes" to remove the billing'
			//   });
		}

		markAsChanged();
		console.log(`✅ Month ${rent.month} state updated. Has changes: ${hasUnsavedChanges}`);
	};

	// Handle amount changes
	const handleAmountChange = (rent: MonthlyRent, newAmount: number) => {
		rent.amount = newAmount;
		markAsChanged();
	};

	// Handle modal close with unsaved changes warning
	const handleClose = () => {
		if (hasUnsavedChanges) {
			const confirmed = confirm('You have unsaved changes. Are you sure you want to close?');
			if (!confirmed) return;
		}
		onOpenChange(false);
	};
</script>

<Dialog {open} onOpenChange={handleClose}>
	<DialogContent class="max-w-2xl">
		<DialogHeader class="pb-3">
			<DialogTitle class="text-lg">Rent Manager - {lease.name}</DialogTitle>
			<DialogDescription class="text-sm">
				Manage monthly rent billings. Select year and enable/disable or modify rent for each month.
				{#if hasUnsavedChanges}
					<span class="text-orange-600 font-medium"> • You have unsaved changes</span>
				{/if}
			</DialogDescription>
		</DialogHeader>

		<div class="flex items-center justify-center space-x-3 py-2">
			<Button variant="outline" size="sm" onclick={() => changeYear(-1)}>&lt;</Button>
			<span class="text-lg font-semibold w-20 text-center">{selectedYear}</span>
			<Button variant="outline" size="sm" onclick={() => changeYear(1)}>&gt;</Button>
		</div>

		{#if isLoading}
			<div class="text-center py-4 text-sm text-muted-foreground">Loading...</div>
		{:else if error}
			<div class="text-center py-4 text-sm text-red-500">{error}</div>
		{:else}
			<div class="max-h-[50vh] overflow-y-auto px-1">
				{#each monthlyRents as rent, i (rent.month)}
					<div
						class="border-b last:border-b-0 p-2 flex items-center gap-3"
						class:opacity-50={!rent.isActive}
					>
						<Checkbox
							bind:checked={rent.isActive}
							onclick={() => {
								// Small delay to ensure the binding has updated
								setTimeout(() => {
									handleActiveChange(rent, rent.isActive);
								}, 0);
							}}
						/>
						<div class="min-w-[80px]">
							<Label class="font-medium text-sm">{getMonthName(rent.month)}</Label>
						</div>
						<div class="flex items-center gap-1">
							<Label for={`amount-${i}`} class="text-xs text-muted-foreground">₱</Label>
							<Input
								id={`amount-${i}`}
								type="number"
								bind:value={rent.amount}
								onchange={() => markAsChanged()}
								disabled={!rent.isActive}
								class="h-7 w-20 text-sm {!rent.isActive ? 'cursor-default' : ''}"
								placeholder="0"
							/>
						</div>
						<div class="flex items-center gap-1">
							<Label for={`due-date-${i}`} class="text-xs text-muted-foreground">Due:</Label>
							<DatePicker
								bind:value={rent.dueDate}
								placeholder={getFirstDayOfMonth(selectedYear, rent.month)}
								id={`due-date-${i}`}
								name={`due-date-${i}`}
								disabled={!rent.isActive}
								label=""
								onChange={(newDate) => {
									if (newDate) {
										handleDueDateChange(rent, newDate);
									}
								}}
							/>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<DialogFooter class="pt-3">
			{#if hasUnsavedChanges}
				<div class="text-sm text-muted-foreground mr-auto">
					{#if monthlyRents.filter((r) => r.isActive).length > 0}
						<span class="text-green-600">
							{monthlyRents.filter((r) => r.isActive).length} month{monthlyRents.filter(
								(r) => r.isActive
							).length !== 1
								? 's'
								: ''} will be billed
						</span>
					{/if}
					{#if monthlyRents.filter((r) => !r.isActive && r.billingId).length > 0}
						<span class="text-red-600 ml-2">
							{monthlyRents.filter((r) => !r.isActive && r.billingId).length} billing{monthlyRents.filter(
								(r) => !r.isActive && r.billingId
							).length !== 1
								? 's'
								: ''} will be removed
						</span>
					{/if}
				</div>
			{/if}
			<Button variant="outline" size="sm" onclick={handleClose}>Cancel</Button>
			<Button size="sm" onclick={handleSaveChanges} disabled={isLoading || !hasUnsavedChanges}>
				{#if isLoading}Saving...{:else}Save Changes{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
