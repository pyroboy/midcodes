<script lang="ts">
    import type { PageData } from './$types';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Button } from '$lib/components/ui/button';

    interface Props {
        data: PageData & { user?: any };
    }

    let { data }: Props = $props();

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatDateShort(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }

    function getIdNumber(cardData: any) {
        try {
            return cardData?.id_number || 'N/A';
        } catch (e) {
            return 'N/A';
        }
    }

    function getName(cardData: any) {
        try {
            return cardData?.full_name || cardData?.name || 'N/A';
        } catch (e) {
            return 'N/A';
        }
    }
    
    function getUserFirstName(user: any): string {
        if (!user?.email) return 'User';
        return user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1);
    }
    
    function getTimeGreeting(): string {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    }
    
    // Quick actions based on user role
    function getQuickActions(user: any) {
        const baseActions = [
            {
                title: 'Browse Templates',
                description: 'Choose from available templates',
                href: '/templates',
                icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />`,
                primary: true
            },
            {
                title: 'View My IDs',
                description: 'See all generated ID cards',
                href: '/all-ids',
                icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-4 0V4a2 2 0 014 0v2" />`,
                primary: false
            }
        ];
        
        // Add admin actions - check app_metadata for roles
        const userRoles = user?.app_metadata?.role ? [user.app_metadata.role] : 
            (user?.app_metadata?.roles || []);
        const hasAdminRole = userRoles.some((role: string) => 
            ['super_admin', 'org_admin', 'id_gen_admin', 'property_admin'].includes(role)
        );
        
        if (hasAdminRole) {
            baseActions.push({
                title: 'Admin Panel',
                description: 'Manage users and settings',
                href: '/admin',
                icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`,
                primary: false
            });
        }
        
        return baseActions;
    }
</script>

<style>
    :global(.dark) {
        color-scheme: dark;
    }
</style>

<div class="container mx-auto px-4 py-6 space-y-6">
    <!-- Hero Section -->
    <div class="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 md:p-8">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {getTimeGreeting()}, {data.user ? getUserFirstName(data.user) : 'User'}!
                </h1>
                <p class="text-gray-600 dark:text-gray-300 text-lg">
                    Ready to create some ID cards today?
                </p>
            </div>
            <div class="flex flex-col items-end">
                <div class="text-3xl md:text-4xl font-bold text-primary">{data.totalCards || 0}</div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Total ID Cards</p>
            </div>
        </div>
    </div>

    <!-- Quick Actions Grid -->
    <div class="space-y-4">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each getQuickActions(data.user) as action}
                <Card class="hover:shadow-lg transition-shadow cursor-pointer group">
                    <a href={action.href} class="block h-full">
                        <CardHeader class="pb-3">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        {@html action.icon}
                                    </svg>
                                </div>
                                <div>
                                    <CardTitle class="text-lg font-semibold">{action.title}</CardTitle>
                                    <CardDescription>{action.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    </a>
                </Card>
            {/each}
        </div>
    </div>

    <!-- Recent Activity -->
    {#if data.error}
        <Card class="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <CardContent class="p-6">
                <div class="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="text-red-700 dark:text-red-300">Error loading recent activity. Please try again later.</p>
                </div>
            </CardContent>
        </Card>
    {:else if data.recentCards?.length > 0}
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Recent ID Cards</h2>
                <Button href="/all-ids" variant="outline" size="sm">
                    View All
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </Button>
            </div>
            
            <!-- Mobile Card View -->
            <div class="md:hidden space-y-3">
                {#each (data.recentCards || []).slice(0, 3) as card}
                    <Card>
                        <CardContent class="p-4">
                            <div class="flex items-start justify-between">
                                <div class="flex-1 min-w-0">
                                    <h3 class="font-medium text-gray-900 dark:text-white truncate">
                                        {getName(card.data)}
                                    </h3>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">
                                        ID: {getIdNumber(card.data)}
                                    </p>
                                    <p class="text-xs text-gray-400 dark:text-gray-500">
                                        {formatDateShort(card.created_at)}
                                    </p>
                                </div>
                                <div class="flex gap-1 ml-3">
                                    {#if card.front_image}
                                        <span class="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">F</span>
                                    {/if}
                                    {#if card.back_image}
                                        <span class="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">B</span>
                                    {/if}
                                    {#if !card.front_image && !card.back_image}
                                        <span class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">—</span>
                                    {/if}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                {/each}
            </div>
            
            <!-- Desktop Table View -->
            <Card class="hidden md:block">
                <CardContent class="p-0">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="border-b border-gray-200 dark:border-gray-700">
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID Number</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Images</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                {#each (data.recentCards || []) as card}
                                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="font-medium text-gray-900 dark:text-white">
                                                {getName(card.data)}
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm font-mono text-gray-600 dark:text-gray-400">
                                                {getIdNumber(card.data)}
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-600 dark:text-gray-400">
                                                {formatDate(card.created_at)}
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex gap-2">
                                                {#if card.front_image}
                                                    <span class="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">Front</span>
                                                {/if}
                                                {#if card.back_image}
                                                    <span class="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">Back</span>
                                                {/if}
                                                {#if !card.front_image && !card.back_image}
                                                    <span class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">No Images</span>
                                                {/if}
                                            </div>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    {:else}
        <Card>
            <CardContent class="p-8 text-center">
                <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-4 0V4a2 2 0 014 0v2" />
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No ID Cards Yet</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-4">Get started by creating your first ID card.</p>
                <Button href="/templates">
                    Browse Templates
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </Button>
            </CardContent>
        </Card>
    {/if}
</div>
