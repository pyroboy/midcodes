<script lang="ts">
    import ChevronsUpDown from "lucide-svelte/icons/chevrons-up-down";
    import Lock from "lucide-svelte/icons/lock";
    import Globe from "lucide-svelte/icons/globe";
    import * as Command from "$lib/components/ui/command";
    import * as Popover from "$lib/components/ui/popover";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { tick } from "svelte";
    import { writable } from 'svelte/store';
    import Fuse from 'fuse.js';

    interface ItemWithStatus {
        value: string;
        label: string;
        isLocked?: boolean;
        isPublished?: boolean;
    }

    export let items: Array<ItemWithStatus> = [];
    export let value = "";
    export let placeholder = "Select an option...";
    export let searchPlaceholder = "Search...";
    export let onValueChange: (value: string) => void;
    export let disabled = false;

    let open = false;
    let searchTerm = writable('');
    let popoverWidth: number;
    let triggerElement: HTMLDivElement;

    const fuseOptions = {
        keys: ['label'],
        threshold: 0.1,
        ignoreLocation: true,
        tokenize: true,
        minMatchCharLength: 2,
        shouldSort: true,
    };

    const fuse = new Fuse(items.sort((a, b) => a.label.localeCompare(b.label)), fuseOptions);

    $: filteredItems = $searchTerm 
        ? fuse.search($searchTerm).map(result => result.item)
        : [...items].sort((a, b) => a.label.localeCompare(b.label));

    $: selectedItem = items.find((item) => item.value === value);
    $: selectedValue = selectedItem?.label ?? placeholder;

    async function closeAndFocusTrigger(triggerId: string) {
        open = false;
        searchTerm.set('');
        await tick();
        document.getElementById(triggerId)?.focus();
    }

    function handleSelect(currentValue: string, triggerId: string) {
        value = currentValue;
        onValueChange(currentValue);
        closeAndFocusTrigger(triggerId);
    }

    function handleOpenChange(isOpen: boolean) {
        open = isOpen;
        if (!isOpen) {
            searchTerm.set('');
        }
    }
</script>

<div class="relative w-full">
    <div bind:this={triggerElement} class="w-full">
        <Popover.Root bind:open={open} onOpenChange={handleOpenChange} let:ids>
            <div class="w-full" bind:clientWidth={popoverWidth}>
                <Popover.Trigger asChild let:builder>
                    <Button
                        builders={[builder]}
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        class="w-full justify-between gap-2"
                        {disabled}
                    >
                        <span class="flex-1 text-left truncate">{selectedValue}</span>
                        <div class="flex items-center gap-2 shrink-0">
                            {#if selectedItem?.isLocked}
                                <Badge variant="outline" class="bg-red-50 text-red-700 border-red-200">
                                    <Lock class="w-3 h-3 mr-1" />
                                    Locked
                                </Badge>
                            {/if}
                            {#if selectedItem?.isPublished}
                                <Badge variant="outline" class="bg-green-50 text-green-700 border-green-200">
                                    <Globe class="w-3 h-3 mr-1" />
                                    Published
                                </Badge>
                            {/if}
                            <ChevronsUpDown class="h-4 w-4 shrink-0 opacity-50" />
                        </div>
                    </Button>
                </Popover.Trigger>
            </div>

            {#if open}
                <div 
                    class="absolute left-0 z-50 w-full bg-white border rounded-md shadow-md mt-1"
                    style="min-width: {popoverWidth}px"
                >
                    <Command.Root class="w-full">
                        <Command.Input 
                            placeholder={searchPlaceholder} 
                            bind:value={$searchTerm}
                            class="h-9 w-full border-none focus:ring-0"
                        />
                        <div class="w-full max-h-[300px] overflow-y-auto">
                            {#if filteredItems.length === 0}
                                <div class="p-4 text-center text-sm text-muted-foreground">
                                    No option found.
                                </div>
                            {:else}
                                {#each filteredItems as item (item.value)}
                                    <button 
                                        type="button" 
                                        class="w-full p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm flex items-center justify-between"
                                        on:click={() => handleSelect(item.value, ids.trigger)}
                                        aria-label="Select item {item.label}"
                                    >
                                        <span class="truncate text-left flex-1">{item.label}</span>
                                        <div class="flex gap-2 shrink-0">
                                            {#if item.isLocked}
                                                <Badge variant="outline" class="bg-red-50 text-red-700 border-red-200">
                                                    <Lock class="w-3 h-3 mr-1" /> Locked
                                                </Badge>
                                            {/if}
                                            {#if item.isPublished}
                                                <Badge variant="outline" class="bg-green-50 text-green-700 border-green-200">
                                                    <Globe class="w-3 h-3 mr-1" /> Published
                                                </Badge>
                                            {/if}
                                        </div>
                                    </button>
                                {/each}
                            {/if}
                        </div>
                    </Command.Root>
                </div>
            {/if}
        </Popover.Root>
    </div>
</div>

<style>
    :global(.combobox-container *) {
        box-sizing: border-box;
    }

    :global(.popover-content) {
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        margin-top: 4px;
        z-index: 50;
        transition: opacity 150ms ease-in-out;
    }
</style>