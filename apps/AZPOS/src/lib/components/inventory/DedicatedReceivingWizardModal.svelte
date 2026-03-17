<script lang="ts">
	import type { PurchaseOrder } from '$lib/types/purchaseOrder.schema';
	import type { ReceivingItem ,ReceivingSession} from '$lib/types/receiving.schema';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { useReceiving, useReceivingSession, useReceivingItems } from '$lib/data/receiving';
	import { toast } from 'svelte-sonner';
	import { cn } from '$lib/utils';
	import * as Table from '$lib/components/ui/table';

	let {
		open,
		po,
		receivingSessionId,
		onClose
	}: {
		open: boolean;
		po: PurchaseOrder | null;
		receivingSessionId?: string | null;
		onClose: () => void;
	} = $props();

	const steps = [
		{ id: 1, name: 'Verification' },
		{ id: 2, name: 'Items' },
		{ id: 3, name: 'Confirmation' }
	];

	// Local component state using Svelte 5 runes
	let currentStep = $state(1);
	let carrierName = $state('');
	let trackingNumber = $state('');
	let packageCondition = $state('good');
	let receivedQuantities = $state<Record<string, number>>({});
	let batchNumbers = $state<Record<string, string>>({});
	let expirationDates = $state<Record<string, string>>({});
	let purchaseCosts = $state<Record<string, number>>({});
	let notes = $state('');
	let isSubmitting = $state(false);

	// Data layer hooks - these return Svelte stores
	const receivingHook = useReceiving();
	
	// Internal session ID state - either from prop or created
	let internalSessionId = $state<string | null>(receivingSessionId || null);

	// These hooks are reactive to receivingSessionId changes
	// Use $derived.by to create reactive hooks based on internalSessionId
	const sessionHook = $derived.by(() => useReceivingSession(internalSessionId || ''));
	const itemsHook = $derived.by(() => useReceivingItems(internalSessionId || ''));

	// Destructure individual stores from hooks reactively
	const { session, isLoading: sessionLoading, isError: sessionError, error: sessionErrorDetails } = $derived(sessionHook);
	const { items, isLoading: itemsLoading, isError: itemsError, error: itemsErrorDetails } = $derived(itemsHook);

	// Effect to create session if needed
	$effect(() => {
		if (open && po && !internalSessionId) {
			// Create a new receiving session
			receivingHook.createReceivingSession({
				purchase_order_id: po.id,
				status: 'pending'
			}).then((newSession: ReceivingSession) => {
				internalSessionId = newSession.id;
			}).catch((error: any) => {
				console.error('Failed to create receiving session:', error);
			});
		}
	});



	function handleClose() {
		// Reset all local state
		currentStep = 1;
		carrierName = '';
		trackingNumber = '';
		packageCondition = 'good';
		receivedQuantities = {};
		batchNumbers = {};
		expirationDates = {};
		purchaseCosts = {};
		notes = '';
		isSubmitting = false;

		onClose();
	}

	function nextStep() {
		if (currentStep < steps.length) {
			currentStep++;
		}
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep--;
		}
	}

	async function completeReceiving() {
		if (!internalSessionId || !po || !itemsHook) return;

		isSubmitting = true;

		try {
			// Get current items from the store
			const currentItems = $items;
			
			// Prepare items data
			const itemsData = currentItems.map((item: ReceivingItem) => ({
				product_id: item.product_id,
				quantity_received: receivedQuantities[item.product_id] || 0,
				unit_cost: purchaseCosts[item.product_id] || 0,
				batch_number: batchNumbers[item.product_id] || undefined,
				expiry_date: expirationDates[item.product_id] || undefined,
				notes: ''
			}));

			// Complete the receiving session
			await receivingHook.completeReceivingSession({
				receiving_session_id: internalSessionId,
				items: itemsData,
				received_date: new Date().toISOString(),
				notes
			});

			toast.success('Purchase order received successfully');
			handleClose();
		} catch (error) {
			toast.error('Failed to complete receiving', {
				description: error instanceof Error ? error.message : 'Unknown error'
			});
		} finally {
			isSubmitting = false;
		}
	}

	function setAllItemsReceived() {
		if (!itemsHook) return;
		const currentItems = $items;
		if (!currentItems) return;

		currentItems.forEach((item: ReceivingItem) => {
			receivedQuantities[item.product_id] = item.quantity_expected;
		});
	}

	function updateReceivedQuantity(productId: string, quantity: number) {
		receivedQuantities[productId] = quantity;
	}

	function updateBatchNumber(productId: string, batchNumber: string) {
		batchNumbers[productId] = batchNumber;
	}

	function updateExpirationDate(productId: string, date: string) {
		expirationDates[productId] = date;
	}

	function updatePurchaseCost(productId: string, cost: number) {
		purchaseCosts[productId] = cost;
	}

	function isBatchTracked(productId: string): boolean {
		if (!itemsHook) return false;
		const currentItems = $items;
		if (!currentItems) return false;
		const item = currentItems.find((i: ReceivingItem) => i.product_id === productId);
		return item?.product?.requires_batch_tracking || false;
	}

	function isStepValid(step: number): boolean {
		switch (step) {
			case 1:
				return true; // Verification step is always valid
			case 2:
				// Items step validation
				if (!itemsHook) return false;
				const currentItems = $items;
				if (!currentItems) return false;
				for (const item of currentItems) {
					const receivedQty = receivedQuantities[item.product_id] || 0;
					if (receivedQty < 0) return false;

					// If product requires batch tracking, batch number is required
					if (
						isBatchTracked(item.product_id) &&
						receivedQty > 0 &&
						!batchNumbers[item.product_id]
					) {
						return false;
					}
				}
				return true;
			case 3:
				return true; // Confirmation step is always valid
			default:
				return false;
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen && handleClose()}>
	{#if po}
		<Dialog.Content class="sm:max-w-4xl">
			<Dialog.Header>
				<Dialog.Title>Receive Purchase Order: {po.po_number}</Dialog.Title>
				<Dialog.Description
					>Follow the steps to receive items for this purchase order using dedicated receiving
					tables.</Dialog.Description
				>
			</Dialog.Header>

			<!-- Progress Steps -->
			<div class="flex items-center justify-between mb-6">
				{#each steps as step, i}
					<div class="flex items-center">
						<div
							class={cn(
								'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
								currentStep === step.id
									? 'bg-primary text-primary-foreground'
								: step.id < currentStep
								? 'bg-secondary text-secondary-foreground'
								: 'bg-muted text-muted-foreground'
							)}
						>
							{step.id < currentStep ? '✓' : step.id}
						</div>
						<span class="ml-2 text-sm font-medium">{step.name}</span>
						{#if i < steps.length - 1}
							<div
								class={cn(
									'mx-2 h-0.5 w-16',
									step.id < currentStep ? 'bg-secondary' : 'bg-muted'
								)}
							></div>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Wizard Content -->
			<div class="min-h-[300px]">
				{#if currentStep === 1}
					<div class="space-y-6">
						<h3 class="text-lg font-semibold">Step 1: Verification</h3>
						<div class="grid grid-cols-2 gap-6">
							<div class="space-y-2">
								<Label for="carrier">Carrier Name</Label>
								<Input
									id="carrier"
									bind:value={carrierName}
									placeholder="Enter carrier name"
								/>
							</div>
							<div class="space-y-2">
								<Label for="tracking">Tracking Number</Label>
								<Input
									id="tracking"
									bind:value={trackingNumber}
									placeholder="Enter tracking number"
								/>
							</div>
							<div class="space-y-2">
								<Label>Package Condition</Label>
								<ToggleGroup.Root
									value={packageCondition}
									onValueChange={(value) => (packageCondition = value)}
									type="single"
									class="flex gap-2"
								>
									<ToggleGroup.Item value="good" class="px-4 py-2 text-sm">
										Good
									</ToggleGroup.Item>
									<ToggleGroup.Item value="damaged" class="px-4 py-2 text-sm">
										Damaged
									</ToggleGroup.Item>
									<ToggleGroup.Item value="other" class="px-4 py-2 text-sm">
										Other
									</ToggleGroup.Item>
								</ToggleGroup.Root>
							</div>
						</div>
						<div class="space-y-2">
							<Label for="notes">Notes</Label>
							<Textarea
								id="notes"
								bind:value={notes}
								placeholder="Add any additional notes about the shipment"
								rows={3}
							/>
						</div>
					</div>
				{:else if currentStep === 2}
					<div class="space-y-4">
						<div class="flex justify-between items-center">
							<h3 class="text-lg font-semibold">Step 2: Items & Batch Information</h3>
							<Button variant="secondary" size="sm" onclick={setAllItemsReceived}
								>Set All Items as Received</Button
							>
						</div>

						{#if !itemsHook}
							<div class="flex justify-center items-center h-32">
								<p>Initializing...</p>
							</div>
						{:else if $itemsLoading}
							<div class="flex justify-center items-center h-32">
								<p>Loading items...</p>
							</div>
						{:else if $itemsError}
							<div class="flex justify-center items-center h-32 text-destructive">
								<p>Error loading items: {$itemsErrorDetails?.message}</p>
							</div>
						{:else if $items && $items.length > 0}
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head>Product</Table.Head>
										<Table.Head>Expected</Table.Head>
										<Table.Head>Received</Table.Head>
										<Table.Head>Batch #</Table.Head>
										<Table.Head>Expiry Date</Table.Head>
										<Table.Head>Unit Cost</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each $items as item (item.id)}
										<Table.Row>
											<Table.Cell>
												<div>
													<div class="font-medium">{item.product?.name || 'Unknown Product'}</div>
													<div class="text-sm text-muted-foreground">
														SKU: {item.product?.sku || 'N/A'}
													</div>
												</div>
											</Table.Cell>
											<Table.Cell>{item.quantity_expected}</Table.Cell>
											<Table.Cell>
												<Input
													type="number"
													min="0"
													bind:value={receivedQuantities[item.product_id]}
													oninput={(e) => {
														const target = e.target as HTMLInputElement;
														updateReceivedQuantity(
															item.product_id,
															target.valueAsNumber || 0
														);
													}}
													class="w-20"
												/>
											</Table.Cell>
											<Table.Cell>
												{#if isBatchTracked(item.product_id)}
													<Input
														type="text"
														bind:value={batchNumbers[item.product_id]}
														oninput={(e: Event) => {
															const target = e.target as HTMLInputElement;
															updateBatchNumber(item.product_id, target.value);
														}}
														placeholder="Enter batch #"
														class="w-24"
													/>
												{:else}
													<div class="text-muted-foreground text-sm">N/A</div>
												{/if}
											</Table.Cell>
											<Table.Cell>
												{#if isBatchTracked(item.product_id)}
													<Input
														type="date"
														bind:value={expirationDates[item.product_id]}
														oninput={(e: Event) => {
															const target = e.target as HTMLInputElement;
															updateExpirationDate(item.product_id, target.value);
														}}
														class="w-32"
													/>
												{:else}
													<div class="text-muted-foreground text-sm">N/A</div>
												{/if}
											</Table.Cell>
											<Table.Cell>
												<Input
													type="number"
													min="0"
													step="0.01"
													bind:value={purchaseCosts[item.product_id]}
													oninput={(e) => {
														const target = e.target as HTMLInputElement;
														updatePurchaseCost(
															item.product_id,
															target.valueAsNumber || 0
														);
													}}
													class="w-20"
												/>
											</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						{:else}
							<div class="text-center py-8 text-muted-foreground">
								<p>No items found for this purchase order.</p>
							</div>
						{/if}
					</div>
				{:else if currentStep === 3}
					<div class="space-y-6">
						<h3 class="text-lg font-semibold">Step 3: Confirmation</h3>
						<div class="space-y-4 p-4 border rounded-lg bg-muted/50">
							<h4 class="font-semibold">Shipment Details</h4>
							<div class="grid grid-cols-2 gap-4 text-sm">
								<div>
									<span class="font-medium">Carrier:</span> {carrierName || 'Not provided'}
								</div>
								<div>
									<span class="font-medium">Tracking #:</span> {trackingNumber || 'Not provided'}
								</div>
								<div>
									<span class="font-medium">Condition:</span> {packageCondition}
								</div>
							</div>
							{#if notes}
								<div class="mt-2">
									<span class="font-medium">Notes:</span> {notes}
								</div>
							{/if}
						</div>

						<div class="space-y-4 p-4 border rounded-lg bg-muted/50">
							<h4 class="font-semibold">Items Summary</h4>
							{#if $items}
								<Table.Root>
									<Table.Header>
										<Table.Row>
											<Table.Head>Product</Table.Head>
											<Table.Head>Expected</Table.Head>
											<Table.Head>Receiving</Table.Head>
											<Table.Head>Batch #</Table.Head>
											<Table.Head>Expiry</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each $items as item (item.id)}
											<Table.Row>
												<Table.Cell>
													<div class="font-medium">{item.product?.name || 'Unknown Product'}</div>
													<div class="text-sm text-muted-foreground">
														SKU: {item.product?.sku || 'N/A'}
													</div>
												</Table.Cell>
												<Table.Cell>{item.quantity_expected}</Table.Cell>
												<Table.Cell>
													{receivedQuantities[item.product_id] || 0}
												</Table.Cell>
												<Table.Cell>
													{isBatchTracked(item.product_id)
														? batchNumbers[item.product_id] || 'Not provided'
														: 'N/A'}
												</Table.Cell>
												<Table.Cell>
													{isBatchTracked(item.product_id) &&
													expirationDates[item.product_id]
														? new Date(expirationDates[item.product_id]).toLocaleDateString()
														: 'N/A'}
												</Table.Cell>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							{:else}
								<p class="text-muted-foreground">No items to display.</p>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<Dialog.Footer class="mt-8 pt-4 border-t">
				<div class="w-full flex justify-between">
					<Button variant="outline" onclick={handleClose}>Cancel</Button>
					<div class="flex gap-2">
						{#if currentStep > 1}
							<Button variant="outline" onclick={prevStep}>Previous</Button>
						{/if}
						{#if currentStep < steps.length}
							<Button
								onclick={nextStep}
								disabled={!isStepValid(currentStep)}
								>{currentStep === steps.length - 1 ? 'Review' : 'Next'}</Button>
						{:else}
							<Button
								onclick={completeReceiving}
								disabled={isSubmitting || !isStepValid(currentStep)}
								>{isSubmitting ? 'Processing...' : 'Complete Receiving'}</Button>
						{/if}
					</div>
				</div>
			</Dialog.Footer>
		</Dialog.Content>
	{/if}
</Dialog.Root>