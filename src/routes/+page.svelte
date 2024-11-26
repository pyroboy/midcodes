<script lang="ts">
    import { session } from '$lib/stores/auth';
    import { Button } from "$lib/components/ui/button";
    import { goto } from '$app/navigation';
</script>

{#if $session}
    <div class="container flex flex-col items-center justify-center min-h-screen p-4">
        <div class="flex flex-col items-center space-y-2 text-center">
            <h1 class="text-3xl font-bold">Welcome to ID Card Generator</h1>
            <p class="text-gray-600">Start creating your ID cards or view your existing ones.</p>
        </div>
        <div class="flex gap-4">
            <Button on:click={() => goto('/use-template')}>Create New ID</Button>
            <Button variant="outline" on:click={() => goto('/all-ids')}>View My IDs</Button>
        </div>
    </div>
{:else}
    <div class="container flex flex-col items-center justify-center min-h-screen p-4">
        <div class="flex max-w-3xl flex-col items-center gap-2 text-center">
            <h1 class="text-3xl font-bold leading-tight tracking-tighter md:text-4xl lg:leading-[1.1]">
                Create Professional ID Cards in Minutes
            </h1>
            <p class="max-w-md text-lg text-gray-600 sm:text-xl">
                Design, generate, and manage ID cards for your organization. Easy to use, professional results.
            </p>
        </div>
        <div class="flex gap-4">
            <Button size="lg" on:click={() => goto('/auth')}>Get Started</Button>
        </div>
    </div>
{/if}