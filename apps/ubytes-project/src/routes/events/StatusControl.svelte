<script lang="ts">
    import { RadioGroup, RadioGroupItem } from "$lib/components/ui/radio-group"
    import { Label } from "$lib/components/ui/label"
    import { createEventDispatcher } from 'svelte'
    import toast from 'svelte-french-toast'
    import { ClipboardCheck, Eye, Lock, Upload, Loader2 } from 'lucide-svelte'

    export let status: EventStatus
    export let eventId: string
    export let isProcessing: boolean
    export let canChange: boolean
    export let userRole: 'Admin' | 'TabulationHead'

    const EVENT_STATUSES = ['nodata', 'forReview', 'approved', 'locked', 'locked_published'] as const
    type EventStatus = typeof EVENT_STATUSES[number]
    type NonNodataStatus = Exclude<EventStatus, 'nodata'>
    let transitioningStatus: EventStatus | null = null

    const STATUS_FLOW: Record<EventStatus, ReadonlyArray<EventStatus>> = {
        nodata: [],
        forReview: ['approved', 'nodata', 'locked'],
        approved: ['locked_published', 'locked', 'forReview'],
        locked: ['forReview', 'locked_published', 'approved'],
        locked_published: ['approved', 'forReview', 'locked']
    }

    const ROLE_STATUS_PERMISSIONS: Record<'Admin' | 'TabulationHead', ReadonlyArray<EventStatus>> = {
        Admin: ['forReview', 'approved', 'locked', 'locked_published'],
        TabulationHead: ['forReview', 'approved']
    }

    function isEventStatus(value: string): value is EventStatus {
        return EVENT_STATUSES.includes(value as EventStatus)
    }

    type StatusConfig = {
        color: string
        activeColor: string
        gradientColor: string
        icon: typeof Eye | typeof ClipboardCheck | typeof Lock | typeof Upload
        label: string
    }

    const STATUS_CONFIG: Record<Exclude<EventStatus, 'nodata'>, StatusConfig> = {
        forReview: {
            color: "text-blue-600 bg-blue-100",
            activeColor: "bg-blue-600",
            gradientColor: "from-blue-400",
            icon: Eye,
            label: "For Review"
        },
        approved: {
            color: "text-green-600 bg-green-100",
            activeColor: "bg-green-600",
            gradientColor: "via-green-400",
            icon: ClipboardCheck,
            label: "Approved"
        },
        locked: {
            color: "text-amber-600 bg-amber-100",
            activeColor: "bg-amber-600",
            gradientColor: "via-amber-400",
            icon: Lock,
            label: "Locked"
        },
        locked_published: {
            color: "text-purple-600 bg-purple-100",
            activeColor: "bg-purple-600",
            gradientColor: "to-purple-400",
            icon: Upload,
            label: "Published"
        }
    }

    const dispatch = createEventDispatcher<{
        statusChange: { newStatus: EventStatus; eventId: string }
    }>()

    function isValidTransition(currentStatus: EventStatus, newStatus: EventStatus): boolean {
        const allowedStatuses = STATUS_FLOW[currentStatus]
        return allowedStatuses.includes(newStatus)
    }

    function isAllowedForRole(newStatus: EventStatus): boolean {
        const allowedStatuses = ROLE_STATUS_PERMISSIONS[userRole]
        return allowedStatuses.includes(newStatus)
    }

    function getAvailableStatuses(role: 'Admin' | 'TabulationHead'): NonNodataStatus[] {
        if (status === 'nodata') return []
        return role === 'Admin' 
            ? ['forReview', 'approved', 'locked', 'locked_published']
            : ['forReview', 'approved']
    }

    function shouldShowStatusIndicator(role: 'Admin' | 'TabulationHead'): boolean {
        return role === 'TabulationHead' && 
            (status === 'locked_published' || status === 'locked')
    }

    function getButtonOpacity(currentStatus: EventStatus, buttonStatus: EventStatus): string {
        if (isProcessing) return 'opacity-50'
        if (!canChange) return 'opacity-50'
        
        const isCurrentStatus = currentStatus === buttonStatus
        const isValidNext = isValidTransition(currentStatus, buttonStatus)
        
        if (isCurrentStatus) return 'opacity-100'
        if (isValidNext) return 'opacity-50 hover:opacity-100'
        return 'opacity-30'
    }

    async function handleStatusChange(value: string) {
        if (!isEventStatus(value)) {
            toast.error('Invalid status value')
            return
        }

        if (value === status) return
        if (isProcessing || !canChange) return
        if (!isValidTransition(status, value)) return
        if (!isAllowedForRole(value)) return

        try {
            transitioningStatus = value as EventStatus
            dispatch('statusChange', { newStatus: value, eventId })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to change status')
            transitioningStatus = null
        }
    }

    $: if (!isProcessing) {
        transitioningStatus = null
    }

    $: isTransitioning = isProcessing && transitioningStatus !== null
    $: animationDuration = isTransitioning ? '1s' : '8s'
    $: availableStatuses = getAvailableStatuses(userRole)
</script>

<div class="status-control relative" style="--animation-duration: {animationDuration}">
    {#if status === 'nodata'}
        <div class="flex items-center justify-center p-4 text-slate-600 font-medium bg-slate-100 rounded-lg">
            No Data Available
        </div>
    {:else}
        <div class="absolute inset-0 bg-gradient-to-r from-blue-400  via-amber-400 to-purple-400 rounded-lg opacity-20 animate-gradient" />
        <div class="flex justify-center gap-2 p-2 relative">
            {#if shouldShowStatusIndicator(userRole)}
                {#if status === 'locked'}
                    <div class="inline-flex items-center gap-2 px-4 py-2 rounded-md min-w-[120px] justify-center bg-amber-100 text-amber-600">
                        <Lock class="w-4 h-4" />
                        Locked
                    </div>
                {:else if status === 'locked_published'}
                    <div class="inline-flex items-center gap-2 px-4 py-2 rounded-md min-w-[120px] justify-center bg-purple-100 text-purple-600">
                        <Upload class="w-4 h-4" />
                        Published
                    </div>
                {/if}
            {/if}
            <RadioGroup
                value={status}
                disabled={!canChange || isProcessing}
                class="inline-flex gap-2"
                onValueChange={handleStatusChange}
            >
                {#each availableStatuses as statusValue}
                    <div class="flex items-center">
                        <RadioGroupItem 
                            value={statusValue} 
                            id={`${statusValue}-${eventId}`} 
                            class="peer hidden"
                            disabled={isProcessing || !canChange || !isValidTransition(status, statusValue)}
                        />
                        <Label
                            for={`${statusValue}-${eventId}`}
                            class={`
                                inline-flex items-center gap-2 px-4 py-2 rounded-md border-2 
                                transition-all duration-200 cursor-pointer min-w-[120px] justify-center
                                backdrop-blur-sm
                                ${STATUS_CONFIG[statusValue].color}
                                ${status === statusValue 
                                    ? `${STATUS_CONFIG[statusValue].activeColor} text-white border-transparent shadow-lg` 
                                    : 'border-transparent'}
                                ${getButtonOpacity(status, statusValue)}
                                ${isProcessing ? 'cursor-wait' : ''}
                            `}
                        >
                            {#if isProcessing && statusValue === transitioningStatus}
                                <Loader2 class="w-4 h-4 animate-spin" />
                            {:else}
                                <svelte:component 
                                    this={STATUS_CONFIG[statusValue].icon} 
                                    class="w-4 h-4"
                                />
                            {/if}
                            {STATUS_CONFIG[statusValue].label}
                        </Label>
                    </div>
                {/each}
            </RadioGroup>
        </div>
    {/if}
</div>

<style>
    .status-control {
        --gradient-width: 200%;
        padding: 1px;
    }

    .status-control :global(.lucide) {
        flex-shrink: 0;
    }

    .animate-gradient {
        background-size: var(--gradient-width) 100%;
        animation: gradient var(--animation-duration) linear infinite;
    }

    @keyframes gradient {
        0% {
            background-position: 0% 50%;
        }
        100% {
            background-position: var(--gradient-width) 50%;
        }
    }

    @media (prefers-reduced-motion) {
        .animate-gradient {
            animation: none;
        }
    }
</style>