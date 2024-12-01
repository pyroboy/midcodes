<script lang="ts">
    import { page } from '$app/stores';
    import { Progress } from '$lib/components/ui/progress';
    import { Button } from '$lib/components/ui/button';
    import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "$lib/components/ui/dropdown-menu";
    import { User, Sun, Moon, Menu, X } from 'lucide-svelte';
    import { onMount, onDestroy } from 'svelte';
    import { session, user, auth, roleState, profile } from '$lib/stores/auth';
    import { settings } from '$lib/stores/settings';
    import { loadGoogleFonts } from '$lib/config/fonts';
    import { supabase } from '$lib/supabaseClient';
    import { navigating } from '$app/stores';
    import { browser } from '$app/environment';
    import "../app.css";
    
    interface Profile {
        id: string;
        email: string;
        role: string;
        org_id: string;
        isEmulated?: boolean;
        originalRole?: string;
    }
    
    let isMenuOpen = false;
    let isUserMenuOpen = false;
    let showProgress = false;
    let progressValue = 0;
    let progressInterval: ReturnType<typeof setTimeout> | undefined;
    
    $: path = $page.url.pathname;
    $: navigation = $page.data.navigation;
    $: serverProfile = $page.data.profile;
    $: showHeader = navigation.showHeader;
    $: userEmail = $user?.email ?? $page.data.user?.email;
    $: isDark = $settings.theme === 'dark';
    $: role = $roleState;
    $: userProfile = $page.data.profile;
    
    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
    }
    
    function toggleUserMenu() {
        isUserMenuOpen = !isUserMenuOpen;
    }
    
    function handleProgressBar() {
        if ($navigating) {
            showProgress = true;
            progressValue = 20;
            progressInterval = setInterval(() => {
                if (progressValue < 90) progressValue += 10;
            }, 100);
        } else {
            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = undefined;
            }
            if (showProgress) {
                progressValue = 100;
                setTimeout(() => {
                    progressValue = 0;
                    showProgress = false;
                }, 200);
            }
        }
    }
    
    async function loadUserProfile(userId: string) {
        // implement logic to load user profile
    }
    
    function extractRoleFromJWT(token: string) {
        // implement logic to extract role from JWT
    }
    
    onMount(() => {
        // Subscribe to auth state changes
        const unsubscribe = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (event === 'SIGNED_IN') {
                session.set(newSession);
                user.set(newSession?.user ?? null);
                
                // Load profile and role state
                if (newSession?.user) {
                    await auth.refreshSession();
                }
            } else if (event === 'SIGNED_OUT') {
                auth.clearSession();
            } else if (event === 'TOKEN_REFRESHED') {
                session.set(newSession);
                user.set(newSession?.user ?? null);
                
                // Update role state from new JWT
                if (newSession) {
                    const roleEmulation = auth.extractRoleFromJWT(newSession.access_token);
                    roleState.update(state => ({
                        ...state,
                        currentRole: roleEmulation.isEmulating ? (roleEmulation.currentRole || state.baseRole) : state.baseRole,
                        isEmulating: roleEmulation.isEmulating || false,
                        emulationExpiry: roleEmulation.emulationExpiry || null,
                        sessionId: roleEmulation.sessionId || null
                    }));
                }
            }
        });

        loadGoogleFonts();
        
        return () => {
            unsubscribe?.data?.subscription?.unsubscribe();
            if (progressInterval) clearInterval(progressInterval);
        };
    });
    
    $: handleProgressBar();
    
    function handleThemeChange() {
        document.body.classList.add('theme-transition');
        setTimeout(() => {
            settings.toggleTheme();
            requestAnimationFrame(() => {
                document.body.classList.remove('theme-transition');
            });
        }, 1);
    }
    
    async function signOut() {
        await auth.signOut();
    }
    </script>
    
    <svelte:head>
        <title>ID Card Generator</title>
        <link rel="icon" href="/favicon.ico" />
    </svelte:head>
    
    {#if showProgress}
        <Progress value={progressValue} class="fixed top-0 left-0 right-0 z-50 h-1 w-full" />
    {/if}
    
    {#if showHeader}
    <header class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div class="container mx-auto px-4">
            <div class="flex h-16 items-center justify-between">
                <div class="flex items-center">
                    <a href={navigation.homeUrl} class="flex items-center space-x-2">
                        <span class="hidden font-bold sm:inline-block">
                            {navigation.homeUrl === '/' ? 'ID Card Generator' : 
                             navigation.homeUrl.replace('/', '').charAt(0).toUpperCase() + 
                             navigation.homeUrl.replace('/', '').slice(1)}
                        </span>
                    </a>
                </div>
    
                <nav class="hidden space-x-8 md:flex">
                    <a 
                        href="/templates" 
                        class="text-sm font-medium transition-colors hover:text-foreground/80"
                        class:text-primary={path === '/templates'}
                    >
                        Templates
                    </a>
                    <a 
                        href="/all-ids" 
                        class="text-sm font-medium transition-colors hover:text-foreground/80"
                        class:text-primary={path === '/all-ids'}
                    >
                        My IDs
                    </a>
                </nav>
    
                <div class="flex items-center space-x-4">
                    <div class="hidden md:flex md:items-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <div class="flex items-center space-x-2">
                                    <div class="flex flex-col items-end">
                                        <span class="max-w-[200px] truncate text-sm">{userEmail}</span>
                                        {#if role.currentRole}
                                            <div class="flex flex-col items-end text-xs">
                                                {#if role.isEmulating}
                                                    <span class="text-yellow-500">Emulating: {role.currentRole}</span>
                                                    <span class="text-muted-foreground">Base Role: {role.baseRole}</span>
                                                {:else}
                                                    <span class="text-muted-foreground capitalize">{role.currentRole}</span>
                                                {/if}
                                                {#if userProfile?.org_id}
                                                    <span class="text-xs text-muted-foreground">Org: {userProfile.org_id}</span>
                                                {/if}
                                            </div>
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
                    <a 
                        href="/templates" 
                        class="block px-3 py-2 text-base font-medium transition-colors hover:bg-muted"
                        class:text-primary={path === '/templates'}
                    >
                        Templates
                    </a>
                    <a 
                        href="/all-ids" 
                        class="block px-3 py-2 text-base font-medium transition-colors hover:bg-muted"
                        class:text-primary={path === '/all-ids'}
                    >
                        My IDs
                    </a>
                    <div class="border-t pt-4">
                        <div class="px-3 py-2">
                            <div class="mb-2 text-sm font-medium">{userEmail}</div>
                            {#if role.currentRole}
                                <div class="text-xs text-muted-foreground capitalize">{role.currentRole}</div>
                            {/if}
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            class="w-full justify-start px-3" 
                            on:click={handleThemeChange}
                        >
                            {#if isDark}
                                <Sun class="mr-2 h-4 w-4" />
                            {:else}
                                <Moon class="mr-2 h-4 w-4" />
                            {/if}
                            Toggle Theme
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            class="w-full justify-start px-3" 
                            on:click={signOut}
                        >
                            Sign Out
                        </Button>
                    </div>
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
        :global(:root) {
            --nav-height: 4rem;
        }
    
        :global(html) {
            background-color: theme('colors.background');
            color: theme('colors.foreground');
        }
    
        :global(html.dark) {
            color-scheme: dark;
        }
    
        :global(body) {
            transition: opacity 0.5s ease;
        }
    
        :global(.theme-transition) {
            opacity: 0;
        }
    </style>