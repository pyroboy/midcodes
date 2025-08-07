<script lang="ts">
	import type { ExtendedTenant } from './types';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		tenants: ExtendedTenant[];
		onedit: (tenant: ExtendedTenant) => void;
		ondelete: (tenant: ExtendedTenant) => void;
	}

	let { tenants, onedit, ondelete }: Props = $props();

	let searchQuery = $state('');
	let selectedStatus = $state<string | undefined>();

	let filteredTenants = $derived(
		tenants.filter((t) => {
			const matchesStatus = !selectedStatus || t.tenant_status === selectedStatus;
			const matchesSearch =
				!searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesStatus && matchesSearch;
		})
	);
</script>

<div class="w-full max-w-6xl mx-auto">
	<div class="bg-white shadow rounded-lg">
		<!-- header + inline filters -->
		<div class="p-4 border-b flex items-center justify-between gap-4">
			<h2 class="text-xl font-semibold">Tenants</h2>

			<input
				type="text"
				placeholder="Search tenants…"
				class="w-64 px-3 py-2 border rounded-md"
				bind:value={searchQuery}
			/>

			<select class="border rounded-md px-3 py-2" bind:value={selectedStatus}>
				<option value="">All statuses</option>
				<option value="ACTIVE">Active</option>
				<option value="PENDING">Pending</option>
				<option value="INACTIVE">Inactive</option>
			</select>
		</div>

		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Name</Table.Head>
					<Table.Head>Unit</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head class="text-right">Actions</Table.Head>
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{#each filteredTenants as tenant (tenant.id)}
					<Table.Row>
						<Table.Cell>{tenant.name}</Table.Cell>

						<Table.Cell>
							{tenant.lease?.location?.number ?? '—'}
						</Table.Cell>
						<Table.Cell>
							<Badge
								variant={tenant.tenant_status === 'ACTIVE'
									? 'secondary'
									: tenant.tenant_status === 'PENDING'
										? 'outline'
										: 'destructive'}
							>
								{tenant.tenant_status}
							</Badge>
						</Table.Cell>
						<Table.Cell class="text-right">
							<div class="flex justify-end gap-2">
								<Button size="sm" variant="outline" onclick={() => onedit(tenant)}>Edit</Button>
								<Button size="sm" variant="destructive" onclick={() => ondelete(tenant)}>
									Delete
								</Button>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>
