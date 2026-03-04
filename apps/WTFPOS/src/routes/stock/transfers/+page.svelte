<script lang="ts">
	import { stockItems, transferStock } from '$lib/stores/stock.svelte';
	import { isWarehouseSession, session } from '$lib/stores/session.svelte';
	import { cn, formatPeso } from '$lib/utils';
	import { fade } from 'svelte/transition';

	// The location we are transferring FROM (usually the active session location)
	const sourceLocationId = $derived(isWarehouseSession() ? 'wh-qc' : session.locationId);
	
	const sourceItems = $derived(
		stockItems.filter(s => s.locationId === sourceLocationId)
	);

	// Potential destination locations
	const destinationLocations = [
		{ id: 'qc', name: 'QC Branch' },
		{ id: 'mkti', name: 'Makati Branch' },
		{ id: 'wh-qc', name: 'Central Warehouse' }
	].filter(loc => loc.id !== sourceLocationId); // Can't transfer to self

	let formStockMenuItemId = $state('');
	let formToLocationId = $state('');
	let formQty = $state('');
	let formNotes = $state('');
	
	const parsedQty = $derived(parseFloat(formQty) || 0);
	
	// Get the specific item based on the selected menuItemId to find its unit
	const selectedSourceItem = $derived(
		sourceItems.find(s => s.menuItemId === formStockMenuItemId)
	);

	let showSuccess = $state(false);
	let showError = $state('');

	function handleTransfer() {
		showError = '';
		showSuccess = false;

		if (!formStockMenuItemId || !formToLocationId || parsedQty <= 0) {
			showError = 'Please fill out all required fields correctly.';
			return;
		}

		console.log('Attempting transfer:', { formStockMenuItemId, parsedQty, sourceLocationId, formToLocationId });
		const success = transferStock(
			formStockMenuItemId,
			parsedQty,
			sourceLocationId,
			formToLocationId,
			'Manager / Admin'
		);

		if (success) {
			showSuccess = true;
			formQty = '';
			formNotes = '';
			setTimeout(() => { showSuccess = false; }, 3000);
		} else {
			showError = 'Transfer failed. Check if destination tracks this item or if you have enough stock.';
		}
	}
</script>

<div class="flex flex-col gap-6 max-w-4xl mx-auto">
	<div class="flex flex-col gap-1">
		<h2 class="text-lg font-bold text-gray-900">Inter-Branch Stock Transfers</h2>
		<p class="text-sm text-gray-500">Move inventory from your current location ({sourceLocationId.toUpperCase()}) to another branch or warehouse.</p>
	</div>

	<div class="pos-card p-6 flex flex-col gap-6 relative">
		
		{#if showSuccess}
			<div class="absolute top-0 left-0 right-0 bg-status-green text-white px-4 py-2 rounded-t-xl text-sm font-bold text-center" transition:fade>
				✓ Stock Transferred Successfully
			</div>
		{/if}

		{#if showError}
			<div class="absolute top-0 left-0 right-0 bg-status-red text-white px-4 py-2 rounded-t-xl text-sm font-bold text-center" transition:fade>
				{showError}
			</div>
		{/if}

		<div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
			<!-- FROM Section (Left) -->
			<div class="flex flex-col gap-4">
				<div class="flex items-center gap-2 mb-2">
					<span class="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-xs font-bold text-gray-600">1</span>
					<h3 class="font-bold text-gray-900">Select Item to Transfer</h3>
				</div>

				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Source Item (From {sourceLocationId.toUpperCase()})</span>
					<select bind:value={formStockMenuItemId} class="pos-input">
						<option value="" disabled>Select an item to transfer...</option>
						{#each sourceItems as item}
							<option value={item.menuItemId}>{item.name} ({item.category})</option>
						{/each}
					</select>
				</label>
				
				<div class="grid grid-cols-[1fr_auto] gap-4">
					<label class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Transfer Quantity</span>
						<input type="number" bind:value={formQty} class="pos-input font-mono" min="0" step="0.1" placeholder="0.0" />
					</label>
					<label class="flex flex-col gap-1.5 w-24">
						<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit</span>
						<input type="text" class="pos-input bg-gray-50 font-mono text-center text-gray-500" value={selectedSourceItem?.unit ?? '-'} disabled />
					</label>
				</div>
			</div>

			<!-- TO Section (Right) -->
			<div class="flex flex-col gap-4">
				<div class="flex items-center gap-2 mb-2">
					<span class="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-xs font-bold text-white">2</span>
					<h3 class="font-bold text-gray-900">Select Destination</h3>
				</div>

				<div class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Destination Branch</span>
					<div class="flex flex-col gap-2">
						{#each destinationLocations as loc}
							<label class={cn(
								'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all',
								formToLocationId === loc.id ? 'border-accent bg-accent/5 shadow-sm' : 'border-border hover:border-gray-300'
							)}>
								<input type="radio" bind:group={formToLocationId} value={loc.id} class="h-4 w-4 accent-accent" />
								<div class="flex flex-col">
									<span class="font-bold text-gray-900">{loc.name}</span>
									<span class="text-[10px] text-gray-500 font-mono uppercase">ID: {loc.id}</span>
								</div>
							</label>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<div class="border-t border-border pt-6 mt-2 flex flex-col md:flex-row items-end gap-6 w-full">
			<label class="flex-1 flex flex-col gap-1.5 w-full">
				<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Transfer Reason / Notes</span>
				<input type="text" bind:value={formNotes} class="pos-input" placeholder="e.g. Weekly replenishment run" />
			</label>
			
			<button 
				onclick={handleTransfer} 
				disabled={!formStockMenuItemId || !formToLocationId || parsedQty <= 0}
				class="btn-primary w-full md:w-[220px] h-[42px] flex items-center justify-center gap-2"
			>
				<span>🚚 Execute Transfer</span>
			</button>
		</div>
	</div>
</div>
