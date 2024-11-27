<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { invalidate } from '$app/navigation';
    import { navigating } from '$app/stores';
    import { Progress } from '$lib/components/ui/progress';
    import { Button } from '$lib/components/ui/button';
    import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "$lib/components/ui/dropdown-menu";
    import { User, Sun, Moon } from 'lucide-svelte';
    import { onMount, onDestroy } from 'svelte';
    import { session, user } from '$lib/stores/auth';
    import { settings } from '$lib/stores/settings';
    import { Badge } from "$lib/components/ui/badge";
    import { loadGoogleFonts } from '$lib/config/fonts';
    import { supabase } from '$lib/supabaseClient';
    import "../app.css";
    
    interface Profile {
        role: string;
    }
    let isMenuOpen = false;

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
    }
    $: profile = $page.data.profile as Profile | null;
    $: path = $page.url.pathname;
    $: showHeader = $session !== null && path !== '/auth';
    $: userEmail = $user?.email ?? $page.data.user?.email;
    $: selectedTemplate = $settings.selectedTemplate;
    $: createIdUrl = selectedTemplate ? `/use-template/${selectedTemplate.id}` : '/use-template';
    $: isDark = $settings.theme === 'dark';

    // Log state changes
    $: console.log('Layout: Current path:', path);
    $: console.log('Layout: Session exists:', !!$session);
    $: console.log('Layout: User exists:', !!$user);
    $: console.log('Layout: Page data user exists:', !!$page.data.user);
    $: console.log('Layout: User email:', userEmail);
    $: console.log('Layout: Show header:', showHeader);
    $: console.log('Layout: Profile:', profile);

    let progressValue = 0;
    let progressInterval: ReturnType<typeof setTimeout> | undefined;
    let showProgress = false;

    onMount(() => {
        loadGoogleFonts();
        console.log('Layout: Mounted');
        console.log('Layout: Initial page data:', $page.data);
        console.log('Layout: Initial session:', $session);
        console.log('Layout: Initial user:', $user);
    });

    onDestroy(() => {
        if (progressInterval) clearInterval(progressInterval);
    });

    $: {
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

    async function handleSignOut() {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            await goto('/');
        }
    }

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
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
            return;
        }
        await invalidate('supabase:auth');
        goto('/auth');
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
    <div class="container">
        <!-- Branding -->
        <div class="mr-4 flex">
            <a href="/" class="mr-6 flex items-center space-x-2">
                <span class="font-bold">ID Generator</span>
            </a>
        </div>

        <!-- Toggle for small screens -->
        <button class="menu-toggle" on:click={toggleMenu}>
            {isMenuOpen ? 'Close' : 'Menu'}
        </button>

        <!-- Navigation -->
        <nav class={`flex items-center space-x-6 text-sm font-medium ${isMenuOpen ? 'show' : ''}`}>
            <a href="/templates" class="transition-colors hover:text-foreground/80">
                Templates
            </a>
            <div class="flex flex-col items-start gap-1">
                {#if selectedTemplate}
                    <a href={createIdUrl} class="transition-colors hover:text-foreground/80">
                        Create ID
                    </a>
                    <span class="text-xs text-muted-foreground">Using: {selectedTemplate.name}</span>
                {:else}
                    <span class="text-muted-foreground cursor-not-allowed" title="Select a template first">
                        Create ID
                    </span>
                    <span class="text-xs text-muted-foreground">No template selected</span>
                {/if}
            </div>
            <a href="/all-ids" class="transition-colors hover:text-foreground/80">
                My IDs
            </a>
        </nav>

        <!-- User Profile and Theme Toggle -->
        <div class="flex items-center space-x-4">
            <Button variant="ghost" size="icon" on:click={handleThemeChange}>
                {#if isDark}
                    <Sun class="h-5 w-5" />
                {:else}
                    <Moon class="h-5 w-5" />
                {/if}
            </Button>
            <div class="flex items-center gap-4">
                <div class="flex flex-col">
                    <span class="text-sm text-gray-600">{userEmail}</span>
                    {#if profile?.role}
                        <span class="text-xs text-muted-foreground">{profile.role}</span>
                    {/if}
                </div>
                <Button variant="outline" size="sm" on:click={signOut}>Sign Out</Button>
            </div>
        </div>
    </div>
</header>

{/if}

<main>
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

    main {
        padding-top: var(--nav-height);
    }
    header {
  display: flex; /* Default for desktop */
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  flex-wrap: nowrap; /* No wrapping on desktop */
}

header nav {
  display: flex; /* Show all nav links on desktop */
  gap: 1rem; /* Space between items */
}

header .menu-toggle {
  display: none; /* Hide toggle button by default (desktop) */
}

header .container {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* Media query for smaller screens */
@media (max-width: 768px) {
  header {
    flex-direction: column; /* Stack items vertically */
    padding: 1rem;
  }

  header nav {
    flex-direction: column; /* Stack nav links */
    gap: 0.5rem;
    display: none; /* Initially hidden */
  }

  header nav.show {
    display: flex; /* Show when toggled */
  }

  header .menu-toggle {
    display: block; /* Show toggle button */
    cursor: pointer;
    font-size: 1rem;
    background: none;
    border: none;
  }
}

</style>