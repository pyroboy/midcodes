<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import * as Card from '$lib/components/ui/card';
	import Button from '$lib/components/ui/button/button.svelte';
	import { leaseReportFilterSchema } from './reportSchema';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import * as Checkbox from '$lib/components/ui/checkbox';
	import type { Property } from './types';

	let { formData, properties } = $props<{
		formData: any; // SuperForm data
		properties: Property[];
	}>();

	const { form, enhance, errors, constraints } = superForm(formData, {
		id: 'filter-form',
		dataType: 'form',
		taintedMessage: null
	});

	// Generate month count options
	const monthCountOptions = Array.from({ length: 12 }, (_, i) => ({
		value: (i + 1).toString(),
		label: `${i + 1} month${i > 0 ? 's' : ''}`
	}));

	// Generate month options (past 24 months + current + next 12 months)
	function generateMonthOptions() {
		const options: { value: string; label: string; isCurrent?: boolean }[] = [];
		const now = new Date();
		const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
		
		// Generate past 24 months
		for (let i = 24; i >= 1; i--) {
			const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
			const label = date.toLocaleDateString('en-US', { 
				month: 'long', 
				year: 'numeric' 
			});
			options.push({ value, label });
		}
		
		// Add current month (highlighted)
		const currentLabel = now.toLocaleDateString('en-US', { 
			month: 'long', 
			year: 'numeric' 
		});
		options.push({ value: currentMonth, label: `${currentLabel} (Current)`, isCurrent: true });
		
		// Generate next 12 months
		for (let i = 1; i <= 12; i++) {
			const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
			const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
			const label = date.toLocaleDateString('en-US', { 
				month: 'long', 
				year: 'numeric' 
			});
			options.push({ value, label });
		}
		
		return options;
	}

	const monthOptions = generateMonthOptions();
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Report Filters</Card.Title>
		<Card.Description>Customize your monthly payment report</Card.Description>
	</Card.Header>
	<Card.Content>
		<form method="POST" use:enhance class="space-y-6">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<!-- Start Month -->
				<div class="space-y-2">
					<Label for="startMonth">Start Month</Label>
					<Select
						type="single" 
						name="startMonth" 
						onValueChange={(v) => ($form.startMonth = v)}
						value={$form.startMonth}
					>
						<SelectTrigger class="w-full" data-error={!!$errors.startMonth}>
							<span>
								{$form.startMonth
									? (monthOptions.find(m => m.value === $form.startMonth)?.label ?? 'Select month')
									: 'Select month'}
							</span>
						</SelectTrigger>
						<SelectContent>
							{#each monthOptions as option}
								<SelectItem value={option.value}>{option.label}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
					{#if $errors.startMonth}
						<p class="text-sm font-medium text-destructive">{$errors.startMonth}</p>
					{/if}
				</div>

				<!-- Month Count -->
				<div class="space-y-2">
					<Label for="monthCount">Number of Months</Label>
					<Select
						type="single" 
						name="monthCount" 
						onValueChange={(v) => ($form.monthCount = v)}
						value={$form.monthCount}
					>
						<SelectTrigger class="w-full" data-error={!!$errors.monthCount}>
							<span>
								{$form.monthCount
									? `${$form.monthCount} month${Number($form.monthCount) > 1 ? 's' : ''}`
									: 'Select month count'}
							</span>
						</SelectTrigger>
						<SelectContent>
							{#each monthCountOptions as option}
								<SelectItem value={option.value}>{option.label}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
					{#if $errors.monthCount}
						<p class="text-sm font-medium text-destructive">{$errors.monthCount}</p>
					{/if}
				</div>

				<!-- Property Filter -->
				<div class="space-y-2">
					<Label for="propertyId">Property</Label>
					<Select
						type="single" 
						name="propertyId" 
						onValueChange={(v) => ($form.propertyId = v)}
						value={$form.propertyId}
					>
						<SelectTrigger class="w-full" data-error={!!$errors.propertyId}>
							<span>
								{$form.propertyId
									? (properties.find((p: Property) => p.id.toString() === $form.propertyId)?.name ??
										'All Properties')
									: 'All Properties'}
							</span>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">All Properties</SelectItem>
							{#each properties as property}
								<SelectItem value={property.id.toString()}>
									{property.name}
								</SelectItem>
							{/each}
						</SelectContent>
					</Select>
					{#if $errors.propertyId}
						<p class="text-sm font-medium text-destructive">{$errors.propertyId}</p>
					{/if}
				</div>

				<!-- Show Inactive Leases -->
				<div class="flex items-center space-x-2 pt-6">
					<Checkbox.Root
						id="showInactiveLeases"
						name="showInactiveLeases"
						bind:checked={$form.showInactiveLeases}
					/>
					<label
						for="showInactiveLeases"
						class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						Include inactive leases
					</label>
				</div>
			</div>

			<div class="flex justify-end">
				<Button type="submit">Apply Filters</Button>
			</div>
		</form>
	</Card.Content>
</Card.Root>
