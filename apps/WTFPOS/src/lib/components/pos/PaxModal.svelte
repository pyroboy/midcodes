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

    function handleCustomConfirm() {
        const val = parseInt(customPax);
        if (!isNaN(val) && val > 0) {
            customPax = '';
            onconfirm(val);
        }
    }
</script>

{#if table}
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="pos-card w-[320px] flex flex-col gap-4">
            <h3 class="font-bold text-gray-900">How many guests for {table.label}?</h3>
            <div class="grid grid-cols-4 gap-2">
                {#each Array.from({length: 12}, (_, i) => i + 1) as num}
                    <button onclick={() => onconfirm(num)} class="btn-secondary h-12 text-lg">
                        {num}
                    </button>
                {/each}
            </div>
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
