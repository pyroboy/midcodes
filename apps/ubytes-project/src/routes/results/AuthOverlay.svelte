<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';

    let isAuthenticated = !!$page.data.session?.user;
    let showOverlay = false;
    let timeCheckInterval: ReturnType<typeof setInterval>;

        async function checkTime() {
    try {
        const response = await fetch('https://worldtimeapi.org/api/timezone/Asia/Manila');
        const data = await response.json();
        const now = new Date(data.datetime);
        
        // Check if the current date is November 23
        const isNovember23 = now.getMonth() === 10 && now.getDate() === 23; // getMonth() is zero-based
        
        const hours = now.getHours();
        const isWithinTimeWindow = hours >= 14 && hours < 18; // 2 PM to 5 PM
        showOverlay = isNovember23 && !isAuthenticated && isWithinTimeWindow;
    } catch (error) {
        console.error('Error fetching time:', error);
        // Fallback to local time if API fails
        const now = new Date();
        const isNovember23 = now.getMonth() === 10 && now.getDate() === 23; // getMonth() is zero-based
        const hours = now.getHours();
        const isWithinTimeWindow = hours >= 14 && hours < 18;
        showOverlay = isNovember23 && !isAuthenticated && isWithinTimeWindow;
    }
}

    onMount(() => {
        checkTime();
        // Check every minute to reduce API calls
        timeCheckInterval = setInterval(checkTime, 60000);

        return () => {
            clearInterval(timeCheckInterval);
        };
    });

    $: {
        isAuthenticated = !!$page.data.session?.user;
        checkTime();
    }
</script>

{#if showOverlay}
    <div class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-md" />
        <div class="relative h-full w-full flex items-center justify-center p-4">
            <div class="w-[95%] sm:w-[90%] max-w-3xl bg-background/95 backdrop-blur rounded-lg shadow-xl">
                <div class="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8">
                    <div class="w-full max-w-md">
                        <img 
                            src="images/title.png" 
                            alt="Title Logo" 
                            class="w-full h-auto object-contain mx-auto 
                                  max-w-[200px] sm:max-w-[240px] md:max-w-[256px]"
                        />
                    </div>
                    <h1 class="text-center font-bold text-foreground
                             text-lg sm:text-xl md:text-2xl lg:text-4xl
                             px-2 sm:px-4 md:px-6
                             leading-tight sm:leading-tight md:leading-tight
                             max-w-[280px] sm:max-w-lg md:max-w-2xl">
                        Tabulation in Progress, await the official announcement of winners this evening
                    </h1>
                </div>
            </div>
        </div>
    </div>
{/if}