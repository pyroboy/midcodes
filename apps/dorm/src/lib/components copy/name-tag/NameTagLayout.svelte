<!-- NameTagLayout.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import QRCodeStyling from 'qr-code-styling';
    import type { Attendee } from '$lib/types/database';
    import { page } from '$app/stores';

    interface Props {
        attendee: Attendee;
        eventName: string;
    }

    let { attendee, eventName }: Props = $props();
    let qrCodeContainer: HTMLDivElement = $state();

    onMount(() => {
        if (!attendee.reference_code_url) return;

        const qrCode = new QRCodeStyling({
            width: 200,
            height: 200,
            data: `${$page.url.origin}/${attendee.reference_code_url}`,
            dotsOptions: {
                color: "#000000",
                type: "square"
            },
            backgroundOptions: {
                color: "#ffffff",
            },
            imageOptions: {
                crossOrigin: "anonymous",
                margin: 0
            }
        });

        qrCode.append(qrCodeContainer);
    });
</script>

<div class="name-tag-container border rounded-lg p-6 print:break-inside-avoid bg-white shadow-sm">
    <div class="text-center mb-4">
        <h3 class="text-2xl font-bold tracking-tight">
            {attendee.basic_info.firstName} {attendee.basic_info.lastName}
        </h3>
        <p class="text-gray-600 font-medium">{attendee.ticket_info.type}</p>
        <p class="text-sm text-gray-500">{eventName}</p>
    </div>
    
    <div class="flex justify-center mb-3">
        <div bind:this={qrCodeContainer} class="qr-code-container"></div>
    </div>
    
    <div class="text-center">
        <p class="text-sm font-mono bg-gray-50 py-1 px-2 rounded inline-block">
            {attendee.reference_code_url}
        </p>
    </div>
</div>

<style>
    .name-tag-container {
        width: 100%;
        max-width: 300px;
        margin: 0 auto;
    }

    .qr-code-container {
        width: 200px;
        height: 200px;
    }

    /* Print styles */
    @media print {
        .name-tag-container {
            break-inside: avoid;
            page-break-inside: avoid;
            margin: 0;
            border: 1px solid #e5e7eb;
        }
    }
</style>
