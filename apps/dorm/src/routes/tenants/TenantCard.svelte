<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Pencil,
		Trash2,
		Phone,
		Mail
	} from 'lucide-svelte';
	import type { TenantResponse } from '$lib/types/tenant';
	import { getStatusClasses } from '$lib/utils/format';
	import { getStatusIcon } from '$lib/utils/status-icons';

	interface Props {
		tenant: TenantResponse;
		onEdit: (tenant: TenantResponse) => void;
		onDelete: (tenant: TenantResponse) => void;
	}

	let { tenant, onEdit, onDelete }: Props = $props();

</script>

<div
	class="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full"
>
	<div class="flex-grow p-6 text-center">
		<div class="flex justify-center relative mb-4">
			<div class="relative w-40 h-40">
				{#if tenant.profile_picture_url}
					<!-- Profile Picture -->
					<div
						class="absolute inset-0 rounded-full overflow-hidden shadow-lg border-4 border-white"
					>
						<img
							src={tenant.profile_picture_url}
							alt="{tenant.name}'s profile picture"
							class="w-full h-full object-cover"
							loading="lazy"
						/>
					</div>
				{:else}
					<!-- Fallback to Initials -->
					<div
						class="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg"
					>
						<span class="text-white font-bold text-xl">
							{tenant.name
								.split(' ')
								.map((n: string) => n[0])
								.join('')
								.toUpperCase()}
						</span>
					</div>
				{/if}
				<div class="absolute bottom-[-10px] w-full flex justify-center">
					<Badge
						class={`${getStatusClasses(tenant.tenant_status)} text-xs font-medium px-3 py-1.5 rounded-full border`}
					>
						{@const TenantStatusIcon = getStatusIcon(tenant.tenant_status)}<TenantStatusIcon class="h-3.5 w-3.5 mr-1 inline" />
						{tenant.tenant_status}
					</Badge>
				</div>
			</div>
		</div>

		<h3 class="font-semibold text-slate-900 text-2xl mb-2">{tenant.name}</h3>

		<div class="space-y-2 mb-4">
			{#if tenant.email}
				<div class="flex items-center justify-center gap-2 text-sm text-slate-600">
					<Mail class="h-3.5 w-3.5" />
					<span class="truncate max-w-[200px]">{tenant.email}</span>
				</div>
			{/if}
			{#if tenant.contact_number}
				<div class="flex items-center justify-center gap-2 text-sm text-slate-600">
					<Phone class="h-3.5 w-3.5" />
					<span>{tenant.contact_number}</span>
				</div>
			{/if}
		</div>
	</div>

	<div class="p-6 pt-0 mt-auto">
		{#if tenant.leases && tenant.leases.length > 0}
			<div class="space-y-2">
				<div class="text-xs font-medium text-slate-600 mb-2 text-center">
					{tenant.leases.length} Lease{tenant.leases.length > 1 ? 's' : ''}
				</div>
				{#each tenant.leases.slice(0, 2) as lease}
					<div class="flex items-center justify-between text-sm bg-slate-50 rounded-lg p-2">
						<div class="flex-1">
							<div class="font-medium text-slate-800 truncate">
								{lease.name}
							</div>
                            <div class="text-xs text-slate-500">
                                {#if lease.rental_unit?.name}
                                    {lease.rental_unit.name}
                                {:else if lease.rental_unit?.number}
                                    Unit {lease.rental_unit.number}
                                {:else}
                                    N/A
                                {/if}
                            </div>
						</div>
						<div class="text-right">
							<Badge
								class={`text-xs px-2 py-0.5 rounded-full border ${getStatusClasses(lease.status)}`}
							>
								{@const LeaseStatusIcon = getStatusIcon(lease.status)}<LeaseStatusIcon class="h-3.5 w-3.5 mr-1 inline" />
								{lease.status}
							</Badge>
						</div>
					</div>
				{/each}
				{#if tenant.leases.length > 2}
					<div class="text-center text-xs text-slate-500">
						+{tenant.leases.length - 2} more lease{tenant.leases.length - 2 > 1 ? 's' : ''}
					</div>
				{/if}
			</div>
		{:else}
			<div class="text-center text-sm text-slate-500 py-4">
				No active leases
			</div>
		{/if}
	</div>

	<div class="border-t border-slate-200 px-4 py-3 flex items-center gap-2">
		<Button
			variant="outline"
			onclick={() => onEdit(tenant)}
			class="w-full h-11 text-sm font-medium text-slate-700"
		>
			<Pencil class="h-4 w-4 mr-1.5" />
			Edit
		</Button>
		<Button
			variant="outline"
			onclick={() => onDelete(tenant)}
			class="w-full h-11 text-sm font-medium text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
		>
			<Trash2 class="h-4 w-4 mr-1.5" />
			Delete
		</Button>
	</div>
</div>
