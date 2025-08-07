<script lang="ts">
	import { Calendar, MapPin, Users, FileText } from 'lucide-svelte';
	import type { Lease } from '$lib/types/lease';
	import { formatDate } from '$lib/utils/format';

	interface Props {
		lease: Lease;
		tenants?: any[];
	}

	let { lease, tenants = [] }: Props = $props();
</script>

<div class="space-y-8">
	<!-- Property Details -->
	<div class="space-y-4">
		<h2 class="text-2xl font-bold text-gray-900 tracking-tight">Property</h2>

		<div class="space-y-3">
			<div>
				<dt class="text-sm font-medium text-gray-500 uppercase tracking-wide">Unit</dt>
				<dd class="text-xl font-semibold text-gray-900 mt-1">
					{(lease.rental_unit as any)?.name ||
						(lease.rental_unit as any)?.rental_unit_number ||
						`Unit ${(lease.rental_unit as any)?.number || 'N/A'}`}
				</dd>
			</div>

			{#if lease.rental_unit?.property?.name}
				<div>
					<dt class="text-sm font-medium text-gray-500 uppercase tracking-wide">Building</dt>
					<dd class="text-lg font-medium text-gray-800 mt-1">{lease.rental_unit.property.name}</dd>
				</div>
			{/if}

			<div>
				<dt class="text-sm font-medium text-gray-500 uppercase tracking-wide">Type</dt>
				<dd class="text-lg font-medium text-gray-800 mt-1">{lease.type || 'STANDARD'}</dd>
			</div>
		</div>
	</div>

	<!-- Tenant Details -->
	<div class="space-y-4">
		<h2 class="text-2xl font-bold text-gray-900 tracking-tight">
			{lease.lease_tenants?.length === 1 ? 'Tenant' : 'Tenants'}
		</h2>

		{#if lease.lease_tenants?.length}
			<div class="space-y-3">
				{#each lease.lease_tenants.filter((lt) => lt.name) as leaseTenant, index}
					{@const tenantData = (leaseTenant as any).tenant || leaseTenant}
					{@const matchedTenant = tenants.find((t) => t.name === tenantData.name)}
					{@const profileUrl = (tenantData as any).profile_picture_url || matchedTenant?.profile_picture_url}
					<div class="flex items-center gap-3">
						{#if profileUrl}
							<img
								src={profileUrl}
								alt="{tenantData.name}'s profile picture"
								class="w-10 h-10 rounded-full object-cover"
							/>
						{:else}
							<div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
								<span class="text-lg font-bold text-gray-700">
									{tenantData.name?.charAt(0).toUpperCase()}
								</span>
							</div>
						{/if}
						<span class="text-xl font-semibold text-gray-900">{tenantData.name}</span>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-gray-500 italic">No tenant information available</p>
		{/if}
	</div>

	<!-- Lease Period -->
	<div class="space-y-4">
		<h2 class="text-2xl font-bold text-gray-900 tracking-tight">Period</h2>

		<div class="grid grid-cols-1 gap-4">
			<div class="flex justify-between items-center py-3 border-b border-gray-200">
				<dt class="text-sm font-medium text-gray-500 uppercase tracking-wide">Start Date</dt>
				<dd class="text-lg font-semibold text-gray-900">{formatDate(lease.start_date)}</dd>
			</div>
			<div class="flex justify-between items-center py-3 border-b border-gray-200">
				<dt class="text-sm font-medium text-gray-500 uppercase tracking-wide">End Date</dt>
				<dd class="text-lg font-semibold text-gray-900">{formatDate(lease.end_date)}</dd>
			</div>
			<div class="flex justify-between items-center py-3">
				<dt class="text-sm font-medium text-gray-500 uppercase tracking-wide">Duration</dt>
				<dd class="text-lg font-semibold text-gray-900">
					{Math.ceil(
						(new Date(lease.end_date).getTime() - new Date(lease.start_date).getTime()) /
							(1000 * 60 * 60 * 24)
					)} days
				</dd>
			</div>
		</div>
	</div>

	<!-- Notes -->
	{#if lease.notes}
		<div class="space-y-4">
			<h2 class="text-2xl font-bold text-gray-900 tracking-tight">Notes</h2>
			<p class="text-base text-gray-700 leading-relaxed">{lease.notes}</p>
		</div>
	{/if}
</div>
