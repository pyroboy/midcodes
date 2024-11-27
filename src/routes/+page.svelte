<script lang="ts">
    import { session } from '$lib/stores/auth';
    import { Button } from "$lib/components/ui/button";
    import { goto } from '$app/navigation';

    async function handleNavigation(path: string) {
        try {
            await goto(path);
        } catch (error) {
            console.error('Navigation error:', error);
            // Fallback to traditional navigation if SvelteKit navigation fails
            window.location.href = path;
        }
    }
</script>

{#if $session}
    <div class="container py-8 md:py-12">
        <div class="mx-auto flex max-w-[980px] flex-col items-center gap-8">
            <div class="flex flex-col items-center space-y-4 text-center">
                <h1 class="text-3xl font-bold leading-tight tracking-tighter md:text-4xl lg:text-5xl lg:leading-[1.1]">
                    Welcome to ID Card Generator
                </h1>
                <p class="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
                    Start creating professional ID cards or manage your existing ones.
                </p>
            </div>
            <div class="flex gap-4">
                <Button size="lg" on:click={() => handleNavigation('/use-template')}>Create New ID</Button>
                <Button size="lg" variant="outline" on:click={() => handleNavigation('/all-ids')}>View My IDs</Button>
            </div>
        </div>
    </div>
{:else}
    <div class="container py-8 md:py-12">
        <div class="mx-auto flex max-w-[980px] flex-col items-center gap-8">
            <div class="flex flex-col items-center space-y-4 text-center">
                <h1 class="text-3xl font-bold leading-tight tracking-tighter md:text-4xl lg:text-5xl lg:leading-[1.1]">
                    Create Professional ID Cards in Minutes
                </h1>
                <p class="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
                    Design, generate, and manage ID cards for your organization. Easy to use, professional results.
                </p>
            </div>
            <div class="flex gap-4">
                <Button size="lg" on:click={() => handleNavigation('/auth')}>Get Started</Button>
            </div>
        </div>
    </div>
{/if}