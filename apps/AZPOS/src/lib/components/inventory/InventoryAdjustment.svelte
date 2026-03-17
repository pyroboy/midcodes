<script lang="ts">
	import { useInventory } from '$lib/data/inventory';
	import type { InventoryItemWithDetails, InventoryItem } from '$lib/types/inventory.schema';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import AdjustmentModal from '$lib/components/inventory/AdjustmentModal.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';

	// Use data hooks instead of stores
	const { inventoryItems,inventoryQuery } = useInventory();

	let searchTerm = $state('');
	let isModalOpen = $state(false);
	let selectedProduct = $state<InventoryItemWithDetails | null>(null);
	let isBulkMode = $state(false);
	let selectedProductIds = $state(new Set<string>());

	// ✅ FIXED: Enhanced filtering with better search across multiple fields
	const filteredProducts = $derived(
		($inventoryItems ?? []).filter((item: InventoryItemWithDetails) => {
			const search = searchTerm.toLowerCase().trim();
			if (!search) return true;
			
			// Search across multiple fields for better filtering
			const searchableFields = [
				item.product_id,
				item.batch_id,
				item.location_id,
				// Add product details if available
				item.product?.name,
				item.product?.sku,
				// Add location details if available
				item.location?.name,
				item.location?.code
			];

			return searchableFields.some(field => 
				field && field.toLowerCase().includes(search)
			);
		})
	);

	const areAllFilteredSelected = $derived(
		filteredProducts.length > 0 && 
		filteredProducts.every((item: InventoryItemWithDetails) => selectedProductIds.has(item.id))
	);

	function toggleSelectAll() {
		if (areAllFilteredSelected) {
			filteredProducts.forEach((item: InventoryItemWithDetails) => selectedProductIds.delete(item.id));
		} else {
			filteredProducts.forEach((item: InventoryItemWithDetails) => selectedProductIds.add(item.id));
		}
	}

	$effect(() => {
		if (!isBulkMode) {
			selectedProductIds.clear();
		}
	});

	let selectedProductsForModal = $state<InventoryItemWithDetails[] | null>(null);

	function openAdjustModal(item: InventoryItemWithDetails) {
		selectedProduct = item;
		selectedProductsForModal = null;
		isModalOpen = true;
	}

	function openBulkAdjustModal() {
		const selected = filteredProducts.filter((item: InventoryItemWithDetails) => 
			selectedProductIds.has(item.id)
		);
		selectedProductsForModal = selected.length > 0 ? selected : null;
		selectedProduct = null;
		isModalOpen = true;
	}

	$effect(() => {
		if (!isModalOpen) {
			selectedProduct = null;
			selectedProductsForModal = null;
		}
	});

	// ✅ ADDED: Helper function to get display name for products
	function getProductDisplayName(item: InventoryItemWithDetails): string {
		if (item.product?.name) {
			return item.product.name;
		}
		return item.product_id;
	}

	// ✅ ADDED: Helper function to get location display name
	function getLocationDisplayName(item: InventoryItemWithDetails): string {
		if (item.location?.name) {
			return item.location.name;
		}
		return item.location_id || 'Default';
	}
</script>

<div class="p-4 space-y-4">
	<div class="flex justify-between items-center">
		<h1 class="text-2xl font-bold">Inventory Adjustments</h1>
		<div class="flex items-center space-x-4">
			<div class="flex items-center space-x-2">
				<Switch id="bulk-mode" bind:checked={isBulkMode} />
				<Label for="bulk-mode">Bulk Adjust</Label>
			</div>
			<div class="w-80">
				<Input 
					placeholder="Search by product name, ID, batch, location..." 
					bind:value={searchTerm} 
				/>
			</div>
		</div>
	</div>

	{#if isBulkMode && selectedProductIds.size > 0}
		<div class="flex justify-between items-center">
			<div class="text-sm text-muted-foreground">
				{selectedProductIds.size} of {filteredProducts.length} items selected
			</div>
			<Button onclick={openBulkAdjustModal}>
				Adjust Selected ({selectedProductIds.size})
			</Button>
		</div>
	{/if}

	<!-- ✅ ADDED: Summary info -->
	{#if searchTerm}
		<div class="text-sm text-muted-foreground">
			Showing {filteredProducts.length} items matching "{searchTerm}"
		</div>
	{:else}
		<div class="text-sm text-muted-foreground">
			Showing {filteredProducts.length} total items
		</div>
	{/if}

	<div class="border rounded-lg">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					{#if isBulkMode}
						<Table.Head class="w-[50px]">
							<Checkbox onclick={toggleSelectAll} checked={areAllFilteredSelected} />
						</Table.Head>
					{/if}
					<Table.Head>Product</Table.Head>
					<Table.Head>Product ID</Table.Head>
					<Table.Head>Batch Number</Table.Head>
					<Table.Head>Location</Table.Head>
					<Table.Head class="text-right">Cost/Unit</Table.Head>
					<Table.Head class="text-right">Available</Table.Head>
					<Table.Head class="w-[120px] text-center">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if $inventoryQuery.isLoading}
					<Table.Row>
						<Table.Cell colspan={isBulkMode ? 8 : 7} class="h-24 text-center">
							Loading inventory...
						</Table.Cell>
					</Table.Row>
				{:else if $inventoryQuery.isError}
					<Table.Row>
						<Table.Cell colspan={isBulkMode ? 8 : 7} class="h-24 text-center text-red-500">
							Error loading inventory: {$inventoryQuery.error?.message || 'Unknown error'}
						</Table.Cell>
					</Table.Row>
				{:else if filteredProducts.length === 0}
					<Table.Row>
						<Table.Cell colspan={isBulkMode ? 8 : 7} class="h-24 text-center">
							{#if searchTerm}
								No products found matching "{searchTerm}".
							{:else}
								No products found.
							{/if}
						</Table.Cell>
					</Table.Row>
				{:else}
					{#each filteredProducts as item (item.id)}
						<Table.Row>
							{#if isBulkMode}
								<Table.Cell>
									<Checkbox
										checked={selectedProductIds.has(item.id)}
										onclick={() => {
											if (selectedProductIds.has(item.id)) {
												selectedProductIds.delete(item.id);
											} else {
												selectedProductIds.add(item.id);
											}
										}}
									/>
								</Table.Cell>
							{/if}
							<Table.Cell class="font-medium">
								{getProductDisplayName(item)}
								{#if item.product?.sku}
									<div class="text-sm text-muted-foreground">{item.product.sku}</div>
								{/if}
							</Table.Cell>
							<Table.Cell class="font-mono text-sm">{item.product_id}</Table.Cell>
							<Table.Cell>{item.batch_id || 'N/A'}</Table.Cell>
							<Table.Cell>{getLocationDisplayName(item)}</Table.Cell>
							<Table.Cell class="text-right">${(item.cost_per_unit ?? 0).toFixed(2)}</Table.Cell>
							<Table.Cell class="text-right font-bold">
								<span class={item.quantity_available ?? 0 <= 0 ? 'text-red-600' : ''}>
									{item.quantity_available}
								</span>
							</Table.Cell>
							<Table.Cell class="text-center">
								{#if !isBulkMode}
									<Button variant="outline" size="sm" onclick={() => openAdjustModal(item)}>
										Adjust
									</Button>
								{/if}
							</Table.Cell>
						</Table.Row>
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>
</div>

<AdjustmentModal
	open={isModalOpen}
	product={selectedProduct}
	productList={selectedProductsForModal}
/>