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
	let selectedTenants = $state(new Set<string>()); // Change to string to store lease-tenant combination
	let searchQuery = $state(reading?.meterName ?? '');

	const flatTenantList = $derived(
		leases
			.filter((lease) => lease)
			.flatMap((lease) =>
				(lease.tenants || []).map((tenant) => ({
					leaseId: lease.id,
					leaseName: lease.name,
					roomName: lease.roomName || 'Unknown Room',
					leaseStatus: lease.status,
					tenant: tenant,
					tenantStatus: tenant.tenant_status || 'UNKNOWN'
				}))
			)
	);

	const fuse = $derived(
		new Fuse(flatTenantList, {
			keys: ['leaseName', 'roomName', 'tenant.full_name'],
			threshold: 0.6
		})
	);

	const filteredList = $derived(
		searchQuery ? fuse.search(searchQuery).map((result) => result.item) : flatTenantList
	);

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
							placeholder="Search tenants or unit..."
							bind:value={searchQuery}
							class="w-full pl-10"
						/>
					</div>
					<p class="text-xs text-muted-foreground mt-1.5">Search for Unit or Tenant names</p>

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
												<span class="ml-2 text-xs text-muted-foreground">
													({item.leaseStatus} • {item.tenantStatus})
												</span>
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
