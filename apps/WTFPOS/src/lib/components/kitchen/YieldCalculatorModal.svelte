<script lang="ts">
    import { cn } from '$lib/utils';
    import { playSound } from '$lib/utils/audio';
    import { stockItems } from '$lib/stores/stock.svelte';
    import { session } from '$lib/stores/session.svelte';
    import { log } from '$lib/stores/audit.svelte';
    import ManagerPinModal from '$lib/components/pos/ManagerPinModal.svelte';
    import ModalWrapper from '$lib/components/ModalWrapper.svelte';

    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    let { isOpen, onClose }: Props = $props();
    const meatItems = $derived(
        stockItems.value.filter(s => s.category === 'Meats' && (session.locationId === 'all' || s.locationId === session.locationId))
    );

    let selectedMeatId = $state('');
    let meatSearchQuery = $state('');
    $effect(() => {
        if (!selectedMeatId && meatItems.length > 0) {
            selectedMeatId = meatItems[0].id;
        }
    });
    const filteredMeatItems = $derived(
        meatSearchQuery.trim() === ''
            ? meatItems
            : meatItems.filter(m => m.name.toLowerCase().includes(meatSearchQuery.trim().toLowerCase()))
    );

    let rawWeightInput = $state('');
    let trimmedWeightInput = $state('');
    let showPin = $state(false);
    // Which field is the numpad currently targeting
    let activeField = $state<'raw' | 'trimmed'>('raw');

    const rawWeight = $derived(parseFloat(rawWeightInput) || 0);
    const trimmedWeight = $derived(parseFloat(trimmedWeightInput) || 0);
    const yieldPct = $derived(rawWeight > 0 ? (trimmedWeight / rawWeight) * 100 : 0);

    const numpadKeys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '⌫'];

    function handleNumpad(key: string) {
        playSound('click');
        const current = activeField === 'raw' ? rawWeightInput : trimmedWeightInput;
        let next = current;

        if (key === 'C') {
            next = '';
        } else if (key === '⌫') {
            next = current.slice(0, -1);
        } else if (key === '.') {
            if (!current.includes('.')) next = current + '.';
        } else {
            if (current.length < 7) next = current + key;
        }

        if (activeField === 'raw') {
            rawWeightInput = next;
        } else {
            trimmedWeightInput = next;
        }
    }

    const ELEVATED_ROLES = ['owner', 'admin', 'manager', 'kitchen'] as const;

    function handleSave() {
        // Kitchen role (and elevated roles) can log yield without a PIN
        if ((ELEVATED_ROLES as readonly string[]).includes(session.role)) {
            handlePinVerify();
        } else {
            showPin = true;
        }
    }

    function handlePinVerify() {
        playSound('success');
        const item = meatItems.find(m => m.id === selectedMeatId);
        log.yieldRecorded(item?.name || 'Unknown', rawWeight, trimmedWeight, yieldPct);
        showPin = false;
        onClose();
        rawWeightInput = '';
        trimmedWeightInput = '';
        meatSearchQuery = '';
    }
</script>

<ModalWrapper open={isOpen} onclose={onClose} zIndex={50} ariaLabel="Yield calculator" class="p-4">
    {#if !showPin}
        <div class="w-full max-w-2xl rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl text-white overflow-hidden">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-700">
                <h2 class="text-xl font-bold">Yield Calculator</h2>
                <button
                    onclick={onClose}
                    class="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors text-xl"
                >✕</button>
            </div>

            <div class="flex gap-0">
                <!-- LEFT: meat selector + yield result -->
                <div class="flex-1 flex flex-col gap-4 p-6 border-r border-gray-700">
                    <!-- Meat Cut Picker -->
                    <div class="flex flex-col gap-1.5">
                        <span class="text-xs font-semibold uppercase tracking-wide text-gray-400">Meat Cut</span>
                        <input
                            type="text"
                            bind:value={meatSearchQuery}
                            placeholder="Search meat cut..."
                            class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none"
                        />
                        <select
                            bind:value={selectedMeatId}
                            class="rounded-lg border border-gray-700 bg-gray-800 p-2 text-white font-medium"
                            size="5"
                        >
                            {#each filteredMeatItems as item}
                                <option value={item.id}>{item.name}</option>
                            {/each}
                            {#if filteredMeatItems.length === 0}
                                <option disabled value="">No results</option>
                            {/if}
                        </select>
                    </div>

                    <!-- Weight display fields (tap to target with numpad) -->
                    <div class="flex flex-col gap-2">
                        <button
                            onclick={() => (activeField = 'raw')}
                            class={cn(
                                'flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all',
                                activeField === 'raw'
                                    ? 'border-status-green bg-gray-800 ring-2 ring-status-green/40'
                                    : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                            )}
                        >
                            <span class="text-xs font-semibold uppercase tracking-wide text-gray-400">Raw Weight</span>
                            <span class="font-mono text-2xl font-bold text-white">
                                {rawWeightInput || '0'}<span class="text-base text-gray-400 ml-1">g</span>
                            </span>
                        </button>
                        <button
                            onclick={() => (activeField = 'trimmed')}
                            class={cn(
                                'flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all',
                                activeField === 'trimmed'
                                    ? 'border-status-green bg-gray-800 ring-2 ring-status-green/40'
                                    : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                            )}
                        >
                            <span class="text-xs font-semibold uppercase tracking-wide text-gray-400">Trimmed Weight</span>
                            <span class="font-mono text-2xl font-bold text-white">
                                {trimmedWeightInput || '0'}<span class="text-base text-gray-400 ml-1">g</span>
                            </span>
                        </button>
                    </div>

                    <!-- Yield result -->
                    <div class="rounded-xl border border-gray-700 bg-gray-800 p-4 text-center">
                        <span class="text-xs font-semibold uppercase tracking-widest text-gray-400">Yield Percentage</span>
                        <div class={cn(
                            "mt-1 text-5xl font-black font-mono tracking-tighter",
                            yieldPct >= 80 ? "text-status-green" : yieldPct >= 65 ? "text-status-yellow" : "text-status-red"
                        )}>
                            {yieldPct.toFixed(1)}<span class="text-3xl">%</span>
                        </div>
                    </div>

                    <button
                        onclick={handleSave}
                        disabled={rawWeight <= 0 || trimmedWeight <= 0 || trimmedWeight > rawWeight}
                        class="w-full rounded-xl bg-status-green py-4 text-lg font-bold text-white hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                        style="min-height: 56px"
                    >
                        Log Yield
                    </button>
                </div>

                <!-- RIGHT: Numpad -->
                <div class="w-56 flex flex-col justify-center gap-2 p-5">
                    <div class="text-center mb-1">
                        <span class={cn(
                            'text-xs font-bold uppercase tracking-wider',
                            activeField === 'raw' ? 'text-status-green' : 'text-blue-400'
                        )}>
                            {activeField === 'raw' ? 'Raw Weight' : 'Trimmed Weight'}
                        </span>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        {#each numpadKeys as key}
                            <button
                                onclick={() => handleNumpad(key)}
                                class={cn(
                                    'flex items-center justify-center rounded-xl text-xl font-bold transition-all active:scale-95 border',
                                    key === 'C'
                                        ? 'bg-red-900/60 text-red-300 border-red-700 hover:bg-red-900'
                                        : key === '⌫'
                                            ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                                            : 'bg-gray-800 text-white border-gray-700 hover:bg-gray-700'
                                )}
                                style="min-height: 56px"
                            >
                                {key}
                            </button>
                        {/each}
                    </div>
                    <!-- Decimal point -->
                    <button
                        onclick={() => handleNumpad('.')}
                        class="flex items-center justify-center rounded-xl text-xl font-bold border bg-gray-800 text-white border-gray-700 hover:bg-gray-700 transition-all active:scale-95"
                        style="min-height: 44px"
                    >
                        .
                    </button>
                </div>
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
</ModalWrapper>
