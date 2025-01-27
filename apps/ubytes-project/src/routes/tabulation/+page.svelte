<script lang="ts">
    import { superForm } from 'sveltekit-superforms/client';
    import { zodClient } from "sveltekit-superforms/adapters";
    import type { PageData } from './$types';
    import type { DepartmentItem, Tabulation, TabulationPageData } from './types';
    import { formSchema, type FormData, validateAndPrepareTieGroups, assignTieGroups } from './schema';
    import { writable, derived } from 'svelte/store';
    import toast, { Toaster } from 'svelte-french-toast';
    import { Button } from '$lib/components/ui/button';
    import { Label } from '$lib/components/ui/label';
    import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Lock, Medal, Upload, ClipboardCheck, RotateCcw ,Trash2} from "lucide-svelte";
    import SearchableCombobox from './SerchableCombobox.svelte';
    import TabulationTable from './TabulationTable.svelte';
    import TieGroup from './TieGroup.svelte';
    import VisualRankings from './VisualRankings.svelte';
    import { page } from '$app/stores';
    import RankingsStatus from './RankingsStatus.svelte';
    
    // Type definitions
    interface Profile {
        role: string;
    }
    
    // Props
    export let data: PageData & TabulationPageData & { user: { role: string } };
    
    // Store initializations
    const isReverting = writable(false);
    const showConfirmModal = writable(false);
    const currentAction = writable<'create' | 'revertToReview' | 'approve' | 'updateApproved'|'clear'>('create');
    const affectedRankings = writable<Set<number>>(new Set());
    
    // Local state
    let formSubmitted = false;
    let isModalOpen = false;
    let currentActionValue: 'create' | 'revertToReview' | 'approve' | 'updateApproved' |'clear' = 'create';
    let tieGroupValue = '';
    let medalCount = 0;
    let departmentCount = data.departments.length;
    let incompleteRankingsMessage = '';
    
    // Form initialization
    const { form, errors, enhance, submitting } = superForm<FormData>(data.form, {
        validators: zodClient(formSchema),
        resetForm: false,
        dataType: "json",
        taintedMessage: null,
        onSubmit: ({ cancel }) => {
            if (!$form.event_id) {
                toast.error('No event selected', {
                    position: "top-center",
                    duration: 3000
                });
                return cancel();
            }
    
            const actionMap = {
                'create': 'Submitting rankings...',
                'revertToReview': 'Reverting rankings...',
                'approve': 'Approving rankings...',
                'updateApproved': 'Updating rankings...',
                'clear':'Clearing Tabulations'
            } as const;
    
            const actionText = actionMap[currentActionValue];
    
            toast.loading(actionText, {
                position: "top-center",
                duration: Infinity
            });
        },
        onResult: async ({ result }) => {
            toast.dismiss();
    
            if (result.type === 'failure') {
                const displayMessage = result.data?.serverError || 
                                     result.data?.message || 
                                     getDefaultErrorMessage(currentActionValue);
    
                toast.error(displayMessage, {
                    position: "top-center",
                    duration: 4000
                });
                isReverting.set(false);
            } else if (result.type === 'success') {
                const successMessage = result.data?.message || 
                                     getSuccessMessage(currentActionValue);
                
                toast.success(successMessage, {
                    position: "top-center",
                    duration: 3000,
                    icon: getSuccessIcon(currentActionValue)
                });
    
                if (currentActionValue === 'create' || currentActionValue === 'revertToReview') {
                    formSubmitted = false;
                }
    
                if (currentActionValue === 'approve') {
                    formSubmitted = true;
                }
    
                isReverting.set(false);
            }
        },
        onUpdate: ({ form }) => {
            console.log('Form state updated:', {
                eventId: form.data.event_id,
                rankingsCount: form.data.rankings?.length ?? 0,
                tieGroups: form.data.tie_groups,
                formErrors: $errors,
                isSubmitting: $submitting
            });
        }
    });
    
    // Store subscriptions
    currentAction.subscribe(value => {
        currentActionValue = value;
    });
    
    // Reactive declarations
    $: profile = $page.data.profile as Profile;
    
    // Role-based access control
    $: isAdminOrTabHead = profile?.role === 'Admin' || profile?.role === 'TabulationHead';
    $: isTabulationCommittee = profile?.role === 'TabulationCommittee';
    
    // Event-related reactive declarations
    $: selectedEvent = data.events.find(e => e.id === $form.event_id);
    $: isEventApproved = selectedEvent?.event_status === "approved";
    $: isEventLocked = selectedEvent?.event_status === "locked";
    $: isEventLockedPublished = selectedEvent?.event_status === "locked_published";
    $: isUpdateMode = data.tabulations?.some(t => t.event_id === $form.event_id) || false;
    
    // Form state reactive declarations
    $: hasValidRankings = $form.rankings?.some(r => r.department_id !== -1) || false;
    $: tieGroupValue = $form.tie_groups || "";
    
    // Event items transformation
    $: eventItems = data.events.map(event => ({
        value: event.id,
        label: event.event_name,
        status: event.event_status,
        category: event.category
    }));
    
    // Form submission state
    $: {
        if (selectedEvent?.event_status === 'forReview') {
            formSubmitted = true;
        } else {
            formSubmitted = false;
        }
    }
    
    // Utility functions
    function getSuccessMessage(action: string): string {
        switch (action) {
            case 'create':
                return 'Rankings submitted successfully for review';
            case 'revertToReview':
                return 'Rankings reverted to review status';
            case 'approve':
                return 'Rankings approved successfully';
            case 'updateApproved':
                return 'Approved rankings updated successfully';
            default:
                return 'Operation completed successfully';
        }
    }
    
    function getSuccessIcon(action: string): string {
        switch (action) {
            case 'approve':
                return '✓';
            case 'revertToReview':
                return '↺';
            case 'create':
                return '📝';
            case 'updateApproved':
                return '🔄';
            default:
                return '✓';
        }
    }
    
    function getDefaultErrorMessage(action: string): string {
        console.log('Getting default error message for action:', action);
        switch (action) {
            case 'revertToReview':
                return 'Failed to revert rankings to review status';
            case 'approve':
                return 'Failed to approve rankings';
            case 'updateApproved':
                return 'Failed to update approved rankings';
            case 'create':
                return 'Failed to create rankings';
            default:
                return 'An error occurred while processing your request';
        }
    }
    
    // Rankings management functions
    function initializeRankings(count: number) {
        $form.rankings = Array.from({ length: count }, (_, i) => ({ 
            rank: i + 1, 
            department_id: -1,
            tie_group: null
        }));
    }
    
    function clearRankings() {
        $form.rankings = [];
        $form.tie_groups = "";
        tieGroupValue = "";
        affectedRankings.set(new Set<number>());
    }
    
function getAvailableDepartments(currentIndex: number): DepartmentItem[] {
   let allowDuplicateDepartments = true
    const selectedDepartments = new Set(
        ($form.rankings ?? [])
            .filter((_, i) => i !== currentIndex) // Exclude the current index
            .map((r) => r.department_id)
            .filter(id => id !== -1) // Exclude unselected departments
    );

    return [
        { value: "-1", label: "Select a department", logo: "" },
        ...data.departments
            .filter(d => allowDuplicateDepartments || !selectedDepartments.has(d.id)) // Apply filter based on flag
            .map(d => ({
                value: d.id.toString(),
                label: `${d.department_acronym} - ${d.department_name}`,
                logo: d.department_logo || ""
            }))
    ];
}

    // Event handlers
    function handleEventSelect(eventId: string) {
        if (eventId && eventId !== "-1") {
            $form.event_id = eventId;
            affectedRankings.set(new Set<number>());
            
            const selectedTabulations = data.tabulations
                ?.filter(t => t.event_id === eventId)
                .sort((a, b) => a.rank - b.rank) ?? [];
    
            const event = data.events.find(e => e.id === eventId);
            medalCount = event?.medal_count ?? 0;
    
            if (departmentCount > 0) {
                if (selectedTabulations.length > 0) {
                    $form.rankings = Array.from({ length: departmentCount }, (_, i) => {
                        const existingTab = selectedTabulations.find(t => t.rank === i + 1);
                        return {
                            rank: i + 1,
                            department_id: existingTab?.department_id ?? -1,
                            tie_group: existingTab?.tie_group ?? null
                        };
                    });
    
                    const tieGroups = selectedTabulations
                        .filter(t => t.tie_group !== null)
                        .map(t => t.tie_group)
                        .filter((value, index, self) => self.indexOf(value) === index)
                        .sort((a, b) => (a || 0) - (b || 0));
    
                    const tieGroupsString = tieGroups
                        .map(group => {
                            const ranksInGroup = selectedTabulations
                                .filter(t => t.tie_group === group)
                                .map(t => t.rank)
                                .sort((a, b) => a - b);
                            return ranksInGroup.length ? 
                                `${ranksInGroup[0]}-${ranksInGroup[ranksInGroup.length - 1]}` : '';
                        })
                        .filter(Boolean)
                        .join(', ');
    
                    $form.tie_groups = tieGroupsString;
                    tieGroupValue = tieGroupsString;
                } else {
                    initializeRankings(departmentCount);
                }
            } else {
                clearRankings();
            }
        } else {
            $form.event_id = '';
            clearRankings();
            medalCount = 0;
        }
    }
    
    function handleDepartmentSelect(index: number, departmentId: string) {
        if ($form.rankings) {
            const updatedRankings = [...$form.rankings];
            updatedRankings[index] = {
                ...updatedRankings[index],
                department_id: parseInt(departmentId)
            };
            $form.rankings = updatedRankings;
        }
    }
    
    function handleTieGroupChange(value: string, affectedRanks?: string) {
        tieGroupValue = value;
        $form.tie_groups = value;
        
        if (affectedRanks) {
            const ranks = new Set(affectedRanks.split(',').map(Number));
            affectedRankings.set(ranks);
        }
        
        if ($form.rankings) {
            $form.rankings = assignTieGroups($form.rankings, value);
        }
    }
    
    function handleResetForm() {
        if (!$form.event_id) {
            toast.error('No event selected');
            return;
        }
    
        initializeRankings(departmentCount);
        handleTieGroupChange('');
        toast.success('Form reset successfully');
    }
    
    // Form submission handlers
    function handleRevert() {
        if (!selectedEvent) {
            toast.error('No event selected');
            return;
        }
    
        if (isEventLocked || isEventLockedPublished) {
            toast.error(`Cannot revert ${selectedEvent.event_status} event. Event must be unlocked first.`);
            return;
        }
    
        if (!$form.rankings || $form.rankings.length === 0) {
            toast.error('No rankings to revert');
            return;
        }
    
        incompleteRankingsMessage = isEventApproved 
            ? `Are you sure you want to revert "${selectedEvent.event_name}" from approved back to review status?`
            : `Are you sure you want to revert "${selectedEvent.event_name}" to review status?`;
            
        isModalOpen = true;
        showConfirmModal.set(true);
        currentAction.set('revertToReview');
    }
    
    function handleApprove() {
        if (!selectedEvent) {
            toast.error('No event selected');
            return;
        }
    
        if (isEventLocked || isEventLockedPublished) {
            toast.error(`Cannot approve ${selectedEvent.event_status} event.`);
            return;
        }
    
        submitForm('approve');
    }
    
    function handleUpdateApproved() {
        if (!selectedEvent) {
            toast.error('No event selected');
            return;
        }
    
        if (!isEventApproved) {
            toast.error('Can only update approved events.');
            return;
        }
    
        submitForm('updateApproved');
    }
    
    function submitForm(action: 'create' | 'revertToReview' | 'approve' | 'updateApproved') {
        console.log('Submit form triggered:', { 
            action,
            currentStatus: selectedEvent?.event_status,
            hasRankings: Boolean($form.rankings?.length),
            formErrors: $errors
        });
        
        currentAction.set(action);
        isReverting.set(action === 'revertToReview');
        
        const formElement = document.querySelector<HTMLFormElement>('#tabulationForm');
        if (formElement) {
            console.log('Form element found, dispatching submit event');
            formElement.setAttribute('action', `?/${action}`);
            formElement.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        } else {
            console.error('Form element not found');
        }
    }
    
    function confirmRevert() {
        isReverting.set(true);
        closeModal();
        submitForm('revertToReview');
    }
    
    function closeModal() {
        isModalOpen = false;
        showConfirmModal.set(false);
        incompleteRankingsMessage = '';
    }

    function confirmClear() {
    closeModal();
    currentAction.set('clear');
    const formElement = document.querySelector<HTMLFormElement>('#tabulationForm');
    if (formElement) {
        formElement.setAttribute('action', '?/clear');
        formElement.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        
        // Reset form after clearing
        clearRankings();
        handleEventSelect('');
        $form.event_id = '';
        $form.tie_groups = '';
    }
}

    </script>
    
    <!-- Rest of the component template remains the same -->
    <Toaster />
    <div class="container mx-auto p-4">
        <Card class="mb-8 relative">
            <CardHeader>
                <CardTitle>Tabulation Management</CardTitle>
            </CardHeader>
            <CardContent class="relative">
                {#if (!isAdminOrTabHead && isEventApproved) || isEventLocked || isEventLockedPublished}
                    <div class="absolute inset-0 flex items-center justify-center z-10 rounded-b-lg 
                        {!isAdminOrTabHead && isEventApproved ? 'bg-green-100/50' : ''}
                        {isEventLocked ? 'bg-gray-100/50' : ''}
                        {isEventLockedPublished ? 'bg-purple-100/50' : ''}">
                        
                        <div class="text-gray-500 flex flex-col items-center">
                            {#if !isAdminOrTabHead && isEventApproved}
                                <ClipboardCheck class="w-12 h-12 mb-2" />
                                <span class="text-lg font-semibold">{selectedEvent?.event_name} is Approved</span>
                            {/if}
                            {#if isEventLocked}
                                <Lock class="w-12 h-12 mb-2" />
                                <span class="text-lg font-semibold">{selectedEvent?.event_name} is locked</span>
                            {/if}
                            {#if isEventLockedPublished}
                                <Upload class="w-12 h-12 mb-2" />
                                <span class="text-lg font-semibold">{selectedEvent?.event_name} is Published</span>
                            {/if}
                        </div>
                    </div>
                {/if}
    
                <form id="tabulationForm" method="POST" use:enhance>
                    <input name="event_id" value={$form.event_id} hidden />
                    <input name="rankings" value={JSON.stringify($form.rankings || [])} hidden />
                    <input name="tie_groups" value={$form.tie_groups || ""} hidden />
                    
                    <div class="grid grid-cols-3 gap-4 mb-8">
                        <div class="z-20">
                            <Label for="event_id">Events</Label>
                            <SearchableCombobox
                                type="event"
                                items={eventItems}
                                value={$form.event_id}
                                onValueChange={handleEventSelect}
                                placeholder="Select an event"
                                searchPlaceholder="Search events..."
                            />
                            {#if $errors.event_id}
                                <span class="text-red-500 text-sm">{$errors.event_id}</span>
                            {/if}
                        </div>
    
                        <div class="flex items-start gap-2">
                            <Medal class="w-6 h-6 mt-6 text-yellow-500" />
                            <div>
                                <Label>Medal Count</Label>
                                <div class="text-2xl font-bold">{medalCount}</div>
                            </div>
                        </div>
    
                        <div class="z-20">
                            <TieGroup
                                value={tieGroupValue}
                                onChange={handleTieGroupChange}
                                disabled={(!isAdminOrTabHead && !isTabulationCommittee) || isEventLocked || isEventLockedPublished}
                                error={$errors.tie_groups}
                                rankings={$form.rankings}
                                on:affectedranks={(e) => affectedRankings.set(new Set(e.detail))}
                            />
                        </div>
                    </div>
    
                    {#if !$form.event_id}
                        <div class="flex justify-center items-center h-20">
                            <p class="text-gray-200 italic text-2xl text-center">
                                Achieve Your Goals with University of Bohol
                            </p>
                        </div>
                    {:else if departmentCount > 0 && $form.rankings}
                        <div class="mt-6">
                            <Label class="mb-4 block">Rankings</Label>
                            <div class="space-y-2">
                                <VisualRankings
                                    rankings={$form.rankings}
                                    tieGroups={$form.tie_groups}
                                    getAvailableDepartments={getAvailableDepartments}
                                    onDepartmentSelect={handleDepartmentSelect}
                                    isDisabled={(!isAdminOrTabHead && !isTabulationCommittee) || isEventLocked || isEventLockedPublished}
                                    affectedRankings={$affectedRankings}
                                />
                            </div>
                        </div>
    
                        <div class="mt-6 flex justify-between">
                            <div class="flex space-x-4">
                                {#if isAdminOrTabHead && !formSubmitted}
                                    <Button 
                                        type="button"
                                        variant="default"
                                        class="bg-yellow-600 hover:bg-yellow-700 flex items-center gap-2"
                                        disabled={!selectedEvent || isEventLocked || isEventLockedPublished || $isReverting || !hasValidRankings}
                                        on:click={handleRevert}
                                    >
                                        <RotateCcw class="w-4 h-4" />
                                        {#if $isReverting}
                                            Reverting...
                                        {:else}
                                            Revert to Review
                                        {/if}
                                    </Button>
                            
                                    {#if isEventApproved}
                                        <Button 
                                            type="button"
                                            variant="default"
                                            class="bg-green-600 hover:bg-green-700"
                                            disabled={!selectedEvent || isEventLocked || isEventLockedPublished || $isReverting || !hasValidRankings}
                                            on:click={handleUpdateApproved}
                                        >
                                            Update Approved
                                        </Button>
                                    {:else}
                                        <Button 
                                            type="button"
                                            variant="default"
                                            class="bg-green-600 hover:bg-green-700"
                                            disabled={!selectedEvent || isEventLocked || isEventLockedPublished || $isReverting || !hasValidRankings}
                                            on:click={handleApprove}
                                        >
                                            Approve
                                        </Button>
                                    {/if}
                                {:else if isAdminOrTabHead && selectedEvent?.event_status === 'forReview'}
                                    <Button 
                                        type="button"
                                        variant="default"
                                        class="bg-green-600 hover:bg-green-700"
                                        disabled={!selectedEvent || isEventLocked || isEventLockedPublished || !hasValidRankings}
                                        on:click={handleApprove}
                                    >
                                        Approve Rankings
                                    </Button>
                                {:else if isTabulationCommittee}
                                    {#if isUpdateMode}
                                        <Button 
                                            type="button"
                                            variant="default"
                                            class="bg-blue-600 hover:bg-blue-700"
                                            disabled={!selectedEvent || isEventLocked || isEventLockedPublished || !hasValidRankings}
                                            on:click={() => submitForm('create')}
                                        >
                                            {#if !hasValidRankings}
                                                Add Rankings First
                                            {:else}
                                                Update For Review
                                            {/if}
                                        </Button>
                                    {:else}
                                        <Button 
                                            type="button"
                                            variant="default"
                                            class="bg-blue-600 hover:bg-blue-700"
                                            disabled={!selectedEvent || isEventLocked || isEventLockedPublished || !hasValidRankings}
                                            on:click={() => submitForm('create')}
                                        >
                                            {#if !hasValidRankings}
                                                Add Rankings First
                                            {:else}
                                                Submit For Review
                                            {/if}
                                        </Button>
                                    {/if}
                                {/if}
                            
                                <Button 
                                    type="button"
                                    variant="outline"
                                    class="flex items-center gap-2"
                                    disabled={!selectedEvent || isEventLocked || isEventLockedPublished}
                                    on:click={handleResetForm}
                                >
                                    <RotateCcw class="w-4 h-4" />
                                    Reset Form
                                </Button>
                            </div>
                        
                            {#if isAdminOrTabHead}
                            <Button 
                            type="button"
                            variant="destructive"
                            class="flex items-center gap-2"
                            disabled={!selectedEvent || 
                                      isEventLocked || 
                                      isEventLockedPublished || 
                                      $submitting ||
                                      selectedEvent.event_status == "nodata"}
                            on:click={() => {
                                if (!selectedEvent) {
                                    toast.error('No event selected');
                                    return;
                                }
                                const message = `Are you sure you want to clear all tabulations for "${selectedEvent.event_name}"? This action cannot be undone.`;
                                
                                incompleteRankingsMessage = message;
                                isModalOpen = true;
                                showConfirmModal.set(true);
                                currentAction.set('clear');
                            }}
                        >
                            <Trash2 class="w-4 h-4" />
                            Clear Tabulations
                        </Button>
                            {/if}
                        </div>
                        
                    {/if}
                </form>
            </CardContent>
        </Card>
    
   
        <RankingsStatus 
            selectedEvent={selectedEvent ? {
                event_status: selectedEvent.event_status,
                event_name: selectedEvent.event_name
            } : null} 
            {formSubmitted}
        />
    
        <div class="mt-8">
            <TabulationTable tabulations={data.tabulations} />
        </div>
    </div>
    

    {#if $showConfirmModal && isModalOpen}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-md">
            <h2 class="text-xl font-bold mb-4">Confirm Action</h2>
            <p class="mb-4">{incompleteRankingsMessage}</p>
            <div class="flex justify-end space-x-2">
                <Button 
                    variant="outline" 
                    on:click={closeModal}
                >
                    Cancel
                </Button>
                <Button 
                    variant="destructive"
                    on:click={currentActionValue === 'clear' ? confirmClear : confirmRevert}
                >
                    Confirm
                </Button>
            </div>
        </div>
    </div>
{/if}

    <style>
        :global(.highlight-row) {
            background-color: rgba(255, 0, 0, 0.1);
            border: 1px solid red;
            border-radius: 0.375rem;
        }
    
        :global(.tie-group-container) {
            position: relative;
            margin-left: 1rem;
        }
    
        :global(.tie-group-indicator) {
            position: absolute;
            left: -1rem;
            width: 4px;
            background-color: rgb(59, 130, 246);
            border-radius: 2px;
        }
    
        :global(.status-indicator) {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 0.5rem;
        }
    
        :global(.status-approved) {
            background-color: #22c55e;
        }
    
        :global(.status-review) {
            background-color: #eab308;
        }
    
        :global(.status-locked) {
            background-color: #64748b;
        }
    
        :global(.status-published) {
            background-color: #8b5cf6;
        }
    </style>
    