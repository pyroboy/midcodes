<script lang="ts">
	import { useInventory } from '$lib/data/inventory';
	import { useView } from '$lib/data/view';
	import { goto } from '$app/navigation';
	import type { InventoryItemWithDetails } from '$lib/types/inventory.schema';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { AlertTriangle, Package, TrendingDown, TrendingUp } from 'lucide-svelte';

	// Get inventory data using the data access layer (following TanStack/Telefunc guidelines)
	const { inventoryItems, valuation, alerts, isLoading, isError, error } = useInventory();

	// Use Svelte 5 runes only for local component state, not for data from hooks
	let search = $state('');

	// Derived states using $derived for local filtering (access stores with $ prefix)
	let lowStockItems = $derived(
		$inventoryItems.filter((item: InventoryItemWithDetails) => {
			const qty = item.quantity_available ?? 0;
			return qty > 0 && qty < 10;
		})
	);

	let outOfStockItems = $derived(
		$inventoryItems.filter((item: InventoryItemWithDetails) => (item.quantity_available ?? 0) === 0)
	);

	let expiredItems = $derived(
		$inventoryItems.filter((item: InventoryItemWithDetails) => {
			const expiryDate = item.expiry_date || item.batch?.expiration_date;
			if (!expiryDate) return false;
			return new Date(expiryDate) < new Date();
		})
	);

	let expiringSoonItems = $derived(
		$inventoryItems.filter((item: InventoryItemWithDetails) => {
			const expiryDateStr = item.expiry_date || item.batch?.expiration_date;
			if (!expiryDateStr) return false;
			const expiryDate = new Date(expiryDateStr);
			const thirtyDaysFromNow = new Date();
			thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
			return expiryDate < thirtyDaysFromNow && expiryDate >= new Date();
		})
	);

	let itemsToReorderCount = $derived(lowStockItems.length);
	let outOfStockCount = $derived(outOfStockItems.length);
	let totalItems = $derived($inventoryItems.length);
	let expiredCount = $derived(expiredItems.length);
	let expiringSoonCount = $derived(expiringSoonItems.length);

	// View state
	let viewMode: 'grid' | 'table' = $state('grid');
	let selectedProductIds: string[] = $state([]);

	// Functions
	function handleViewModeChange(mode: 'grid' | 'table') {
		viewMode = mode;
	}

	function handleProductSelect(productId: string) {
		if (selectedProductIds.includes(productId)) {
			selectedProductIds = selectedProductIds.filter((id) => id !== productId);
		} else {
			selectedProductIds = [...selectedProductIds, productId];
		}
	}

	function handleBulkAction(action: string) {
		console.log(`Performing ${action} on products:`, selectedProductIds);
		// Implement bulk actions here
	}

	// Effect for logging (optional)
	$effect(() => {
		console.log('📊 StockStatus: Inventory items updated, count:', inventoryItems.length);
	});
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-3xl font-bold tracking-tight">Stock Status</h2>
			<p class="text-muted-foreground">Monitor your inventory levels and stock alerts</p>
		</div>
		<div class="flex items-center space-x-2">
			<Button
				variant={viewMode === 'grid' ? 'default' : 'outline'}
				size="sm"
				onclick={() => handleViewModeChange('grid')}
			>
				<Package class="h-4 w-4 mr-2" />
				Grid
			</Button>
			<Button
				variant={viewMode === 'table' ? 'default' : 'outline'}
				size="sm"
				onclick={() => handleViewModeChange('table')}
			>
				Table
			</Button>
		</div>
	</div>

	<!-- Status Cards -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Total Items</CardTitle>
				<Package class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{totalItems}</div>
				<p class="text-xs text-muted-foreground">Active inventory items</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Low Stock</CardTitle>
				<TrendingDown class="h-4 w-4 text-orange-500" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-orange-600">{itemsToReorderCount}</div>
				<p class="text-xs text-muted-foreground">Items need reordering</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Out of Stock</CardTitle>
				<AlertTriangle class="h-4 w-4 text-red-500" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-red-600">{outOfStockCount}</div>
				<p class="text-xs text-muted-foreground">Items out of stock</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Stock Health</CardTitle>
				<TrendingUp class="h-4 w-4 text-green-500" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-green-600">
					{totalItems > 0 ? Math.round(((totalItems - outOfStockCount) / totalItems) * 100) : 0}%
				</div>
				<p class="text-xs text-muted-foreground">Items in stock</p>
			</CardContent>
		</Card>
	</div>

	<!-- Content -->
	{#if $isLoading}
		<div class="flex items-center justify-center h-64">
			<div class="text-center">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
				<p class="text-muted-foreground">Loading inventory...</p>
			</div>
		</div>
	{:else if $isError}
		<div class="flex items-center justify-center h-64">
			<div class="text-center">
				<AlertTriangle class="h-8 w-8 text-destructive mx-auto mb-2" />
				<p class="text-destructive font-medium">Error loading inventory</p>
				<p class="text-muted-foreground text-sm">{$error?.message || 'Unknown error'}</p>
			</div>
		</div>
	{:else if $inventoryItems.length === 0}
		<div class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/20 p-8 text-center">
			<Package class="h-12 w-12 text-muted-foreground mb-4" />
			<h3 class="text-lg font-semibold">No Inventory Items</h3>
			<p class="text-sm text-muted-foreground">No inventory items found matching your criteria.</p>
		</div>
	{:else}
		<!-- Inventory Items Display -->
		{#if viewMode === 'grid'}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each $inventoryItems as item (item.id)}
					<Card class="cursor-pointer transition-colors hover:bg-muted/50" onclick={() => handleProductSelect(item.id)}>
						<CardHeader class="pb-2">
							<div class="flex items-center justify-between">
								<CardTitle class="text-sm font-medium truncate">{item.product?.name || `Product ${item.product_id}`}</CardTitle>
								<Badge variant={(item.quantity_available ?? 0) > 0 ? 'default' : 'destructive'}>
									{(item.quantity_available ?? 0) > 0 ? 'In Stock' : 'Out of Stock'}
								</Badge>
							</div>
						</CardHeader>
						<CardContent>
							<div class="space-y-2">
								<div class="flex justify-between text-sm">
									<span class="text-muted-foreground">Available:</span>
									<span class="font-medium">{item.quantity_available ?? 0}</span>
								</div>
								<div class="flex justify-between text-sm">
									<span class="text-muted-foreground">Location:</span>
									<span class="font-medium">{item.location?.name || 'Default Location'}</span>
								</div>
								<!-- Expiry date display disabled until batch data integration is complete -->
								<!-- {#if item.expiry_date}
									<div class="flex justify-between text-sm">
										<span class="text-muted-foreground">Expires:</span>
										<span class="font-medium">{new Date(item.expiry_date).toLocaleDateString()}</span>
									</div>
								{/if} -->
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>
		{:else}
			<!-- Table view would go here -->
			<div class="rounded-lg border">
				<div class="p-4">
					<p class="text-sm text-muted-foreground">Table view coming soon...</p>
				</div>
			</div>
		{/if}
	{/if}
</div>
