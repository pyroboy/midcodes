# PrintOutLayout.svelte
<script lang="ts">
    import type { Attendee } from '$lib/types/database';
    import { onMount } from 'svelte';

    export let attendees: Attendee[] = [];
    export let eventName: string;
    export let onClose: () => void;

    let printContainer: HTMLElement;

    onMount(() => {
        window.print();
    });

    function handleAfterPrint() {
        onClose();
    }
</script>

<svelte:window on:afterprint={handleAfterPrint} />

<div bind:this={printContainer} class="print-container">
    {#each attendees as attendee, i}
        <div class="name-tag">
            <div class="event-name">{eventName}</div>
            <div class="attendee-name">{attendee.first_name} {attendee.last_name}</div>
            <div class="qr-code">
                <!-- QR code will be generated here -->
                <img src={attendee.qr_code_url} alt="QR Code" />
            </div>
        </div>
        {#if (i + 1) % 6 === 0}
            <div class="page-break"></div>
        {/if}
    {/each}
</div>

<style>
    .print-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        padding: 1rem;
    }

    .name-tag {
        border: 1px solid #ccc;
        padding: 1rem;
        text-align: center;
        break-inside: avoid;
    }

    .event-name {
        font-size: 1.2rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
    }

    .attendee-name {
        font-size: 1.5rem;
        margin-bottom: 1rem;
    }

    .qr-code {
        width: 150px;
        height: 150px;
        margin: 0 auto;
    }

    .qr-code img {
        width: 100%;
        height: 100%;
    }

    .page-break {
        break-after: page;
    }

    @media print {
        .print-container {
            width: 100%;
            margin: 0;
            padding: 0;
        }

        .name-tag {
            page-break-inside: avoid;
        }
    }
</style>
