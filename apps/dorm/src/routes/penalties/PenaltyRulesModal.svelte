<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';

	let { open, onOpenChange, onSave } = $props<{
		open: boolean;
		onOpenChange: (open: boolean) => void;
		onSave: (rules: PenaltyRules) => void;
	}>();

	// Define the interface for penalty rules
	interface PenaltyRules {
		gracePeriodDays: number;
		penaltyType: 'percentage' | 'fixed';
		penaltyPercentage: number;
		penaltyFixedAmount: number;
		applyPenaltyAfterDays: number;
	}

	// Default values for the rules
	let gracePeriodDays = $state(3);
	let penaltyType = $state<'percentage' | 'fixed'>('percentage');
	let penaltyPercentage = $state(5);
	let penaltyFixedAmount = $state(500);
	let applyPenaltyAfterDays = $state(1);

	// Options for penalty type
	const penaltyTypeOptions = [
		{ value: 'percentage', label: 'Percentage of Amount' },
		{ value: 'fixed', label: 'Fixed Amount' }
	];

	function handlePenaltyTypeChange(value: string) {
		penaltyType = value as 'percentage' | 'fixed';
	}

	function saveRules() {
		onSave({
			gracePeriodDays,
			penaltyType,
			penaltyPercentage,
			penaltyFixedAmount,
			applyPenaltyAfterDays
		});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Penalty Rules Configuration</DialogTitle>
			<DialogDescription>
				Configure the rules for how penalties are automatically calculated and applied.
			</DialogDescription>
		</DialogHeader>

		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="grace-period" class="text-right">Grace Period</Label>
				<div class="col-span-3 flex items-center gap-2">
					<Input
						id="grace-period"
						type="number"
						min="0"
						class="w-20"
						bind:value={gracePeriodDays}
					/>
					<span class="text-sm text-gray-500">days after due date</span>
				</div>
			</div>

			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="penalty-type" class="text-right">Penalty Type</Label>
				<div class="col-span-3">
					<Select.Root
						type="single"
						value={penaltyType}
						onValueChange={handlePenaltyTypeChange}
						items={penaltyTypeOptions}
					>
						<Select.Trigger>
							{#snippet children()}
								{penaltyType === 'percentage' ? 'Percentage of Amount' : 'Fixed Amount'}
							{/snippet}
						</Select.Trigger>
						<Select.Content>
							{#snippet children()}
								<Select.Group>
									{#each penaltyTypeOptions as option}
										<Select.Item value={option.value}>
											{#snippet children()}
												{option.label}
											{/snippet}
										</Select.Item>
									{/each}
								</Select.Group>
							{/snippet}
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			{#if penaltyType === 'percentage'}
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="penalty-percentage" class="text-right">Percentage</Label>
					<div class="col-span-3 flex items-center gap-2">
						<Input
							id="penalty-percentage"
							type="number"
							min="0"
							max="100"
							class="w-20"
							bind:value={penaltyPercentage}
						/>
						<span class="text-sm text-gray-500">% of the original amount</span>
					</div>
				</div>
			{:else}
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="penalty-fixed" class="text-right">Fixed Amount</Label>
					<div class="col-span-3 flex items-center gap-2">
						<Input
							id="penalty-fixed"
							type="number"
							min="0"
							class="w-32"
							bind:value={penaltyFixedAmount}
						/>
						<span class="text-sm text-gray-500">PHP</span>
					</div>
				</div>
			{/if}

			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="apply-after-days" class="text-right">Apply After</Label>
				<div class="col-span-3 flex items-center gap-2">
					<Input
						id="apply-after-days"
						type="number"
						min="0"
						class="w-20"
						bind:value={applyPenaltyAfterDays}
					/>
					<span class="text-sm text-gray-500">days past due date</span>
				</div>
			</div>
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={() => onOpenChange(false)}>Cancel</Button>
			<Button onclick={saveRules}>Save Rules</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
