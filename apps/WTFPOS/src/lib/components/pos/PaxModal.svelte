<script lang="ts">
    import type { Table } from '$lib/types';
    import { cn } from '$lib/utils';

    interface Props {
        table: Table | null;
        onconfirm: (pax: number) => void;
        oncancel: () => void;
    }

    let { table, onconfirm, oncancel }: Props = $props();
</script>

{#if table}
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="pos-card w-[320px] flex flex-col gap-4">
            <h3 class="font-bold text-gray-900">How many guests for {table.label}?</h3>
            <div class="grid grid-cols-4 gap-2">
                {#each Array.from({length: 12}, (_, i) => i + 1) as num}
                    <button onclick={() => onconfirm(num)} class={cn('btn-secondary h-12 text-lg', [2, 4, 6].includes(num) && 'ring-2 ring-accent/40 ring-offset-1')}>
                        {num}
                    </button>
                {/each}
            </div>
            <div class="flex gap-2 mt-2">
                <button class="btn-ghost flex-1" onclick={oncancel}>Cancel</button>
            </div>
        </div>
    </div>
{/if}
