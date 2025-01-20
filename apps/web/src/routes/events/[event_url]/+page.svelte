<script lang="ts">
import type { PageData } from './types';
import { Root as Card, Content as CardContent, Description as CardDescription, Header as CardHeader, Title as CardTitle } from '$lib/components/ui/card';
import { Button } from '$lib/components/ui/button';
import { CalendarDays, Users, CreditCard, QrCode, Tag, Settings } from 'lucide-svelte';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

function formatPercentage(value: number, total: number): string {
    if (!total) return '0%';
    const percentage = (value / total) * 100;
    return `${percentage < 0 ? 0 : Math.round(percentage)}%`;
}

const routes = [
    {
        name: 'Registration',
        href: `/events/${data.event.event_url}/register`,
        description: 'Register new attendees',
        icon: Users,
        color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
        name: 'Payments',
        href: `/events/${data.event.event_url}/payments`,
        description: 'Manage payments and transactions',
        icon: CreditCard,
        color: 'bg-green-500 hover:bg-green-600'
    },
    {
        name: 'Name Tags',
        href: `/events/${data.event.event_url}/name-tags`,
        description: 'Generate and print name tags',
        icon: Tag,
        color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
        name: 'QR Scanner',
        href: `/events/${data.event.event_url}/qr-checker`,
        description: 'Scan QR codes for check-in',
        icon: QrCode,
        color: 'bg-yellow-500 hover:bg-yellow-600'
    },
    {
        name: 'Settings',
        href: `/events/${data.event.event_url}/settings`,
        description: 'Configure event settings',
        icon: Settings,
        color: 'bg-gray-500 hover:bg-gray-600'
    }
];

// Format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(amount);
};
</script>

<svelte:head>
    <title>{data.event.event_name} Dashboard</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
    <!-- Event Header -->
    <div class="mb-8">
        <h1 class="text-4xl font-bold mb-2">{data.event.event_name}</h1>
        <!-- {#if data.event.event_long_name}
            <p class="text-xl text-muted-foreground">{data.event.event_long_name}</p>
        {/if} -->
        
        <!-- Event Status -->
        <div class="flex items-center gap-2 mt-4">
            <CalendarDays class="w-5 h-5 text-muted-foreground" />
            <span class="text-sm text-muted-foreground">
                {new Date(data.eventStatus.registrationStartDate).toLocaleDateString()} - 
                {new Date(data.eventStatus.registrationEndDate).toLocaleDateString()}
            </span>
            <!-- <span class={`ml-2 px-2 py-1 text-xs rounded-full ${data.eventStatus.isRegistrationOpen ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {data.eventStatus.isRegistrationOpen ? 'Registration Open' : 'Registration Closed'}
            </span> -->
        </div>
    </div>

    <div class="flex gap-8">
        <!-- Quick Actions (Left Side) -->
        <div class="w-1/4 space-y-4">
            {#each routes as route}
                <a href={route.href} class="block">
                    <Card class={`${route.color} text-white transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}>
                        <CardHeader>
                            <div class="flex items-center gap-3">
                                <route.icon class="w-6 h-6" />
                                <div>
                                    <CardTitle class="text-lg">{route.name}</CardTitle>
                                    <CardDescription class="text-white/80">{route.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                </a>
            {/each}
        </div>

        <!-- Statistics (Right Side) -->
        <div class="w-3/4">
            <!-- Statistics Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <!-- Total Registrations -->
                <Card>
                    <CardHeader>
                        <CardTitle class="text-lg">Total Registrations</CardTitle>
                        <CardDescription>Overall registration count</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div class="text-3xl font-bold">{data.stats.totalRegistrations}</div>
                        <p class="text-sm text-muted-foreground mt-1">
                            Capacity: {formatPercentage(data.stats.totalRegistrations, data.event.other_info.capacity)}
                        </p>
                    </CardContent>
                </Card>

                <!-- Payment Status -->
                <Card>
                    <CardHeader>
                        <CardTitle class="text-lg">Payment Status</CardTitle>
                        <CardDescription>Registration payment overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div class="space-y-2">
                            <div>
                                <div class="text-3xl font-bold text-green-600">
                                    {data.stats.paidCount}
                                </div>
                                <p class="text-sm text-muted-foreground">Paid Registrations</p>
                            </div>
                            <div>
                                <div class="text-3xl font-bold text-yellow-600">
                                    {data.stats.totalRegistrations - data.stats.paidCount}
                                </div>
                                <p class="text-sm text-muted-foreground">Pending Payments</p>
                            </div>
                            <div class="mt-4 pt-4 border-t">
                                <p class="text-sm text-muted-foreground">Payment Rate</p>
                                <div class="text-2xl font-bold">
                                    {formatPercentage(data.stats.paidCount, data.stats.totalRegistrations)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <!-- Total Revenue -->
                <Card>
                    <CardHeader>
                        <CardTitle class="text-lg">Total Revenue</CardTitle>
                        <CardDescription>Overall earnings from registrations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div class="space-y-2">
                            <div class="text-3xl font-bold">
                                {formatCurrency(data.stats.totalRevenue)}
                            </div>
                            <p class="text-sm text-muted-foreground">
                                From {data.stats.paidCount} paid registrations
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- Activity and Distribution -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Ticket Type Distribution -->
                <Card>
                    <CardHeader>
                        <CardTitle class="text-lg">Ticket Distribution</CardTitle>
                        <CardDescription>Breakdown by ticket type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div class="space-y-4">
                            {#each Object.entries(data.stats.ticketTypeCounts) as [type, count]}
                                <div>
                                    <div class="flex justify-between items-center mb-1">
                                        <span class="text-sm font-medium">{type}</span>
                                        <span class="text-sm text-muted-foreground">{count}</span>
                                    </div>
                                    <div class="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            class="h-full bg-primary"
                                            style="width: {formatPercentage(count, data.stats.totalRegistrations)}"
></div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </CardContent>
                </Card>

                <!-- Recent Activity -->
                <Card>
                    <CardHeader>
                        <CardTitle class="text-lg">Recent Activity</CardTitle>
                        <CardDescription>Latest registrations and payments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div class="space-y-4">
                            {#each data.stats.recentActivity as activity}
                                <div class="flex items-start gap-3">
                                    <div class={`p-2 rounded-full ${activity.type === 'registration' ? 'bg-blue-100' : 'bg-green-100'}`}>
                                        {#if activity.type === 'registration'}
                                            <Users class="w-4 h-4 text-blue-600" />
                                        {:else}
                                            <CreditCard class="w-4 h-4 text-green-600" />
                                        {/if}
                                    </div>
                                    <div>
                                        <p class="text-sm">{activity.description}</p>
                                        <p class="text-xs text-muted-foreground">
                                            {new Date(activity.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
</div>
