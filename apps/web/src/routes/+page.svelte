<script lang="ts">
    import { session } from '$lib/stores/auth';
    import { Button } from "$lib/components/ui/button";
    import { goto } from '$app/navigation';
    import DokmutyaLanding from '$lib/components/DokmutyaLanding.svelte';
    import { page } from '$app/stores';

    let isDokmutyaDomain = $derived($page.data.shouldShowDokmutya);

    async function handleNavigation(path: string) {
        try {
            console.log('Navigating to:', path);
            await goto(path);
        } catch (error) {
            console.error('Navigation error:', error);
            console.log('Falling back to direct navigation');
            window.location.href = path;
        }
    }
</script>

<svelte:head>
    {#if $page.data.shouldShowDokmutya}
        <title>DokMutya - Healthcare Leadership for Bohol</title>
        <meta name="description" content="Building a Healthier First District - Dr. Maria Santos for Board Member" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    {:else}
        <title>ID Card Generator - Professional ID Cards in Minutes</title>
        <meta name="description" content="Design, generate, and manage ID cards for your organization. Easy to use, professional results." />
    {/if}
</svelte:head>

{#if $page.data.shouldShowDokmutya}
    <DokmutyaLanding />
{:else}
    <div class="container py-8 md:py-12">
        <div class="mx-auto flex max-w-[980px] flex-col items-center gap-8">
            <div class="flex flex-col items-center space-y-4 text-center">
                <h1 class="text-3xl font-bold leading-tight tracking-tighter md:text-4xl lg:text-5xl lg:leading-[1.1]">
                    {#if $session}
                        Welcome to ID Card Generator
                    {:else}
                        Create Professional ID Cards in Minutes
                    {/if}
                </h1>
                <p class="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
                    {#if $session}
                        Start creating professional ID cards or manage your existing ones.
                    {:else}
                        Design, generate, and manage ID cards for your organization. Easy to use, professional results.
                    {/if}
                </p>
            </div>
            <div class="flex gap-4">
                {#if $session}
                    <Button size="lg" on:click={() => handleNavigation('/use-template')}>Create New ID</Button>
                    <Button size="lg" variant="outline" on:click={() => handleNavigation('/all-ids')}>View My IDs</Button>
                {:else}
                    <Button size="lg" on:click={() => handleNavigation('/auth')}>Get Started</Button>
                {/if}
            </div>
        </div>
    </div>
{/if}
