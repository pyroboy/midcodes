<script lang="ts">
    import type { PageData } from './$types';
    import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
    import { Button } from '$lib/components/ui/button';
    import { ArrowUpDown } from 'lucide-svelte';

    interface ActivityLogView {
        id: number;
        user_id: string | null;
        username: string | null;
        role: string | null;
        activity: string;
        previous_data: Record<string, unknown> | null;
        new_data: Record<string, unknown> | null;
        created_at: string;
    }

    export let data: PageData & {
        activities: ActivityLogView[];
    };

    let activities: ActivityLogView[] = data.activities;
    let sortField: keyof ActivityLogView = 'created_at';
    let sortOrder: 'asc' | 'desc' = 'desc';

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatData(data: Record<string, unknown> | null): string {
        if (!data) return '';
        try {
            return JSON.stringify(data, null, 2);
        } catch {
            return 'Invalid data';
        }
    }

    function getUserDisplay(activity: ActivityLogView): string {
        if (activity.username) {
            return `${activity.username} (${activity.role})`;
        }
        return activity.user_id ? `User ${activity.user_id}` : 'Anonymous';
    }

    function sortBy(field: keyof ActivityLogView) {
        if (sortField === field) {
            sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            sortField = field;
            sortOrder = 'asc';
        }

        activities = [...activities].sort((a, b) => {
            const aValue = a[field];
            const bValue = b[field];

            if (aValue === null) return 1;
            if (bValue === null) return -1;

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }
</script>

<div class="container mx-auto py-8">
    <Card>
        <CardHeader>
            <CardTitle>Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
            <div class="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead class="w-[100px]">
                                <Button variant="ghost" on:click={() => sortBy('id')} class="flex items-center gap-1">
                                    ID
                                    <ArrowUpDown class="h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead class="w-[200px]">
                                <Button variant="ghost" on:click={() => sortBy('username')} class="flex items-center gap-1">
                                    User
                                    <ArrowUpDown class="h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" on:click={() => sortBy('activity')} class="flex items-center gap-1">
                                    Activity
                                    <ArrowUpDown class="h-4 w-4" />
                                </Button>
                            </TableHead>
                            <!-- <TableHead>Previous Data</TableHead>
                            <TableHead>New Data</TableHead> -->
                            <TableHead class="w-[180px]">
                                <Button variant="ghost" on:click={() => sortBy('created_at')} class="flex items-center gap-1">
                                    Created At
                                    <ArrowUpDown class="h-4 w-4" />
                                </Button>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {#each activities as activity (activity.id)}
                            <TableRow>
                                <TableCell class="font-mono">{activity.id}</TableCell>
                                <TableCell class="font-medium">{getUserDisplay(activity)}</TableCell>
                                <TableCell>{activity.activity}</TableCell>
                                <!-- <TableCell>
                                    {#if activity.previous_data}
                                        <pre class="text-xs overflow-x-auto max-w-xs">{formatData(activity.previous_data)}</pre>
                                    {/if}
                                </TableCell>
                                <TableCell>
                                    {#if activity.new_data}
                                        <pre class="text-xs overflow-x-auto max-w-xs">{formatData(activity.new_data)}</pre>
                                    {/if}
                                </TableCell> -->
                                <TableCell>{formatDate(activity.created_at)}</TableCell>
                            </TableRow>
                        {/each}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>
</div>