<script lang="ts">
	// Main page script for utility billings
	import { superForm } from 'sveltekit-superforms/client';
	import { defaults } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { Button } from '$lib/components/ui/button';
	import * as Alert from '$lib/components/ui/alert';
	import { Check, RefreshCw, Download, BarChart, Loader2 } from 'lucide-svelte';
	import { tick } from 'svelte';
	import { toast } from 'svelte-sonner';

	// Import components
	import ReadingFiltersPanel from './ReadingFiltersPanel.svelte';
	import ReadingEntryModal from './ReadingEntryModal.svelte';
	import ExportDialog from './ExportDialog.svelte';
	import SummaryStatistics from './SummaryStatistics.svelte';
	import ConsolidatedReadingsTable from './ConsolidatedReadingsTable.svelte';
	import TenantShareModal from './TenantShareModal.svelte';
	import PrintPreviewModal from './PrintPreviewModal.svelte';
	import BillingPeriodsGraphModal from './BillingPeriodsGraphModal.svelte';
	import UtilityBillingSkeleton from './UtilityBillingSkeleton.svelte';

	// Import types
	import { propertyStore } from '$lib/stores/property';
	import type {
		Reading,
		Meter,
		Property,
		MeterReadingEntry,
		FilterChangeEvent,
		ReadingSaveEvent,
		ExportEvent,
		MeterData,
		Filters,
		ShareData
	} from './types';

	// Import processing function
	import { processUtilityBillingsData } from './dataProcessor';

	// RxDB local-first imports
	import {
		propertiesStore,
		metersStore,
		readingsStore,
		billingsStore,
		leasesStore,
		leaseTenantsStore,
		tenantsStore,
		rentalUnitsStore
	} from '$lib/stores/collections.svelte';
	import { resyncUtilityData } from '$lib/db/optimistic-utility-billings';
	import SyncErrorBanner from '$lib/components/sync/SyncErrorBanner.svelte';

	// ─── Loading state from RxDB initialization ────────────────────────
	let isLoading = $derived(
		!metersStore.initialized || !readingsStore.initialized ||
		!billingsStore.initialized || !leasesStore.initialized ||
		!propertiesStore.initialized || !rentalUnitsStore.initialized ||
		!leaseTenantsStore.initialized || !tenantsStore.initialized
	);

	// ─── Process data from RxDB stores using the existing dataProcessor ─
	let processedData = $derived.by(() => {
		if (isLoading) return {
			properties: [], meters: [], readings: [], allReadings: [],
			availableReadingDates: [], rental_unitTenantCounts: {},
			leases: [], meterLastBilledDates: {},
			leaseMeterBilledDates: {}, actualBilledDates: {},
			previousReadingGroups: []
		};

		// Transform RxDB data to match the format expected by processUtilityBillingsData
		const propertiesData = [...propertiesStore.value]
			.sort((a: any, b: any) => a.name.localeCompare(b.name))
			.map((p: any) => ({ id: Number(p.id), name: p.name }));

		// Map lookups for O(1) joins
		const unitMap = new Map<string, any>();
		for (const u of rentalUnitsStore.value) unitMap.set(String(u.id), u);
		const tenantMap = new Map<string, any>();
		for (const t of tenantsStore.value) tenantMap.set(String(t.id), t);
		const meterMap = new Map<string, any>();
		for (const m of metersStore.value) meterMap.set(String(m.id), m);

		const metersData = metersStore.value.map((m: any) => ({
			id: Number(m.id),
			name: m.name,
			type: m.type,
			propertyId: m.property_id ? Number(m.property_id) : null,
			initialReading: m.initial_reading,
			rental_unit: m.rental_unit_id ? (() => {
				const unit = unitMap.get(String(m.rental_unit_id));
				return unit ? { id: Number(unit.id), name: unit.name, number: unit.number } : null;
			})() : null
		}));

		const readingsData = [...readingsStore.value]
			.sort((a: any, b: any) => new Date(a.reading_date).getTime() - new Date(b.reading_date).getTime())
			.map((r: any) => ({
				id: Number(r.id),
				meter_id: Number(r.meter_id),
				reading: r.reading,
				reading_date: r.reading_date,
				rate_at_reading: r.rate_at_reading,
				review_status: r.review_status
			}));

		const utilityBillings = billingsStore.value
			.filter((b: any) => b.type === 'UTILITY' && b.meter_id)
			.map((b: any) => ({
				meter_id: Number(b.meter_id),
				lease_id: Number(b.lease_id),
				billing_date: b.billing_date,
				amount: b.amount
			}));

		const availableReadingDates = readingsStore.value.map((r: any) => ({
			reading_date: r.reading_date
		}));

		// Tenant counts from active leases
		const tenantCounts = leasesStore.value
			.filter((l: any) => l.status === 'ACTIVE')
			.flatMap((l: any) => {
				const lts = leaseTenantsStore.value.filter((lt: any) => String(lt.lease_id) === String(l.id));
				return lts.map((lt: any) => ({
					rental_unit_id: l.rental_unit_id,
					tenants: [{ id: Number(lt.tenant_id) }]
				}));
			});

		// Leases with rental unit and tenant info
		const leasesData = leasesStore.value.map((l: any) => {
			const unit = unitMap.get(String(l.rental_unit_id));
			const ltDocs = leaseTenantsStore.value.filter((lt: any) => String(lt.lease_id) === String(l.id));
			const lease_tenants_list = ltDocs.map((lt: any) => {
				const tenant = tenantMap.get(String(lt.tenant_id));
				return tenant ? {
					tenants: { id: Number(tenant.id), full_name: tenant.name, tenant_status: tenant.tenant_status }
				} : null;
			}).filter(Boolean);

			return {
				...l,
				id: Number(l.id),
				rentalUnitId: l.rental_unit_id,
				rental_unit: unit ? {
					id: Number(unit.id), name: unit.name, number: unit.number,
					type: unit.type, floor_id: unit.floor_id, property_id: unit.property_id
				} : null,
				lease_tenants: lease_tenants_list
			};
		});

		// All readings with meter info (for pending review)
		const allReadingsData = readingsStore.value.map((r: any) => {
			const meter = meterMap.get(String(r.meter_id));
			return {
				id: Number(r.id),
				meter_id: Number(r.meter_id),
				reading: r.reading,
				reading_date: r.reading_date,
				rate_at_reading: r.rate_at_reading,
				review_status: r.review_status,
				meters: meter ? { id: Number(meter.id), name: meter.name, type: meter.type, property_id: meter.property_id ? Number(meter.property_id) : null } : null
			};
		});

		return processUtilityBillingsData(
			propertiesData, metersData, readingsData, utilityBillings,
			availableReadingDates, tenantCounts, leasesData, allReadingsData
		);
	});

	// Form handling
	const { form, errors, enhance, delayed, message } = superForm(defaults(zod(batchReadingsSchema)), {
		resetForm: true,
		onResult: ({ result }) => {
			if (result.type === 'success') {
				modals.reading = false; // Close modal on success
				showSuccessMessage = true;
				// Save preferences to localStorage
				try {
					if (filters.type) localStorage.setItem(LS_LAST_UTILITY_TYPE, filters.type);
					if (readingEntry.costPerUnit) localStorage.setItem(LS_LAST_COST_PER_UNIT, String(readingEntry.costPerUnit));
				} catch {}
				// Rich success toast
				const readingCount = readingEntry.meterReadings.filter(r => r.currentReading !== null).length;
				const typeLabel = readingEntry.utilityType ? readingEntry.utilityType.charAt(0) + readingEntry.utilityType.slice(1).toLowerCase() : 'Utility';
				toast.success(`${readingCount} ${typeLabel} reading${readingCount !== 1 ? 's' : ''} saved`, {
					description: `Date: ${readingEntry.readingDate} — Rate: ${readingEntry.costPerUnit}/unit`
				});
				// Resync readings and meters after successful batch add
				resyncUtilityData();
				setTimeout(() => {
					showSuccessMessage = false;
				}, 3000);
			}
		}
	});

	// Global state
	let selectedProperty = $derived($propertyStore.selectedProperty);

	// UI state
	let showSuccessMessage = $state(false);

	// localStorage preference keys
	const LS_LAST_UTILITY_TYPE = 'dorm:utility-billings:lastType';
	const LS_LAST_COST_PER_UNIT = 'dorm:utility-billings:lastCostPerUnit';

	function getLastType(): string {
		try { return localStorage.getItem(LS_LAST_UTILITY_TYPE) ?? ''; } catch { return ''; }
	}
	function getLastCost(): number {
		try { return Number(localStorage.getItem(LS_LAST_COST_PER_UNIT)) || 0; } catch { return 0; }
	}

	// Grouped state for reading entry modal
	let readingEntry = $state({
		utilityType: '',
		meterReadings: [] as MeterReadingEntry[],
		readingDate: new Date().toISOString().split('T')[0],
		costPerUnit: 0
	});

	// Grouped state for filters (pre-fill type from localStorage)
	let filters = $state({
		searchQuery: '',
		date: '',
		type: getLastType() || null as string | null
	});

	// Grouped state for modal visibility
	let modals = $state({
		reading: false,
		export: false,
		tenantShare: false,
		printPreview: false,
		billingGraph: false
	});

	// Grouped state for tenant sharing
	let tenantShare = $state({
		selectedMeter: null as MeterData | null,
		dataForPreview: [] as ShareData[],
		selectedReading: null as MeterData | null
	});

	// State for export dialog
	let fromDate = $state('');
	let toDate = $state('');
	let exportFormat = $state('csv');

	// Initialize form data
	$effect(() => {
		($form as any).cost_per_unit = readingEntry.costPerUnit;
		($form as any).property_id = selectedProperty?.id.toString();
		$form.type = filters.type as typeof $form.type;
		$form.reading_date = readingEntry.readingDate;
	});

	// Data sources - use processed data
	const allProperties = $derived(processedData.properties);
	const allMeters = $derived(processedData.meters);
	const allReadings = $derived((processedData as any).allReadings || []); // ALL readings for pending review
	const displayReadings = $derived(processedData.readings || []); // Filtered readings for display
	const availableDates = $derived(processedData.availableReadingDates);

	let leases = $derived(processedData.leases);

	// Returns the most recent reading for a given meter
	function getPreviousReading(meterId: number): { reading: number | null; date: string | null } {
		const readings = allReadings
			.filter((r: Reading) => r.meter_id === meterId)
			.sort(
				(a: Reading, b: Reading) =>
					new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime()
			);
		return readings.length > 0
			? { reading: readings[0].reading, date: readings[0].reading_date }
			: { reading: null, date: null };
	}

	// Type for pending review groups
	type PendingReviewGroup = {
		date: string;
		readings: Reading[];
	};

	// Pending review grouping
	let pendingReviewGroups = $derived.by(() => {
		const pending: Reading[] = allReadings.filter((r: Reading) => r.review_status === 'PENDING_REVIEW');
		const byDate: Record<string, Reading[]> = {};
		for (const r of pending) {
			const key = r.reading_date;
			(byDate[key] ||= []).push(r);
		}
		return Object.entries(byDate).map(([date, readings]): PendingReviewGroup => ({ date, readings }));
	});

	let hasPendingReview = $derived.by(() => {
		if (!allReadings || !Array.isArray(allReadings)) {
			return false;
		}

		return allReadings.some((r: Reading) => r.review_status === 'PENDING_REVIEW');
	});

	async function approveGroup(readingIds: number[]) {
		try {
			const form = new FormData();
			form.append('reading_ids', JSON.stringify(readingIds));
			const res = await fetch('?/approvePendingReadings', { method: 'POST', body: form });
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data?.error || 'Failed to approve readings');
			}
			toast.success(`${readingIds.length} reading${readingIds.length !== 1 ? 's' : ''} approved`, {
				description: 'Readings are now confirmed and billable'
			});
			resyncUtilityData();
		} catch (e: any) {
			toast.error(e?.message || 'Failed to approve readings');
		}
	}

	async function rejectGroup(readingIds: number[]) {
		try {
			const form = new FormData();
			form.append('reading_ids', JSON.stringify(readingIds));
			const res = await fetch('?/rejectPendingReadings', { method: 'POST', body: form });
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data?.error || 'Failed to reject readings');
			}
			toast.success(`${readingIds.length} reading${readingIds.length !== 1 ? 's' : ''} rejected`, {
				description: 'Rejected readings will not be billed'
			});
			resyncUtilityData();
		} catch (e: any) {
			toast.error(e?.message || 'Failed to reject readings');
		}
	}

	// Event handlers
	const activeFilters: Filters = $derived({
		property: selectedProperty,
		type: filters.type,
		date: filters.date,
		search: filters.searchQuery
	});

	// Open the modal and initialize meter readings based on selected property and type
	function openReadingModal() {
		if (!selectedProperty) return;

		const metersForProperty = allMeters.filter(
			(meter: Meter) => meter.property_id === selectedProperty.id
		);

		let metersToUpdate = metersForProperty;
		if (filters.type) {
			metersToUpdate = metersForProperty.filter(
				(meter: Meter) => meter.type && meter.type.toUpperCase() === filters.type!.toUpperCase()
			);
		}

		// Populate the centralized state object
		readingEntry.utilityType = filters.type || '';
		readingEntry.meterReadings = metersToUpdate.map((meter: Meter) => {
			const { reading: previousReading, date: previousDate } = getPreviousReading(meter.id);
			return {
				meterId: meter.id,
				meterName: meter.name,
				previousReading,
				previousDate,
				currentReading: null,
				consumption: null,
				cost: null,
				initialReading: meter.initial_reading
			};
		});
		readingEntry.readingDate = new Date().toISOString().split('T')[0];
		readingEntry.costPerUnit = getLastCost();

		modals.reading = true;
	}

	function openTenantShareModal(meter: MeterData) {
		// Create a new object to ensure reactivity
		tenantShare.selectedReading = { ...meter };
		tenantShare.selectedMeter = { ...meter };
		// Use requestAnimationFrame to ensure state is updated before showing modal
		requestAnimationFrame(() => {
			modals.tenantShare = true;
		});
	}

	function handleGeneratePreview(data: ShareData[]) {
		tenantShare.dataForPreview = data;
		// Close the tenant share modal before opening the print preview
		modals.tenantShare = false;
		// Use a timeout to ensure the first modal has closed before opening the next
		setTimeout(() => {
			modals.printPreview = true;
		}, 150);
	}

	function handleBackToTenantShare() {
		modals.printPreview = false;
		modals.tenantShare = true;
	}

	function handlePrint() {
		// TODO: Implement printing functionality
	}

	async function handleSaveReadings(event: ReadingSaveEvent) {
		const { readings, costPerUnit, readingDate } = event;

		// Update the form state with the latest data from the modal
		$form.readings_json = JSON.stringify(readings);
		($form as any).cost_per_unit = costPerUnit;
		$form.reading_date = readingDate;
		$form.type = filters.type as typeof $form.type;

		// Wait for the DOM to update with the new form values
		await tick();

		(
			document.querySelector('form[action="?/addBatchReadings"]') as HTMLFormElement
		)?.requestSubmit();
	}

	function resetFilters() {
		filters.type = null;
		filters.date = '';
		filters.searchQuery = '';
	}

	function handleExport(data: ExportEvent) {
		const { format, fromDate, toDate } = data;
		modals.export = false;
		toast.success(`Export in ${format.toUpperCase()} format initiated!`);
	}

	// Get utility billing types from data
	import { utilityBillingTypeEnum, batchReadingsSchema } from './meterReadingSchema';
</script>

<div class="container mx-auto py-6">
	<SyncErrorBanner collections={['meters', 'readings', 'billings', 'leases', 'properties', 'tenants', 'rental_units']} />
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-4 gap-2">
		<h1 class="text-2xl sm:text-3xl font-bold">Utility Readings Management</h1>

		<div class="flex items-center gap-2"></div>
	</div>

	{#if showSuccessMessage}
		<Alert.Root class="mb-6 bg-green-50 border-green-200">
			<Check class="h-5 w-5 mr-2 text-green-500" />
			<Alert.Title>Readings saved successfully!</Alert.Title>
		</Alert.Root>
	{/if}

	<!-- Always show Filters Panel -->
	<ReadingFiltersPanel
		availableReadingDates={availableDates}
		utilityTypes={utilityBillingTypeEnum.enum}
		{selectedProperty}
		bind:filters
		addReadings={openReadingModal}
	/>

	<!-- Pending Review Card -->
	{#if hasPendingReview}
		<div class="mt-6 p-4 border rounded-lg bg-amber-50 border-amber-200">
			<h2 class="text-lg font-semibold text-amber-800 mb-2">Pending Review</h2>
			<div class="space-y-3">
				{#each pendingReviewGroups as group (group.date)}
					<div class="p-3 bg-white border rounded">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm text-gray-600">Date</p>
								<p class="font-medium">{new Date(group.date).toLocaleDateString()}</p>
							</div>
							<div class="flex items-center gap-2">
								<Button variant="outline" class="min-h-[44px]" onclick={() => rejectGroup(group.readings.map((r) => r.id))}>Reject</Button>
								<Button class="min-h-[44px]" onclick={() => approveGroup(group.readings.map((r) => r.id))}>Approve</Button>
							</div>
						</div>
						<div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
							{#each group.readings as r}
								<div class="p-2 border rounded text-sm">
									<div class="flex items-center justify-between">
										<span>{r.meters?.name || `Meter #${r.meter_id}`}</span>
										<span class="text-gray-600">{r.reading}{r.meters?.type ? ` (${r.meters.type.charAt(0) + r.meters.type.slice(1).toLowerCase()})` : ''}</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<TenantShareModal
		bind:open={modals.tenantShare}
		reading={tenantShare.selectedMeter}
		leases={processedData.leases}
		leaseMeterBilledDates={processedData.leaseMeterBilledDates}
		actualBilledDates={processedData.actualBilledDates}
		generatePreview={handleGeneratePreview}
		close={() => {
			modals.tenantShare = false;
			tenantShare.selectedMeter = null;
		}}
	/>

	<PrintPreviewModal
		bind:open={modals.printPreview}
		reading={tenantShare.selectedReading}
		data={tenantShare.dataForPreview}
		onBack={handleBackToTenantShare}
		close={() => (modals.printPreview = false)}
	/>

	<form method="POST" action="?/addBatchReadings" use:enhance>
		<input type="hidden" name="type" bind:value={$form.type} />
		<input type="hidden" name="cost_per_unit" bind:value={($form as any).cost_per_unit} />
		<input type="hidden" name="reading_date" bind:value={$form.reading_date} />
		<input type="hidden" name="readings_json" bind:value={$form.readings_json} />
		{#if modals.reading && selectedProperty}
			<ReadingEntryModal
				bind:open={modals.reading}
				property={selectedProperty}
				utilityType={readingEntry.utilityType}
				meters={allMeters}
				meterReadings={readingEntry.meterReadings}
				readingDate={readingEntry.readingDate}
				costPerUnit={readingEntry.costPerUnit}
				onSave={handleSaveReadings}
				close={() => (modals.reading = false)}
				form={defaults(zod(batchReadingsSchema))}
			/>
		{/if}
	</form>

	<ExportDialog
		bind:open={modals.export}
		bind:fromDate
		bind:toDate
		bind:exportFormat
		onexport={handleExport}
		onclose={() => (modals.export = false)}
	/>

	<BillingPeriodsGraphModal
		bind:open={modals.billingGraph}
		readings={displayReadings}
		meters={allMeters}
		properties={allProperties}
		close={() => (modals.billingGraph = false)}
	/>

	<!-- Main Content -->
	<div class="space-y-6 mt-6">
		<!-- Readings Display Section -->
		<div class="space-y-4">
			<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<h2 class="text-xl font-semibold">Meter Readings</h2>

				<div class="flex items-center gap-2 w-full sm:w-auto">
					<!-- Graph Analysis button -->
					<Button
						variant="outline"
						onclick={() => (modals.billingGraph = true)}
						class="flex items-center gap-2 min-h-[44px]"
						disabled={displayReadings.length === 0}
					>
						<BarChart class="h-4 w-4 mr-1" />
						Graph Analysis
					</Button>

					<!-- Export button -->
					<Button
						variant="outline"
						onclick={() => (modals.export = true)}
						class="flex items-center gap-2 min-h-[44px]"
						disabled={displayReadings.length === 0}
					>
						<Download class="h-4 w-4 mr-1" />
						Export Data
					</Button>
				</div>
			</div>

			{#if isLoading}
				<UtilityBillingSkeleton />
			{:else}
				<ConsolidatedReadingsTable
					readings={displayReadings}
					meters={allMeters}
					properties={allProperties}
					filters={activeFilters}
					onShareReading={openTenantShareModal}
					meterLastBilledDates={processedData.meterLastBilledDates}
					actualBilledDates={processedData.actualBilledDates}
					leaseMeterBilledDates={processedData.leaseMeterBilledDates}
					leases={processedData.leases}
				/>
			{/if}
		</div>
	</div>

	<!-- Summary Statistics -->
	{#if !isLoading}
		<SummaryStatistics readings={displayReadings} meters={allMeters} readingDates={availableDates} />
	{/if}
</div>
