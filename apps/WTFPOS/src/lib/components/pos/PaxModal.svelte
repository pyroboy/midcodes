<script lang="ts">
    import type { Table } from '$lib/types';
    import { cn } from '$lib/utils';
    import { Users } from 'lucide-svelte';
    import { playSound } from '$lib/utils/audio';
    import ModalWrapper from '$lib/components/ModalWrapper.svelte';

    interface Props {
        table: Table | null;
        onconfirm: (pax: number, childPax: number, freePax: number, scCount: number, pwdCount: number) => void;
        oncancel: () => void;
    }

    let { table, onconfirm, oncancel }: Props = $props();

    let adults = $state(0);
    let children = $state(0);  // ages 6–9, reduced price
    let free = $state(0);      // under 5, no charge
    let scCount = $state(0);   // Senior Citizen (20% discount)
    let pwdCount = $state(0);  // PWD (20% discount)

    // Reset all fields every time the modal opens (table goes from null → value)
    $effect(() => {
        if (table) {
            adults = 0;
            children = 0;
            free = 0;
            scCount = 0;
            pwdCount = 0;
        }
    });

    let total = $derived(adults + children + free);
    let isOverCapacity = $derived(!!table && total > table.capacity);

    // SC only applies to adults — children and infants cannot be senior citizens.
    // PWD can apply to any guest (adults or children).
    // No guest can carry both discounts; pools are exclusive per person.
    let scMax = $derived(Math.max(0, adults - pwdCount));
    let pwdMax = $derived(Math.max(0, total - scCount));

    // Re-clamp discounts whenever headcount shrinks below current caps.
    $effect(() => {
        if (scCount > scMax) scCount = Math.max(0, scMax);
        if (pwdCount > pwdMax) pwdCount = Math.max(0, pwdMax);
    });

    function adj(
        getter: () => number,
        setter: (n: number) => void,
        delta: number,
        min = 0,
        max = Infinity
    ) {
        const next = Math.min(max, Math.max(min, getter() + delta));
        if (next !== getter()) {
            setter(next);
            playSound('click');
        }
    }
</script>

<ModalWrapper open={!!table} onclose={oncancel} zIndex={60} ariaLabel="Guest count for table" class="items-end sm:items-center px-3 sm:px-4">
    {#if table}
        <div
            class="pos-card w-full sm:max-w-[380px] flex flex-col gap-0 overflow-hidden rounded-t-2xl sm:rounded-xl max-h-[90vh] overflow-y-auto safe-bottom sm:pb-0"
            style="padding: 0;"
        >
            <!-- Header -->
            <div class="px-5 pt-5 pb-4 border-b border-border">
                <div class="flex items-start justify-between">
                    <div>
                        <h3 class="text-base font-bold text-gray-900 leading-tight">
                            How many guests for <span class="text-accent">{table.label}</span>?
                        </h3>
                        <div class="flex items-center gap-1.5 mt-1">
                            <Users class="w-3.5 h-3.5 text-gray-400" />
                            <span class="text-xs text-gray-400">
                                Capacity: <strong class="text-gray-600 font-semibold">{table.capacity}</strong>
                            </span>
                        </div>
                    </div>
                    <!-- Total badge -->
                    <div class={cn(
                        'flex flex-col items-center justify-center rounded-xl w-12 h-12 border',
                        isOverCapacity
                            ? 'bg-yellow-50 border-yellow-300'
                            : 'bg-accent-light border-accent/20'
                    )}>
                        <span class={cn(
                            'font-mono font-bold text-xl leading-none',
                            isOverCapacity ? 'text-status-yellow' : 'text-accent'
                        )}>{total}</span>
                        <span class="text-[9px] font-medium text-gray-400 leading-none mt-0.5">total</span>
                    </div>
                </div>
            </div>

            <!-- Headcount rows -->
            <div class="flex flex-col divide-y divide-border">
                <!-- Adults -->
                <div class="flex items-center justify-between px-5 py-3.5">
                    <div class="flex flex-col">
                        <span class="text-sm font-semibold text-gray-900">Adults</span>
                        <span class="text-xs text-gray-400">full price</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <button
                            onclick={() => adj(() => adults, (n) => { adults = n; }, -1)}
                            disabled={adults <= 0}
                            class={cn(
                                'w-9 h-9 rounded-lg border font-bold text-lg flex items-center justify-center transition-colors',
                                adults <= 0
                                    ? 'border-border text-gray-300 cursor-not-allowed bg-surface-secondary'
                                    : 'border-border bg-white text-gray-700 hover:border-accent/60 hover:text-accent active:bg-accent-light'
                            )}
                        >−</button>
                        <span class="w-6 text-center font-mono font-bold text-gray-900 text-base select-none">{adults}</span>
                        <button
                            onclick={() => adj(() => adults, (n) => { adults = n; }, 1)}
                            class="w-9 h-9 rounded-lg border border-border bg-white text-gray-700 font-bold text-lg flex items-center justify-center transition-colors hover:border-accent/60 hover:text-accent active:bg-accent-light"
                        >+</button>
                    </div>
                </div>

                <!-- Children -->
                <div class="flex items-center justify-between px-5 py-3.5">
                    <div class="flex flex-col">
                        <span class="text-sm font-semibold text-gray-900">Children</span>
                        <span class="text-xs text-gray-400">ages 6–9 · reduced price</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <button
                            onclick={() => adj(() => children, (n) => { children = n; }, -1)}
                            disabled={children <= 0}
                            class={cn(
                                'w-9 h-9 rounded-lg border font-bold text-lg flex items-center justify-center transition-colors',
                                children <= 0
                                    ? 'border-border text-gray-300 cursor-not-allowed bg-surface-secondary'
                                    : 'border-border bg-white text-gray-700 hover:border-accent/60 hover:text-accent active:bg-accent-light'
                            )}
                        >−</button>
                        <span class="w-6 text-center font-mono font-bold text-gray-900 text-base select-none">{children}</span>
                        <button
                            onclick={() => adj(() => children, (n) => { children = n; }, 1)}
                            class="w-9 h-9 rounded-lg border border-border bg-white text-gray-700 font-bold text-lg flex items-center justify-center transition-colors hover:border-accent/60 hover:text-accent active:bg-accent-light"
                        >+</button>
                    </div>
                </div>

                <!-- Infants / Free -->
                <div class="flex items-center justify-between px-5 py-3.5">
                    <div class="flex flex-col">
                        <span class="text-sm font-semibold text-gray-900">Infants</span>
                        <span class="text-xs text-gray-400">under 5 · free</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <button
                            onclick={() => adj(() => free, (n) => { free = n; }, -1)}
                            disabled={free <= 0}
                            class={cn(
                                'w-9 h-9 rounded-lg border font-bold text-lg flex items-center justify-center transition-colors',
                                free <= 0
                                    ? 'border-border text-gray-300 cursor-not-allowed bg-surface-secondary'
                                    : 'border-border bg-white text-gray-700 hover:border-accent/60 hover:text-accent active:bg-accent-light'
                            )}
                        >−</button>
                        <span class="w-6 text-center font-mono font-bold text-gray-900 text-base select-none">{free}</span>
                        <button
                            onclick={() => adj(() => free, (n) => { free = n; }, 1)}
                            class="w-9 h-9 rounded-lg border border-border bg-white text-gray-700 font-bold text-lg flex items-center justify-center transition-colors hover:border-accent/60 hover:text-accent active:bg-accent-light"
                        >+</button>
                    </div>
                </div>
            </div>

            <!-- Discount section divider -->
            <div class="px-5 pt-4 pb-1">
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Discounts</span>
                    <div class="flex-1 h-px bg-border"></div>
                    <span class="text-[10px] text-gray-400">optional</span>
                </div>
            </div>

            <!-- Discount rows -->
            <div class="flex flex-col divide-y divide-border border-t border-border">
                <!-- Senior Citizen -->
                <div class="flex items-center justify-between px-5 py-3">
                    <div class="flex flex-col">
                        <div class="flex items-center gap-1.5">
                            <span class="text-sm font-semibold text-gray-900">Senior Citizen</span>
                            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-status-purple/10 text-status-purple leading-none">SC</span>
                        </div>
                        <span class="text-xs text-gray-400">
                            adults only · 20% · {scMax > 0 ? `up to ${scMax}` : 'no slots left'}
                        </span>
                    </div>
                    <div class="flex items-center gap-3">
                        <button
                            onclick={() => adj(() => scCount, (n) => { scCount = n; }, -1)}
                            disabled={scCount <= 0}
                            class={cn(
                                'w-9 h-9 rounded-lg border font-bold text-lg flex items-center justify-center transition-colors',
                                scCount <= 0
                                    ? 'border-border text-gray-300 cursor-not-allowed bg-surface-secondary'
                                    : 'border-border bg-white text-gray-700 hover:border-status-purple/60 hover:text-status-purple active:bg-purple-50'
                            )}
                        >−</button>
                        <span class="w-6 text-center font-mono font-bold text-gray-900 text-base select-none">{scCount}</span>
                        <button
                            onclick={() => adj(() => scCount, (n) => { scCount = n; }, 1, 0, scMax)}
                            disabled={scCount >= scMax || total === 0}
                            class={cn(
                                'w-9 h-9 rounded-lg border font-bold text-lg flex items-center justify-center transition-colors',
                                scCount >= scMax || total === 0
                                    ? 'border-border text-gray-300 cursor-not-allowed bg-surface-secondary'
                                    : 'border-border bg-white text-gray-700 hover:border-status-purple/60 hover:text-status-purple active:bg-purple-50'
                            )}
                        >+</button>
                    </div>
                </div>

                <!-- PWD -->
                <div class="flex items-center justify-between px-5 py-3">
                    <div class="flex flex-col">
                        <div class="flex items-center gap-1.5">
                            <span class="text-sm font-semibold text-gray-900">PWD</span>
                            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-500 leading-none">PWD</span>
                        </div>
                        <span class="text-xs text-gray-400">
                            20% discount · {pwdMax > 0 ? `up to ${pwdMax}` : 'no slots left'}
                        </span>
                    </div>
                    <div class="flex items-center gap-3">
                        <button
                            onclick={() => adj(() => pwdCount, (n) => { pwdCount = n; }, -1)}
                            disabled={pwdCount <= 0}
                            class={cn(
                                'w-9 h-9 rounded-lg border font-bold text-lg flex items-center justify-center transition-colors',
                                pwdCount <= 0
                                    ? 'border-border text-gray-300 cursor-not-allowed bg-surface-secondary'
                                    : 'border-border bg-white text-gray-700 hover:border-blue-400/60 hover:text-blue-500 active:bg-blue-50'
                            )}
                        >−</button>
                        <span class="w-6 text-center font-mono font-bold text-gray-900 text-base select-none">{pwdCount}</span>
                        <button
                            onclick={() => adj(() => pwdCount, (n) => { pwdCount = n; }, 1, 0, pwdMax)}
                            disabled={pwdCount >= pwdMax || total === 0}
                            class={cn(
                                'w-9 h-9 rounded-lg border font-bold text-lg flex items-center justify-center transition-colors',
                                pwdCount >= pwdMax || total === 0
                                    ? 'border-border text-gray-300 cursor-not-allowed bg-surface-secondary'
                                    : 'border-border bg-white text-gray-700 hover:border-blue-400/60 hover:text-blue-500 active:bg-blue-50'
                            )}
                        >+</button>
                    </div>
                </div>
            </div>

            <!-- Over-capacity warning -->
            
                <div class={cn("mx-5 mt-3 rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 flex items-center gap-2", !isOverCapacity && "invisible")}>
                    <span class="text-status-yellow text-base leading-none">⚠</span>
                    <span class="text-xs font-semibold text-yellow-700">
                        Over capacity — table fits {table.capacity} guest{table.capacity !== 1 ? 's' : ''}.
                    </span>
                </div>
            <!-- Actions -->
            <div class="flex gap-2 px-5 pt-3 pb-5 mt-1">
                <button class="btn-ghost flex-1" onclick={oncancel}>Cancel</button>
                <button
                    onclick={() => { playSound('success'); onconfirm(total, children, free, scCount, pwdCount); }}
                    disabled={total < 1}
                    class={cn(
                        'flex-1 rounded-lg font-semibold text-sm transition-colors',
                        isOverCapacity
                            ? 'bg-status-yellow text-white hover:bg-yellow-500 active:bg-yellow-600'
                            : 'btn-primary'
                    )}
                    style="min-height: 44px;"
                >
                    {isOverCapacity ? 'Confirm anyway' : 'Confirm'}
                </button>
            </div>
        </div>
    {/if}
</ModalWrapper>
