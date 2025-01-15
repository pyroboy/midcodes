
<script lang="ts">
    import '../app.css';
    import { page } from '$app/stores';
    import type { NavigationPath } from '$lib/types/navigation';
    import { browser } from '$app/environment';
    import type { RoleEmulationClaim } from '$lib/types/roleEmulation';
    import { Progress } from '$lib/components/ui/progress';
    import { Button } from '$lib/components/ui/button';
    import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "$lib/components/ui/dropdown-menu";
    import { User, Sun, Moon, Menu, X } from 'lucide-svelte';
    import { onMount, onDestroy } from 'svelte';
    import { session, user, auth, profile } from '$lib/stores/auth';
    import { settings } from '$lib/stores/settings';
    import { loadGoogleFonts } from '$lib/config/fonts';
    import { navigating } from '$app/stores';
    import DokmutyaLanding from '$lib/components/DokmutyaLanding.svelte';


    let isMenuOpen = false;
    let isUserMenuOpen = false;
    let showProgress = false;
    let progressValue = 0;
    let progressInterval: ReturnType<typeof setInterval> | undefined;
    let progressTimeout: ReturnType<typeof setTimeout> | undefined;

    $: path = $page.url.pathname;
    $: navLinks = $page.data.navigation.allowedPaths
        .filter((p: NavigationPath) => p.showInNav)
        .map((p: NavigationPath) => ({
            path: p.path.replace(/\[.*?\]/g, ''),
            label: p.label || p.path
        }));
    $: navigation = $page.data.navigation;
    $: pageSession = $page.data.session;
    $: showHeader = navigation?.showHeader;
    // $: {
    //     console.log('[Layout Debug]', {
    //         pageSession,
    //         navigationShowHeader: navigation?.showHeader,
    //         showHeader,
    //         path,
    //         navLinks
    //     });
    // }
    $: isDark = $settings.theme === 'dark';
    $: userEmail = $page.data.user?.email ?? '';
    $: emulation = $page.data.session?.roleEmulation as RoleEmulationClaim | null;
    $: userProfile = $page.data.profile;
    $: special_url = $page.data.special_url;
    $: isDokMutya = $page.data.shouldShowDokmutya;


    // Update session when server data changes
    $: if (userProfile && $session) {
        const isProfileEmulated = 'isEmulated' in userProfile ? userProfile.isEmulated : false;
        if (isProfileEmulated !== emulation?.active) {
            auth.refreshSession();
        }
    }

    // Navigation progress bar with proper cleanup
    $: if ($navigating) {
        showProgress = true;
        progressValue = 0;
        
        // Clear any existing intervals/timeouts
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = undefined;
        }
        if (progressTimeout) {
            clearTimeout(progressTimeout);
            progressTimeout = undefined;
        }
        
        progressInterval = setInterval(() => {
            progressValue = Math.min(progressValue + 10, 90);
        }, 100);
    } else {
        progressValue = 100;
        
        // Clear existing timeout before setting a new one
        if (progressTimeout) {
            clearTimeout(progressTimeout);
        }
        
        progressTimeout = setTimeout(() => {
            showProgress = false;
            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = undefined;
            }
        }, 300);
    }

    onMount(async () => {
        if (browser) {
            try {
                await loadGoogleFonts();
            } catch (error) {
                console.error('Failed to load Google Fonts:', error);
            }
        }
    });

    // Cleanup all timers and intervals
    onDestroy(() => {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = undefined;
        }
        if (progressTimeout) {
            clearTimeout(progressTimeout);
            progressTimeout = undefined;
        }
    });

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
    }

    function handleThemeChange() {
        settings.toggleTheme();
    }
    
    async function signOut() {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    }
</script>

<!-- <svelte:head>
    <title>March of Faith Incorporated</title>
    <link rel="icon" href="/favicon.ico" />
</svelte:head> -->

{#if showProgress}
    <Progress value={progressValue} class="fixed top-0 left-0 right-0 z-50 h-1 w-full" />
{/if}

{#if showHeader}
<header class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container mx-auto px-4">
        <div class="flex h-16 items-center justify-between gap-4">
            <div class="flex items-center space-x-4 flex-shrink-0">
                {#if special_url && special_url !== '/'}
                    <a href={special_url} class="flex items-center">
                        <span class="hidden font-bold sm:inline-block">
                            {(special_url.split('/').pop() || 'Admin').charAt(0).toUpperCase() + 
                             (special_url.split('/').pop() || 'Admin').slice(1)}
                        </span>
                    </a>
                {/if}
                {#if navigation.homeUrl !== '/'}
                    <a href={navigation.homeUrl} class="flex items-center">
                        <span class="hidden font-bold sm:inline-block">
                            {navigation.homeUrl.replace('/', '').charAt(0).toUpperCase() + 
                             navigation.homeUrl.replace('/', '').slice(1)}
                        </span>
                    </a>
                {/if}
            </div>

            <nav class="hidden space-x-8 md:flex md:flex-1 md:justify-center">
                {#if navLinks.length > 0}
                    {#each navLinks as link}
                        <a 
                            href={link.path}
                            class="text-sm font-medium transition-colors hover:text-foreground/80"
                            class:text-primary={path === link.path}
                        >
                            {link.label}
                        </a>
                    {/each}
                {:else}
                    <div class="text-sm text-muted-foreground">No navigation links available</div>
                {/if}
            </nav>

            <div class="flex items-center space-x-4 flex-shrink-0">
                <div class="hidden md:flex md:items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <div class="flex items-center space-x-2">
                                <div class="flex flex-col items-end">
                                    <span class="max-w-[200px] truncate text-sm font-medium">{userEmail}</span>
                                    {#if userProfile}
                                        <span class="text-xs text-muted-foreground">
                                            {#if emulation?.active}
                                                <span class="text-yellow-500">Emulating: {emulation?.emulated_role}</span>
                                                <span class="text-muted-foreground">({emulation?.organizationName ?? 'Unknown Organization'})</span>
                                            {:else}
                                                Role: {userProfile.role}
                                            {/if}
                                        </span>
                                    {/if}
                                </div>
                                <User class="h-5 w-5" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem on:click={handleThemeChange}>
                                {#if isDark}
                                    <Sun class="mr-2 h-4 w-4" />
                                {:else}
                                    <Moon class="mr-2 h-4 w-4" />
                                {/if}
                                Toggle Theme
                            </DropdownMenuItem>
                          
                            <DropdownMenuItem on:click={signOut}>
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    class="md:hidden"
                    on:click={toggleMenu}
                >
                    {#if isMenuOpen}
                        <X class="h-6 w-6" />
                    {:else}
                        <Menu class="h-6 w-6" />
                    {/if}
                </Button>
            </div>
        </div>

        {#if isMenuOpen}
        <div class="border-t md:hidden">
            <div class="space-y-4 px-2 py-4">
                {#if navLinks.length > 0}
                    {#each navLinks as link}
                        <a 
                            href={link.path}
                            class="block px-3 py-2 text-base font-medium transition-colors hover:bg-muted"
                            class:text-primary={path === link.path}
                        >
                            {link.label}
                        </a>
                    {/each}
                {:else}
                    <div class="px-3 py-2 text-sm text-muted-foreground">No navigation links available</div>
                {/if}
                <div class="px-3 py-2">
                    <div class="flex items-center justify-between">
                        <span class="text-sm">Theme</span>
                        <Button variant="ghost" size="sm" on:click={handleThemeChange}>
                            {#if isDark}
                                <Sun class="h-4 w-4" />
                            {:else}
                                <Moon class="h-4 w-4" />
                            {/if}
                        </Button>
                    </div>
                </div>
                <button 
                    class="block w-full px-3 py-2 text-base font-medium text-left text-red-500 transition-colors hover:bg-muted"
                    on:click={signOut}
                >
                    Sign Out
                </button>
            </div>
        </div>
        {/if}
    </div>
</header>
{/if}

<main class="min-h-screen">

  <slot />

</main>

<style>
    :global(html) {
        transition: background-color 0.3s ease, color 0.3s ease;
    }

    :global(html.dark) {
        background-color: var(--background);
        color: var(--foreground);
    }

    :global(html.light) {
        background-color: var(--background);
        color: var(--foreground);
    }
</style>
