<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Loader2 } from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils/format';
	import type { PenaltyBilling } from './types';

	let {
		penalty,
		open,
		onOpenChange,
		form = $bindable(),
		enhance,
		errors,
		submitting
	} = $props<{
		penalty: PenaltyBilling;
		open: boolean;
		onOpenChange: (open: boolean) => void;
		form: any; // This will be bound
		enhance: any;
		errors: any;
		submitting: boolean;
	}>();

	// Calculate the new total and difference for display, reacting to changes in the bound form
	let newTotal = $derived(penalty.amount + (form.penalty_amount || 0));
	let difference = $derived((form.penalty_amount || 0) - penalty.penalty_amount);

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent class="sm:max-w-[425px]">
		<DialogHeader>
			<DialogTitle>Update Penalty</DialogTitle>
			<DialogDescription>
				Update the penalty amount for this billing. The changes will be reflected immediately.
			</DialogDescription>
		</DialogHeader>

		<form method="POST" action="?/updatePenalty" use:enhance>
			<input type="hidden" name="id" value={penalty.id} />

			<div class="grid gap-4 py-4">
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="billing-info" class="text-right">Billing</Label>
					<div id="billing-info" class="col-span-3">
						<p class="text-sm font-medium">{penalty.name}</p>
						<p class="text-xs text-gray-500">Due: {formatDate(penalty.due_date)}</p>
					</div>
				</div>

				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="original-amount" class="text-right">Original Amount</Label>
					<div id="original-amount" class="col-span-3">
						<p class="font-medium tabular-nums">{formatCurrency(penalty.amount)}</p>
					</div>
				</div>

				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="penalty-amount" class="text-right">Penalty Amount</Label>
					<div class="col-span-3">
						<Input
							id="penalty-amount"
							name="penalty_amount"
							type="number"
							step="0.01"
							min="0"
							inputmode="decimal"
							autofocus
							bind:value={form.penalty_amount}
							class="min-h-[44px] {errors?.penalty_amount ? 'border-red-500' : ''}"
						/>
						{#if errors?.penalty_amount}
							<p class="text-xs text-red-500 mt-1">{errors.penalty_amount[0]}</p>
						{/if}
					</div>
				</div>

				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="new-total" class="text-right">New Total</Label>
					<div id="new-total" class="col-span-3">
						<p class="font-medium tabular-nums">{formatCurrency(newTotal)}</p>
						{#if difference > 0}
							<p class="text-xs text-green-600 tabular-nums">+{formatCurrency(difference)}</p>
						{:else if difference < 0}
							<p class="text-xs text-red-600 tabular-nums">{formatCurrency(difference)}</p>
						{/if}
					</div>
				</div>

				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="notes" class="text-right">Notes</Label>
					<div class="col-span-3">
						<Textarea
							id="notes"
							name="notes"
							bind:value={form.notes}
							placeholder="Add any notes about this penalty"
							class={errors?.notes ? 'border-red-500' : ''}
						/>
						{#if errors?.notes}
							<p class="text-xs text-red-500 mt-1">{errors.notes[0]}</p>
						{/if}
					</div>
				</div>
			</div>

			<DialogFooter class="sticky bottom-0 bg-background pt-4 pb-2">
				<Button type="button" variant="outline" class="min-h-[44px]" onclick={() => onOpenChange(false)}>Cancel</Button>
				<Button type="submit" class="min-h-[44px]" disabled={submitting}>
					{#if submitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Saving...
					{:else}
						Save Changes
					{/if}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
