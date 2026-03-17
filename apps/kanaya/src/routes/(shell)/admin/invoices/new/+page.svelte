<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { getUsersWithCredits } from '$lib/remote/billing.remote';
	import { createInvoice } from '$lib/remote/invoices.remote';
	import { CREDIT_PACKAGES, PREMIUM_FEATURES } from '$lib/payments/catalog';
	import { FileText, Plus, Trash2, ArrowLeft, User, Package } from '@lucide/svelte';

	const users = getUsersWithCredits();

	let selectedUserId = $state('');
	let invoiceType = $state<
		'credit_purchase' | 'feature_purchase' | 'refund' | 'correction' | 'bonus'
	>('credit_purchase');
	let notes = $state('');
	let internalNotes = $state('');
	let dueDate = $state('');
	let loading = $state(false);
	let errorMessage = $state('');

	// Invoice items
	let items = $state<
		Array<{
			item_type: 'credits' | 'feature' | 'service' | 'custom';
			sku_id?: string;
			description: string;
			quantity: number;
			unit_price: number;
			credits_granted: number;
			metadata: Record<string, unknown>;
		}>
	>([]);

	const invoiceTypes = [
		{ value: 'credit_purchase', label: 'Credit Purchase' },
		{ value: 'feature_purchase', label: 'Feature Purchase' },
		{ value: 'refund', label: 'Refund' },
		{ value: 'correction', label: 'Correction' },
		{ value: 'bonus', label: 'Bonus' }
	];

	function addCreditPackageItem(pkg: (typeof CREDIT_PACKAGES)[number]) {
		items = [
			...items,
			{
				item_type: 'credits',
				sku_id: pkg.id,
				description: `${pkg.name} - ${pkg.credits} credits`,
				quantity: 1,
				unit_price: pkg.amountPhp * 100, // Convert to centavos
				credits_granted: pkg.credits,
				metadata: { package_id: pkg.id }
			}
		];
	}

	function addFeatureItem(feature: (typeof PREMIUM_FEATURES)[number]) {
		items = [
			...items,
			{
				item_type: 'feature',
				sku_id: feature.id,
				description: feature.name,
				quantity: 1,
				unit_price: feature.price * 100, // Convert to centavos
				credits_granted: 0,
				metadata: { feature_id: feature.id }
			}
		];
	}

	function addCustomItem() {
		items = [
			...items,
			{
				item_type: 'custom',
				description: '',
				quantity: 1,
				unit_price: 0,
				credits_granted: 0,
				metadata: {}
			}
		];
	}

	function removeItem(index: number) {
		items = items.filter((_, i) => i !== index);
	}

	function updateItem(index: number, field: string, value: any) {
		items = items.map((item, i) => {
			if (i !== index) return item;
			return { ...item, [field]: value };
		});
	}

	let totalAmount = $derived(items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0));

	let totalCredits = $derived(
		items.reduce((sum, item) => sum + item.credits_granted * item.quantity, 0)
	);

	async function handleSubmit() {
		if (!selectedUserId) {
			errorMessage = 'Please select a user';
			return;
		}

		if (items.length === 0) {
			errorMessage = 'Please add at least one item';
			return;
		}

		// Validate items
		for (const item of items) {
			if (!item.description) {
				errorMessage = 'All items must have a description';
				return;
			}
		}

		loading = true;
		errorMessage = '';

		try {
			const result = await createInvoice({
				user_id: selectedUserId,
				invoice_type: invoiceType,
				notes: notes || undefined,
				internal_notes: internalNotes || undefined,
				due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
				items: items.map((item) => ({
					item_type: item.item_type,
					sku_id: item.sku_id,
					description: item.description,
					quantity: item.quantity,
					unit_price: item.unit_price,
					total_price: item.quantity * item.unit_price,
					credits_granted: item.credits_granted,
					metadata: item.metadata
				}))
			});

			if (result.success) {
				goto('/admin/invoices');
			}
		} catch (err: any) {
			errorMessage = err.message || 'Failed to create invoice';
		} finally {
			loading = false;
		}
	}

	function formatCurrency(amountCentavos: number): string {
		return `₱${(amountCentavos / 100).toFixed(2)}`;
	}
</script>

<svelte:head>
	<title>Create Invoice - Admin</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="sm" href="/admin/invoices">
			<ArrowLeft class="h-4 w-4 mr-2" />
			Back
		</Button>
		<div>
			<h1 class="text-2xl font-bold">Create Invoice</h1>
			<p class="text-muted-foreground">Create a new invoice for a user</p>
		</div>
	</div>

	{#if errorMessage}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
			{errorMessage}
		</div>
	{/if}

	<!-- User Selection -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<User class="h-5 w-5" />
				Select User
			</CardTitle>
			<CardDescription>Choose the user to invoice</CardDescription>
		</CardHeader>
		<CardContent>
			{#await users}
				<p class="text-muted-foreground">Loading users...</p>
			{:then usersData}
				<div class="grid gap-4">
					<div>
						<Label for="user">User</Label>
						<select
							id="user"
							class="w-full mt-1 border rounded-md px-3 py-2 bg-background"
							bind:value={selectedUserId}
						>
							<option value="">Select a user...</option>
							{#each usersData as user}
								<option value={user.id}>
									{user.email} ({user.credits_balance} credits)
								</option>
							{/each}
						</select>
					</div>
					<div>
						<Label for="type">Invoice Type</Label>
						<select
							id="type"
							class="w-full mt-1 border rounded-md px-3 py-2 bg-background"
							bind:value={invoiceType}
						>
							{#each invoiceTypes as type}
								<option value={type.value}>{type.label}</option>
							{/each}
						</select>
					</div>
				</div>
			{/await}
		</CardContent>
	</Card>

	<!-- Quick Add Items -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Package class="h-5 w-5" />
				Quick Add Items
			</CardTitle>
			<CardDescription>Add items from the catalog or create custom items</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				<div>
					<Label class="text-sm font-medium">Credit Packages</Label>
					<div class="flex flex-wrap gap-2 mt-2">
						{#each CREDIT_PACKAGES as pkg}
							<Button variant="outline" size="sm" onclick={() => addCreditPackageItem(pkg)}>
								{pkg.name} (₱{pkg.amountPhp})
							</Button>
						{/each}
					</div>
				</div>
				<div>
					<Label class="text-sm font-medium">Premium Features</Label>
					<div class="flex flex-wrap gap-2 mt-2">
						{#each PREMIUM_FEATURES as feature}
							<Button variant="outline" size="sm" onclick={() => addFeatureItem(feature)}>
								{feature.name} (₱{feature.price})
							</Button>
						{/each}
					</div>
				</div>
				<div>
					<Button variant="secondary" size="sm" onclick={addCustomItem}>
						<Plus class="h-4 w-4 mr-2" />
						Add Custom Item
					</Button>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Invoice Items -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<FileText class="h-5 w-5" />
				Invoice Items
			</CardTitle>
			<CardDescription>
				{items.length} items, {totalCredits} credits total
			</CardDescription>
		</CardHeader>
		<CardContent>
			{#if items.length === 0}
				<p class="text-muted-foreground text-center py-8">
					No items added yet. Use the buttons above to add items.
				</p>
			{:else}
				<div class="space-y-4">
					{#each items as item, index}
						<div class="flex items-start gap-4 p-4 border rounded-lg">
							<div class="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
								<div class="md:col-span-2">
									<Label>Description</Label>
									<Input
										value={item.description}
										oninput={(e) => updateItem(index, 'description', e.currentTarget.value)}
										placeholder="Item description"
									/>
								</div>
								<div>
									<Label>Quantity</Label>
									<Input
										type="number"
										min="1"
										value={item.quantity}
										oninput={(e) =>
											updateItem(index, 'quantity', parseInt(e.currentTarget.value) || 1)}
									/>
								</div>
								<div>
									<Label>Unit Price (₱)</Label>
									<Input
										type="number"
										min="0"
										step="0.01"
										value={item.unit_price / 100}
										oninput={(e) =>
											updateItem(
												index,
												'unit_price',
												Math.round((parseFloat(e.currentTarget.value) || 0) * 100)
											)}
									/>
								</div>
								{#if item.item_type === 'credits' || item.item_type === 'custom'}
									<div>
										<Label>Credits Granted</Label>
										<Input
											type="number"
											min="0"
											value={item.credits_granted}
											oninput={(e) =>
												updateItem(index, 'credits_granted', parseInt(e.currentTarget.value) || 0)}
										/>
									</div>
								{/if}
							</div>
							<div class="flex flex-col items-end gap-2">
								<span class="font-semibold">
									{formatCurrency(item.quantity * item.unit_price)}
								</span>
								<Button variant="ghost" size="sm" onclick={() => removeItem(index)}>
									<Trash2 class="h-4 w-4 text-red-500" />
								</Button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Additional Details -->
	<Card>
		<CardHeader>
			<CardTitle>Additional Details</CardTitle>
		</CardHeader>
		<CardContent class="space-y-4">
			<div>
				<Label for="dueDate">Due Date (Optional)</Label>
				<Input id="dueDate" type="date" bind:value={dueDate} />
			</div>
			<div>
				<Label for="notes">Notes (Visible to User)</Label>
				<Textarea
					id="notes"
					bind:value={notes}
					placeholder="Notes that will be visible on the invoice..."
					rows={3}
				/>
			</div>
			<div>
				<Label for="internalNotes">Internal Notes (Admin Only)</Label>
				<Textarea
					id="internalNotes"
					bind:value={internalNotes}
					placeholder="Internal notes not visible to user..."
					rows={3}
				/>
			</div>
		</CardContent>
	</Card>

	<!-- Summary & Submit -->
	<Card>
		<CardContent class="pt-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-lg font-semibold">
						Total: {formatCurrency(totalAmount)}
					</p>
					{#if totalCredits > 0}
						<p class="text-sm text-muted-foreground">
							{totalCredits} credits will be granted when paid
						</p>
					{/if}
				</div>
				<div class="flex gap-2">
					<Button variant="outline" href="/admin/invoices">Cancel</Button>
					<Button
						onclick={handleSubmit}
						disabled={loading || !selectedUserId || items.length === 0}
					>
						{#if loading}
							Creating...
						{:else}
							Create Invoice
						{/if}
					</Button>
				</div>
			</div>
		</CardContent>
	</Card>
</div>
