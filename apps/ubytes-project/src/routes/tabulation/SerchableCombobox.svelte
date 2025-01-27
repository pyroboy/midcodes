<script lang="ts" context="module">
    let activeComboboxId: string | null = null;
</script>
    
<script lang="ts">
import { ClipboardCheck, Eye, Lock, Upload, Search, ChevronsUpDown } from 'lucide-svelte';
import * as Command from "$lib/components/ui/command";
import * as Popover from "$lib/components/ui/popover";
import * as Select from "$lib/components/ui/select";
import { Button } from "$lib/components/ui/button";
import { tick, onMount } from "svelte";
import { writable, type Writable } from 'svelte/store';
import Fuse from 'fuse.js';

const EVENT_STATUSES = ['nodata', 'forReview', 'approved', 'locked', 'locked_published'] as const;
const EVENT_CATEGORIES = [
        'Athletics',
        'Academics & Literary',
        'Music',
        'Dances',
        'E-Sports',
        'MMUB',
        'Special'
    ] as const;
    
type EventStatus = typeof EVENT_STATUSES[number];
type EventCategory = typeof EVENT_CATEGORIES[number];
type ItemType = 'department' | 'event';

function isEventStatus(value: string): value is EventStatus {
    return EVENT_STATUSES.includes(value as EventStatus);
}


const STATUS_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'nodata', label: 'No Data' },
    { value: 'forReview', label: 'For Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'locked', label: 'Locked' },
    { value: 'locked_published', label: 'Published' }
] as const;

type StatusOption = typeof STATUS_OPTIONS[number];

function isStatusOption(value: unknown): value is StatusOption {
    return STATUS_OPTIONS.some(option => option.value === (value as StatusOption)?.value);
}

let selectedStatus: StatusOption = STATUS_OPTIONS[0];

const CATEGORY_COLORS = {
    'Athletics': 'bg-red-100 text-red-800 border-red-500',
    'Academics & Literary': 'bg-blue-100 text-blue-800 border-blue-500',
    'Music & Dances': 'bg-purple-100 text-purple-800 border-purple-500',
    'E-Sports': 'bg-green-100 text-green-800 border-green-500',
    'Journalism': 'bg-yellow-100 text-yellow-800 border-yellow-500',
    'MMUB': 'bg-pink-100 text-pink-800 border-pink-500',
    'Special': 'bg-indigo-100 text-indigo-800 border-indigo-500',
    'Departments': 'bg-slate-100 text-slate-800 border-slate-500'
} as const;

const STATUS_CONFIG = {
    all: {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
        borderColor: 'border-gray-200',
        label: 'All'
    },
    nodata: {
        icon: Search,
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-600',
        borderColor: 'border-slate-200',
        label: 'No Data'
    },
    forReview: {
        icon: Eye,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-200',
        label: 'For Review'
    },
    approved: {
        icon: ClipboardCheck,
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        borderColor: 'border-green-200',
        label: 'Approved'
    },
    locked: {
        icon: Lock,
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-600',
        borderColor: 'border-amber-200',
        label: 'Locked'
    },
    locked_published: {
        icon: Upload,
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600',
        borderColor: 'border-purple-200',
        label: 'Published'
    }
};

interface BaseItem {
    value: string;
    label: string;
}

interface DepartmentItem extends BaseItem {
    logo?: string;
}

interface EventItem extends BaseItem {
    status: EventStatus;
    category: EventCategory;
}

interface Props {
    type: ItemType;
    items: (DepartmentItem | EventItem)[];
    value?: string;
    placeholder?: string;
    searchPlaceholder?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
    forceClose?: boolean;
    onOpenStateChange?: (isOpen: boolean) => void;
    id?: string;
}

const instanceId = Math.random().toString(36).substr(2, 9);

export let type: ItemType;
export let items: Props['items'] = [];
export let value: string | undefined = undefined;
export let placeholder = "Select an option...";
export let searchPlaceholder = "Search...";
export let onValueChange = (value: string) => {};
export let disabled = false;
export let forceClose = false;
export let onOpenStateChange = (isOpen: boolean) => {};
export let id = instanceId;

let open = false;
let searchTerm: Writable<string> = writable('');
let popoverWidth: number;
let triggerElement: HTMLDivElement;
let fuse: Fuse<DepartmentItem | EventItem>;

const fuseOptions = {
    keys: ['label', 'category'],
    threshold: 0.1,
    ignoreLocation: true,
    tokenize: true,
    minMatchCharLength: 2,
    shouldSort: true,
};

$: currentItems = items.filter(item => {
    if (type === 'department') {
        return item.value !== value && item.value !== "-1";
    }
    if (type === 'event' && selectedStatus.value !== 'all') {
        return isEventItem(item) && item.status === selectedStatus.value;
    }
    return true;
});


$: {
    fuse = new Fuse(currentItems, fuseOptions);
}

$: searchResults = $searchTerm 
    ? fuse.search($searchTerm).map(result => result.item)
    : currentItems;

$: selectedItem = value ? items.find((item) => item.value === value) : undefined;
$: selectedValue = selectedItem?.label ?? placeholder;
$: isPlaceholderVisible = selectedValue === placeholder;

type GroupedItems = Record<string, (DepartmentItem | EventItem)[]>;

$: groupedItems = type === 'event' 
    ? searchResults.reduce((groups: GroupedItems, item) => {
        if (isEventItem(item)) {
            const category = item.category;
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(item);
        }
        return groups;
    }, {} as GroupedItems)
    : { 'Departments': searchResults };

function isEventItem(item: DepartmentItem | EventItem): item is EventItem {
    return type === 'event';
}

function isDepartmentItem(item: DepartmentItem | EventItem): item is DepartmentItem {
    return type === 'department';
}

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
    if (isOpen) {
        if (activeComboboxId && activeComboboxId !== id) {
            const event = new CustomEvent('closeCombobox', {
                detail: { exceptId: id },
                bubbles: true
            });
            document.dispatchEvent(event);
        }
        activeComboboxId = id;
    } else {
        if (activeComboboxId === id) {
            activeComboboxId = null;
        }
    }
    
    open = isOpen;
    onOpenStateChange(isOpen);
    if (!isOpen) {
        searchTerm.set('');
    }
}

function setupCloseListener() {
    const handleClose = (event: CustomEvent<{ exceptId: string }>) => {
        if (event.detail.exceptId !== id) {
            open = false;
            searchTerm.set('');
        }
    };

    document.addEventListener('closeCombobox', handleClose as EventListener);
    return () => {
        document.removeEventListener('closeCombobox', handleClose as EventListener);
    };
}

function getStatusClasses(status: EventStatus) {
    const config = STATUS_CONFIG[status];
    return `${config.bgColor} ${config.textColor}`;
}

function getCategoryClasses(category: string) {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || 'bg-gray-100 text-gray-800 border-gray-500';
}

onMount(() => {
    const cleanup = setupCloseListener();
    return () => {
        cleanup();
        if (activeComboboxId === id) {
            activeComboboxId = null;
        }
    };
});

$: {
    if (forceClose && open) {
        open = false;
        searchTerm.set('');
        activeComboboxId = null;
    }
}
</script>
<div class="relative w-full">
    <div bind:this={triggerElement} class="w-full">
        <Popover.Root bind:open onOpenChange={handleOpenChange} let:ids>
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
                        <div class="flex items-center gap-2 flex-1">
                            {#if selectedItem && isDepartmentItem(selectedItem) && selectedItem.logo}
                                <img 
                                    src={selectedItem.logo} 
                                    alt={selectedItem.label}
                                    class="w-6 h-6 object-contain"
                                />
                            {/if}
                            <span class="text-left {isPlaceholderVisible ? 'text-gray-300' : ''}">{selectedValue}</span>
                        </div>
                        {#if selectedItem && isEventItem(selectedItem)}
                            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-md min-w-[100px] justify-center {getStatusClasses(selectedItem.status)}">
                                <svelte:component 
                                    this={STATUS_CONFIG[selectedItem.status].icon} 
                                    class="w-4 h-4" 
                                />
                                {STATUS_CONFIG[selectedItem.status].label}
                            </div>
                        {/if}
                        <ChevronsUpDown class="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </Popover.Trigger>
            </div>

            {#if open}
                <div 
                    class="absolute left-0 z-50 w-full bg-white border rounded-md shadow-md mt-1"
                    style="min-width: {popoverWidth}px"
                >
                    <Command.Root class="w-full">
                        <div class="flex items-center gap-2 p-2 border-b">
                            <div class="flex-1">
                                <Command.Input 
                                    placeholder={searchPlaceholder} 
                                    bind:value={$searchTerm}
                                    class="h-9 w-full"
                                />
                            </div>
                            {#if type === 'event'}
                                <div class="w-[180px]">
                                    <Select.Root
                                        selected={selectedStatus}
                                        onSelectedChange={(selection) => {
                                            if (selection && isStatusOption(selection)) {
                                                selectedStatus = selection;
                                            }
                                        }}
                                    >
                                        <Select.Trigger class="w-full h-9">
                                            <Select.Value placeholder="Filter by status" />
                                        </Select.Trigger>
                                        <Select.Content>
                                            {#each STATUS_OPTIONS as option}
                                                <Select.Item
                                                    value={option.value}
                                                    label={option.label}
                                                    class="cursor-pointer {option.value !== 'all' ? getStatusClasses(option.value) : STATUS_CONFIG.all.bgColor}"
                                                />
                                            {/each}
                                        </Select.Content>
                                    </Select.Root>
                                </div>
                            {/if}
                        </div>
                        <div class="w-full max-h-[300px] overflow-y-auto">
                            {#if value !== "-1" && type === "department"}
                                <button 
                                    type="button" 
                                    class="w-full p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm flex items-center justify-between"
                                    on:click={() => handleSelect("-1", ids.trigger)}
                                >
                                    <span>Select a department</span>
                                </button>
                                <div class="w-full h-px bg-muted my-1" />
                            {/if}
                            {#if Object.keys(groupedItems).length === 0}
                                <div class="p-4 text-center text-sm text-muted-foreground">
                                    No option found.
                                </div>
                            {:else}
                                {#each Object.entries(groupedItems) as [category, categoryItems] (category)}
                                    {#if categoryItems && categoryItems.length > 0}
                                        <div class="px-2 py-1.5 text-sm font-semibold {getCategoryClasses(category)}">
                                            {category}
                                        </div>
                                        {#each categoryItems as item (item.value)}
                                            <button 
                                                type="button" 
                                                class="w-full p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm flex items-center justify-between relative group"
                                                on:click={() => handleSelect(item.value, ids.trigger)}
                                                aria-label={`Select ${item.label}`}
                                            >
                                                <div class="absolute left-0 top-0 bottom-0 w-1 {getCategoryClasses(category)}" />
                                                <div class="flex items-center gap-2 pl-3">
                                                    {#if isDepartmentItem(item) && item.logo}
                                                        <img 
                                                            src={item.logo} 
                                                            alt={item.label}
                                                            class="w-6 h-6 object-contain"
                                                        />
                                                    {/if}
                                                    <span>{item.label}</span>
                                                </div>
                                                {#if isEventItem(item)}
                                                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-md min-w-[100px] justify-center {getStatusClasses(item.status)}">
                                                        <svelte:component 
                                                            this={STATUS_CONFIG[item.status].icon} 
                                                            class="w-4 h-4" 
                                                        />
                                                        {STATUS_CONFIG[item.status].label}
                                                    </div>
                                                {/if}
                                            </button>
                                        {/each}
                                    {/if}
                                {/each}
                            {/if}
                        </div>
                    </Command.Root>
                </div>
            {/if}
        </Popover.Root>
    </div>
</div>