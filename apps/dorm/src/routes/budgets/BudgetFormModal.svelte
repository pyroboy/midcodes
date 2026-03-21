<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Building, DollarSign, Tag, Clock, Loader2, ChevronDown, ChevronUp } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { browser } from '$app/environment';
	import type { Budget, Property } from './types';
	import { budgetCategoryEnum, budgetStatusEnum } from './schema';

	// Autofocus project name input on mount
	let nameInputRef = $state<HTMLInputElement | null>(null);
	$effect(() => {
		if (nameInputRef && browser) {
			setTimeout(() => nameInputRef?.focus(), 150);
		}
	});

	// Get enum values as arrays
	const budgetCategories = Object.values(budgetCategoryEnum.enum);
	const budgetStatuses = Object.values(budgetStatusEnum.enum);

	// [P0-1] Humanize enum labels
	function humanizeEnum(value: string): string {
		return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bAnd\b/g, 'and');
	}

	// Props using Svelte 5 $props rune
	let {
		budget,
		properties = [],
		editMode = false,
		isSubmitting = false
	} = $props<{
		budget: Budget | null;
		properties: Property[];
		editMode: boolean;
		isSubmitting?: boolean;
	}>();

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		close: void;
		submit: Budget;
	}>();

	// Handle close
	function handleClose() {
		dispatch('close');
	}

	// Form data
	let formData = $state((() => ({
		id: budget?.id || undefined,
		project_name: budget?.project_name || '',
		project_description: budget?.project_description || '',
		project_category: budget?.project_category || 'RENOVATION',
		planned_amount: budget?.planned_amount || 0,
		pending_amount: budget?.pending_amount || 0,
		actual_amount: budget?.actual_amount || 0,
		budget_items: budget?.budget_items || [],
		status: budget?.status || 'PLANNED',
		start_date: budget?.start_date || null,
		end_date: budget?.end_date || null,
		property_id: budget?.property_id || null,
		created_by: budget?.created_by || null,
		created_at: budget?.created_at || new Date().toISOString(),
		updated_at: budget?.updated_at || new Date().toISOString()
	} as Budget))());

	// Progressive disclosure for description and dates
	let showOptional = $state(!!(budget?.project_description || budget?.start_date || budget?.end_date));

	// Handle form submission
	function handleSubmit() {
		dispatch('submit', formData as Budget);
	}

	function handleChange(field: keyof Budget, value: any) {
		formData = {
			...formData,
			[field]: value
		};
	}
</script>

<Dialog.Root open={true} onOpenChange={(isOpen) => !isOpen && handleClose()}>
	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
		/>
		<Dialog.Content
			class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-h-[90vh] overflow-y-auto"
		>
			<Dialog.Header class="border-b pb-3">
				<Dialog.Title class="text-xl font-semibold text-blue-700">
					{editMode ? 'Edit Budget Project' : 'Add Budget Project'}
				</Dialog.Title>
				<Dialog.Description class="text-gray-600">
					{editMode
						? 'Update the details of this budget project.'
						: 'Create a new budget project for property renovations or maintenance.'}
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-5">
				<!-- Property Selection -->
				<div class="space-y-2">
					<Label for="property" class="flex items-center gap-2 font-medium text-gray-700">
						<Building class="h-4 w-4 text-gray-500" />
						Property
					</Label>
					<Select.Root
						type="single"
						value={formData.property_id?.toString() || ''}
						onValueChange={(value: string) => handleChange('property_id', parseInt(value, 10))}
					>
						<Select.Trigger
							class="w-full min-h-[44px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
						>
							<span
								>{properties.find((p: Property) => p.id === formData.property_id)?.name ||
									'Select a property'}</span
							>
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								{#each properties as property}
									<Select.Item value={property.id.toString()}>{property.name}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>

				<!-- Project Name -->
				<div class="space-y-2">
					<Label for="project_name" class="font-medium text-gray-700">Project Name</Label>
					<Input
						id="project_name"
						value={formData.project_name}
						onchange={(e) => handleChange('project_name', e.currentTarget.value)}
						placeholder="Enter project name"
						class="min-h-[44px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
						bind:ref={nameInputRef}
						required
					/>
				</div>

				<!-- Collapsible optional: Description & Dates -->
				<div class="border rounded-lg overflow-hidden">
					<button
						type="button"
						class="flex items-center justify-between w-full px-4 py-2.5 text-left bg-muted/30 hover:bg-muted/50 transition-colors"
						onclick={() => showOptional = !showOptional}
					>
						<span class="text-sm text-muted-foreground">
							Description & Dates
							{#if formData.project_description || formData.start_date || formData.end_date}
								<span class="text-primary">(has content)</span>
							{/if}
						</span>
						{#if showOptional}
							<ChevronUp class="h-4 w-4 text-muted-foreground" />
						{:else}
							<ChevronDown class="h-4 w-4 text-muted-foreground" />
						{/if}
					</button>
					{#if showOptional}
						<div class="p-4 space-y-4">
							<div class="space-y-2">
								<Label for="project_description" class="font-medium text-gray-700">Description</Label>
								<Textarea
									id="project_description"
									value={formData.project_description || ''}
									onchange={(e) => handleChange('project_description', e.currentTarget.value)}
									placeholder="Enter project description"
									class="min-h-[44px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
									rows={2}
								/>
							</div>

				<div class="grid grid-cols-2 gap-4">
					<!-- Project Category -->
					<div class="space-y-2">
						<Label for="project_category" class="flex items-center gap-2 font-medium text-gray-700">
							<Tag class="h-4 w-4 text-gray-500" />
							Category
						</Label>
						<Select.Root
							type="single"
							value={formData.project_category}
							onValueChange={(value: string) => handleChange('project_category', value)}
						>
							<Select.Trigger
								class="w-full min-h-[44px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
							>
								<span>{formData.project_category ? humanizeEnum(formData.project_category) : 'Select a category'}</span>
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									{#each budgetCategories as category}
										<Select.Item value={category}>{humanizeEnum(category)}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>

					<!-- Status -->
					<div class="space-y-2">
						<Label for="status" class="flex items-center gap-2 font-medium text-gray-700">
							<Clock class="h-4 w-4 text-gray-500" />
							Status
						</Label>
						<Select.Root
							type="single"
							value={formData.status}
							onValueChange={(value: string) => handleChange('status', value)}
						>
							<Select.Trigger
								class="w-full min-h-[44px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
							>
								<span>{formData.status ? humanizeEnum(formData.status) : 'Select a status'}</span>
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									{#each budgetStatuses as status}
										<Select.Item value={status}>{humanizeEnum(status)}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<!-- Planned Amount -->
				<div class="space-y-2">
					<Label for="planned_amount" class="flex items-center gap-2 font-medium text-gray-700">
						<DollarSign class="h-4 w-4 text-gray-500" />
						Planned Budget
					</Label>
					<Input
						id="planned_amount"
						type="number"
						inputmode="decimal"
						value={formData.planned_amount}
						onchange={(e) => handleChange('planned_amount', parseFloat(e.currentTarget.value))}
						min="0"
						step="0.01"
						placeholder="0.00"
						class="min-h-[44px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
						required
					/>
				</div>

							<!-- Date Range -->
							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-2">
									<Label for="start_date" class="font-medium text-gray-700">Start Date</Label>
									<Input
										type="date"
										class="min-h-[44px] border-gray-300"
										value={formData.start_date
											? new Date(formData.start_date).toISOString().split('T')[0]
											: ''}
										onchange={(e) => {
											const date = e.currentTarget.value;
											if (date) handleChange('start_date', new Date(date).toISOString());
										}}
									/>
								</div>
								<div class="space-y-2">
									<Label for="end_date" class="font-medium text-gray-700">End Date</Label>
									<Input
										type="date"
										class="min-h-[44px] border-gray-300"
										value={formData.end_date
											? new Date(formData.end_date).toISOString().split('T')[0]
											: ''}
										onchange={(e) => {
											const date = e.currentTarget.value;
											if (date) handleChange('end_date', new Date(date).toISOString());
										}}
									/>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<Dialog.Footer class="flex justify-end gap-2 pt-4 border-t mt-2 sticky bottom-0 bg-background pb-1 sm:static sm:pb-0">
				<Button variant="outline" onclick={handleClose} class="min-h-[44px] border-gray-300">Cancel</Button>
				<div class="flex flex-col items-end gap-1">
					<Button onclick={handleSubmit} class="min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting || !formData.project_name || !formData.property_id}>
						{#if isSubmitting}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							Saving...
						{:else}
							{editMode ? 'Update Project' : 'Create Project'}
						{/if}
					</Button>
					{#if !isSubmitting && (!formData.project_name || !formData.property_id)}
						<span class="text-xs text-muted-foreground">Fill name and property</span>
					{/if}
				</div>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
