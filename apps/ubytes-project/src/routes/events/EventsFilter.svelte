<script lang="ts">
    import { Card } from "$lib/components/ui/card"
    import { Input } from "$lib/components/ui/input"
    import * as Select from "$lib/components/ui/select"
    import { Search, Eye, ClipboardCheck, Lock, Upload } from "lucide-svelte"

    const EVENT_STATUSES = ['nodata', 'forReview', 'approved', 'locked', 'locked_published'] as const
    type EventStatus = (typeof EVENT_STATUSES)[number] | 'All'

    type StatusConfig = {
        color: string
        icon: typeof Eye | typeof ClipboardCheck | typeof Lock | typeof Upload
        label: string
        textColor: string
    }

    const STATUS_CONFIG: Record<Exclude<EventStatus, 'All'>, StatusConfig> = {
        nodata: {
            color: "bg-gray-100",
            textColor: "text-gray-600",
            icon: Eye,
            label: "No Data"
        },
        forReview: {
            color: "bg-blue-100",
            textColor: "text-blue-600",
            icon: Eye,
            label: "For Review"
        },
        approved: {
            color: "bg-green-100",
            textColor: "text-green-600",
            icon: ClipboardCheck,
            label: "Approved"
        },
        locked: {
            color: "bg-amber-100",
            textColor: "text-amber-600",
            icon: Lock,
            label: "Locked"
        },
        locked_published: {
            color: "bg-purple-100",
            textColor: "text-purple-600",
            icon: Upload,
            label: "Published"
        }
    }

    function isEventStatus(value: string): value is EventStatus {
        return [...EVENT_STATUSES, 'All'].includes(value as EventStatus)
    }

    export let search: string
    export let onSearchChange: (value: string) => void
    export let status: EventStatus
    export let onStatusChange: (value: EventStatus) => void

    const allStatuses = ['All', ...EVENT_STATUSES] as const
    $: statusSelected = { value: status, label: status === 'All' ? 'All' : STATUS_CONFIG[status].label }
</script>

<Card>
    <div class="p-4 space-y-4">
        <div class="flex items-center gap-4">
            <div class="relative flex-1">
                <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search events..."
                    class="pl-8"
                    value={search}
                    on:input={(e) => onSearchChange(e.currentTarget.value)}
                />
            </div>
            <div class="w-[200px]">
                <Select.Root
                    selected={statusSelected}
                    onSelectedChange={(selection) => {
                        if (selection && isEventStatus(selection.value)) {
                            onStatusChange(selection.value)
                        }
                    }}
                >
                    <Select.Trigger>
                        <Select.Value>
                            {#if status !== 'All'}
                                <div class="flex items-center gap-2">
                                    <svelte:component 
                                        this={STATUS_CONFIG[status].icon} 
                                        class="w-4 h-4 {STATUS_CONFIG[status].textColor}"
                                    />
                                    <span>{STATUS_CONFIG[status].label}</span>
                                </div>
                            {:else}
                                All Statuses
                            {/if}
                        </Select.Value>
                    </Select.Trigger>
                    <Select.Content>
                        <Select.Item value="All" label="All Statuses">
                            <div class="flex items-center gap-2">
                                <span>All Statuses</span>
                            </div>
                        </Select.Item>
                        {#each EVENT_STATUSES as statusValue}
                            <Select.Item
                                value={statusValue}
                                label={STATUS_CONFIG[statusValue].label}
                            >
                                <div class="flex items-center gap-2 {STATUS_CONFIG[statusValue].color} rounded-md px-2 py-1">
                                    <svelte:component 
                                        this={STATUS_CONFIG[statusValue].icon} 
                                        class="w-4 h-4 {STATUS_CONFIG[statusValue].textColor}"
                                    />
                                    <span class={STATUS_CONFIG[statusValue].textColor}>
                                        {STATUS_CONFIG[statusValue].label}
                                    </span>
                                </div>
                            </Select.Item>
                        {/each}
                    </Select.Content>
                </Select.Root>
            </div>
        </div>
    </div>
</Card>