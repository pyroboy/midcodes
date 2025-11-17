<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import * as Checkbox from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Search } from 'lucide-svelte';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import type { Lease, Tenant, Reading, ShareData, MeterData } from './types';
	import Fuse from 'fuse.js';
	import * as Table from '$lib/components/ui/table';

	type Props = {
		open: boolean;
		close: () => void;
		generatePreview: (data: ShareData[]) => void;
		reading: MeterData | null;
		leases: Lease[];
		leaseMeterBilledDates?: Record<string, string>;
		actualBilledDates?: Record<string, string[]>;
	};

	type View = 'tenants' | 'history';

	let {
		open = $bindable(),
		close,
		generatePreview,
		reading,
		leases = [],
		leaseMeterBilledDates = {},
		actualBilledDates = {}
	}: Props = $props();

	let view: View = $state('tenants');
	let selectedLeases = $state(new Set<number>()); // Store selected lease IDs
	let selectedTenants = $state(new Set<string>()); // Store selected tenant IDs (leaseId-tenantId)
	let searchQuery = $state(reading?.meterName ?? '');

	// Filter leases based on meter location
	const filteredLeases = $derived(() => {
		if (!reading) return leases;

		// Filter leases based on the meter's location type and IDs
		return leases.filter((lease) => {
			if (!lease || !lease.rental_unit) return false;

			// Use the meter's location_type to determine filtering logic
			switch (reading.location_type) {
				case 'RENTAL_UNIT':
					// Only show leases for the specific rental unit
					return lease.rental_unit_id === reading.rental_unit_id;
					
				case 'FLOOR':
					// Show leases for all rental units on the same floor
					// Show leases for all rental units on the same floor
					if (reading.floor_id && lease.rental_unit) {
						return lease.rental_unit.floor_id === reading.floor_id;
					}
					return false;
					
				case 'PROPERTY':
					// Show leases for all rental units in the same property
					if (reading.property_id && lease.rental_unit) {
						return lease.rental_unit.property_id === reading.property_id;
					}
					return false;
					
				default:
					// Fallback: if location_type is not set or unknown, use hierarchical logic
					if (reading.rental_unit_id) {
						return lease.rental_unit_id === reading.rental_unit_id;
					} else if (reading.floor_id && lease.rental_unit) {
						return lease.rental_unit.floor_id === reading.floor_id;
					} else if (reading.property_id && lease.rental_unit) {
						return lease.rental_unit.property_id === reading.property_id;
					}
					return true; // Show all if no location info
			}
		});
	});

	// Convert leases to display items (one item per lease, not per tenant)
	const flatLeaseList = $derived(
		filteredLeases()
			.filter((lease) => lease)
			.filter((lease) => {
				// Only show leases that have at least one active tenant
				const activeTenants = (lease.tenants || []).filter((tenant) => 
					tenant.tenant_status !== 'INACTIVE' && 
					tenant.tenant_status !== 'TERMINATED' &&
					tenant.tenant_status !== 'ARCHIVED'
				);
				return activeTenants.length > 0;
			})
			.map((lease) => {
				const activeTenants = (lease.tenants || []).filter((tenant) => 
					tenant.tenant_status !== 'INACTIVE' && 
					tenant.tenant_status !== 'TERMINATED' &&
					tenant.tenant_status !== 'ARCHIVED'
				);

				return {
					leaseId: lease.id,
					leaseName: lease.name,
					roomName: lease.roomName || 'Unknown Room',
					leaseStatus: lease.status,
					tenantCount: activeTenants.length,
					activeTenants: activeTenants,
					// Check if this lease has mixed tenant statuses
					hasArchivedTenants: (lease.tenants || []).some(t => t.tenant_status === 'ARCHIVED'),
					hasActiveTenants: (lease.tenants || []).some(t => t.tenant_status === 'ACTIVE')
				};
			})
	);

	// Convert leases to individual tenant items for selection
	const flatTenantList = $derived(
		flatLeaseList.flatMap((leaseItem) => 
			leaseItem.activeTenants.map((tenant) => ({
				leaseId: leaseItem.leaseId,
				leaseName: leaseItem.leaseName,
				roomName: leaseItem.roomName,
				leaseStatus: leaseItem.leaseStatus,
				tenant: tenant,
				tenantStatus: tenant.tenant_status,
				hasArchivedTenants: leaseItem.hasArchivedTenants,
				hasActiveTenants: leaseItem.hasActiveTenants
			}))
		)
	);

	// Smart search function that recognizes patterns
	function smartSearch(query: string, list: typeof flatTenantList) {
		if (!query.trim()) return list;
		
		const lowerQuery = query.toLowerCase().trim();
		
		// Floor pattern matching (2f, 3f, floor 2, 2nd floor, etc.)
		const floorPatterns = [
			/^(\d+)f$/i,                    // "2f", "3f"
			/^floor\s+(\d+)$/i,            // "floor 2", "floor 3"
			/^(\d+)(st|nd|rd|th)\s+floor$/i, // "2nd floor", "3rd floor"
			/^f(\d+)$/i,                   // "f2", "f3"
		];
		
		// Combined pattern matching (2f room 1, floor 2 r3, etc.)
		const combinedPatterns = [
			/^(\d+)f\s+(room\s+)?(r)?(\d+)$/i,           // "2f room 1", "2f r1", "2f 1"
			/^floor\s+(\d+)\s+(room\s+)?(r)?(\d+)$/i,   // "floor 2 room 1", "floor 2 r1"
			/^f(\d+)\s+(room\s+)?(r)?(\d+)$/i,          // "f2 room 1", "f2 r1"
		];
		
		// Function to filter by floor number (strict floor filtering)
		function filterByFloor(floorNum: string, items: typeof list) {
			return items.filter(item => {
				const roomName = item.roomName.toLowerCase();
				// Strict floor matching - only show items from this specific floor
				return roomName.includes(`${floorNum}f`) || 
					   roomName.includes(`floor ${floorNum}`) ||
					   roomName.includes(`${floorNum}nd floor`) ||
					   roomName.includes(`${floorNum}rd floor`) ||
					   roomName.includes(`${floorNum}th floor`) ||
					   roomName.includes(`${floorNum}st floor`) ||
					   roomName.match(new RegExp(`^${floorNum}\\d+`, 'i')); // e.g., "201", "301" for floor 2, 3
			});
		}
		
		// Check for combined patterns first (floor + room) - locked to specific floor
		for (const pattern of combinedPatterns) {
			const match = lowerQuery.match(pattern);
			if (match) {
				const floorNum = match[1];
				const roomNum = match[4];
				
				// First filter by floor to lock to that floor only
				const floorFiltered = filterByFloor(floorNum, list);
				
				// Then filter by room within that floor using STRICT room matching
				return floorFiltered.filter(item => {
					const roomName = item.roomName.toLowerCase();
					const leaseName = item.leaseName.toLowerCase();
					
					// STRICT room matching - only exact room number matches
					const exactRoomPatterns = [
						new RegExp(`\\broom\\s+${roomNum}\\b`, 'i'),     // "room 2"
						new RegExp(`\\br${roomNum}\\b`, 'i'),           // "r2"
						new RegExp(`\\bunit\\s+${roomNum}\\b`, 'i'),    // "unit 2"
						new RegExp(`\\bu${roomNum}\\b`, 'i'),           // "u2"
						new RegExp(`\\s${roomNum}\\s`, 'i'),           // " 2 " (surrounded by spaces)
						new RegExp(`\\s${roomNum}$`, 'i'),              // ends with " 2"
						new RegExp(`^${roomNum}\\s`, 'i'),              // starts with "2 "
						new RegExp(`-${roomNum}\\b`, 'i'),              // "-2" (dash separator)
						new RegExp(`\\b${roomNum}-`, 'i'),              // "2-" (dash separator)
					];
					
					return exactRoomPatterns.some(pattern => 
						pattern.test(roomName) || pattern.test(leaseName)
					);
				});
			}
		}
		
		// Check for floor-only patterns - STRICT floor filtering (no mixing)
		for (const pattern of floorPatterns) {
			const match = lowerQuery.match(pattern);
			if (match) {
				const floorNum = match[1];
				// Return ONLY results from this specific floor
				return filterByFloor(floorNum, list);
			}
		}
		
		// Room-specific patterns (STRICT - lock to specific room)
		const roomSpecificPatterns = [
			/^room\s+(\d+)$/i,             // "room 1", "room 10"
			/^r(\d+)$/i,                   // "r1", "r10"
			/^unit\s+(\d+)$/i,             // "unit 1", "unit 10"
			/^u(\d+)$/i,                   // "u1", "u10"
		];
		
		// Check for room-specific patterns (STRICT - only that room number)
		for (const pattern of roomSpecificPatterns) {
			const match = lowerQuery.match(pattern);
			if (match) {
				const roomNum = match[1] || match[0]; // Handle both captured group and full match
				return list.filter(item => {
					const roomName = item.roomName.toLowerCase();
					const leaseName = item.leaseName.toLowerCase();
					
					// STRICT room matching - only exact room number matches
					// Check for exact room patterns to avoid partial matches
					const exactRoomPatterns = [
						new RegExp(`\\broom\\s+${roomNum}\\b`, 'i'),
						new RegExp(`\\br${roomNum}\\b`, 'i'),
						new RegExp(`\\bunit\\s+${roomNum}\\b`, 'i'),
						new RegExp(`\\bu${roomNum}\\b`, 'i'),
						new RegExp(`\\s${roomNum}$`, 'i'), // ends with room number
						new RegExp(`^${roomNum}\\s`, 'i'), // starts with room number
					];
					
					return exactRoomPatterns.some(pattern => 
						pattern.test(roomName) || pattern.test(leaseName)
					);
				});
			}
		}
		
		// Pure number pattern (can mix rooms/floors) - only when it's just a number
		const pureNumberPattern = /^(\d+)$/;
		const numberMatch = lowerQuery.match(pureNumberPattern);
		if (numberMatch) {
			const num = numberMatch[1];
			return list.filter(item => {
				const roomName = item.roomName.toLowerCase();
				const leaseName = item.leaseName.toLowerCase();
				// For pure numbers, allow broader matching across floors/rooms
				return roomName.includes(num) || leaseName.includes(num);
			});
		}
		
		// Fallback to fuzzy search for tenant names and other queries (can mix floors)
		const fuse = new Fuse(list, {
			keys: ['leaseName', 'roomName', 'tenant.full_name'],
			threshold: 0.6
		});
		
		return fuse.search(lowerQuery).map((result) => result.item);
	}

	const filteredList = $derived(
		smartSearch(searchQuery, flatTenantList)
	);

	function toggleLeaseSelection(
		leaseId: number,
		isChecked: boolean | 'indeterminate'
	) {
		if (isChecked === true) {
			selectedLeases.add(leaseId);
		} else {
			selectedLeases.delete(leaseId);
		}
		selectedLeases = new Set(selectedLeases);
	}

	function toggleTenantSelection(
		leaseId: number,
		tenantId: number,
		isChecked: boolean | 'indeterminate'
	) {
		const uniqueKey = `${leaseId}-${tenantId}`;
		if (isChecked === true) {
			selectedTenants.add(uniqueKey);
		} else {
			selectedTenants.delete(uniqueKey);
		}
		selectedTenants = new Set(selectedTenants);
	}

	function selectAllFiltered() {
		// Add all currently filtered tenants to selection
		filteredList.forEach((item) => {
			const uniqueKey = `${item.leaseId}-${item.tenant.id}`;
			selectedTenants.add(uniqueKey);
		});
		selectedTenants = new Set(selectedTenants);
	}

	function clearAllSelection() {
		selectedTenants.clear();
		selectedTenants = new Set(selectedTenants);
	}

	// Check if all filtered items are selected
	const allFilteredSelected = $derived(
		filteredList.length > 0 && filteredList.every((item) => 
			selectedTenants.has(`${item.leaseId}-${item.tenant.id}`)
		)
	);

	// Check if some (but not all) filtered items are selected
	const someFilteredSelected = $derived(
		filteredList.some((item) => 
			selectedTenants.has(`${item.leaseId}-${item.tenant.id}`)
		) && !allFilteredSelected
	);

	function handleGenerate() {
		if (!reading || selectedTenants.size === 0) return;

		const totalCost = reading.totalCost || 0;
		const sharePerTenant = totalCost / selectedTenants.size;

		const shareData = flatTenantList
			.filter((item) => selectedTenants.has(`${item.leaseId}-${item.tenant.id}`))
			.map((item) => ({
				tenant: item.tenant,
				lease: { id: item.leaseId, name: item.leaseName },
				share: sharePerTenant
			}));

		generatePreview(shareData);
	}

	function handleClose() {
		selectedTenants.clear();
		selectedLeases.clear();
		searchQuery = '';
		view = 'tenants';
		close();
	}

	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatNumber(value: number | null | undefined): string {
		if (value === null || value === undefined) return '-';
		return value.toLocaleString();
	}

	function formatCurrency(amount: number | null | undefined): string {
		if (amount === null || amount === undefined) return '-';
		return new Intl.NumberFormat('en-PH', {
			style: 'currency',
			currency: 'PHP',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount);
	}

	function getUnitLabel(type: string): string {
		switch (type.toUpperCase()) {
			case 'ELECTRICITY':
				return 'kWh';
			case 'WATER':
				return 'm³';
			case 'GAS':
				return 'm³';
			case 'INTERNET':
				return 'GB';
			case 'CABLE':
				return 'month';
			default:
				return 'unit';
		}
	}
</script>

<Dialog.Root {open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
	<Dialog.Content class="sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Tenant Share Calculation</Dialog.Title>
			{#if reading}
				<div class="p-4 rounded-xl bg-muted/40 border shadow-sm space-y-4">
					<div class="flex justify-center items-center gap-2 text-center">
						<h2 class="text-lg font-semibold">{reading.meterName}</h2>
						<span class="text-muted-foreground">–</span>
						<p class="text-sm text-muted-foreground">{formatDate(reading.lastReadingDate)}</p>
						<span class="text-muted-foreground">–</span>
						<p class="text-sm text-muted-foreground">{formatDate(reading.currentReadingDate)}</p>
					</div>

					<div class="grid grid-cols-2 divide-x divide-border text-sm">
						<div class="flex flex-col justify-center px-4 space-y-3">
							<div class="flex justify-between items-center">
								<span class="text-muted-foreground">Consumption</span>
								<span class="font-semibold">
									{formatNumber(reading.consumption)}
									{getUnitLabel(reading.meterType)}
								</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-muted-foreground">Total Cost</span>
								<span class="font-semibold">{formatCurrency(reading.totalCost)}</span>
							</div>
						</div>

						<div class="flex flex-col justify-center px-4 space-y-3">
							<div class="flex justify-between items-center">
								<span class="text-muted-foreground">Tenants</span>
								<span class="font-semibold">{selectedTenants.size}</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-muted-foreground">Per Tenant</span>
								<span class="font-semibold">
									{selectedTenants.size > 0
										? formatCurrency((reading.totalCost || 0) / selectedTenants.size)
										: formatCurrency(0)}
								</span>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</Dialog.Header>

		<div class="space-y-4">
			<ToggleGroup.Root
				type="single"
				value={view}
				onValueChange={(v: string | null) => {
					if (v) view = v as View;
				}}
				class="w-full"
			>
				<ToggleGroup.Item value="tenants" class="w-1/2">Tenants</ToggleGroup.Item>
				<ToggleGroup.Item value="history" class="w-1/2">History</ToggleGroup.Item>
			</ToggleGroup.Root>

			{#if view === 'tenants'}
				<div class="animate-in fade-in-0">
					<div class="relative">
						<Search
							class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
						/>
						<Input
							type="search"
							placeholder="Search: 2f (floor), room 1 (specific room), tenant name..."
							bind:value={searchQuery}
							class="w-full pl-10"
						/>
					</div>
					<div class="flex justify-between items-center mt-1.5">
						<p class="text-xs text-muted-foreground">Smart search: "2f" (all floor 2), "room 1" (only room 1), "2f room 3" (floor 2 room 3)</p>
						{#if reading && reading.location_type}
							<p class="text-xs text-blue-600 font-medium">
								{reading.location_type === 'RENTAL_UNIT'
									? 'Showing only this room'
									: reading.location_type === 'FLOOR'
										? 'Showing rooms on this floor'
										: 'Showing all rooms in property'}
							</p>
						{/if}
					</div>

					{#if filteredList.length > 0}
						<div class="flex items-center justify-between mt-3 mb-2">
							<div class="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onclick={allFilteredSelected ? clearAllSelection : selectAllFiltered}
									class="h-7 text-xs"
								>
									{allFilteredSelected ? 'Clear All' : 'Select All'}
									({filteredList.length})
								</Button>
								
								{#if someFilteredSelected || allFilteredSelected}
									<span class="text-xs text-muted-foreground">
										{selectedTenants.size} selected
									</span>
								{/if}
							</div>
							
							{#if searchQuery.trim()}
								<span class="text-xs text-green-600 font-medium">
									Showing {filteredList.length} of {flatTenantList.length}
								</span>
							{/if}
						</div>
					{/if}

					<div class="mt-4 pr-2 -mr-4 max-h-60 overflow-y-auto">
						{#if filteredList.length > 0}
							<div class="grid gap-2">
								{#each filteredList as item (`${item.leaseId}-${item.tenant.id}`)}
									{@const billedDate =
										reading && leaseMeterBilledDates
											? leaseMeterBilledDates[`${reading.meterId}-${item.leaseId}`]
											: undefined}
									{@const isBilledForPeriod =
										reading && actualBilledDates && actualBilledDates[String(reading.meterId)]
											? actualBilledDates[String(reading.meterId)].includes(
													reading.currentReadingDate || ''
												)
											: false}
									<label
										class="flex items-center p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
									>
										<Checkbox.Root
											class="mr-3"
											checked={selectedTenants.has(`${item.leaseId}-${item.tenant.id}`)}
											onCheckedChange={(isChecked) =>
												toggleTenantSelection(item.leaseId, item.tenant.id, isChecked)}
										/>
										<div class="flex-1">
											<p class="font-medium">
												{item.roomName} -
												<span class="text-muted-foreground">{item.tenant.full_name}</span>
												{#if !(item.hasArchivedTenants && item.hasActiveTenants)}
													<span class="ml-2 text-xs text-muted-foreground">
														({item.leaseStatus} • {item.tenantStatus})
													</span>
												{/if}
												{#if isBilledForPeriod}
													<span class="ml-2 text-xs font-normal text-green-600"
														>✓ Billed for this period</span
													>
												{/if}
											</p>
											<p class="text-xs text-muted-foreground mt-1">
												Lease: {item.leaseName}
											</p>
										</div>
									</label>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-muted-foreground text-center py-4">No tenants found.</p>
						{/if}
					</div>
				</div>
			{:else if view === 'history'}
				<div class="animate-in fade-in-0">
					{#if reading && reading.history.length > 0}
						<div class="rounded-md border max-h-[284px] overflow-y-auto">
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head>Date</Table.Head>
										<Table.Head class="text-right">Reading</Table.Head>
										<Table.Head class="text-right">Consumption</Table.Head>
										<Table.Head class="text-right">Cost</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each reading.history as historyItem}
										<Table.Row>
											<Table.Cell>{formatDate(historyItem.reading_date)}</Table.Cell>
											<Table.Cell class="text-right">{formatNumber(historyItem.reading)}</Table.Cell
											>
											<Table.Cell class="text-right"
												>{formatNumber(historyItem.consumption)}
												{getUnitLabel(reading.meterType)}</Table.Cell
											>
											<Table.Cell class="text-right">{formatCurrency(historyItem.cost)}</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>
					{:else}
						<p class="text-sm text-muted-foreground text-center py-4">
							No reading history available.
						</p>
					{/if}
				</div>
			{/if}

			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={handleClose}>Cancel</Button>
				<Button type="button" onclick={handleGenerate} disabled={selectedTenants.size === 0}>
					Generate Print Preview
				</Button>

				<form
					action="?/createUtilityBillings"
					method="POST"
					use:enhance={({ formData }) => {
						if (!reading || selectedTenants.size === 0) return;

						const totalCost = reading.totalCost || 0;
						const sharePerTenant = totalCost / selectedTenants.size;

						const shareData = flatTenantList
							.filter((item) => selectedTenants.has(`${item.leaseId}-${item.tenant.id}`))
							.map((item) => ({
								tenant: item.tenant,
								lease: { id: item.leaseId, name: item.leaseName },
								share: sharePerTenant
							}));

						formData.set(
							'billingData',
							JSON.stringify(
								shareData.map((d: ShareData) => ({
									lease_id: d.lease.id,
									lease: { name: d.lease.name },
									amount: d.share,
									meter_id: reading?.meterId,
									utility_type: reading?.meterType,
									billing_date: reading?.currentReadingDate,
									notes: `Utility bill for ${reading?.meterName}`
								}))
							)
						);

						return async ({ result, update }) => {
							if (result.type === 'success') {
								const data = result.data as any;
								let message = `Successfully created ${data.created} billing(s).`;
								if (Array.isArray(data.duplicates) && data.duplicates.length > 0) {
									message += ` ${data.duplicates.length} duplicate(s) were skipped.`;
								}
								toast.success(message);
								handleClose();
							} else if (result.type === 'failure') {
								const data = result.data as any;
								if (result.status === 409 && data?.error) {
									toast.error('Duplicate Billing Found', {
										description: data.error,
										duration: 10000
									});
								} else if (data?.error) {
									toast.error('Billing Error', { description: data.error });
								} else {
									toast.error('An unknown validation error occurred.');
								}
							} else if (result.type === 'error') {
								toast.error('Request Failed', { description: result.error.message });
							}

							await update({ reset: false });
						};
					}}
				>
					<Button type="submit" disabled={selectedTenants.size === 0}>Bill Leases</Button>
				</form>
			</Dialog.Footer>
		</div>
	</Dialog.Content>
</Dialog.Root>
