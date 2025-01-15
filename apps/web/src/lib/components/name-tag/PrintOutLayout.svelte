<!-- PrintOutLayout.svelte -->
<script lang="ts">
    import type { Attendee } from '$lib/types/database';
    import NameTagLayout from './NameTagLayout.svelte';
    import { onMount } from 'svelte';

    export let attendees: Attendee[];
    export let eventName: string;
    export let onClose: () => void;
    export let onPrinted: () => void;

    onMount(() => {
        // Automatically trigger print when component mounts
        setTimeout(() => {
            window.print();
            onPrinted(); // Call the callback after printing
            onClose(); // Close the preview after printing
        }, 500); // Small delay to ensure QR codes are rendered
    });
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:static print:bg-transparent">
    <div class="bg-white p-8 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto print:p-0 print:max-h-none print:overflow-visible">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6 print:hidden">
            <h2 class="text-2xl font-bold">Print Preview</h2>
        </div>
        
        <!-- Name Tags Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
            {#each attendees as attendee (attendee.id)}
                <NameTagLayout {attendee} {eventName} />
            {/each}
        </div>
    </div>
</div>

<style>
    /* Print styles */
    @media print {
        :global(body) {
            background: white;
        }
        
        :global(*) {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
    }
</style>
