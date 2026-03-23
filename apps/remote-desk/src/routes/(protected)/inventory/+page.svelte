<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { roleStore } from '$lib/stores/role.svelte';
	import {
		Package,
		AlertTriangle,
		Search,
		Filter,
		Layers,
		CheckCircle2,
		ArrowUpDown,
		ShieldAlert
	} from 'lucide-svelte';

	interface InventoryItem {
		id: string;
		name: string;
		sku: string;
		quantity: number;
		minStock: number;
		category: string;
		unit: string;
	}

	const mockItems: InventoryItem[] = [
		{ id: '1', name: 'Cooking Oil (5L)', sku: 'OIL-001', quantity: 3, minStock: 10, category: 'Supplies', unit: 'bottle' },
		{ id: '2', name: 'Pork Belly (kg)', sku: 'MEAT-001', quantity: 15, minStock: 20, category: 'Meat', unit: 'kg' },
		{ id: '3', name: 'Salt (1kg)', sku: 'SALT-001', quantity: 25, minStock: 15, category: 'Supplies', unit: 'bag' },
		{ id: '4', name: 'Charcoal (25kg)', sku: 'COAL-001', quantity: 12, minStock: 10, category: 'Equipment', unit: 'bag' },
		{ id: '5', name: 'Soy Sauce (1L)', sku: 'SOY-001', quantity: 8, minStock: 12, category: 'Condiments', unit: 'bottle' },
		{ id: '6', name: 'Paper Napkins', sku: 'NAP-001', quantity: 45, minStock: 20, category: 'Supplies', unit: 'pack' },
		{ id: '7', name: 'Disposable Gloves', sku: 'GLV-001', quantity: 30, minStock: 25, category: 'Supplies', unit: 'box' },
		{ id: '8', name: 'Chicken Wings (kg)', sku: 'MEAT-002', quantity: 5, minStock: 15, category: 'Meat', unit: 'kg' },
		{ id: '9', name: 'Rice (50kg)', sku: 'RICE-001', quantity: 8, minStock: 5, category: 'Supplies', unit: 'sack' },
		{ id: '10', name: 'Vinegar (1L)', sku: 'VIN-001', quantity: 18, minStock: 10, category: 'Condiments', unit: 'bottle' },
		{ id: '11', name: 'Lettuce (head)', sku: 'VEG-001', quantity: 10, minStock: 8, category: 'Produce', unit: 'head' },
		{ id: '12', name: 'Tongs (pair)', sku: 'TOOL-001', quantity: 6, minStock: 4, category: 'Equipment', unit: 'pair' }
	];

	const categories = ['All', ...new Set(mockItems.map((i) => i.category))];
	let searchQuery = $state('');
	let selectedCategory = $state('All');

	let filteredItems = $derived(
		mockItems.filter((item) => {
			if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
			if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && !item.sku.toLowerCase().includes(searchQuery.toLowerCase())) return false;
			return true;
		})
	);

	let totalItems = mockItems.length;
	let lowStockCount = mockItems.filter((i) => i.quantity <= i.minStock).length;
	let categoryCount = new Set(mockItems.map((i) => i.category)).size;

	function getStockStatus(qty: number, min: number): string {
		if (qty <= min) return 'Low Stock';
		if (qty < min * 1.5) return 'Adequate';
		return 'In Stock';
	}

	function getStockBadge(qty: number, min: number): string {
		if (qty <= min) return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
		if (qty < min * 1.5) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
		return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
	}

	function getStockPercent(qty: number, min: number): number {
		return Math.min((qty / (min * 2)) * 100, 100);
	}

	function getBarColor(qty: number, min: number): string {
		if (qty <= min) return 'bg-red-500';
		if (qty < min * 1.5) return 'bg-amber-500';
		return 'bg-emerald-500';
	}
</script>

<div class="min-h-full">
	{#if roleStore.role === 'staff'}
		<div class="flex min-h-[60vh] flex-col items-center justify-center">
			<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
				<ShieldAlert class="h-8 w-8 text-red-500" />
			</div>
			<h3 class="mt-5 text-lg font-semibold">Access Restricted</h3>
			<p class="mt-1 text-sm text-muted-foreground">You don't have permission to view this page.</p>
			<a href="/dashboard" class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Back to Dashboard</a>
		</div>
	{:else}
	<div class="mx-auto max-w-dashboard p-5 sm:p-8 lg:p-10">
		<!-- Page Header -->
		<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="text-page-title">Inventory</h2>
				<p class="mt-1 text-sm text-muted-foreground">Track stock levels and manage supplies</p>
			</div>
			<button class="inline-flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 active:scale-95">
				<Package class="h-4 w-4" />
				Add Item
			</button>
		</div>

		<!-- Summary Stats -->
		<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
			<Card>
				<CardContent class="p-5">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
							<Package class="h-5 w-5" />
						</div>
						<div>
							<p class="text-card-label text-muted-foreground">Total Items</p>
							<p class="text-stat font-mono">{totalItems}</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="p-5">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
							<AlertTriangle class="h-5 w-5" />
						</div>
						<div>
							<p class="text-card-label text-muted-foreground">Low Stock</p>
							<p class="text-stat font-mono text-red-600 dark:text-red-400">{lowStockCount}</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="p-5">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
							<Layers class="h-5 w-5" />
						</div>
						<div>
							<p class="text-card-label text-muted-foreground">Categories</p>
							<p class="text-stat font-mono">{categoryCount}</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Search & Filter -->
		<Card class="mb-6">
			<CardContent class="p-4">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
					<div class="relative flex-1">
						<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Search by name or SKU..."
							class="w-full rounded-lg border border-input bg-background py-1.5 pl-9 pr-3 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
					<div class="flex flex-wrap gap-1.5">
						{#each categories as cat}
							<button
								onclick={() => (selectedCategory = cat)}
								class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors
									{selectedCategory === cat
										? 'bg-primary text-primary-foreground'
										: 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}"
							>
								{cat}
							</button>
						{/each}
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Inventory Table -->
		<Card>
			<CardHeader class="flex flex-row items-center justify-between pb-4">
				<CardTitle class="text-section-title">Stock Levels</CardTitle>
				<span class="text-caption text-muted-foreground">{filteredItems.length} items</span>
			</CardHeader>
			<CardContent>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b">
								<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Item</th>
								<th class="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">SKU</th>
								<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									<div class="flex items-center gap-1">
										Qty
										<ArrowUpDown class="h-3 w-3" />
									</div>
								</th>
								<th class="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Min</th>
								<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stock Level</th>
								<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredItems as item}
								{@const isLow = item.quantity <= item.minStock}
								<tr class="border-b last:border-0 transition-colors {isLow ? 'bg-red-50/50 dark:bg-red-950/10' : 'hover:bg-muted/50'}">
									<td class="px-4 py-3">
										<div class="flex items-center gap-2">
											{#if isLow}
												<AlertTriangle class="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
											{/if}
											<div>
												<p class="font-medium">{item.name}</p>
												<p class="text-xs text-muted-foreground sm:hidden">{item.sku}</p>
											</div>
										</div>
									</td>
									<td class="hidden px-4 py-3 font-mono text-xs text-muted-foreground sm:table-cell">{item.sku}</td>
									<td class="px-4 py-3">
										<span class="font-mono font-semibold">{item.quantity}</span>
										<span class="text-xs text-muted-foreground"> {item.unit}</span>
									</td>
									<td class="hidden px-4 py-3 font-mono text-xs text-muted-foreground md:table-cell">{item.minStock}</td>
									<td class="px-4 py-3">
										<div class="flex items-center gap-2">
											<div class="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
												<div class="h-full rounded-full transition-all {getBarColor(item.quantity, item.minStock)}" style="width: {getStockPercent(item.quantity, item.minStock)}%"></div>
											</div>
										</div>
									</td>
									<td class="px-4 py-3">
										<span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium {getStockBadge(item.quantity, item.minStock)}">
											{getStockStatus(item.quantity, item.minStock)}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	</div>
	{/if}
</div>
