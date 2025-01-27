<script lang="ts">
    import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { AlertCircle } from "lucide-svelte";
    
    export let open = false;
    export let eventName = '';
    
    const CONFIRMATION_TEXT = 'delete_event_will_delete_tabulations';
    $: console.log('Dialog props:', { open, eventName });
    let inputValue = '';
    let error = '';
    
    function handleInputChange(e: Event) {
        const target = e.target as HTMLInputElement;
        inputValue = target.value;
        error = '';
    }
    
    function handleSubmit() {
        if (inputValue !== CONFIRMATION_TEXT) {
            error = 'Text must match exactly';
            return;
        }
        dispatch('confirm');
        inputValue = '';
        error = '';
    }
    
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    
    $: isValid = inputValue === CONFIRMATION_TEXT;
    
    function handleClose() {
        dispatch('close');
        inputValue = '';
        error = '';
    }

    function handlePaste(e: Event) {
        e.preventDefault();
        error = 'Pasting is not allowed for security reasons';
    }

    function handleDrop(e: Event) {
        e.preventDefault();
        error = 'Dropping text is not allowed for security reasons';
    }

    function handleDragOver(e: Event) {
        e.preventDefault();
    }

    function handleCopy(e: Event) {
        e.preventDefault();
        error = 'Copying is not allowed for security reasons';
    }
</script>

<Dialog {open} onOpenChange={handleClose}>
    <DialogContent class="sm:max-w-md">
        <DialogHeader>
            <DialogTitle class="text-red-600 flex items-center gap-2">
                <AlertCircle class="w-5 h-5" />
                Confirm Delete
            </DialogTitle>
            <DialogDescription class="space-y-4">
                <p>You are about to delete: <span class="font-medium">{eventName}</span></p>
                <p>Type <span class="font-mono bg-gray-100 px-1 rounded">{CONFIRMATION_TEXT}</span> to confirm deletion:</p>
            </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4">
            <div role="group" aria-label="Delete confirmation input">
                <label for="delete-confirmation-input" class="sr-only">
                    Type confirmation text to delete event
                </label>
                <div
                    role="presentation"
                    on:paste|preventDefault|stopPropagation={handlePaste}
                    on:drop|preventDefault|stopPropagation={handleDrop}
                    on:dragover|preventDefault|stopPropagation={handleDragOver}
                    on:copy|preventDefault|stopPropagation={handleCopy}
                >
                    <Input
                        id="delete-confirmation-input"
                        bind:value={inputValue}
                        on:input={handleInputChange}
                        class="font-mono"
                        autocomplete="off"
                        spellcheck={false}
                        placeholder="Type the confirmation text here"
                        aria-invalid={!!error}
                        aria-describedby={error ? "delete-confirmation-error" : undefined}
                    />
                </div>
            </div>
            {#if error}
                <p 
                    class="text-red-500 text-sm" 
                    id="delete-confirmation-error" 
                    role="alert"
                    aria-live="polite"
                >{error}</p>
            {/if}
        </div>
        
        <DialogFooter>
            <Button variant="outline" on:click={handleClose}>Cancel</Button>
            <Button 
                variant="destructive"
                on:click={handleSubmit}
                disabled={!isValid}
                aria-label="Confirm delete event"
            >
                Delete Event
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>