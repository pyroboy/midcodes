<script lang="ts">
    import { cn } from '$lib/utils';
    import { stockItems } from '$lib/stores/stock.svelte';
    import { session } from '$lib/stores/session.svelte';
    import { log } from '$lib/stores/audit.svelte';
    import ManagerPinModal from '$lib/components/pos/ManagerPinModal.svelte';
    import BluetoothWeightInput from '$lib/components/BluetoothWeightInput.svelte';

    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    let { isOpen, onClose }: Props = $props();
    const meatItems = $derived(
        stockItems.value.filter(s => s.category === 'Meats' && (session.locationId === 'all' || s.locationId === session.locationId))
    );

    let selectedMeatId = $state('');
    $effect(() => {
        if (!selectedMeatId && meatItems.length > 0) {
            selectedMeatId = meatItems[0].id;
        }
    });
    let rawWeightInput = $state('');
    let trimmedWeightInput = $state('');
    let showPin = $state(false);

    const rawWeight = $derived(parseFloat(rawWeightInput) || 0);
    const trimmedWeight = $derived(parseFloat(trimmedWeightInput) || 0);
    const yieldPct = $derived(rawWeight > 0 ? (trimmedWeight / rawWeight) * 100 : 0);

    function handleSave() {
        showPin = true;
    }

    function handlePinVerify() {
        const item = meatItems.find(m => m.id === selectedMeatId);
        log.yieldRecorded(item?.name || 'Unknown', rawWeight, trimmedWeight, yieldPct);
        showPin = false;
        onClose();
        rawWeightInput = '';
        trimmedWeightInput = '';
    }
</script>

{#if isOpen}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    {#if !showPin}
        <div class="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-700 p-6 shadow-2xl text-white">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold">Yield Calculator</h2>
                <button onclick={onClose} class="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            <div class="flex flex-col gap-4">
                <label class="flex flex-col gap-1.5">
                    <span class="text-xs font-semibold uppercase tracking-wide text-gray-400">Meat Cut</span>
                    <select bind:value={selectedMeatId} class="rounded-lg border border-gray-700 bg-gray-800 p-3 text-white font-medium">
                        {#each meatItems as item}
                            <option value={item.id}>{item.name}</option>
                        {/each}
                    </select>
                </label>

                <div class="flex flex-col gap-1.5">
                    <span class="text-xs font-semibold uppercase tracking-wide text-gray-400">Raw Slab Weight (g)</span>
                    <BluetoothWeightInput
                        id="yield-raw"
                        value={rawWeightInput}
                        onValueChange={(v) => { rawWeightInput = v; }}
                        theme="dark"
                    />
                </div>

                <div class="flex flex-col gap-1.5">
                    <span class="text-xs font-semibold uppercase tracking-wide text-gray-400">Trimmed Usable Weight (g)</span>
                    <BluetoothWeightInput
                        id="yield-trimmed"
                        value={trimmedWeightInput}
                        onValueChange={(v) => { trimmedWeightInput = v; }}
                        theme="dark"
                    />
                </div>

                <div class="my-2 rounded-xl border border-gray-700 bg-gray-800 p-5 text-center">
                    <span class="text-xs font-semibold uppercase tracking-widest text-gray-400">Yield Percentage</span>
                    <div class={cn(
                        "mt-2 text-5xl font-black font-mono tracking-tighter",
                        yieldPct >= 80 ? "text-status-green" : yieldPct >= 65 ? "text-status-yellow" : "text-status-red"
                    )}>
                        {yieldPct.toFixed(1)}<span class="text-3xl">%</span>
                    </div>
                </div>

                <button 
                    onclick={handleSave} 
                    disabled={rawWeight <= 0 || trimmedWeight <= 0 || trimmedWeight > rawWeight}
                    class="w-full rounded-xl bg-status-green py-4 text-lg font-bold text-white hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                    Log Yield
                </button>
            </div>
        </div>
    {:else}
        <!-- Wrap in a light context for ManagerPinModal so its white bg looks right -->
        <ManagerPinModal
            isOpen={true}
            title="Manager PIN"
            description="Authorize recording this yield."
            onClose={() => showPin = false}
            onConfirm={handlePinVerify}
            confirmLabel="Record"
        />
    {/if}
</div>
{/if}
