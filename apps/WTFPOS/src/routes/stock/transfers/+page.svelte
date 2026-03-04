<script lang="ts">
	import { stockItems, transferStock, getCurrentStock, getStockStatus, adjustments } from '$lib/stores/stock.svelte';
	import { isWarehouseSession, session } from '$lib/stores/session.svelte';
	import { cn } from '$lib/utils';
	import { fade } from 'svelte/transition';
	import { ArrowRight, CheckCircle, AlertCircle, ChevronLeft, MapPin } from 'lucide-svelte';

	// ─── Wizard state ────────────────────────────────────────────────────────────
	let currentStep = $state<1 | 2 | 3>(1);

	// ─── Source (derived from session) ───────────────────────────────────────────
	const sourceLocationId = $derived(isWarehouseSession() ? 'wh-qc' : session.locationId);
	const sourceItems = $derived(stockItems.filter(s => s.locationId === sourceLocationId));

	const locationLabels: Record<string, string> = {
		'qc':    'QC Branch (Alta Cita)',
		'mkti':  'Makati Branch (Alona)',
		'wh-qc': 'Central Warehouse',
	};

	const allLocations = [
		{ id: 'qc',    name: 'QC Branch (Alta Cita)' },
		{ id: 'mkti',  name: 'Makati Branch (Alona)' },
		{ id: 'wh-qc', name: 'Central Warehouse' },
	];

	// ─── Form state ─────────────────────────────────────────────────────────────
	let formStockMenuItemId = $state('');
	let formToLocationId    = $state('');
	let formQty             = $state('');
	let formNotes           = $state('');

	const parsedQty = $derived(parseFloat(formQty) || 0);

	const selectedSourceItem = $derived(
		sourceItems.find(s => s.menuItemId === formStockMenuItemId)
	);
	const availableStock = $derived(
		selectedSourceItem ? getCurrentStock(selectedSourceItem.id) : null
	);
	const remainingStock = $derived(
		availableStock !== null && parsedQty > 0 ? availableStock - parsedQty : null
	);

	// ─── Destination awareness ──────────────────────────────────────────────────
	const destinationItem = $derived(
		formToLocationId && formStockMenuItemId
			? stockItems.find(s => s.menuItemId === formStockMenuItemId && s.locationId === formToLocationId)
			: undefined
	);
	const destinationCurrentStock = $derived(
		destinationItem ? getCurrentStock(destinationItem.id) : null
	);
	const destinationAfterStock = $derived(
		destinationCurrentStock !== null && parsedQty > 0 ? destinationCurrentStock + parsedQty : null
	);
	const destinationTracksItem = $derived(!!destinationItem);

	// ─── Step validation gates ──────────────────────────────────────────────────
	const canProceedToStep2 = $derived(
		!!formStockMenuItemId && parsedQty > 0 && availableStock !== null && parsedQty <= availableStock
	);
	const canProceedToStep3 = $derived(
		canProceedToStep2 && !!formToLocationId && destinationTracksItem
	);

	// Reset destination when item changes (destination may not track the new item)
	$effect(() => {
		formStockMenuItemId; // track
		formToLocationId = '';
	});

	// ─── Status toast ───────────────────────────────────────────────────────────
	let status = $state<{ type: 'success' | 'error'; msg: string } | null>(null);
	let statusTimer: ReturnType<typeof setTimeout> | null = null;

	function setStatus(type: 'success' | 'error', msg: string) {
		status = { type, msg };
		if (statusTimer) clearTimeout(statusTimer);
		if (type === 'success') statusTimer = setTimeout(() => (status = null), 4000);
	}

	// ─── Navigation ─────────────────────────────────────────────────────────────
	function nextStep() {
		if (currentStep === 1 && canProceedToStep2) currentStep = 2;
		else if (currentStep === 2 && canProceedToStep3) currentStep = 3;
	}

	function prevStep() {
		if (currentStep === 2) currentStep = 1;
		else if (currentStep === 3) currentStep = 2;
	}

	function resetWizard() {
		currentStep = 1;
		formStockMenuItemId = '';
		formQty = '';
		formToLocationId = '';
		formNotes = '';
	}

	function confirmTransfer() {
		const success = transferStock(
			formStockMenuItemId,
			parsedQty,
			sourceLocationId,
			formToLocationId,
			session.userName,
			formNotes.trim() || undefined
		);

		if (success) {
			const transferredQty = parsedQty;
			const transferredUnit = selectedSourceItem?.unit ?? '';
			const dest = locationLabels[formToLocationId] ?? formToLocationId;
			setStatus('success', `Transferred ${transferredQty.toLocaleString()} ${transferredUnit} to ${dest}.`);
			resetWizard();
		} else {
			setStatus('error', 'Transfer failed. The destination may not track this item, or stock is insufficient.');
		}
	}

	// ─── Recent transfers ───────────────────────────────────────────────────────
	const recentTransfers = $derived(
		adjustments.filter(a => a.reason.startsWith('Transfer')).slice(0, 20)
	);

	// ─── Step indicator data ────────────────────────────────────────────────────
	const steps = [
		{ num: 1, label: 'Select Item' },
		{ num: 2, label: 'Destination' },
		{ num: 3, label: 'Confirm' },
	] as const;
</script>

<div class="flex flex-col gap-6 max-w-4xl mx-auto">
	<div class="flex flex-col gap-1">
		<h2 class="text-lg font-bold text-gray-900">Inter-Branch Stock Transfers</h2>
		<p class="text-sm text-gray-500">Move inventory from <strong>{locationLabels[sourceLocationId] ?? sourceLocationId}</strong> to another branch or warehouse.</p>
	</div>

	<!-- Wizard card -->
	<div class="pos-card p-6 flex flex-col gap-6">
		<!-- Step indicator -->
		<div class="flex items-center gap-2">
			{#each steps as step, i}
				<div class="flex items-center gap-2">
					<span class={cn(
						'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors',
						currentStep === step.num
							? 'bg-accent text-white'
							: currentStep > step.num
								? 'bg-status-green text-white'
								: 'bg-gray-200 text-gray-500'
					)}>
						{currentStep > step.num ? '✓' : step.num}
					</span>
					<span class={cn(
						'text-sm font-semibold hidden sm:inline',
						currentStep === step.num ? 'text-gray-900' : 'text-gray-400'
					)}>{step.label}</span>
				</div>
				{#if i < steps.length - 1}
					<div class={cn(
						'flex-1 h-0.5 rounded',
						currentStep > step.num ? 'bg-status-green' : 'bg-gray-200'
					)}></div>
				{/if}
			{/each}
		</div>

		<!-- ═══════════════════════════════════════════════════════════════════ -->
		<!-- STEP 1: Source & Item Selection                                    -->
		<!-- ═══════════════════════════════════════════════════════════════════ -->
		{#if currentStep === 1}
			<div class="flex flex-col gap-5">
				<!-- Source banner -->
				<div class="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
					<MapPin class="w-4 h-4 text-blue-500 flex-shrink-0" />
					<span class="text-sm font-semibold text-blue-700">Source: {locationLabels[sourceLocationId]}</span>
				</div>

				<!-- Item select -->
				<div class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</span>
					<select bind:value={formStockMenuItemId} class="pos-input">
						<option value="" disabled>Select an item...</option>
						{#each sourceItems as item}
							<option value={item.menuItemId}>{item.name} ({item.category})</option>
						{/each}
					</select>
				</div>

				{#if availableStock !== null}
					<div class="rounded-lg border border-border bg-gray-50 px-3 py-2 text-sm">
						<span class="text-gray-500">Available: </span>
						<span class="font-mono font-bold text-gray-900">{availableStock.toLocaleString()} {selectedSourceItem?.unit}</span>
					</div>
				{/if}

				<!-- Quantity -->
				<div class="grid grid-cols-[1fr_auto] gap-3">
					<div class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Transfer Quantity</span>
						<input
							type="number"
							bind:value={formQty}
							class={cn('pos-input font-mono', availableStock !== null && parsedQty > availableStock && 'border-status-red focus:border-status-red')}
							min="0" step="any" placeholder="0.0"
						/>
					</div>
					<div class="flex flex-col gap-1.5 w-20">
						<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit</span>
						<input type="text" class="pos-input bg-gray-50 font-mono text-center text-gray-500 text-sm" value={selectedSourceItem?.unit ?? '—'} disabled />
					</div>
				</div>

				<!-- Remaining stock preview -->
				{#if remainingStock !== null}
					<div class={cn(
						'rounded-lg border px-3 py-2 text-sm',
						remainingStock < 0
							? 'border-status-red/30 bg-status-red-light text-status-red'
							: remainingStock <= (selectedSourceItem?.minLevel ?? 0)
								? 'border-status-yellow/30 bg-status-yellow-light text-status-yellow'
								: 'border-border bg-gray-50 text-gray-600'
					)}>
						After transfer: <span class="font-mono font-bold">{remainingStock.toLocaleString()} {selectedSourceItem?.unit}</span> remaining
						{#if remainingStock < 0}
							— exceeds available stock
						{:else if remainingStock <= (selectedSourceItem?.minLevel ?? 0)}
							— will be below minimum level
						{/if}
					</div>
				{/if}

				<!-- Source inventory preview -->
				<div class="flex flex-col gap-2">
					<span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Source Inventory</span>
					<div class="rounded-lg border border-border overflow-hidden">
						<div class="max-h-[200px] overflow-y-auto">
							<table class="w-full text-sm">
								<thead class="sticky top-0 bg-gray-50 border-b border-border">
									<tr>
										<th class="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-400">Item</th>
										<th class="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-400">Stock</th>
										<th class="px-3 py-2 text-center text-xs font-semibold uppercase text-gray-400">Status</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-border">
									{#each sourceItems as item (item.id)}
										{@const stock = getCurrentStock(item.id)}
										{@const itemStatus = getStockStatus(item.id)}
										<tr class={cn(
											'transition-colors',
											formStockMenuItemId === item.menuItemId ? 'bg-accent/5' : 'hover:bg-gray-50'
										)}>
											<td class="px-3 py-2 font-medium text-gray-900">{item.name}</td>
											<td class="px-3 py-2 text-right font-mono text-gray-700">{stock.toLocaleString()} {item.unit}</td>
											<td class="px-3 py-2 text-center">
												<span class={cn(
													'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
													itemStatus === 'ok' ? 'bg-status-green-light text-status-green'
														: itemStatus === 'low' ? 'bg-status-yellow-light text-status-yellow'
														: 'bg-status-red-light text-status-red'
												)}>
													{itemStatus}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				<!-- Next button -->
				<div class="flex justify-end pt-2">
					<button
						onclick={nextStep}
						disabled={!canProceedToStep2}
						class="btn-primary flex items-center gap-2 px-6"
					>
						Next <ArrowRight class="w-4 h-4" />
					</button>
				</div>
			</div>

		<!-- ═══════════════════════════════════════════════════════════════════ -->
		<!-- STEP 2: Destination Selection                                      -->
		<!-- ═══════════════════════════════════════════════════════════════════ -->
		{:else if currentStep === 2}
			<div class="flex flex-col gap-5">
				<!-- Context banner -->
				<div class="rounded-lg border border-border bg-gray-50 px-4 py-3">
					<p class="text-sm text-gray-700">
						Transferring <span class="font-semibold text-gray-900">{selectedSourceItem?.name}</span>
						— <span class="font-mono font-bold">{parsedQty.toLocaleString()} {selectedSourceItem?.unit}</span>
						from <span class="font-semibold">{locationLabels[sourceLocationId]}</span>
					</p>
				</div>

				<!-- Destination cards -->
				<div class="flex flex-col gap-2.5">
					<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Select Destination</span>

					{#each allLocations as loc}
						{@const isSource = loc.id === sourceLocationId}
						{@const destItem = stockItems.find(s => s.menuItemId === formStockMenuItemId && s.locationId === loc.id)}
						{@const destStock = destItem ? getCurrentStock(destItem.id) : null}
						{@const canSelect = !isSource && !!destItem}

						<label class={cn(
							'flex flex-col gap-2 p-4 border rounded-xl transition-all',
							isSource
								? 'border-gray-200 bg-gray-50 cursor-not-allowed'
								: !destItem
									? 'border-status-yellow/20 bg-status-yellow-light/40 cursor-not-allowed'
									: formToLocationId === loc.id
										? 'border-accent bg-accent/5 shadow-sm cursor-pointer'
										: 'border-border hover:border-gray-300 bg-white cursor-pointer'
						)}>
							<div class="flex items-center gap-3">
								{#if canSelect}
									<input type="radio" bind:group={formToLocationId} value={loc.id} class="h-4 w-4 accent-accent" />
								{:else}
									<div class="h-4 w-4 rounded-full border-2 border-gray-300 bg-gray-100 flex-shrink-0"></div>
								{/if}
								<span class={cn('font-semibold text-sm', isSource ? 'text-gray-400' : 'text-gray-900')}>
									{loc.name}
								</span>
								{#if isSource}
									<span class="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-500">Source</span>
								{/if}
							</div>

							{#if isSource}
								<p class="text-xs text-gray-400 ml-7">Cannot transfer to the same location</p>
							{:else if !destItem}
								<div class="flex items-center gap-1.5 ml-7 text-xs text-status-yellow">
									<AlertCircle class="w-3.5 h-3.5 flex-shrink-0" />
									This location does not track {selectedSourceItem?.name ?? 'this item'}
								</div>
							{:else}
								<div class="ml-7 text-xs text-gray-500 flex flex-col gap-0.5">
									<span>Current stock: <span class="font-mono font-semibold text-gray-700">{destStock?.toLocaleString()} {destItem.unit}</span></span>
									<span>After transfer: <span class="font-mono font-semibold text-status-green">{((destStock ?? 0) + parsedQty).toLocaleString()} {destItem.unit}</span></span>
								</div>
							{/if}
						</label>
					{/each}
				</div>

				<!-- Back / Next -->
				<div class="flex justify-between pt-2">
					<button onclick={prevStep} class="btn-secondary flex items-center gap-2 px-5">
						<ChevronLeft class="w-4 h-4" /> Back
					</button>
					<button
						onclick={nextStep}
						disabled={!canProceedToStep3}
						class="btn-primary flex items-center gap-2 px-6"
					>
						Next <ArrowRight class="w-4 h-4" />
					</button>
				</div>
			</div>

		<!-- ═══════════════════════════════════════════════════════════════════ -->
		<!-- STEP 3: Transfer Summary with Split-View                           -->
		<!-- ═══════════════════════════════════════════════════════════════════ -->
		{:else}
			<div class="flex flex-col gap-5">
				<!-- Transfer header -->
				<div class="flex flex-col gap-1">
					<h3 class="font-bold text-gray-900">Transfer Summary</h3>
					<p class="text-sm text-gray-500">
						<span class="font-semibold text-gray-900">{selectedSourceItem?.name}</span>
						— <span class="font-mono font-bold">{parsedQty.toLocaleString()} {selectedSourceItem?.unit}</span>
					</p>
				</div>

				<!-- Split-view: Source → Destination -->
				<div class="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
					<!-- Source panel -->
					<div class="rounded-xl border border-border bg-gray-50 p-4 flex flex-col gap-3">
						<h4 class="text-xs font-semibold uppercase tracking-wider text-gray-400">Source</h4>
						<p class="font-semibold text-gray-900">{locationLabels[sourceLocationId]}</p>
						<div class="flex flex-col gap-1.5 text-sm">
							<div class="flex justify-between">
								<span class="text-gray-500">Before</span>
								<span class="font-mono font-bold text-gray-900">{availableStock?.toLocaleString()} {selectedSourceItem?.unit}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-500">After</span>
								<span class={cn(
									'font-mono font-bold',
									remainingStock !== null && remainingStock <= (selectedSourceItem?.minLevel ?? 0)
										? 'text-status-yellow'
										: 'text-gray-900'
								)}>
									{remainingStock?.toLocaleString()} {selectedSourceItem?.unit}
								</span>
							</div>
							<hr class="border-border" />
							<div class="flex justify-between text-xs">
								<span class="text-gray-400">Min level</span>
								<span class="font-mono text-gray-400">{selectedSourceItem?.minLevel?.toLocaleString()} {selectedSourceItem?.unit}</span>
							</div>
						</div>
					</div>

					<!-- Arrow -->
					<div class="flex items-center justify-center text-accent">
						<ArrowRight class="w-6 h-6" />
					</div>

					<!-- Destination panel -->
					<div class="rounded-xl border border-accent/30 bg-accent/5 p-4 flex flex-col gap-3">
						<h4 class="text-xs font-semibold uppercase tracking-wider text-accent">Destination</h4>
						<p class="font-semibold text-gray-900">{locationLabels[formToLocationId]}</p>
						<div class="flex flex-col gap-1.5 text-sm">
							<div class="flex justify-between">
								<span class="text-gray-500">Before</span>
								<span class="font-mono font-bold text-gray-900">{destinationCurrentStock?.toLocaleString()} {destinationItem?.unit}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-500">After</span>
								<span class="font-mono font-bold text-status-green">{destinationAfterStock?.toLocaleString()} {destinationItem?.unit}</span>
							</div>
							<hr class="border-border" />
							<div class="flex justify-between text-xs">
								<span class="text-gray-400">Min level</span>
								<span class="font-mono text-gray-400">{destinationItem?.minLevel?.toLocaleString()} {destinationItem?.unit}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Notes -->
				<div class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Transfer Reason / Notes (optional)</span>
					<input type="text" bind:value={formNotes} class="pos-input" placeholder="e.g. Weekly replenishment run" />
				</div>

				<!-- Back / Confirm -->
				<div class="flex justify-between pt-2">
					<button onclick={prevStep} class="btn-secondary flex items-center gap-2 px-5">
						<ChevronLeft class="w-4 h-4" /> Back
					</button>
					<button onclick={confirmTransfer} class="btn-primary flex items-center gap-2 px-6">
						<CheckCircle class="w-4 h-4" /> Confirm Transfer
					</button>
				</div>
			</div>
		{/if}

		<!-- Status toast -->
		{#if status}
			<div
				transition:fade={{ duration: 150 }}
				class={cn(
					'flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium',
					status.type === 'success' ? 'bg-status-green-light border border-status-green/30 text-status-green' : 'bg-status-red-light border border-status-red/20 text-status-red'
				)}
			>
				{#if status.type === 'success'}
					<CheckCircle class="w-4 h-4 flex-shrink-0" />
				{:else}
					<AlertCircle class="w-4 h-4 flex-shrink-0" />
				{/if}
				{status.msg}
			</div>
		{/if}
	</div>

	<!-- Recent transfers -->
	{#if recentTransfers.length > 0}
		<div>
			<h3 class="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">Recent Transfers</h3>
			<div class="overflow-hidden rounded-xl border border-border bg-white">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border bg-gray-50">
							<th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Time</th>
							<th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Item</th>
							<th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Qty</th>
							<th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Direction</th>
							<th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">By</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each recentTransfers as a (a.id)}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-2.5 text-xs text-gray-400">{a.loggedAt}</td>
								<td class="px-4 py-2.5 font-medium text-gray-900">{a.itemName}</td>
								<td class="px-4 py-2.5 text-right font-mono text-gray-700">{a.qty} {a.unit}</td>
								<td class="px-4 py-2.5 text-xs text-gray-500">{a.reason}</td>
								<td class="px-4 py-2.5 text-right text-xs text-gray-400">{a.loggedBy}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
