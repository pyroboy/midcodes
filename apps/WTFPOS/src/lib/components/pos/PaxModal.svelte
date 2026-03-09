<script lang="ts">
    import type { Table } from '$lib/types';
    import { cn } from '$lib/utils';

    interface Props {
        table: Table | null;
        onconfirm: (pax: number, childPax: number, freePax: number) => void;
        oncancel: () => void;
    }

    let { table, onconfirm, oncancel }: Props = $props();

    let adults = $state(2);
    let children = $state(0);  // ages 6–9, reduced price
    let free = $state(0);      // ages under 5, no charge

    let customAdults = $state('');
    let capacityError = $state('');

    let total = $derived(adults + children + free);

    function clampedAdults(n: number) {
        adults = Math.max(1, n);
        capacityError = '';
        checkCapacity();
    }

    function clampedChildren(n: number) {
        children = Math.max(0, n);
        capacityError = '';
        checkCapacity();
    }

    function clampedFree(n: number) {
        free = Math.max(0, n);
        capacityError = '';
        checkCapacity();
    }

    function checkCapacity(): boolean {
        if (table && total > table.capacity) {
            capacityError = `Maximum ${table.capacity} guest${table.capacity !== 1 ? 's' : ''} for this table.`;
            return false;
        }
        return true;
    }

    function handleConfirm() {
        if (!checkCapacity()) return;
        onconfirm(total, children, free);
    }

    // Quick-select presets for adults row (1–8)
    const adultPresets = [1, 2, 3, 4, 5, 6, 7, 8];
    // Quick-select presets for children/free rows (0–4)
    const childPresets = [0, 1, 2, 3, 4];
</script>

{#if table}
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="pos-card w-[360px] flex flex-col gap-5">
            <div>
                <h3 class="font-bold text-gray-900">How many guests for {table.label}?</h3>
                <p class="text-xs text-gray-400 mt-0.5">Capacity: <strong class="text-gray-600">{table.capacity}</strong></p>
            </div>

            <!-- Adults row -->
            <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <div>
                        <span class="text-sm font-semibold text-gray-800">Adults</span>
                        <span class="ml-1.5 text-xs text-gray-400">full price</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <button
                            onclick={() => clampedAdults(adults - 1)}
                            class="btn-secondary h-8 w-8 text-base p-0 flex items-center justify-center"
                            disabled={adults <= 1}
                        >−</button>
                        <span class="w-8 text-center font-mono font-bold text-gray-900">{adults}</span>
                        <button
                            onclick={() => clampedAdults(adults + 1)}
                            class="btn-secondary h-8 w-8 text-base p-0 flex items-center justify-center"
                        >+</button>
                    </div>
                </div>
                <div class="flex gap-1.5">
                    {#each adultPresets as num}
                        <button
                            onclick={() => clampedAdults(num)}
                            class={cn(
                                'flex-1 rounded-lg border text-sm font-semibold py-1.5 transition-colors',
                                adults === num
                                    ? 'bg-accent text-white border-accent'
                                    : 'bg-surface-secondary text-gray-600 border-border hover:border-accent/50'
                            )}
                        >{num}</button>
                    {/each}
                </div>
            </div>

            <div class="border-t border-border"></div>

            <!-- Children 6–9 row -->
            <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <div>
                        <span class="text-sm font-semibold text-gray-800">Children</span>
                        <span class="ml-1.5 text-xs text-gray-400">ages 6–9 · reduced price</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <button
                            onclick={() => clampedChildren(children - 1)}
                            class="btn-secondary h-8 w-8 text-base p-0 flex items-center justify-center"
                            disabled={children <= 0}
                        >−</button>
                        <span class="w-8 text-center font-mono font-bold text-gray-900">{children}</span>
                        <button
                            onclick={() => clampedChildren(children + 1)}
                            class="btn-secondary h-8 w-8 text-base p-0 flex items-center justify-center"
                        >+</button>
                    </div>
                </div>
                <div class="flex gap-1.5">
                    {#each childPresets as num}
                        <button
                            onclick={() => clampedChildren(num)}
                            class={cn(
                                'flex-1 rounded-lg border text-sm font-semibold py-1.5 transition-colors',
                                children === num
                                    ? 'bg-accent text-white border-accent'
                                    : 'bg-surface-secondary text-gray-600 border-border hover:border-accent/50'
                            )}
                        >{num}</button>
                    {/each}
                </div>
            </div>

            <!-- Free under-5 row -->
            <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <div>
                        <span class="text-sm font-semibold text-gray-800">Free</span>
                        <span class="ml-1.5 text-xs text-gray-400">under 5 · no charge</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <button
                            onclick={() => clampedFree(free - 1)}
                            class="btn-secondary h-8 w-8 text-base p-0 flex items-center justify-center"
                            disabled={free <= 0}
                        >−</button>
                        <span class="w-8 text-center font-mono font-bold text-gray-900">{free}</span>
                        <button
                            onclick={() => clampedFree(free + 1)}
                            class="btn-secondary h-8 w-8 text-base p-0 flex items-center justify-center"
                        >+</button>
                    </div>
                </div>
                <div class="flex gap-1.5">
                    {#each childPresets as num}
                        <button
                            onclick={() => clampedFree(num)}
                            class={cn(
                                'flex-1 rounded-lg border text-sm font-semibold py-1.5 transition-colors',
                                free === num
                                    ? 'bg-accent text-white border-accent'
                                    : 'bg-surface-secondary text-gray-600 border-border hover:border-accent/50'
                            )}
                        >{num}</button>
                    {/each}
                </div>
            </div>

            <!-- Capacity error -->
            {#if capacityError}
                <p class="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm font-semibold text-status-red">
                    {capacityError}
                </p>
            {/if}

            <!-- Total summary -->
            <div class="rounded-xl bg-surface-secondary border border-border px-4 py-3 flex items-center justify-between">
                <span class="text-sm text-gray-500">Total guests</span>
                <span class="font-mono font-bold text-xl text-gray-900">{total}</span>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
                <button class="btn-ghost flex-1" onclick={oncancel}>Cancel</button>
                <button
                    onclick={handleConfirm}
                    class="btn-primary flex-1"
                    style="min-height: 44px"
                    disabled={total < 1}
                >Confirm</button>
            </div>
        </div>
    </div>
{/if}
