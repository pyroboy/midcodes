<script lang="ts">
    import type { Table } from '$lib/types';
    import { cn } from '$lib/utils';

    interface Props {
        table: Table | null;
        onconfirm: (pax: number) => void;
        oncancel: () => void;
    }

    let { table, onconfirm, oncancel }: Props = $props();

    let customPax = $state('');
    // P0-02 / P2-03: inline capacity error — always visible on tap, not hover-only
    let capacityError = $state('');

    function handleQuickSelect(num: number) {
        capacityError = '';
        if (table && num > table.capacity) {
            capacityError = `Maximum ${table.capacity} guest${table.capacity !== 1 ? 's' : ''} for this table.`;
            return;
        }
        onconfirm(num);
    }

    function handleCustomConfirm() {
        const val = parseInt(customPax);
        if (isNaN(val) || val < 1) return;
        if (table && val > table.capacity) {
            capacityError = `Maximum ${table.capacity} guest${table.capacity !== 1 ? 's' : ''} for this table.`;
            return;
        }
        capacityError = '';
        customPax = '';
        onconfirm(val);
    }

    // Clear error when input changes
    function handleCustomInput() {
        if (capacityError) capacityError = '';
    }
</script>

{#if table}
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="pos-card w-[320px] flex flex-col gap-4">
            <h3 class="font-bold text-gray-900">How many guests for {table.label}?</h3>
            <p class="text-xs text-gray-400 -mt-2">Capacity: <strong class="text-gray-600">{table.capacity}</strong></p>
            <div class="grid grid-cols-4 gap-2">
                {#each Array.from({length: 12}, (_, i) => i + 1) as num}
                    <button
                        onclick={() => handleQuickSelect(num)}
                        class={cn(
                            'btn-secondary h-12 text-lg',
                            table && num > table.capacity && 'opacity-40'
                        )}
                    >
                        {num}
                    </button>
                {/each}
            </div>
            <!-- P2-03 / P0-02: Always-visible inline capacity error (visible on tap, not hover-only) -->
            {#if capacityError}
                <p class="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm font-semibold text-status-red">
                    {capacityError}
                </p>
            {/if}
            <div class="flex flex-col gap-1.5">
                <label for="pax-custom-input" class="text-xs font-semibold text-gray-500">Other (type number)</label>
                <div class="flex gap-2">
                    <input
                        id="pax-custom-input"
                        type="number"
                        min="1"
                        bind:value={customPax}
                        placeholder="e.g. 15"
                        class="pos-input flex-1"
                        oninput={handleCustomInput}
                        onkeydown={(e) => { if (e.key === 'Enter') handleCustomConfirm(); }}
                    />
                    <button
                        onclick={handleCustomConfirm}
                        disabled={!customPax || isNaN(parseInt(customPax)) || parseInt(customPax) < 1}
                        class="btn-primary px-4 disabled:opacity-40"
                        style="min-height: 44px"
                    >OK</button>
                </div>
            </div>
            <div class="flex gap-2 mt-2">
                <button class="btn-ghost flex-1" onclick={oncancel}>Cancel</button>
            </div>
        </div>
    </div>
{/if}
