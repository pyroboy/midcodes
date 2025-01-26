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

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
    
    let scanner: Html5QrcodeScanner;
    let scannerActive = false;
    let recentScans: AttendeeWithScanInfo[] = [];
    const MAX_RECENT_SCANS = 10;

    const { form, enhance } = superForm<QrScanSchema>(data.form, {
        onResult: ({ result }) => {
            const actionResult = result.data as ActionResultData;
            if (result.type === 'success' && actionResult.success) {
                const attendee = actionResult.data as AttendeeWithScanInfo;
                toast.success(actionResult.message);
                updateRecentScans(attendee);
            } else {
                toast.error(actionResult.message);
            }
        },
    });

    onMount(async () => {
        const { Html5QrcodeScanner } = await import('html5-qrcode');
        scanner = new Html5QrcodeScanner(
            'qr-reader',
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );
    });

    onDestroy(() => {
        if (scanner) {
            scanner.clear();
        }
    });

    function updateRecentScans(attendee: AttendeeWithScanInfo) {
        recentScans = [attendee, ...recentScans.slice(0, MAX_RECENT_SCANS - 1)];
    }

    function formatDateTime(dateStr: string) {
        return new Date(dateStr).toLocaleString();
    }

    function toggleScanner() {
        if (scannerActive && scanner) {
            scanner.pause();
            scannerActive = false;
        } else if (scanner) {
            scanner.render(success, error);
            scannerActive = true;
        }
    }

    async function success(decodedText: string) {
        $form.qrCode = decodedText;
        await enhance();
    }

    function error(errorMessage: string) {
        console.error('QR Scan Error:', errorMessage);
    }
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
                    <div>
                        <Label>QR Scanner</Label>
                        <div id="qr-reader"></div>
                    </div>

                    <div class="flex justify-center">
                        <Button
                            variant={scannerActive ? "destructive" : "default"}
                            on:click={toggleScanner}
                        >
                            {scannerActive ? 'Stop Scanner' : 'Start Scanner'}
                        </Button>
                    </div>

                    <form method="POST" use:enhance class="space-y-4">
                        <div>
                            <Label for="qrCode">Manual Entry</Label>
                            <div class="flex gap-2">
                                <input
                                    type="text"
                                    id="qrCode"
                                    name="qrCode"
                                    bind:value={$form.qrCode}
                                    placeholder="Enter QR code manually"
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <Button type="submit">
                                    Verify
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </Card>
        </div>

        <!-- Recent Scans Section -->
        <div>
            <Card class="p-6">
                <h2 class="text-xl font-semibold mb-4">Recent Scans</h2>
                <div class="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Ticket</TableHead>
                                <TableHead>Scans</TableHead>
                                <TableHead>Last Scan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each recentScans as scan}
                                <TableRow>
                                    <TableCell>
                                        {scan.first_name} {scan.last_name}
                                    </TableCell>
                                    <TableCell>
                                        {scan.ticket_type.name}
                                    </TableCell>
                                    <TableCell>
                                        {scan.scan_count}
                                    </TableCell>
                                    <TableCell>
                                        {scan.last_scan ? formatDateTime(scan.last_scan) : 'N/A'}
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
    }

    :global(#qr-reader video) {
        width: 100% !important;
        height: auto !important;
    }

    :global(#qr-reader__scan_region) {
        position: relative !important;
        min-height: 300px !important;
    }

    :global(#qr-reader__dashboard_section_csr button) {
        display: none !important;
    }
</style>
