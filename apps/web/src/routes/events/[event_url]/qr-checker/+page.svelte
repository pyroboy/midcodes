<script lang="ts">
    import type { PageData } from './$types';
    import { supabase } from '$lib/supabaseClient';
    import { superForm } from 'sveltekit-superforms/client';
    import type { QrScanSchema } from './+page.server';
    import type { ActionResultData, AttendeeWithScanInfo } from '$lib/types/database';
    import { onMount, onDestroy } from 'svelte';
    import { Button } from '$lib/components/ui/button';
    import { Card } from '$lib/components/ui/card';
    import { Label } from '$lib/components/ui/label';
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from '$lib/components/ui/table';
    import { cn } from '$lib/utils';
    import toast from 'svelte-french-toast';
    import type { Html5QrcodeScanner } from 'html5-qrcode';
    import { z } from 'zod';

    export let data: PageData;
    const { form, enhance, message } = superForm<z.infer<QrScanSchema>>(data.form, {
        onResult: ({ result }) => {
            if (result.type === 'success') {
                const resultData = result.data as ActionResultData;
                toast.success(resultData?.message || 'Scan recorded successfully');
                lastScannedUrl = null; // Reset for next scan
            } else if (result.type === 'error') {
                toast.error('Failed to record scan');
            }
        }
    });

    let scannerElement: HTMLDivElement;
    let scanner: Html5QrcodeScanner | null = null;
    let scannerActive = false;
    let lastScannedUrl: string | null = null;
    let scanType: 'entry' | 'exit' = 'entry';
    let processing = false;

    // Type the scan logs properly
    let scanLogs = (data.scanLogs as unknown as AttendeeWithScanInfo[]).map(log => ({
        ...log,
        attendance_status: log.attendance_status || 'registered'
    }));

    function getAttendeeDisplayName(basicInfo: { firstName: string; lastName: string; email: string; phone: string }) {
        return `${basicInfo.firstName} ${basicInfo.lastName}`;
    }

    // Format date
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    async function initializeScanner() {
        try {
            const { Html5QrcodeScanner } = await import('html5-qrcode');
            scanner = new Html5QrcodeScanner(
                'qr-reader',
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1,
                    rememberLastUsedCamera: true,
                },
                false
            );

            scanner.render(onScanSuccess, onScanError);
            scannerActive = true;
        } catch (err) {
            console.error('Failed to initialize scanner:', err);
            toast.error('Failed to initialize QR scanner');
        }
    }

    async function onScanSuccess(decodedText: string) {
        if (decodedText === lastScannedUrl || processing) return; // Prevent duplicate scans
        lastScannedUrl = decodedText;
        processing = true;

        try {
            // Extract attendee ID from URL
            const urlParts = decodedText.split('/');
            const referenceNumber = urlParts[urlParts.length - 1];
            
            // Find attendee by reference number
            const { data: attendeeData, error } = await supabase
                .from('attendees')
                .select('id, basic_info')
                .eq('reference_code_url', referenceNumber)
                .single();
            
            if (error || !attendeeData) {
                toast.error('Invalid QR code or attendee not found');
                return;
            }

            // Play success sound
            const audio = new Audio('/sounds/success-beep.mp3');
            audio.play().catch(console.error);

            // Record the scan
            form.update((current) => ({
                ...current,
                attendeeId: attendeeData.id,
                scannedUrl: decodedText,
                scanType: scanType,
                scanNotes: ''
            }));

            // Show who was scanned
            const attendeeName = attendeeData.basic_info?.name || 'Unknown Attendee';
            toast.success(`Scanning ${attendeeName}...`);

        } catch (err) {
            console.error('Scan processing error:', err);
            toast.error('Error processing scan');
        } finally {
            processing = false;
        }
    }

    function onScanError(err: any) {
        console.warn(`QR Scan error: ${err}`);
    }

    function toggleScanner() {
        if (scannerActive && scanner) {
            scanner.pause();
            scannerActive = false;
        } else if (scanner) {
            scanner.resume();
            scannerActive = true;
        }
    }

    onMount(() => {
        initializeScanner();
    });

    onDestroy(() => {
        if (scanner) {
            scanner.clear();
        }
    });
</script>

<svelte:head>
    <title>QR Scanner - {data.event.event_name}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">QR Scanner</h1>
        <p class="text-gray-600">{data.event.event_name}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Scanner Section -->
        <div>
            <Card class="p-6">
                <div class="space-y-4">
                    <div id="qr-reader" bind:this={scannerElement} class="w-full"></div>
                    
                    <div class="flex justify-between items-center">
                        <Button
                            variant={scannerActive ? "destructive" : "default"}
                            on:click={toggleScanner}
                        >
                            {scannerActive ? 'Pause Scanner' : 'Resume Scanner'}
                        </Button>
                        
                        <div class="flex items-center gap-4">
                            <Button
                                variant={scanType === 'entry' ? "default" : "outline"}
                                on:click={() => scanType = 'entry'}
                            >
                                Entry
                            </Button>
                            <Button
                                variant={scanType === 'exit' ? "default" : "outline"}
                                on:click={() => scanType = 'exit'}
                            >
                                Exit
                            </Button>
                        </div>
                    </div>

                    {#if lastScannedUrl}
                        <div class="mt-4 p-4 bg-gray-50 rounded-lg">
                            <p class="font-medium">Last Scanned:</p>
                            <p class="text-sm font-mono break-all">{lastScannedUrl}</p>
                        </div>
                    {/if}
                </div>
            </Card>
        </div>

        <!-- Scan Logs Section -->
        <div>
            <Card class="p-6">
                <h2 class="text-xl font-semibold mb-4">Recent Scans</h2>
                <div class="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Attendee</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Scan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each scanLogs as attendee}
                                <TableRow>
                                    <TableCell>
                                        <div class="flex flex-col">
                                            <span class="font-medium">
                                                {getAttendeeDisplayName(attendee.basic_info)}
                                            </span>
                                            <span class="text-xs text-gray-500">
                                                {attendee.reference_code_url}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span class={cn(
                                            "px-2 py-1 rounded-full text-xs font-medium",
                                            attendee.attendance_status === 'present' ? "bg-green-100 text-green-700" : 
                                            attendee.attendance_status === 'exited' ? "bg-blue-100 text-blue-700" :
                                            "bg-gray-100 text-gray-700"
                                        )}>
                                            {attendee.attendance_status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {#if attendee.qr_scan_info?.length}
                                            <div class="flex flex-col">
                                                <span class="text-sm">
                                                    {formatDate(attendee.qr_scan_info[attendee.qr_scan_info.length - 1].scan_time)}
                                                </span>
                                                <span class="text-xs text-gray-500">
                                                    {attendee.qr_scan_info[attendee.qr_scan_info.length - 1].scan_type}
                                                </span>
                                            </div>
                                        {/if}
                                    </TableCell>
                                </TableRow>
                            {:else}
                                <TableRow>
                                    <TableCell colspan={3} class="text-center py-8 text-gray-500">
                                        No scan logs yet
                                    </TableCell>
                                </TableRow>
                            {/each}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    </div>
</div>

<style>
    :global(#qr-reader) {
        width: 100% !important;
        border: none !important;
        box-shadow: none !important;
    }

    :global(#qr-reader__status) {
        display: none !important;
    }

    :global(#qr-reader__dashboard_section_csr button) {
        padding: 0.5rem 1rem !important;
        border-radius: 0.375rem !important;
        background-color: #f3f4f6 !important;
        color: #374151 !important;
        font-size: 0.875rem !important;
        line-height: 1.25rem !important;
        font-weight: 500 !important;
        border: 1px solid #e5e7eb !important;
    }
</style>
